
# Proxy Server with WebSocket support
This is a reverse proxy server writtern entirely in Node.js. It allows you to run numberous HTTP and WebSocket servers on the same IP address by filtering requests based on their intended host (domain). This server (or broker as technical term) has full SSL support and supports any combination fo  HTTP, HTTPS, Websockets and Secure WebSockets. There is a web based configuration panel where you can create links between the desired domain and the address of the web server and port it lies on your server. Plugins can be used to enhance the capabilities of this panel with their own designated pages. I may add support for intercepting requests later.

## Function
A simple HTTP request works like this:
User types desired domain into browser > DNS resolves this to your server > Reverse proxy recieves request > Reverse proxy looks up which port the intended web server lies on based on host (domain) > Reverse proxy makes request to that web server > Web server responds > Reverse proxy pipes response back to the user.

## Get started

- Ensure you have Node.js installed
- Clone this repository
- Create a directory called `plugins`, even if you don't intend to install any
- Change the `plugin_folder` in `data/config.json` to the location of your plugin directory
- Install the required packages: `npm install node-fetch express cookie-parser ws ejs`
- Run the server by running `node .`. You will need super user permissions on linux if you intend to run the server on port 443 or 80 or any under 1000.
The server will be running on the default configuration. Open the web configuration panel at `http://localhost` You can change around the data/config.json file to your liking:

## Configuation (data/config.json)
`http_port` can be set to the port you want the server to listen on (80 for HTTP, 443 for HTTPS)
`ws_port` can be set to the port you want the server to listen on (80 for WS, 443 for WSS)
If you set these to the same, the web socket server will be binded to the HTTP server so you can send messages through it.
`panel_password` is the password you can use to set the password to the interactive panel.

### If you want to use http **only**:
- set `http_port` to the port you want the http server to listen to
- set `http_active` to `true` and set `ws_active` to `false`
- set `useSSLHTTP` to `false`

### If you want to use https **only**:
- set `http_port` to the port you want the httpsserver to listen to
- set `http_active` to `true` and set `ws_active` to `false`
- set `useSSLHTTP` to `true`
- set `sslHTTP.cert` to the file location of your SSL certificate
- set `sslHTTP.private_key` to the file location of your SSL private key

### If you want to use web socket **only**
- set `ws_port` to the port you want the websocket server to listen to
- set `ws_active` to `true` and set `http_active` to `false`
- set `useSSLWS` to `false`

### If you want to use web socket secure **only**:
- set `ws_port` to the port you want the web socket server to listen to
- set `ws_active` to `true` and set `http_active` to `false`
- set `useSSLWS` to `true`
- set `sslWS.cert` to the file location of your SSL certificate
- set `sslWS.private_key` to the file location of your SSL private key

### If you want to use http and web socket unsecure on different ports
- set `http_port` to the port you want the http server to listen to
- set `ws_port` to the port you want the websocket server to listen to

- set `http_active` to `true` and set `ws_active` to `true`
- set `useSSLHTTP` to `false`
- set `useSSLWS` to `false`

### If you want to use http**s** and web socket unsecure on different ports
- set `http_port` to the port you want the https server to listen to
- set `ws_port` to the port you want the websocket server to listen to
- set `http_active` to `true` and set `ws_active` to `true`
- set `useSSLHTTP` to `true`
- set `useSSLWS` to `false`
- set `sslHTTP.cert` to the file location of your SSL certificate
- set `sslHTTP.private_key` to the file location of your SSL private key

### If you want to use https and web socket secure on different ports
- set `http_port` to the port you want the https server to listen to
- set `ws_port` to the port you want the websocket server to listen to
- set `http_active` to `true` and set `ws_active` to `true`
- set `useSSLHTTP` to `true`
- set `useSSLWS` to `true`
- set `sslHTTP.cert` to the file location of your SSL certificate
- set `sslHTTP.private_key` to the file location of your SSL private key
- set `sslWS.cert` to the file location of your SSL certificate
- set `sslWS.private_key` to the file location of your SSL private key

### If you want to use http and web socket secure on different ports
- set `http_port` to the port you want the https server to listen to
- set `ws_port` to the port you want the websocket server to listen to
- set `http_active` to `true` and set `ws_active` to `true`
- set `useSSLHTTP` to `false`
- set `useSSLWS` to `true`
- set `sslWS.cert` to the file location of your SSL certificate
- set `sslWS.private_key` to the file location of your SSL private key

### If you want to use http and web socket on the **same** port
- set `http_port` to the port you want the server to listen to
- set `ws_port` to the **SAME** port as `http_port`
- set `http_active` to `true` and set `ws_active` to `true`

### If you want to use https and web socket (which can only be secure) on the **same** port
- set `http_port` to the port you want the server to listen to
- set `ws_port` to the **SAME** port as `http_port`
- set `http_active` to `true` and set `ws_active` to `true`
- set `useSSLHTTP` to `true`
- set `sslHTTP.cert` to the file location of your SSL certificate
- set `sslHTTP.private_key` to the file location of your SSL private key

## Using the configuration panel
By default you should see a list of HTTP domains with `localhost => 127.0.0.1:80`. This basically says any requests going to localhost will be directed to a server running oon port 80 at address 127.0.0.1. You'll probably think: wait the proxy is listening on the same server as this entry points to. This is because this entry allows you to load the configuration panel. If you wanted to be able to access this web panel on the internet, you would add another entry listening to a specific domain, and then keep it going to the localhost such as: `panel.pizone.dev => 127.0.0.1:80` where `panel.pizone.dev` is the domain, `127.0.0.1` is the IP address and `80` is the port.

Below HTTP domains you will see WebSocket Domains. These work the same way as the HTTP domains. So if you had a website that uses websockets listening on port 81 on your local machine, you would create a HTTP entry pointing to it: `localhost => 127.0.0.1:80` and then the same for WebSocket: `localhost => 127.0.0.1:80`

Domain for Panel tells the server which domain is used to load up the panel page. So by default it will be localhost, but if you moved the panel to the internet you would change it to your web domain or IP address.

On the left side you will only see the Home button. If you install plugins, you can tab to them here.

Hopefully this Readme has been helpful, don't hesitate to create an issue if you have any questions.

# Copyright
This repository is protected under copyright. Only personal use is permitted and editing of code only for personal use. You are not permitted to copy and redistribute or otherwise edit change, or use code without my explicit permission. All my code is protected under the Copyright, Designs and Patents Act 1988.
