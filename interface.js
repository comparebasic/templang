var FLAG_INITIALIZED = 1;
var FLAG_UPDATE = 2;

var STATE_TEXT = 0;
var STATE_PRE_KEY = 1;
var STATE_KEY = 2;

var QUERY_SELF = 1;
var QUERY_PARENTS = 2;
var QUERY_CHILDREN = 4;

var EVENT_QUERY = 16;
var ELEM_QUERY = 17;

function PropName(name_s){
    if(/\./.test(name_s)){
        var props = name_s.split('.');
        var name = props[0];
        props.shift();
        return {name: name, props: props.split('/')};
    }
    return {name: name_s, props: []};
}

function GetDirection(sel_s){
    var direction = QUERY_SELF;
    var type = EVENT_QUERY;
    var sel = sel_s;
    if(sel[0] === '_'){
        direction = QUERY_CHILDREN;
        sel = sel.substring(1);
    }else if(sel[0] === '^'){
        direction = QUERY_PARENTS;
        sel = sel.substring(1);
    }

    if(sel[0] === '#'){
        direction = QUERY_CHILDREN;
        type = ELEM_QUERY;
        sel = sel.substring(1);
    }

    return {sel: sel, direction: direction, type: type };
}


function specParse(spec_s){
    var spec = {cmd: null, values: [], direction: QUERY_SELF};
    if(/:/.test(spec_s)){
        var s_li = spec_s.split(':'); 
        var dir = GetDirection(s_li[0]);

        spec.direction = dir.direction;
        spec.cmd = dir.sel;

        if(s_li.length > 1){
            s_li.shift();
            spec.values = s_li;
        }
    }
    return spec;

}

function Event_SetSpec(event_ev, spec_s){
    var spec = specParse(spec_s);
    event_ev.spec =  {
        spec_s: spec_s, /* original spec string */
        eventName: spec.cmd,/* the first part of the event for routing */
        values: spec.values, /* the remainder of the event */
        gathers: {}, /* key:elem_addr -> [props: vars to gather] */
        getvars: [], /* key:elem_addr -> [props: vars to gather] */
    }

    for(var i = 0; i < event_ev.spec.values.length; i++){
        var var_k = event_ev.spec.values[i];
        if(var_k[0] == '#'){
            var props = PropName(var_k); 
            event_ev.gathers[prop.name_s] = prop.props;
        }else{
            event_ev.getvars.push(var_k);
        }
    }

    return event_ev;
}

function CopyVars(values, to, from){
    for(var i = 0; i < values.length; i ++){
        var key = values[i];
        if(key[0] !== '_' || key[0] !== '^' || key[0] !== '#'){
            var var_k = key[0];
            var dest_k = var_k;
            if(/=/.test(var_k)){
                var var_li = var_k.split('=');
                var_k = var_li[1];
                dest_k = var_li[0];
            }

            if(from[var_k]){
                to[dest_k] = from[var_k];
            }
        }
    }
}

function Event_New(target_el, sourceType, spec_s){

    if(/;/.test(spec_s)){
        var events_li = [];
        var events_li = eventSpec_s.split(';');
        for(var i = 0; i < events_li.length; i++){
            events_li.push(Event_New(target_el, sourceType, events_li[i]);
            return events_li;
        }
        return;
    }

    var event_ev = {
        target: target_el, /* the source of the event, e.g. clicked element */
        sourceType: sourceType, /* the dispatch method e.g click, mousedown, key */
        dest: null, /* the destination that has the event on it */
        vars: {}, /* end result of target vars + gathers */
        _pior: null, /* event this event is based on */
    }

    Event_SetSpec(event_ev, spec_s);

    if(target_el.vars){
        if(event_ev.spec.getvars){
            CopyVars(event_ev.spec.getvars, event_ev.vars, target_el.vars);
        }
    }

    return event_ev;

}

function Event_Clone(target_el, _event_ev, spec_s){
    var event_ev = Event_New(target_el, _event_ev.sourceType, spec_s); 
    event_ev.vars = _event_ev.vars;
    event_ev.gathers = _event_ev.gathers;
    event_ev._prior = _event_ev;

    return Event_SetSpec(spec_s);
}

function El_Match(node, name, data){
    var found = false;
    if(node.templ && (!name || node.templ.name === name)){
        if(typeof data === 'function'){
            return data(node, name); 
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

function Match_ByCommandOrHandler(node_el, event_s){
    if(node_el.commands[event_s] || node_el.templ && node_el.templ.on[event_s]){
        return node_el;
    }
    return null;
}

function El_Query(node, criteria){
    var direction = QUERY_SELF;
    var nodeName = null;
    var match = null;

    if(typeof criteria === 'object'){
        /* event_ev */
        if(criteria.direction){
            direction = event_ev.spec.direction;
            match = Match_ByCommandOrHandler;
            nodeName = event_ev.spec.cmd;
        };
    }else if(typeof criteria === 'string'){
        var dir = GetDirection(criteria);
        direction = dir.direction;
        if(dir.type == ELEM_QUERY){
            nodeName = dir.sel;
        }
    }

    if(event_ev.spec.gathers){
        for(var k in event_ev.spec.gathers){
            if(El_Match(node, k, null)){
                CopyVars(event_ev.spec.gathers[i], event_ev.vars, node.vars);
            }
        }
    }

    if(El_Match(node, nodeName, match)){
        return node;
    }

    if(direction === QUERY_CHILDREN){
        for(var i = 0, l = node.childNodes.length; i < l; i++){
            if(node.childNodes[i].nodeType === Node.ELEMENT_NODE){
                var found = El_Query(node.childNodes[i], event_ev, criteria);
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

            var found = El_Query(parent_el, event_ev, criteria);
            if(found != null){
                return found; 
            }

            node = parent_el;
        }
    }
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

function handleEvent(event_ev){

    if(event_ev.length){
        for(int i = 0; i < event_ev.length; i++){
            handleEvent(event_ev[i]);
        }
    }

    var msg = "[event called]:" + event_ev.eventName + ' ' + event_ev.spec.spec_s);
    console.log(msg, event_ev.target_el);

    if(event_ev.eventName === 'templ'){
        var pair = specParse(eventSpec_s);
        if(target_el.vars[pair.value]){
            El_SetChildren(event_ev.target, target_el.vars[pair.value], null, null);
        }
    }else if(event_ev.eventName == 'style'){
        if(name == 'unhover'){
            if(spec.length == 2){
                var value = spec[1];
                El_RemoveStyle(value, event_ev.target.templ, event_ev.target);
            }else if(spec.length == 3){
                var value = spec[1];
                var value2 = spec[2];
                El_RemoveStyle(value, event_ev.target.templ, event_ev.target);
                El_SetStyle(value2, event_ev.target.templ, event_ev.target);
            }
        }else{
            if(spec.length >= 2){
                var value = spec[1];
                El_SetStyle(value, event_ev.target.templ, event_ev.target);
            }
        }
    }else{
        var dest_el = El_Query(event_ev.target_el, event_ev);

        if(dest_el && node_el.commands[event_s]){
            event_ev.dest = source_el;
            node_el.commands[event_s](event_ev);
        }

        if(dest_el && dest_el && dest_el.templ != event_ev.target_el && dest_el.templ.on[event_s]){
            handleEvent(Event_Clone(source_el, event_ev, dest_el.templ.on[event_s]));
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
            node.onclick = function(){ handleEvent(Event_New(node, 'click', eventSpec_s))};
        }else if(key == 'down'){
            node.onmousedown = function(){ handleEvent(Event_New(node, 'down', eventSpec_s))};
        }else if(key == 'up'){
            node.onmouseup = function(){ handleEvent(Event_New(node, 'up', eventSpec_s, node))};
        }else if(key == 'key'){
            node.onkeyboard = function(){ handleEvent(Event_New(node, 'key', eventSpec_s, node))};
        }else if(key == 'hover'){
            node.onmouseover = function(){ handleEvent(Event_New(node, 'hover', eventSpec_s, node))};
            node.onmouseout = function(){ handleEvent(Event_New(node, 'unhover', eventSpec_s, node))};
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
