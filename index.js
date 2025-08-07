const http = require("http")
const https = require("https")
const fs = require("fs")
const path = require("path")

const { WebSocket, WebSocketServer } = require("ws")
const ejs = require("ejs")

const express = require("express")
const panel = express()

var plugin_pages = []
var plugin_scripts = []

var config = require("./data/config.json") //vars because they can be updated at runtime
var httpDomains = require("./data/httpDomains.json")
var wsDomains = require("./data/wsDomains.json")
var current_panel_domain = fs.readFileSync(__dirname + "/data/currentpaneldomain.txt", "utf-8").trim()

const startTime = new Date()

function calculateUptime(){
    var now = new Date()
    var difference = now - startTime //in ms
    return new Date(difference)
}

const files = fs.readdirSync(config.plugin_folder) // reading files from folders
files.map(file => {
    if(fs.lstatSync(config.plugin_folder + "/" + file).isFile()){
        var plugin = require(config.plugin_folder + "/" + file)
        panel.use("/plugins/" + plugin.name, plugin.web)
        plugin_pages.push({ name: file.split('.').shift(), pages: plugin.pages })
    }
})

const cookieParser = require('cookie-parser')
panel.use(cookieParser())
panel.use(express.json())
panel.use("/panel/public", express.static(path.join(__dirname, "public")))
panel.use((req, res, next) => {
    console.log(req.path, req.headers.host)
    next()
})
panel.get("/panel/login", (req, res) => {
    res.sendFile(__dirname + "/views/panel/login.html")
})
panel.post("/panel/login", (req, res) => {
    if(req.body.password === config.panel_password) res.cookie("password", config.panel_password).send("ok")
    else res.status(403).send("Wrong password")
})

panel.use((req, res, next) => {
    if(!req.cookies.password) return res.redirect("/panel/login")
    if(req.cookies.password !== config.panel_password) return res.redirect("/panel/login")

    var ip = req.headers["x-forwarded-for"]
    if(!ip) ip = req.headers["cf-connecting-ip"]
    if(!ip) ip = req.connection.remoteAddress
    req.c_ip = ip
    next()
})

panel.get("/", (req, res) => {
    res.redirect("/panel")
})

panel.get("/panel", (req, res) => {
    res.render(__dirname + "/views/panel/index.ejs", { wsDomains, httpDomains, current_panel_domain, plugin_pages })
})

panel.post("/panel/setpaneldomain", (req, res) => {
    var domain = req.body.domain
    current_panel_domain = req.body.domain
    fs.writeFileSync(__dirname + "/data/current_panel_domain.txt", current_panel_domain)
    res.json({status: "ok", domain})
})

panel.post("/panel/create_domain/http", (req, res) => {
    if(httpDomains.find(a => a.domain === req.body.domain)) return res.send("not ok")
    httpDomains.push(req.body)
    fs.writeFileSync(__dirname + "/data/httpDomains.json", JSON.stringify(httpDomains), "utf-8")
    res.send("ok")
})

panel.post("/panel/delete_domain/http", (req, res) => {
    httpDomains = httpDomains.filter(a => a.domain !== req.body.domain)
    fs.writeFileSync(__dirname + "/data/httpDomains.json", JSON.stringify(httpDomains), "utf-8")
    res.send("ok")
})

panel.post("/panel/create_domain/ws", (req, res) => {
    if(wsDomains.find(a => a.domain === req.body.domain)) return res.send("not ok")
    wsDomains.push(req.body)
    fs.writeFileSync(__dirname + "/data/wsDomains.json", JSON.stringify(wsDomains), "utf-8")
    res.send("ok")   
})

panel.post("/panel/delete_domain/ws", (req, res) => {
    wsDomains = wsDomains.filter(a => a.domain !== req.body.domain)
    fs.writeFileSync(__dirname + "/data/wsDomains.json", JSON.stringify(wsDomains), "utf-8")
    res.send("ok")
})

panel.use((req, res) => {
    res.status(404).render(__dirname + "/views/404.ejs", { host: req.headers.host + req.path, ip: req.c_ip, uptime: calculateUptime().getTime() })
})


if(config.useSSLHTTP){
    var server = https.createServer({
        cert: fs.readFileSync(config.sslHTTP.certificate),
        key: fs.readFileSync(config.sslHTTP.private_key)
    })
} else var server = http.createServer()

server.on('request', (originalReq, originalRes) => {

    // console.log("[REQ]", originalReq.method, originalReq.headers.host, originalReq.url)
    // if(originalReq.headers.host === current_panel_domain) return panel(originalReq, originalRes)

    const isPanelRequest = (
        originalReq.headers.host === current_panel_domain
        // &&
        // originalReq.url.startsWith("/panel")
    )
    if (isPanelRequest) return panel(originalReq, originalRes)

    if(originalReq.headers["cf-connecting-ip"]) var ip = originalReq.headers["cf-connecting-ip"]
    else if(originalReq.headers["x-forwarded-for"]) var ip = originalReq.headers["x-forwarded-for"]
    else var ip = originalReq.connection.remoteAddress

    var domain = httpDomains.find(a => a.domain === originalReq.headers.host)
    if(!domain){
        originalRes.writeHead(404, { 'Content-Type': "text/html" })
        return originalRes.end(
            ejs.render(
                fs.readFileSync(path.join(__dirname, "./views/404.ejs"), "utf-8"),
                { host: originalReq.headers.host + originalReq.url, ip, uptime: calculateUptime().getTime() }
            )
        )
    }
    

    //insert log function here laters

    var options = {
        hostname: domain.ip,
        port: domain.port,
        path: originalReq.url,
        method: originalReq.method,
        headers: originalReq.headers
    }

    var proxy = http.request(options, res => {
        originalRes.writeHead(res.statusCode, res.headers)
        res.pipe(originalRes, { end: true })
    })

    proxy.on('error', err => { //log error here too maybe
        // console.error(`Error encountered making the secondary ${originalReq.method} request for requested host ${originalReq.host}${originalReq.url} to ${domain.ip}:${domain.path}`, err)

        originalRes.writeHead(500, { 'Content-Type': "text/html" })
        originalRes.end(
            ejs.render(
                fs.readFileSync(path.join(__dirname, "./views/500.ejs"), "utf-8"),{ host: originalReq.headers.host, ip, uptime: calculateUptime().getTime(), error: err.toString() }
            )
        )
    })

    originalReq.pipe(proxy, { end: true })
    
})

// if((config.http_port === config.ws_port) && config.http_active && config.ws_active){ //ws and http are sharing same server
if(config.ws_active){
    
    // const wss = new ws.WebSocketServer({ server });
    let wss
    if((config.http_port === config.ws_port) && config.http_active) wss = new WebSocketServer({ server });
    else {
        if(config.useSSLWS){
            let httpServer = https.createServer({
                cert: fs.readFileSync(config.sslWS.certificate),
                key: fs.readFileSync(config.sslWS.private_key)
            })
            wss = new WebSocketServer({ httpServer });
        }
        else wss = new WebSocketServer({ port: config.ws_port })
    }
    
    wss.on('connection', (ws, req) => {
        // Extract the 'Host' header from the request headers
        const host = req.headers.host;
      
        // Use the host value to determine the target server to proxy the WebSocket to
        let target = '';

        let found = wsDomains.find(a => a.domain === host)
        if(!found){
            ws.send(JSON.stringify({ success: false, error: "Domain not found" }))
            return ws.close()
        } else target = `ws://${found.ip}:${found.port}`
      
        // Create a new WebSocket connection to the target server

        const proxy = new WebSocket(target, {
            Headers: {
                Host: host
            }
        });
      
        // Forward messages from the client WebSocket to the target WebSocket
        ws.on('message', (message) => {
            proxy.send(message);
        });
      
        // Forward messages from the target WebSocket to the client WebSocket
        proxy.on('message', (message) => {
            console.log(message)
            ws.send(message.toString());
        });
      
        // Handle errors from the target WebSocket
        proxy.on('error', (error) => {
            ws.send(JSON.stringify({ success: false, error: error.toString() }))
            ws.close();
        });
    });
}

if(config.http_active) server.listen(config.http_port, "0.0.0.0", err => {
    if (err) console.log("Error in server setup")
    console.log("Server listening on Port", config.http_port);
})

process.on('uncaughtException', err => {
    console.error("Catastrophic error made not catastrophic:", err)
})

process.on('unhandledRejection', err => {
    console.error("Catastrophic error made not catastrophic:", err)
})
