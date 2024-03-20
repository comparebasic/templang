var FLAG_INITIALIZED = 1;
var FLAG_UPDATE = 2;

var STATE_TEXT = 0;
var STATE_PRE_KEY = 1;
var STATE_KEY = 2;

var QUERY_SELF = 1;
var QUERY_PARENTS = 2;
var QUERY_CHILDREN = 4;

function specParse(spec_s){
    if(/:/.test(spec_s)){
        s_li = spec_s.split(':'); 
        if(s_li.length === 1){
            return {cmd: spec_s};
        }else if(s_li.length === 2){
            return {
                cmd: s_li[0],
                value: s_li[1],
            };
        }else{
            var o = {cmd: s_li[0], value: s_li[1]};
            s_li.shift();
            s_li.shift();
            o.allValues = s_li;
            return o;
        }
    }

    return {};
}

function propName(name_s){
    if(/\./.test(name_s)){
        var props = name_s.split('.');
        var name = props[0];
        props.shift();
        return {name: name, props: props};
    }
    return {name: name_s, props: []};
}

function El_Match(node, name, data){
    var found = false;
    if(node.templ && (!name || node.templ.name === name)){
        if(typeof data === 'function'){
            return data(node); 
        }else if(data){
            for(var key in data){
                if(data[key] !== node.vars[key]){
                    return null;
                }
            }
            return node;
        }else if(name){
            return node;
        }
    }

    return null;
}

function El_SetChildren(node, templ, key, data){
    if(key){
        if(key && templ){
            node.innerHTML = '';
            var childItems = data[key];
            if(childItems){
                for(var j = 0; j < childItems.length; j++){
                    var childData = childItems[j];
                    childData._parentData = data;
                    El_Make(templ, node, node.root_el, childData);
                }
            }
        }
    }else if(templ){
        var childData = data && data[templ];
        if(childData){
            node.innerHTML = '';
            childData._parentData = data;
            El_Make(templ, node, node.root_el, childData);
        }else{
            node.innerHTML = '';
            El_Make(templ, node, node.root_el, data);
        }
    }
}

function El_Query(node, root_el, _query_s, data, capture_d){
    var direction = QUERY_SELF;

    var query_s = null;
    var valsel = null;
    var valname = null;
    if(typeof _query_s === 'object'){
        query_s = _query_s.query;
        valsel = _query_s.valsel; 
        if(valsel && valsel[0] === '#'){
            var valProps = propName(valsel);
            valname = valProps.name.substring(1);
            valprops = valProps.props;
        }
    }else{
        query_s = _query_s;
    }

    if(query_s[0] === '_'){
        direction = QUERY_CHILDREN;
        query_s = query_s.substring(1);
    }else if(query_s[0] === '^'){
        direction = QUERY_PARENTS;
        query_s = query_s.substring(1);
    }

    var nodeName = null;

    var nameProps = propName(query_s);
    if(query_s[0] === '#'){
        nodeName = nameProps.name.substring(1);
    }

    if(valname && El_Match(node, valname, data)){
        for(var i = 0; i < valprops.length; i++){
            var k = valprops[i];
            if(node.vars[k]){
                capture_d[k] = node.vars[k]; 
            }
        }
    }

    if(El_Match(node, nodeName, data)){
        return node;
    }

    if(direction === QUERY_CHILDREN){
        for(var i = 0, l = node.childNodes.length; i < l; i++){
            if(node.childNodes[i].nodeType === Node.ELEMENT_NODE){
                var found = El_Query(node.childNodes[i], root_el, _query_s, data, capture_d);
                if(found != null){
                    return found; 
                }
            }
        }
    }

    if(direction === QUERY_PARENTS){
        while(node.parentNode != null){
            var parent_el = node.parentNode;
            if(parent_el == root_el){
                return null;
            }

            var found = El_Query(parent_el, root_el, _query_s, data, capture_d);
            if(found != null){
                return found; 
            }

            node = parent_el;
        }
    }
}

function parseSpec(spec_s){
    return spec_s.split(':');
}

function handleEvent(name, eventSpec_s, target_el, event_d){
    if(/;/.test(eventSpec_s)){
        var events_li = eventSpec_s.split(';');
        for(var i = 0; i < events_li.length; i++){
            handleEvent.call(this, name, events_li[i], target_el, event_d);
        }
        return;
    }

    var msg = "[event called]:" + name + " : " + eventSpec_s;
    var spec = parseSpec(eventSpec_s);
    if(spec.length > 0 && spec[0]){
        var cmd = spec[0];
        if(cmd === 'templ'){
            var pair = specParse(eventSpec_s);
            if(target_el.vars[pair.value]){
                El_SetChildren(this, target_el.vars[pair.value], null, null);
            }
        }else if(cmd == 'style'){
            if(name == 'unhover'){
                if(spec.length == 2){
                    var value = spec[1];
                    El_RemoveStyle(value, this.templ, this);
                }else if(spec.length == 3){
                    var value = spec[1];
                    var value2 = spec[2];
                    El_RemoveStyle(value, this.templ, this);
                    El_SetStyle(value2, this.templ, this);
                }
            }else{
                if(spec.length >= 2){
                    var value = spec[1];
                    El_SetStyle(value, this.templ, this);
                }
            }
        }else if(spec[0] && (spec[0][0] == '_' || spec[0][0] == '^')){
            var cmd_s = eventSpec_s.substring(1);
            var cmd_li = cmd_s.split(':');
            var cmdName_s = cmd_li[0];
            var func = null;
            var subSpec_s = spec[0].substring(1);
            var node = this;

            var source_el = El_Query(node, node.root_el, {query: spec[0], valsel: spec[1]}, function(node_el){
                if(!node_el){
                    return null;
                }
                if(node_el.commands[cmdName_s] || (node_el.templ && node_el.templ.on[cmdName_s])){
                    return node_el;
                }
                return null;
            }, event_d);

            if(source_el){
                if(source_el.commands[cmdName_s]){
                    func = source_el.commands[cmdName_s];
                }else if(source_el.templ && source_el.templ.on[cmdName_s]){
                    subSpec_s = source_el.templ.on[cmdName_s];
                }
                if(spec.length > 1){
                    var k = spec[1];
                    var dest_k = spec[1];
                    if(/=/.test(k)){
                        console.log('splitty from ' + spec[1]);
                        var k_li = k.split('=');
                        dest_k = k_li[0];
                        k = k_li[1];
                    }
                    console.log('SET ON SOURCER? orig ' + spec[1] + ' dest:' + dest_k + ' = ' + target_el.vars[k] + ' from ' + k , source_el);
                    console.log('SET FROM TRAGET? orig ' + spec[1] + ' dest:' + dest_k + ' = ' + target_el.vars[k] + ' from ' + k , target_el);
                    var varKeys = Object.keys(source_el.templ.vars);
                    if(varKeys.indexOf(k) != -1 && target_el.vars[k]){
                        console.log('SET ' + dest_k + ' = ' + target_el.vars[k] + ' from ' + k , source_el);
                        source_el.vars[dest_k] = target_el.vars[k];
                    }
                }
            }else{
                console.log('ERROR: source_el not found ' + spec[0], node);
            }

            if(func){
                func(this, source_el, name, spec, event_d);
                if(source_el.templ.on && source_el.templ.on[cmdName_s]){
                    handleEvent.call(source_el, cmdName_s, source_el.templ.on[cmdName_s], target_el, event_d);
                }
            }else if(subSpec_s){
                handleEvent.call(source_el, cmdName_s, subSpec_s, target_el, event_d);
            }else{
                console.log('NOT FOUND cmd "'+ cmd +'" not found "'+ cmdName_s +'"');
            }
        }else if(window.basic.commands && window.basic.commands[cmd]){
            window.basic.command[cmd].call(this, name, eventSpec_s);
        }
    }
}

function dataScope(sel, data){
    var key = sel;
    while(key && key.length > 1 && data !== undefined){
        if(key[0] === '^'){
            key = key.substring(1);
            data = data._parentData;
        }else if(key[0] === '_'){
            key = key.substring(1);
            if(data[key]){
                data = data[key];
            }else{
                return {key: null, data: null};
            }
        }else{
            break;
        }
    }

    return {
        key:key,
        data: data || null
    };
}

function El_StyleFromSetters(styleSetters, templ, node, data){
    for(var i = 0; i < styleSetters.length; i++){
        var setter = styleSetters[i].split('=');
        if(setter.length == 2){
            var key = setter[0];
            var style = setter[1];
            while(key.length > 1 && key[0] === '^' && data !== undefined){
                key = key.substring(1);
                data = data._parentData;
            }

            var scope = dataScope(key, data);
            if(scope.data && scope.data[scope.key] === node.vars[scope.key]){
                El_SetStyle(style, templ, node);
            }
        }
    }
}

function El_RemoveStyle(style_s, templ, node){
    node.classList.remove(style_s);
}

function El_SetStyle(style_s, templ, node){
    if(templ.classList){
        node.classList = templ.classList;
    }

    if(style_s){
        for(var i = 0; i < templ.styleOptions.length; i++){
            var idx = templ.styleOptions.indexOf(style_s);
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

    var varKeys = Object.keys(templ.vars);
    if(varKeys.length){
        for(var i = 0; i < varKeys.length; i++){
            var key = varKeys[i];
            node.vars[key] = data[key];
        }
    }

    El_SetStyle(null, templ, node);
    El_StyleFromSetters(templ.styleSetters, templ, node, data);

    var commandKeys = templ.commandKeys;
    if(commandKeys.length){
        for(var i = 0; i < commandKeys.length; i++){
            var cmdKey = commandKeys[i];
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
            node.onclick = handleEvent.bind(node, 'click', eventSpec_s, node, {});
        }else if(key == 'down'){
            node.onmousedown = handleEvent.bind(node, 'down', eventSpec_s, node, {});
        }else if(key == 'up'){
            node.onmouseup = handleEvent.bind(node, 'up', eventSpec_s, node, {});
        }else if(key == 'key'){
            node.onkeyboard = handleEvent.bind(node, 'key', eventSpec_s, node, {});
        }else if(key == 'hover'){
            node.onmouseover = handleEvent.bind(node, 'hover', eventSpec_s, node, {});
            node.onmouseout = handleEvent.bind(node, 'unhover', eventSpec_s, node, {});
        }else{
            node.events[key] = eventSpec_s
        }
    }

    if(templ.children){
        for(var i = 0, l = templ.children.length; i < l; i++){
            El_Make(templ.children[i], node, rootEl, data);
        }
    }

    var childTempl = templ.childTempl;
    if(templ.childSetter){
        var scope = dataScope(templ.childSetter, data);
        if(scope.data[scope.key]){
            childTempl = scope.data[scope.key];
        }
    }

    if(childTempl){
        El_SetChildren(node, childTempl, null, data);
    }

    if(templ.childrenKey && templ.childrenTempl){
        El_SetChildren(node, templ.childrenTempl, templ.childrenKey, data);
    }

    targetEl.appendChild(node);
}

function updateEl(el, targetEl, data){
    ;
}
