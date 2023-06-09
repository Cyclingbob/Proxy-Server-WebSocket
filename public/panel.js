function create_domain(e, type){
    e.preventDefault()
    var form_data = {
        domain: e.target[0].value,
        ip: e.target[1].value,
        port: e.target[2].value,
    }
    fetch("/panel/create_domain/" + type, {
        method: "POST",
        body: JSON.stringify(form_data),
        headers: {
            "Content-Type": "application/json"
        }
    }).then(data => data.text()).then(data => {
        if(data === "ok"){
            var li = document.createElement("li")
            li.innerHTML = `${form_data.domain} => ${form_data.ip}:${form_data.port}`

            var button = document.createElement("button")
            button.id = form_data.domain
            button.className = "delete-domain"
            button.innerHTML = "Delete"
            button.onclick = function(){delete_domain(event)}

            li.appendChild(button)

            document.getElementById(type + "-domains").appendChild(li)
            
            if(document.getElementById("no-domains-" + type)) document.getElementById("no-domains-" + type).remove()
        }
    })
}
document.getElementById("create-domain-form-http").addEventListener("submit", e => create_domain(e, "http"))
document.getElementById("create-domain-form-ws").addEventListener("submit", e => create_domain(e, "ws"))

function delete_domain(e, type){
    fetch("/panel/delete_domain/" + type, {
        method: "POST",
        body: JSON.stringify({
            domain: e.target.id,
        }),
        headers: {
            "Content-Type": "application/json"
        }
    }).then(data => data.text()).then(data => {
        if(data === "ok"){
            document.getElementById(e.target.id).parentNode.remove()
        }
    })
}

function tab(evt, name, type) {
    // Declare all variables
    var i, tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabs");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tab-links");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    // Show the current tab, and add an "active" class to the button that opened the tab

    if(type === "passive") document.getElementById(name).style.display = "block";
    else {
        fetch(name).then(data => data.text()).then(data => {
            document.getElementById('active-page').innerHTML = data
            document.getElementById('active-page').style.display = "block"

            //get all the JS scripts and load them
            document.getElementById('active-page').querySelectorAll("script").forEach(script => {
                var head = document.getElementsByTagName('head')[0];
                var element = document.createElement('script');
                element.type = 'text/javascript';
                element.src = script.src

                // then bind the event to the callback function 
                // there are several events for cross browser compatibility
                // element.onreadystatechange = callback;
                // element.onload = callback;

                // fire the loading
                head.appendChild(element);
            })

            //get all CSS sheets
            const linkElements = document.getElementsByTagName('link');
            // Filter out link elements that aren't stylesheets
            const styleSheetLinks = Array.from(linkElements).filter((link) => {
                return link.rel === 'stylesheet';
            });
            // Extract href attributes of each stylesheet link
            const styleSheetUrls = styleSheetLinks.map((link) => {
                return link.href;
            });

            for(url of styleSheetUrls){
                var sheet = document.createElement('link')
                sheet.rel = "stylesheet"
                sheet.type = 'text/css';
                sheet.media = 'screen';
                sheet.href = url
                document.getElementsByTagName('head')[0].appendChild(sheet);
            }
        })
    }
    evt.currentTarget.className += " active";
}

var x, i, j, l, ll, selElmnt, a, b, c;
/* Look for any elements with the class "custom-select": */
x = document.getElementsByClassName("custom-select");
l = x.length;
for (i = 0; i < l; i++) {
    selElmnt = x[i].getElementsByTagName("select")[0];
    ll = selElmnt.length;
    /* For each element, create a new DIV that will act as the selected item: */
    a = document.createElement("DIV");
    a.setAttribute("class", "select-selected");
    a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
    x[i].appendChild(a);
    /* For each element, create a new DIV that will contain the option list: */
    b = document.createElement("DIV");
    b.setAttribute("class", "select-items select-hide");
    for (j = 1; j < ll; j++) {
        /* For each option in the original select element,
        create a new DIV that will act as an option item: */
        c = document.createElement("DIV");
        c.innerHTML = selElmnt.options[j].innerHTML;
        c.addEventListener("click", function(e){
            fetch("/panel/setpaneldomain", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    domain: e.target.innerHTML
                })
            })
            /* When an item is clicked, update the original select box,
            and the selected item: */
            var y, i, k, s, h, sl, yl;
            s = this.parentNode.parentNode.getElementsByTagName("select")[0];
            sl = s.length;
            h = this.parentNode.previousSibling;
            for(i = 0; i < sl; i++){
                if(s.options[i].innerHTML == this.innerHTML){
                    s.selectedIndex = i;
                    h.innerHTML = this.innerHTML;
                    y = this.parentNode.getElementsByClassName("same-as-selected");
                    yl = y.length;
                    for (k = 0; k < yl; k++) {
                        y[k].removeAttribute("class");
                    }
                    this.setAttribute("class", "same-as-selected");
                    break;
                }
            }
            h.click();
        });
        b.appendChild(c);
    }
    x[i].appendChild(b);
    a.addEventListener("click", function(e) {
        /* When the select box is clicked, close any other select boxes,
        and open/close the current select box: */
        e.stopPropagation();
        closeAllSelect(this);
        this.nextSibling.classList.toggle("select-hide");
        this.classList.toggle("select-arrow-active");
    });
}

function closeAllSelect(elmnt) {
    /* A function that will close all select boxes in the document,
    except the current select box: */
    var x, y, i, xl, yl, arrNo = [];
    x = document.getElementsByClassName("select-items");
    y = document.getElementsByClassName("select-selected");
    xl = x.length;
    yl = y.length;
    for (i = 0; i < yl; i++) {
        if (elmnt == y[i]) {
        arrNo.push(i)
        } else {
        y[i].classList.remove("select-arrow-active");
        }
    }
    for (i = 0; i < xl; i++) {
        if (arrNo.indexOf(i)) {
        x[i].classList.add("select-hide");
        }
    }
}

/* If the user clicks anywhere outside the select box,
then close all select boxes: */
document.addEventListener("click", closeAllSelect);
