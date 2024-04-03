/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


[TempLang: Documentation]
see https://templang.org/example.html for an example of the framework

public API:

    Templag_Init(templates_el, framework) -> undefined
       - templates_el: this is the root node that contains HTML template tags
         to use with TempLang 
       - framework: this is an empty object that will be filled in with the
         TempLang public API functions

    upon success the "framework" object will have been modified to contain the
    following:

        {
            El_Make: El_Make,
            Injest: Injest,
            Cash: Cash,
        }

    El_Make(templ, parent_el, data) -> undefined
        - templ: string or template object that was added to framework.templates
        - parent_el: where to place the newly created element
        - data: data used to populate the nodes that are designated by the "templ"

    Injest(content) -> undefined
        - content: an array that will be tagged with tracking properties such
          as _idscope, and _idtag that are used internally by TempLang

    Cash(s, data) -> string
        - s: string to parse in the form of "Hi there ${prop}"
        - data: a data object with data used to fill the cash string
*/

function TempLang_Init(templates_el, framework){

    (function (host){
        if(window.location.host !== host && window.location.host !== 'localhost'){
            throw Error('This file is intended to be served from "' + host + '". The framework is licenced under the MIT license, which means you are welcome to remove this function and it\'s caller and host this file from any domain of your choosing.');
        }
    })('templang.org');


    var STATE_TEXT = 0;
    var STATE_PRE_KEY = 1;
    var STATE_KEY = 2;

    var DIRECTION_SELF = 3;
    var DIRECTION_PARENT = 4;
    var DIRECTION_CHILD = 5;
    var TYPE_HANDLER = 6;
    var TYPE_FUNC = 7;
    var TYPE_ELEM = 8;

    function El_Match(node, compare){
        if(Array.isArray(compare)){
            for(let i = 0; i < compare.length; i++){
                var comp = compare[i];
                if(typeof comp === 'object'){
                    for(var k in comp){
                        if(!node.vars && !node.templ){
                            continue;
                        }
                        const key2 = comp[k];
                        if((node.vars[k] && (node.vars[k] == comp[k])) || (node.templ[k] && node.templ[k][key2])){
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function El_Query(node, spec, compare){
        if(El_Match(node, compare)){
            return node;
        }

        if(spec.direction === DIRECTION_PARENT && node.parentNode){
            return El_Query(node.parentNode, spec, compare);
        }

        return null;
    }


    function Args_Parse(args_s){
        return args_s.split(',');
    }

    function Spec_Parse(spec_s){
        var spec = {
            direction: DIRECTION_SELF, 
            type: TYPE_HANDLER,
            mapVars: {},
            key: null,
            func: null,
        };
        if(!spec_s){
            return spec;
        }

        if(spec_s.indexOf(';') != -1){
            const li = spec_s.split(';');
            const ret = [];
            for(let i = 0; i < li.length; i++){
                ret.push(Spec_Parse(li[i])); 
            }
            return ret;
        }
        var key = spec_s;
        if(key[0] === '_'){
            spec.direction = DIRECTION_CHILD;
            key = key.substring(1);
        }else if(key[0] === '^'){
            spec.direction = DIRECTION_PARENT;
            key = key.substring(1);
        }

        if(key[0] === '#'){
            spec.type = TYPE_ELEM;
            key = key.substring(1);
        }

        const openP = key.indexOf('(');
        let handler = null;
        let closeP = -1;
        let rest = null;
        if(openP != -1){
            rest = key.substring(openP+1);
            key = key.substring(0, openP);
            closeP = rest.indexOf(')');
        }

        if(rest && closeP != -1){
            spec.mapVars = Map_Make(rest.substring(0, closeP));
        }

        spec.key = key;

        return spec;
    }

    function CopyVars(map, to, from){
        for(var k in map){
            if(from[map[k]]){
                to[k] = from[map[k]];
            }
        }
    }

    function Event_Run(event_ev){
        const dest_el = El_Query(event_ev.target, event_ev.spec, [
            {on: event_ev.spec.key},
            {funcs: event_ev.spec.key}
        ]);

        let func = null;

        if(dest_el){
            event_ev.dest = dest_el;
            if(dest_el.templ && dest_el.templ.funcs[event_ev.spec.key]){
                func = dest_el.templ.funcs[event_ev.spec.key];
            }
        }

        if(func){
            func(event_ev);
        }
    }

    function Event_New(target_el, e, spec){
        var event_ev = {
            target: target_el, /* the source of the event, e.g. clicked element */
            dest: null, /* the destination that has the event on it */
            e: e,
            spec: spec,
            vars: {}, /* end result of target vars + gathers */
            _pior: null, /* event this event is based on */
        }

        if(target_el.vars){
            if(spec.mapVars){
                CopyVars(spec.mapVars, event_ev.vars, target_el.vars);
            }
        }

        return event_ev;
    }

    function onMouseMove(e){
        var x = e.clientX;
        var y = e.clientY;
    }

    function onDown(e){
        var node = this;
        var node = this;
        if(node._down_ev){
            Event_Run(node._down_ev);
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onUp(e){
        var node = this;
        if(node.templ && node.templ.on.mouseup){
            Event_Run(Event_New(node, e, node.templ.on.mouseup));
        }
        if(node.templ && node.templ.on.click){
            Event_Run(Event_New(node, e, node.templ.on.click));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onScroll(e){
        var node = this;
    }

    function onHover(e){
        var node = this;
        if(node.on.hover){
            Event_Run(Event_New(node, e, node.on.hover));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onUnHover(e){
        var node = this;
        if(node.on.unhover){
            Event_Run(Event_New(node, e, node.on.unhover));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function El_SetEvents(node, events){
        if(events.mouseup || events.click){
            node.onmouseup = onUp;
        }
        if(events.mousedown){
            node.onmosuedown = onDown;
        }
        if(events.hover){
            node.onmosueover = onHover;
            node.onmosueout = onUnHover;
        }
    }

    function Injest(content){
        const framework = this;
        if(Array.isArray(content)){
            for(let i = 0; i < content.length; i++){
                content._idtag = ++framework.content_idx;
                content._idscope = 'content';
            }
        }
    }

    function DataScope(sel, data){
        if(data[sel]){
            return data[sel];
        }
        return null;
    }

    function Cash(s, data){
        if(!s){
            return "";
        }

        let state = STATE_TEXT;
        let key = "";
        let shelf = "";
        for(let i = 0; i < s.length; i++){
            const c = s.charAt(i);
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
                    var value = DataScope(key, data);
                    if(!value){
                        return "";
                    }
                    shelf += value;
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

    function Templ_Merge(into_templ, from_templ){

        const templ = {
            nodeName: into_templ.nodeName,
            name: into_templ.name,
            flags: into_templ.flags | from_templ.flags,
            el: into_templ.el,
            on: {},
            funcs: {},
            atts: {},
            forKey: null,
            withkey: null,
            mapVars: {},
            children: from_templ.children,
            body: into_templ.body || from_templ.body,
        };

        function copyObj(name){
            for(let k in from_templ[name]){
                templ[name][k] = from_templ[name][k];
            }
            for(let k in into_templ[name]){
                templ[name][k] = into_templ[name][k];
            }
        }

        copyObj('atts');
        copyObj('funcs');
        copyObj('on');
        copyObj('mapVars');
        copyObj('_misc');
        templ.classes = into_templ.classes.concat(from_templ.classes);

        return templ;
    }

    function GetDestK(key){
        const var_k = key;
        let dest_k = var_k;
        if(/=/.test(var_k)){
            const var_li = var_k.split('=');
            var_k = var_li[1];
            dest_k = var_li[0];
        }
        return {
            key: var_k,
            dest_key: dest_k
        }
    }

    function Map_Make(vars_s){
        const li =  vars_s.split(',');
        var obj = {};
        for(let i = 0; i < li.length; i++){
            const keys = GetDestK(li[i]);
            if(keys){
                obj[keys.dest_key] = keys.key;
            }
        }
        return obj;
    }

    function Templ_Parse(el, parentEl){
        var templ = {
            nodeName: el.nodeName.toUpperCase(),
            name: null,
            flags: 0,
            el: el,
            on: {},
            funcs: {},
            func: {},
            atts: {},
            forKey: null,
            withkey: null,
            mapVars: {},
            children: [],
            classes: [],
            _misc: {},
        };

        for(let i = 0, l = el.attributes.length; i < l; i++){
            const att = el.attributes[i];
            if(att.name == 'templ'){
                templ.name = att.value.toUpperCase();
            }else if(/^on:/.test(att.name)){
                const name = att.name.substring("on:".length);        
                templ.on[name] = Spec_Parse(att.value);
            }else if(/^func:/.test(att.name)){
                const name = att.name.substring("func:".length);        
                const spec = Spec_Parse(att.value);
                if(!spec.key){
                    spec.key = name;
                }
                if(framework.funcs[spec.key]){
                    templ.funcs[name] = framework.funcs[spec.key];
                }else{
                    console.warn('No func found for ' + spec.key, templ);
                }
            }else if(att.name == 'drag'){
                templ.dragElementSpec = att.value;
                templ.flags |= FLAG_DRAG_CONTAINER;
            }else if(att.name == 'class-if'){
                templ.styleSetters = att.value.split(';');
            }else if(att.name == 'func'){
                templ.commandKeys = [att.value];
            }else if(att.name == 'vars'){
                templ.mapVars = Map_Make(att.value);
            }else if(att.name == 'for'){
                templ.forKey = att.value;
            }else if(att.name == 'with'){
                templ.forKey = att.value;
                templ.childrenKey = att.value;
            }else if(att.name == 'if'){
                templ.forKey = att.value;
                templ.childrenKey = att.value;
            }else if(att.name == 'if-not'){
                templ.forKey = att.value;
                templ.childrenKey = att.value;
            }else if(att.name == 'atts'){
                templ.atts = att.value.split(',');
            }else if(att.name == 'class'){
                templ.classes = att.value.split(' ');
            }else{
                templ._misc[att.name] = att.value;
            }
        }

        if(templ.name){
            framework.templates[templ.name] = templ;
        }

        if(parentEl){
            parentEl.children.push(templ);
        }

        if(el.firstChild && el.firstChild.nodeType == Node.TEXT_NODE){
            templ.body = el.firstChild.nodeValue;
        }

        if(el.hasChildNodes()){
            for(let i = 0, l = el.childNodes.length; i < l; i++){
                const child = el.childNodes[i];
                if(child.nodeType == Node.ELEMENT_NODE){
                    Templ_Parse(child, templ);
                }
            }
        }
    }

    function El_Make(templ, parent_el, data){
        if(typeof templ === 'string'){
            templ = framework.templates[templ.toUpperCase()];
        }

        if(!templ){
            console.warn('El_Make no templ', templ);
            return;
        }

        if(templ.forKey){
            const childList = data[templ.forKey];
            _templ = framework.templates[templ.nodeName];
            if(_templ && Array.isArray(childList)){
                const childTempl = Templ_Merge(_templ, templ);
                for(let i = 0; i < childList.length; i++){
                    El_Make(childTempl, parent_el, childList[i]);
                }
            }
            return;
        }

        const node = document.createElement(templ.nodeName);
        node.vars = {};
        node.templ = templ;
        parent_el.appendChild(node);

        if(data._idflag){
            node._content_idflag = data._idflag;
        }

        for(let k in templ.mapVars){
            const value = data[templ.mapVars[k]];
            if(value){
                node.vars[k] = value;
            }
        }
        
        for(let k in templ.mapVars){
            const value = data[templ.mapVars[k]];
            if(value){
                node.vars[k] = value;
            }
        }

        El_SetEvents(node, templ.on);
        El_SetEvents(node, templ.funcs);

        for(let i = 0; i < templ.atts.length; i++){
            const value = data[Cash(templ.atts[i], data)];
            if(value){
                node.setAttribute(templ.atts, value);
            }
        }

        const body = Cash(templ.body, data);
        if(body){
            node.appendChild(document.createTextNode(body));
        }

        if(templ.children){
            for(let i = 0; i < templ.children.length; i++){
                El_Make(templ.children[i], node, data);
            }
        }

    }

    if(templates_el){
        if(typeof framework.funcs === 'undefined'){
            framework.funcs = {};
        }
        if(typeof framework.templates === 'undefined'){
            framework.templates = {};
        }
        var nodes = templates_el.childNodes;
        for(var i = 0, l = nodes.length; i < l;i++){
            var el = nodes[i];
            if(el.nodeType == Node.ELEMENT_NODE){
                Templ_Parse(el, null);
            }
        }
    }

    framework.content_idx = 0;
    framework.el_idx = 0;

    framework.El_Make = El_Make;
    framework.Injest = Injest;
    framework.Cash = Cash;
}
