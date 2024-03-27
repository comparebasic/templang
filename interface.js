var ui = UI_Init();
var template = Template_Init();
var injest = Content_Init();
var anim = Anim_Init();
var change = Change_Init();

function NestData(child, parentData){
    child._parentData = parentData;
}

function PropName(name_s){
    if(/\./.test(name_s)){
        var props = name_s.split('.');
        var name = props[0];
        props.shift();
        return {name: name, props: props};
    }
    return name_s;
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
        type = ELEM_QUERY;
        sel = sel.substring(1);
    }

    return {sel: sel, direction: direction, type: type };
}

function FilterSetters(var_li){
    if(typeof var_li === 'object'){
        var li = [];
        for(var k in var_li){
            var x = var_li[k];
            if(/=/.test('=')){
                var _li = x.split('=');
                li.push(_li[0]);
            }else{
                li.push(x);
            }

        }
    }else if(Array.isArray(var_li)){
        var li = [];
        for(var i = 0; i < var_li.length; i++){
            var x = var_li[i];
            if(/=/.test('=')){
                var _li = x.split('=');
                li.push(_li[0]);
            }else{
                li.push(x);
            }

        }
    }

    return li;
}

function CopyVars(values, to, from){
    if(Array.isArray(values)){
        for(var i = 0; i < values.length; i ++){
            var key = values[i];
            if(key[0] === '_' || key[0] === '#'){
                console.warn('element and child copy vars not supported');
                continue;
            }

            var var_k = key;
            var dest_k = var_k;
            if(/=/.test(var_k)){
                var var_li = var_k.split('=');
                var_k = var_li[1];
                dest_k = var_li[0];
            }

            var scope = DataScope(var_k, from);
            if(scope.data){
                var value = scope.data;
                var_k = scope.ukey;
                to[dest_k] = value;

                return;
            }

            if(from[var_k]){
                to[dest_k] = from[var_k];
            }
        }
    }else if(typeof values == 'object'){
        for(var k in values){
            var valKey = values[k]; 

            var scope = DataScope(k, from);
            if(scope.data){
                var value = null;
                var dest_k = k;
                if(typeof scope.data === 'string'){
                    value = scope.data;
                    to[dest_k] = value;
                }

                continue;
            }

            if(from[k]){
                to[k] = from[k];
            }
        } 
    }
}

function specParse(spec_s, spec){
    if(/:/.test(spec_s)){
        var s_li = spec_s.split(':'); 
        spec.eventName = s_li[0];
        var dir = GetDirection(s_li[0]);

        spec.direction = dir.direction;
        spec.cmd = dir.sel;

        if(s_li.length > 1){
            s_li.shift();
            for(var i = 0; i < s_li.length; i++){
                var s = s_li[i];
                if(s.indexOf('/') != -1){
                    s = s.split('/');
                }
                spec.values.push(s);
            }
        }
    }else{
        spec.eventName = spec;
    }
    return spec;

}


function Event_SetSpec(event_ev, spec_s){
    event_ev.spec = specParse(spec_s, {
        direction: QUERY_SELF,
        spec_s: spec_s, /* original spec string */
        eventName: [],/* the first part of the event for routing */
        values: [], /* the remainder of the event */
        gathers: {}, /* key:elem_addr -> [props: vars to gather] */
        getvars: [], /* key:elem_addr -> [props: vars to gather] */

    });

    for(var i = 0; i < event_ev.spec.values.length; i++){
        var var_k = event_ev.spec.values[i];
        if(var_k[0] == '#'){
            var props = PropName(var_k.substring(1)); 
            event_ev.spec.gathers[props.name] = props.props;
        }else{
            event_ev.spec.getvars.push(var_k);
        }
    }

    return event_ev;
}

function Event_New(target_el, sourceType, spec_s){

    if(/;/.test(spec_s)){
        var events_li = [];
        var li_s = spec_s.split(';');
        for(var i = 0; i < li_s.length; i++){
            events_li.push(Event_New(target_el, sourceType, li_s[i]));
        }
        return events_li;
    }

    var event_ev = {
        target: target_el, /* the source of the event, e.g. clicked element */
        sourceType: sourceType, /* the dispatch method e.g click, mousedown, key */
        flags: 0,
        dest: null, /* the destination that has the event on it */
        vars: {}, /* end result of target vars + gathers */
        props: {},
        _pior: null, /* event this event is based on */
    }

    Event_SetSpec(event_ev, spec_s);

    if(target_el.vars){
        if(event_ev.spec.getvars){
            if(DEBUG_VARS_GATHER){
                console.debug('Copy EVENT_NEW var keys: ',event_ev.spec.getvars);
                console.debug('Copy EVENT_NEW var from: ',target_el.vars);
                console.debug('Copy EVENT_NEW var to: ', event_ev.vars);
                console.debug('Copy EVENT_NEW var to event: ', event_ev);
                console.debug('Copy EVENT_NEW var from target_: ', target_el);
            }
            CopyVars(event_ev.spec.getvars, event_ev.vars, target_el.vars);
            if(DEBUG_VARS_GATHER){
                console.debug('Copy EVENT_NEW var AFTER to event: ', event_ev.vars);
            }
        }
    }

    return event_ev;
}

function Event_Clone(target_el, _event_ev, spec_s){
    var event_ev = Event_New(target_el, _event_ev.sourceType, spec_s); 
    event_ev.vars = _event_ev.vars;
    event_ev.gathers = _event_ev.gathers;
    event_ev._prior = _event_ev;

    Event_SetSpec(event_ev, spec_s);
    return event_ev;
}

function El_Match(node, name, data){
    if(typeof data === 'function'){
        return data(node, name); 
    }
    var found = false;
    if(node.templ && (!name || node.templ.name === name)){
        if(data){
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
    var gathers = {};
    var root_el = null;
    var dest_vars = null;
    var outerParent_el = null;

    if(!node){
        console.warn("El_Query called with empty node");
        return;
    }

    if(typeof criteria === 'object'){
        if(criteria.spec){
            var ev = criteria;
            /* event_ev */
            direction = ev.spec.direction;
            match = Match_ByCommandOrHandler;
            nodeName = ev.spec.cmd;
            gathers = ev.spec.gathers;
            dest_vars = ev.vars;
            root_el = ev.target.root_el;
        }else if(criteria.name){
            var dir = GetDirection(criteria.name);
            if(dir.type == ELEM_QUERY){
                nodeName = dir.sel;
                direction = dir.direction;
                match = criteria.data;
            }
            if(criteria.root_el){
                root_el = criteria.root_el;
            }
        }
    }else if(typeof criteria === 'string'){
        var dir = GetDirection(criteria);
        direction = dir.direction;
        if(dir.type == ELEM_QUERY){
            nodeName = dir.sel;
        }
    }

    if(gathers && dest_vars){
        for(var k in gathers){
            if(El_Match(node, k, null)){
                if(DEBUG_VARS_GATHER){
                    console.debug('Copy ELEM_QUERY gather var keys: ', gathers[k]);
                    console.debug('Copy ELEM_QUERY gather var from: ', node.vars);
                    console.debug('Copy ELEM_QUERY gather var to: ', dest_vars);
                }
                CopyVars(gathers[k], dest_vars, node.vars);
            }
        }
    }

    if(El_Match(node, nodeName, match)){
        return node;
    }

    if(direction === QUERY_CHILDREN){
        for(var i = 0, l = node.childNodes.length; i < l; i++){
            if(node.childNodes[i].nodeType === Node.ELEMENT_NODE){
                var found = El_Query(node.childNodes[i], criteria);
                if(found != null){
                    return found; 
                }
            }
        }
    }

    if(direction === QUERY_PARENTS){
        while(node != null){
            if(node.parentNode){
                node = node.parentNode;
            }else{
                if(root_el && (node != root_el)){
                    node = root_el;
                    root_el = null;
                }else{
                    break;
                }
            }

            if(node.flags && (node.flags & FLAG_CONTAINER)){
                return null;
            }

            var found = El_Query(node, criteria);
            if(found != null){
                return found; 
            }

        }
    }
}

function El_SetChildren(node, templ, key, data){
    if(key){
        if(key && templ){
            node.innerHTML = '';
            var childItems = data[key];
            if(childItems){
                if(childItems._views){
                    for(var idx in childItems._views){
                        var v = childItems._views[idx];
                        v.el_li = [];
                    }
                }
                for(var j = 0; j < childItems.length; j++){
                    var childData = childItems[j];
                    NestData(childData, data);
                    var node_el = El_Make(templ, node, node.root_el, childData);
                    node_el._content_idtag = childItems._idtag;
                    if(childItems._views){
                        for(var idx in childItems._views){
                            var v = childItems._views[idx];
                            v.el_li.push({
                                node_idx:node_el.idx,
                                el:node_el,
                                source: childData,
                            });
                        }
                    }
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

function getNodeData(node, spec_s){
    var props = PropName(spec_s);
    var dataNode = El_Query(node, {name: props.name, root_el: node.root_el});
    var data = {};
    if(!dataNode){
        console.warn("Warn: getNodeData no element for data found", spec_s);
        console.warn("Warn: getNodeData no element for data found node", node);
        return null;
    }
    if(dataNode && props.props[0]){
        return dataNode.vars[props.props[0]];
        return data;
    }else{
        console.warn("Warn: getNodeData no data found");
        return null;
    }
}

function addChildData(node, childrenDataKeys, childData){
    if(childrenDataKeys){
        for(var i = 0; i < childrenDataKeys.length; i++){
            var dataQ = childrenDataKeys[i];
            var props = PropName(dataQ);
            var dataNode = El_Query(node, {name: props.name, root_el: node.root_el});
            if(dataNode && props.props[0]){
                childData[props.props[0]] = dataNode.vars[props.props[0]];
            }else{
                console.warn("addChildData: data not found", dataNode);
                console.warn("addChildData: data not found queried", props);
                console.warn("addChildData: data not found queried node", node);
            }
        }
    }
}

function handleEvent(event_ev){
    if(event_ev.length){
        for(var i = 0; i < event_ev.length; i++){
            handleEvent(event_ev[i]);
        }
        return;
    }

    var msg = "[event called]:" + event_ev.sourceType + ' ' + event_ev.spec.eventName + ' ' +event_ev.spec.spec_s;
    // console.log(msg, event_ev);

    if(event_ev.spec.eventName === 'templ'){
        var props = PropName(event_ev.spec.values[0]);
        var type = null;
        if (typeof props === 'object'){
            var dataNode = El_Query(event_ev.target, {name: props.name});
            if(dataNode){
                type = dataNode.vars[props.props[0]];
            }
        }else{
            type = event_ev.vars[props];
        }

        var childData = {};
        if(event_ev.target){
            var childrenDataKeys = event_ev.target.templ && event_ev.target.templ.childrenDataKeys;
            addChildData(event_ev.target, childrenDataKeys, childData);
        }

        if(type && childData){
            El_SetChildren(event_ev.target, type, null, childData);
        }
    }else if(event_ev.spec.eventName === 'style'){
        if(event_ev.sourceType === 'unhover'){
            var value = event_ev.spec.values[0];
            if(Array.isArray(value)){
                value = value[1];
            }
            El_SetStyle(value, event_ev.target.templ, event_ev.target);
        }else{
            var value = event_ev.spec.values[0];
            if(Array.isArray(value)){
                value = value[0];
            }
            El_SetStyle(value, event_ev.target.templ, event_ev.target);
        }
    }else{
        var dest_el = El_Query(event_ev.target, event_ev);
        if(dest_el){
            var event_s = event_ev.spec.cmd;
            if(dest_el.commands[event_s]){
                event_ev.dest = dest_el;
                dest_el.commands[event_s](event_ev);
            }

            if(DEBUG_VARS_GATHER){
                console.debug('Copy HANDLE_EVENT var keys: ', Object.keys(event_ev.vars));
                console.debug('Copy HANDLE_EVENT var from: ', event_ev.vars);
                console.debug('Copy HANDLE_EVENT var to: ', dest_el.vars);
                console.debug('Copy HANDLE_EVENT var to dest: ', dest_el);
                console.debug('Copy HANDLE_EVENT var from ev: ', event_ev);
            }
            CopyVars(Object.keys(event_ev.vars), dest_el.vars, event_ev.vars);
            if(DEBUG_VARS_GATHER){
                console.debug('Copy HANDLE_EVENT var AFTER  to: ', dest_el.vars);
            }
            if(dest_el.templ != event_ev.target_el && dest_el.templ.on[event_s]){
                handleEvent(Event_Clone(dest_el, event_ev, dest_el.templ.on[event_s]));
            }
        }
    }
}

function GetDestK(key){
    var var_k = key;
    var dest_k = var_k;
    if(/=/.test(var_k)){
        var var_li = var_k.split('=');
        var_k = var_li[1];
        dest_k = var_li[0];
    }
    return {
        key: var_k,
        dest_key: dest_k
    }
}

function DataScope(sel, data){
    var key = sel;
    var ukey = sel;
    if(ukey[0] === '^'){
        ukey = ukey.substring(1);
    }else if(key[0] === '_'){
        ukey = ukey.substring(1);
    }

    if(key[0] === '^'){
        data = data._parentData;
    }

    var ret = null;
    while(ret === null && data){
        if(data[ukey]){
            ret = data[ukey];
        }else if(key[0] === '^'){
            data = data._parentData;
        }else{
            break;
        }
    }

    return {
        key: key,
        ukey: ukey,
        data: ret || null
    };
}

function El_StyleFromSetters(styleSetters, templ, node, data){
    for(var i = 0; i < styleSetters.length; i++){
        var styleset = styleSetters[i]
        var spec = specParse(styleset, {values: []});
        var keys = GetDestK(spec.eventName);

        var scope = DataScope(keys.key, data);
        var style = spec.values[0];
        if(style && scope.data && scope.data === node.vars[keys.dest_key]){
            El_SetStyle(style, templ, node);
        }
    }
}

function El_RemoveStyle(style_s, templ, node){
    node.classList.remove(style_s);
}

function El_SetStyle(style_s, templ, node){
    if(templ.classList){
        node.classList = [];
        for(var i = 0; i < templ.classList.length; i++){
            node.classList.add(templ.classList[i]);
        }
    }else{
        node.classList = [];
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
    if(DEBUG_CASH){
        console.debug('CASH of :' + s, data);
    }
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
                var scope = DataScope(key, data);
                if(!scope.data || (typeof scope.data === 'object')){
                    return "";
                }
                shelf += scope.data;
                key = "";
                state = STATE_TEXT;
                continue;
            }else{
                key += c;
            }
        }
    }
    if(DEBUG_CASH){
        console.debug('cash result:', shelf);
    }
    return shelf;
}

function Event_Bind(node, name, eventSpec_s){
    return Event_New(node, name, eventSpec_s);
}

var el_idx = 0;
function El_Make(templ, targetEl, rootEl, data){
    var templ_s = templ;
    if(typeof templ === 'string'){
        templ = window.basic.templates[templ];
    }

    if(templ.name === 'viewport-view'){
        console.debug("viewport view", templ);
    }

    if(templ && templ.childrenTempl && !templ.childrenKey){

        var templ_s = cash(templ.childrenTempl, data);
        if(DEBUG_CHILDREN_AS){
            console.debug('Detecting funny thing ' +templ.childrenTempl + ' now with ' + templ_s, data);
        }
        var templ_prev = templ;
        if(templ_s){
            templ = window.basic.templates[templ_s];
        }
        if(templ_prev && templ){
            templ = template.Templ_Merge(templ, templ_prev);
        }
    }

    if(!templ){
        console.warn('Error: template not found: '+ templ_s, data);
        return;
    }

    var node = document.createElement(templ.nodeName);
    node.idx = 'idx_'+String(++el_idx);
    node.vars = {};
    node.events = {};
    node.templ = templ;
    node.root_el = rootEl;
    node.commands = {};
    targetEl.appendChild(node);

    if(templ && templ.dragElementSpec){
        templ.dragElements = getNodeData(node, templ.dragElementSpec);
        if(templ.dragElements){
            if(typeof templ.dragElements._views === 'undefined'){
                templ.dragElements._views = {};
            }
            var _dragView = {_elements: templ.dragElements, el_li: []};
            templ.dragElements._views[node.idx] = _dragView;
            node._view = _dragView;
        }else{
            console.warn('NOT FOUND drag elements data');
        }
        node.flags &= ~FLAG_DRAG_CONT_CALCULATED;
        ui.SetMouseDrop(node, null);
    }

    if(templ.body){
        node.innerHTML = cash(templ.body, data);
    }

    var varKeys = Object.keys(templ.vars);
    if(DEBUG_VARS_GATHER){
        console.debug('Copy EL_MAKE var keys: ', varKeys);
        console.debug('Copy EL_MAKE var from: ', data);
        console.debug('Copy EL_MAKE var to: ', node.vars);
        console.debug('Copy EL_MAKE templ: ', templ);
    }
    CopyVars(varKeys, node.vars, data);
    if(DEBUG_VARS_GATHER){
        console.debug('Copy EL_MAKE var AFTER to making: ' + templ.name, node.vars);
    }

    if(templ.mapVars && Object.keys(templ.mapVars).length > 0){
        if(DEBUG_VARS_GATHER){
            console.debug('Copy EL_MAKE mapVars keys: ', templ.mapVars);
            console.debug('Copy EL_MAKE mapVars from: ', data);
            console.debug('Copy EL_MAKE mapVars to: ', node.vars);
            console.debug('Copy EL_MAKE mapVars templ: ', templ);
        }
        CopyVars(templ.mapVars, node.vars, data);
    }

    El_SetStyle(null, templ, node);
    El_StyleFromSetters(templ.styleSetters, templ, node, data);
    if(templ.atts){
        for(var i = 0; i < templ.atts.length; i++){
            var a = templ.atts[i];
            var keys = GetDestK(a);
            var scope = DataScope(keys.key, data); 
            if(typeof scope.data === 'string'){
                node.setAttribute(keys.dest_key, scope.data);
            }
        }
    }

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
            ui.SetMouseClick(node, Event_Bind(node, 'click', eventSpec_s));
        }else if(key == 'down'){
            ui.SetMouseDown(node, Event_Bind(node, 'down', eventSpec_s));
        }else if(key == 'up'){
            ui.SetMouseUp(node, Event_Bind(node, 'up', eventSpec_s));
        }else if(key == 'key'){
            Event_Bind(node, 'key', eventSpec_s);
        }else if(key == 'drag'){
            ui.SetMouseDrag(node, Event_Bind(node, 'drag', eventSpec_s));
        }else if(key == 'hover'){
            ui.SetHover(node,  Event_Bind(node, 'hover', eventSpec_s));
            ui.SetUnHover(node, Event_Bind(node, 'unhover', eventSpec_s));
        }
    }

    if(templ.children){
        for(var i = 0, l = templ.children.length; i < l; i++){
            El_Make(templ.children[i], node, rootEl, data);
        }
    }

    var childTempl = templ.childTempl;
    if(templ.childSetter){
        var scope = DataScope(templ.childSetter, data);
        if(scope.data && scope.data[scope.key]){
            childTempl = scope.data[scope.key];
        }
    }

    if(childTempl){
        El_SetChildren(node, childTempl, null, data);
    }

    if(templ.childrenDataKeys && templ.childrenTempl){
        addChildData(node, templ.childrenDataKeys, data);
        var childrenTempl = templ.childrenTempl;
        if(typeof childrenTempl === 'string'){
            var childrenTempl = window.basic.templates[childrenTempl];
        }
        var templ_child = template.Templ_Merge(childrenTempl, templ);
        El_SetChildren(node, templ_child, templ.childrenKey, data);
    }

    if(templ.childrenKey && templ.childrenTempl){
        var childrenTempl = templ.childrenTempl;
        if(typeof childrenTempl === 'string'){
            var childrenTempl = window.basic.templates[childrenTempl];
        }
        var templ_child = template.Templ_Merge(childrenTempl, templ);
        El_SetChildren(node, templ_child, templ.childrenKey, data);
    }

    if(templ && templ.on['init']){
        handleEvent(Event_New(node, 'init', templ.on['init']));
    }
    return node;
}
