var FLAG_INITIALIZED = 1;
var FLAG_UPDATE = 2;

var STATE_TEXT = 0;
var STATE_PRE_KEY = 1;
var STATE_KEY = 2;

function handleEvent(name, eventSpec_s){
    var msg = "[event called]:" + name + " : " + eventSpec_s;
    console.log(msg, this);

    var li = eventSpec_s.split(':');
    if(li.length > 0 && li[0]){
        var cmd = li[0];
        if(cmd == 'style'){
            if(name == 'unhover'){
                if(li.length == 2){
                    var value = li[1];
                    El_RemoveStyle(value, this.templ, this);
                }else if(li.length == 3){
                    var value = li[1];
                    var value2 = li[2];
                    El_RemoveStyle(value, this.templ, this);
                    El_SetStyle(value2, this.templ, this);
                }
            }else{
                if(li.length >= 2){
                    var value = li[1];
                    El_SetStyle(value, this.templ, this);
                }
            }
        }else if(eventSpec_s[0] == '^'){
            var cmd_s = eventSpec_s.substring(1);
            var cmd_li = cmd_s.split(':');
            var cmdName_s = cmd_li[0];
            var func = null;
            var node = this;
            while(node.parentNode != null && func === null){
                var parent_el = node.parentNode;
                if(parent_el == this.root_el){
                    break;
                }
                console.log("looking for event " + cmdName_s, parent_el.commands);
                if(parent_el.commands[cmdName_s]){
                    console.log('found ' + cmdName_s);
                    func = parent_el.commands[cmdName_s];
                }
                node = parent_el;
            }

            if(func){
                func(this, parent_el, name, eventSpec_s);
                console.log(parent_el.templ.on[cmdName_s]);
                if(parent_el.templ.on && parent_el.templ.on[cmdName_s]){
                    console.log('caliling');
                    handleEvent.call(parent_el, cmdName_s, parent_el.templ.on[cmdName_s]);
                }
            }
        }else if(window.basic.commands && window.basic.commands[cmd]){
            window.basic.command[cmd].call(this, name, eventSpec_s);
        }
    }
}

function El_RemoveStyle(style_s, templ, node){
    node.classList.remove(style_s);
}

function El_SetStyle(style_s, templ, node){
    console.log('setting style ' + style_s);

    if(templ.classList){
        node.classList = templ.classList;
    }

    if(style_s){
        for(var i = 0; i < templ.styleOptions.length; i++){
            var idx = templ.styleOptions.indexOf(style_s);
            console.log('setting style ' + style_s +' ' + idx, node);
            if(idx != -1){
                node.classList.add(templ.styleOptions[idx]);
            }
        }
    }else{
        if(templ.styleOptions[0]){
            node.classList.add(templ.styleOptions[0]);
        }
    }
}

function cash(s, data){
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

function El_Make(templ, targetEl, rootEl, data){
    if(typeof templ == 'string'){
        templ = window.basic.templates[templ];
    }
    if(!templ){
        return;
    }

    var node = document.createElement(templ.nodeName);
    node.vars = {};
    node.events = {};
    node.templ = templ;
    node.root_el = rootEl;
    node.commands = {};

    if(templ.body){
        node.appendChild(document.createTextNode(cash(templ.body, data)));
    }


    El_SetStyle(null, templ, node);

    var varKeys = Object.keys(templ.vars);
    if(varKeys.length){
        for(var i = 0; i < varKeys.length; i++){
            var key = varKeys[i];
            node.vars[key] = data[key];
        }
    }

    var commandKeys = templ.commandKeys;
    if(commandKeys.length){
        for(var i = 0; i < commandKeys.length; i++){
            var cmdKey = commandKeys[i];
            console.log(cmdKey);
            console.log(data[cmdKey]);
            if(typeof data[cmdKey] == 'function'){
                node.commands[cmdKey] = data[cmdKey];
            }
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
            node.onclick = handleEvent.bind(node, 'click', eventSpec_s);
        }else if(key == 'down'){
            node.onmousedown = handleEvent.bind(node, 'down', eventSpec_s);
        }else if(key == 'up'){
            node.onmouseup = handleEvent.bind(node, 'up', eventSpec_s);
        }else if(key == 'key'){
            node.onkeyboard = handleEvent.bind(node, 'key', eventSpec_s);
        }else if(key == 'hover'){
            node.onmouseover = handleEvent.bind(node, 'hover', eventSpec_s);
            node.onmouseout = handleEvent.bind(node, 'unhover', eventSpec_s);
        }else{
            node.events[key] = eventSpec_s
        }
    }

    if(templ.children){
        for(var i = 0, l = templ.children.length; i < l; i++){
            El_Make(templ.children[i], node, rootEl, data);
        }
    }

    if(templ.childrenKey && templ.childrenTempl){
        var childItems = data[templ.childrenKey];
        if(childItems){
            for(var j = 0; j < childItems.length; j++){
                var childData = childItems[j];
                El_Make(templ.childrenTempl, node, rootEl, childData);
            }
        }
    }

    targetEl.appendChild(node);
}

function updateEl(el, targetEl, data){
    ;
}
