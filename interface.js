var FLAG_INITIALIZED = 1;
var FLAG_UPDATE = 2;

var STATE_TEXT = 0;
var STATE_PRE_KEY = 1;
var STATE_KEY = 2;

function handleEvent(name, eventSpec_s){
    var msg = "event called" + name + " : " + eventSpec_s;
    console.log(msg, this);
}

function cash(s, data){
    console.log("cash " + s, data);
    var state = STATE_TEXT;
    var key = "";
    var shelf = "";
    for(var i = 0; i < s.length; i++){
        var c = s.charAt(i);
        if(state == STATE_TEXT){
            if(c == '$'){
                state = STATE_PRE_KEY;
                continue;
            }else{
                shelf += c;
            }
        }else if(state == STATE_PRE_KEY){
            if(c == '{'){
               state = STATE_KEY; 
            }else{
                return "";
            }
        }else if(state == STATE_KEY){
            if(c == '}'){
                if(!data[key]){
                    return "";
                }
                shelf += data[key];
                key = "";
                state = STATE_TEXT;
                continue;
            }else{
                key += c;
            }
        }
    }
    return shelf;
}

function El_Make(templ, targetEl, data){
    if(typeof templ == 'string'){
        templ = window.basic.templates[templ];
    }
    if(!templ){
        return;
    }

    console.log('making', templ);

    var node = document.createElement(templ.nodeName);
    node.vars = {};
    node.events = {};

    if(templ.body){
        node.appendChild(document.createTextNode(cash(templ.body, data)));
    }

    if(templ.styleOptions[0]){
        node.className = templ.styleOptions[0];
    }

    var varKeys = Object.keys(templ.vars);
    if(varKeys.length){
        for(var i = 0; i < varKeys.length; i++){
            var key = varKeys[i];
            node.vars[key] = data[key];
        }
    }
     
    for(var key in templ.tags){
        node.setAttribute(key, cash(templ.tags[key], data));
    }

    node.flags = templ.flags | FLAG_INITIALIZED;


    var onKeys = Object.keys(templ.on);
    for(var i = 0; i < onKeys.length; i++){
        var key = onKeys[i];
        var eventSpec_s = templ.on[key];
        if(key == 'click'){
            node.onclick = handleEvent('click', eventSpec_s);
        }else if(key == 'down'){
            node.onmousedown = handleEvent('down', eventSpec_s);
        }else if(key == 'up'){
            node.onmouseup = handleEvent('up', eventSpec_s);
        }else if(key == 'key'){
            node.onkeyboard = handleEvent('key', eventSpec_s);
        }else if(key == 'hover'){
            node.onmouseover = handleEvent('hover', eventSpec_s);
        }else{
            node.events[key] = eventSpec_s
        }
    }

    if(templ.children){
        for(var i = 0, l = templ.children.length; i < l; i++){
            El_Make(templ.children[i], node, data);
        }
    }

    if(templ.childrenKey && templ.childrenTempl){
        var childItems = data[templ.childrenKey];
        if(childItems){
            for(var j = 0; j < childItems.length; j++){
                var childData = childItems[j];
                El_Make(templ.childrenTempl, node, childData);
            }
        }
    }

    targetEl.appendChild(node);
}

function updateEl(el, targetEl, data){
    ;
}
