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

    const STATE_TEXT = 0;
    const STATE_PRE_KEY = 1;
    const STATE_KEY = 2;

    const DIRECTION_SELF = 3;
    const DIRECTION_PARENT = 4;
    const DIRECTION_CHILD = 5;
    const DIRECTION_DATA = 6;
    const DIRECTION_CURRENT_DATA = 7;
    const DIRECTION_VARS = 8;
    const DIRECTION_PREV_DATA = 9;
    const TYPE_HANDLER = 10;
    const TYPE_FUNC = 11;
    const TYPE_ELEM = 12;

    const FLAG_NODE_STATE_HOVER = 1;
    const FLAG_NODE_STATE_DRAG = 2;

    const isTouchDevice = !!('ontouchstart' in window);

    function ResetCtx(args){
        if(typeof framework._ctx === 'undefined'){
           framework._ctx =  {vars: {}, data: {}, current_idx: 0, currentData: {}, prevData:[], ev: null};
        }
        /*
        console.log('      resetting          vars was:', framework._ctx.vars);
        */
        if(args.data){
            const data = args.data;
            framework._ctx.data = data;
            framework._ctx.currentData = data;
            framework._ctx.current_idx = 0;
            if(framework._ctx.prevData.indexOf(data) == -1){
                framework._ctx.prevData.push(data);
            }
        }else{
            framework._ctx.currentData = null;
            framework._ctx.current_idx = 0;
        }

        if(args.ev !== undefined){
            framework._ctx.ev = args.ev;
        }

        if(!args.preserveVars){
            framework._ctx.vars = {};
        }
    }

    function ClearCtx(){
        framework._ctx.vars = {};
        framework._ctx.data = {};
        framework._ctx.currentData = {};
        framework._ctx.prevData = [];
    }

    function PopDataCtx(data){
        const idx = framework._ctx.prevData.length;
        if(idx == 0){
           return null; 
        }

        idx--;
        if(data === framework._ctx.prevData[idx]){
            return framework._ctx.prevData.pop();
        }

       return null; 
    }

    function GetstyleSheet(sheet_s){
        var name_s = sheet_s;
        if(sheet_s === null){
            name_s === 'default';
        }
        if(framework._styleSheets[name_s]){
            return framework._styleSheets[name_s];
        }
        for(var i = 0; i < document.styleSheets.length; i++){
            var s = document.styleSheets[i];
            if(!sheet_s){
                if(!s.href){
                    framework._styleSheets[name_s] = {sheet: s, cls: {}};
                    return framework._styleSheets[name_s];
                }
            }else if(s.href){
                if(s.href && s.href.substring(s.href.length - sheet_s.length) === sheet_s){
                    framework._styleSheets[sheet_s] = {sheet: s, cls: {}};
                    return framework._styleSheets[sheet_s];
                }
            }
        }
        return null;
    }

    function El_SetStateStyle(node, templ, stateStyle, add){
        node.classList = [];
        for(var i = 0; i < templ.classes.length; i++){
            node.classList.add(templ.classes[i]);
        }

        let custom_rule = 'custom-' + node._idtag.replace('_', '-');

        let style_s = Cash(templ.baseStyle, node.vars).result;
        if(style_s){
            const rule = '.' + custom_rule + ' {' + style_s + '}';
            if(!GetStyleRule(GetstyleSheet(null), custom_rule)){
                AddStyle(null, rule);
            }
        }

        if(add && stateStyle){
            node.classList.add(stateStyle);
            if(custom_rule && style_s){
                node.classList.remove(custom_rule);
            }
        }else{
            if(stateStyle){
                node.classList.remove(stateStyle);
            }
            if(custom_rule && style_s){
                node.classList.add(custom_rule);
            }
        }
    }

    function GetStyleRule(sheetObj, cls){
        if(sheetObj.cls[cls]){
            return sheetObj.cls[cls];
        }
        for(var i = 0; i < sheetObj.sheet.rules.length; i++){
            var rule = sheetObj.sheet.rules[i];
            if(rule.selectorText == cls){
                sheetObj.cls[cls] = rule;
                return rule;
            }
        }
        return null;
    }

    function ChangeStyle(sheet_s, name, att, value){
        var sheetObj = GetstyleSheet(sheet_s);
        if(sheetObj){
            var rule = GetStyleRule(sheetObj, name);
            rule.style[att] = value;
        }
    }

    function AddStyle(sheet_s, rule_s){
        var sheetObj = GetstyleSheet(sheet_s);
        if(sheetObj){
            sheetObj.sheet.insertRule(rule_s, sheetObj.sheet.rules.length);
        }
    }

    function Templ_SetFuncs(templ, funcs){
        for(let k in templ.funcs){
            if(typeof templ.funcs[k] === 'string'){
                if(funcs[k]){
                    templ.funcs[k] = funcs[k];
                }else{
                    console.warn('Func not found "'+ k + '"', templ);
                    console.warn('Func not found "'+ k + '" funcs', funcs);
                }
            }
        }
    }

    function El_Match(node, compare){
        let match = false;
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
        }else{
            let typeofVars = typeof compare.vars;
            if(typeofVars === 'string'){
                if(compare.vars && node.vars && (typeof node.vars[compare.vars] !== 'undefined')){
                    return true;
                }
            }else if(typeofVars === 'object'){
                if(Array.isArray(compare.vars)){
                    for(var i = 0; i < compare.vars.length; i++){
                        if(typeof node.vars[compare.vars[i]] === 'undefined'){
                            return false;
                        }
                    }
                    match = true;
                }
            }

            if(compare.name){
                if(node.templ && node.templ.name !== compare.name){
                    return false;
                }else{
                    match = true;
                }
            }
        }

        return match;
    }

    function El_VarFrom(node, name, direction){
        if(direction === DIRECTION_PARENT){
            while(node){
                if(node.vars && (typeof node.vars[name] !== 'undefined')){
                    return node.vars[name];
                }
                node = node.parentNode;
            }
        }
    }

    function El_Query(node, spec, compare){

        /*
        console.log('EL_Query', spec);
        console.log('EL_Query node', node);
        console.log('EL_Query node vars', node.vars);
        console.log('EL_Query compare', compare);
        */

        if(compare._tries === undefined){
            compare._tries = 1;
        }else{
            compare._tries++;
        }

        if(spec.direction == DIRECTION_SELF || compare._tries > 1){
            if(El_Match(node, compare)){
                return node;
            }
        }

        if(spec.direction === DIRECTION_PARENT && node.parentNode){
            return El_Query(node.parentNode, spec, compare);
        }else if(spec.direction === DIRECTION_CHILD && node.firstChild){
            let el = node.firstChild;
            while(el){
                if(el.nodeType == Node.ELEMENT_NODE){
                    const found = El_Query(el, spec, compare);
                    if(found){
                        return found;
                    }
                }
                el = el.nextSibling;
            }
        }

        return null;
    }

    function GatherData(node, cond, dest){
        propval = El_VarFrom(node, cond.key, cond.var_direction);
        if(propval !== null){
            dest[cond.key] = propval
        }
    }


    function El_SetClasses(node, templ, data){
        if(!data){
            data = {};
            GatherData(node, templ.classIfCond, data);
        }

        const cond = templ.classIfCond;
        if(cond && cond.key){
            const propval = data[cond.key];
            if(propval !== null && propval === node.vars[cond.dest_key]){
                node.classList.add(cond.value); 
            }else{
                node.classList.remove(cond.value); 
            }
        }
    }

    function Args_Parse(args_s){
        return args_s.split(',');
    }

    function MultiProp_Parse(args_s){
        if(args_s.indexOf('/') != -1){
            return args_s.split('/');
        }else{
            return args_s;
        }
    }

    function Statements(stmt_s, func, c){
        if(!c){
            c = ';';
        }
        if(stmt_s.indexOf(c) != -1){
            const li = stmt_s.split(c);
            const ret = [];
            for(let i = 0; i < li.length; i++){
                ret.push(func(li[i])); 
            }
            return ret;
        }
        return func(stmt_s);
    }

    function Spec_Parse(spec_s){
        var spec = {
            direction: DIRECTION_SELF, 
            type: TYPE_HANDLER,
            mapVars: {},
            varList: [],
            varIsPair: false,
            key: null,
            func: null,
        };
        if(!spec_s){
            return spec;
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
            const arg = MultiProp_Parse(rest.substring(0, closeP));
            if(typeof arg === 'string'){
                spec.mapVars = Map_Make(arg);
                spec.varList = [arg];
            }else if(Array.isArray(arg)){
                if(arg.length == 2){
                    spec.varIsPair = true;
                }
                spec.varList = arg;
            }
        }

        spec.key = key;

        return spec;
    }

    function CopyVars(map, to, from){
        if(Array.isArray(map)){
            for(let i = 0; i < map.length; i++){
                if(from[map[i]] !== undefined){
                    const _k = map[i];
                    const _v = from[map[i]]
                    to[_k] = _v;
                    // framework._ctx.vars[_k] = _v;
                }
            }
        }else{
            for(var k in map){
                let value;
                if(map[k].cash.isCash){
                    value = Cash(map[k].key, from).result;
                }else if(from[map[k].key] !== undefined){
                    value = from[map[k].key];
                }
                
                if(value !== undefined){
                    const _k = map[k].dest_key;
                    to[_k] = value;
                    framework._ctx.vars[_k] = value;
                }
            }
        }
    }

    function Event_Run(event_ev){
        let r = false;
        /*
        console.log('Event_Run '+event_ev.spec.key, event_ev);
        */

        if(framework._ctx.ev === null){
            framework._ctx.ev = event_ev;
        }

        let dest_el = event_ev.dest;
        if(!dest_el){
            if(event_ev.spec.key === 'set'){
                dest_el = El_Query(event_ev.target, {direction: event_ev.spec.direction},  {vars: Object.keys(event_ev.spec.mapVars)});
            }else{
                dest_el = El_Query(event_ev.target, event_ev.spec, [
                    {on: event_ev.spec.key},
                    {funcs: event_ev.spec.key}
                ]);
            }
        }

        let func = null;
        let sub_ev = null;

        if(dest_el){
            event_ev.dest = dest_el;
            if(dest_el.templ && dest_el.templ.funcs[event_ev.spec.key]){
                func = dest_el.templ.funcs[event_ev.spec.key];
            }
            if(dest_el.templ && dest_el.templ.on[event_ev.spec.key]){
                sub_ev = {
                    spec: dest_el.templ.on[event_ev.spec.key],
                    target: dest_el,
                    copyTargetVars: true,
                };
            }
        }

        if(event_ev.spec.key === 'style'){
            if(event_ev.eventType === 'hover'){
                if(event_ev.spec.varIsPair){
                    event_ev.target.classList.add(event_ev.spec.varList[0]); 
                    event_ev.target.classList.remove(event_ev.spec.varList[1]); 
                }
            }else if(event_ev.eventType === 'unhover'){
                if(event_ev.spec.varIsPair){
                    event_ev.target.classList.add(event_ev.spec.varList[1]); 
                    event_ev.target.classList.remove(event_ev.spec.varList[0]); 
                }
            }
        }if(event_ev.spec.key === 'unhover'){
            if(event_ev.dest.templ && event_ev.dest.templ.on.hover){
                sub_ev = {spec: event_ev.dest.templ.on.hover, target: event_ev.dest, eventType: "unhover"};
            }
        }else if(event_ev.spec.key === 'set'){
            var tg = event_ev.dest || event_ev.target;
            for(var k in event_ev.spec.mapVars){
                /*
                console.log('Setting var: ' + k + ' -> ' + event_ev.vars[k], tg.templ && tg.templ.name);
                */
                r = El_SetVar(tg, k, event_ev.vars[k]);
            }
            if(event_ev.dest && event_ev.dest.templ.on.set){
               sub_ev = {spec: event_ev.dest.templ.on.set};
            }
        }

        if(event_ev.spec.mapVars){
            var newVars = {};
            if(event_ev.dest){
                CopyVars(event_ev.spec.mapVars, newVars, event_ev.dest.vars);
            }
            CopyVars(event_ev.spec.mapVars, event_ev.vars, event_ev.vars);
        }

        if(sub_ev){
            const merged_ev = Event_Merge(sub_ev, event_ev)
            /*
            console.log('sub merged', merged_ev.spec);
            */
            const _r = Event_Run(merged_ev); 
            if(_r !== undefined){
                r = _r;
            }
        }

        if(func){
            const _r = func(event_ev);
            if(_r !== undefined){
                r = _r;
            }
        }

        return r;
    }

    function GetTypeFromE(e){
        if(e && e.type){
            if(e.type === 'mouseover'){
                return 'hover';
            }else if(e.type === 'mouseout'){
                return 'unhover';
            }else{
                return e.type;
            }
        }
    }

    function Event_Merge(sub_ev, event_ev){
         const ev = {
            target: sub_ev.target || event_ev.target,
            dest: sub_ev.dest,
            e: event_ev.e,
            spec: sub_ev.spec,
            vars: sub_ev.vars || {},
            eventType: sub_ev.eventType || event_ev.eventType,
            _pior: event_ev,
        }


        if(ev.spec.mapVars){
            if(sub_ev.copyTargetVars){
                CopyVars(ev.spec.mapVars, ev.vars, ev.target.vars);
            }
            CopyVars(ev.spec.mapVars, ev.vars, event_ev.vars);
        }

        /*
        console.log('Event_Merge ' + ev.spec.key + ' vars: ', ev.vars);
        console.log('    Event_Merge mapVars ' + event_ev.spec.key + ' vars: ', ev.spec.mapVars);
        console.log('    Event_Merge orig ' + event_ev.spec.key + ' vars: ', event_ev.vars);
        console.log('    Event_Merge sub ' + sub_ev.spec.key + ' vars: ', sub_ev.vars);
        */

        return ev;
    }

    function Event_New(target_el, e, spec){
        var event_ev = {
            target: target_el, /* the source of the event, e.g. clicked element */
            dest: null, /* the destination that has the event on it */
            e: e,
            spec: spec,
            eventType: GetTypeFromE(e),
            vars: {}, /* end result of target vars + gathers */
            _pior: null, /* event this event is based on */
        }

        if(target_el.vars){
            if(spec.mapVars){
                CopyVars(spec.mapVars, event_ev.vars, target_el.vars);
            }
        }

        /*
        console.log('Event "' + spec.key + '" vars:', event_ev.vars);
        */

        return event_ev;
    }

    function onMouseMove(e){
        var x = e.clientX;
        var y = e.clientY;
    }

    function onDown(e){
        var node = this;
        let r = false;
        ResetCtx({ev: null});
        if(node.templ && node.templ.on.mousedown){
            r = Event_Run(Event_New(node, e, node.templ.on.mousedown));
        }
        if(node.templ && node.templ.on.click){
            r = Event_Run(Event_New(node, e, node.templ.on.click));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onUp(e){
        ResetCtx({ev: null});
        var node = this;
        if(node.templ && node.templ.on.mouseup){
            r = Event_Run(Event_New(node, e, node.templ.on.mouseup));
        }
        if(node.templ && node.templ.on.click){
            r = Event_Run(Event_New(node, e, node.templ.on.click));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onScroll(e){
        var node = this;
    }

    function onHover(e){
        ResetCtx({ev: null});
        var node = this;
        if(node.flags & FLAG_NODE_STATE_HOVER){
            return;
        }
        node.flags |= FLAG_NODE_STATE_HOVER;
        if(node.templ && node.templ.on.hover){
            Event_Run(Event_New(node, e, node.templ.on.hover));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onUnHover(e){
        ResetCtx({ev: null});
        var node = this;
        if((node.flags & FLAG_NODE_STATE_HOVER) == 0){
            return;
        }
        node.flags &= ~FLAG_NODE_STATE_HOVER;
        if(node.templ && node.templ.on.hover){
            Event_Run(Event_New(node, e, node.templ.on.hover));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function El_SetEvents(node, events){
        if(events.mousedown || events.click){
            node.onmousedown = onDown;
        }
        if(events.mouseup){
            node.onmouseup = onUp;
        }

        if(events.hover){
            /*
            if(!events.click && isTouchDevice){
                node.onmouseup = onHover;
            }else{
                node.onmouseover = onHover;
            }
            */
            node.onmouseover = onHover;
            node.onmouseout = onUnHover;
        }
    }

    function Injest(content){
        const framework = this;
        if(Array.isArray(content)){
            for(let i = 0; i < content.length; i++){
                content._idtag = 'content_' + (++framework.content_idx);
            }
        }
    }

    function DataScope(sel, data){
        if(data && data[sel]){
            return data[sel];
        }
        return null;
    }


    function Cash(s, data, prepare){
        const result = {
            arg: s,
            result: null,
            isCash: false,
            vars: [],
        };
        
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
                    shelf = "";
                    break;
                }
            }else if(state == STATE_KEY){
                if(c == '}'){
                    if(data){
                        var value = DataScope(key, data);
                        if(!value){
                            shelf = "";
                            break;
                        }
                        shelf += value;
                    }
                    if(prepare){
                        const destK = blankDestKLiteral(key);
                        result.vars.push(destK);
                        shelf += '${'+destK.key+'}';
                    }
                    result.isCash = true;
                    key = "";
                    state = STATE_TEXT;
                    continue;
                }else{
                    key += c;
                }
            }
        }

        result.result = shelf || s;
        if(prepare){
            result.arg = shelf;
        }

        return result;
    }

    function El_MakeAs(node, parentNode, data){
        let templ = null;
        templ = node.templ;

        let templ_s = '';
        if(templ.asKey){
            const keys = templ.asKey;

            templ_s = keys.key;
            if(keys.cash.isCash){
                templ_s = Cash(keys.key, data).result; 
            }else{
                templ_s = keys.key;
            }
        }

        if(framework.templates[templ_s.toUpperCase()]){
            new_templ = framework.templates[templ_s.toUpperCase()];
            templ = Templ_Merge(new_templ, templ); 
        }


        while(node.hasChildNodes()){
            node.firstChild.remove();
        }
        
        El_Make(templ, parentNode, node);
    }

    function Templ_Merge(into_templ, from_templ){

        const templ = {
            nodeName: from_templ.nodeName,
            name: into_templ.name || from_templ.name,
            isMerged: true,
            flags: into_templ.flags | from_templ.flags,
            el: into_templ.el,
            asKey: from_templ.asKey,
            on: {},
            funcs: {},
            atts: {},
            forKey: null,
            withkey: null,
            mapVars: {},
            children: from_templ.children,
            body: into_templ.body.trim() || from_templ.body.trim(),
            classIfCond: {},
            baseStyle: '',
            setters: from_templ.setters,
            _misc: {},
        };

        function copyObj(name){
            for(let k in from_templ[name]){
                templ[name][k] = from_templ[name][k];
            }
            for(let k in into_templ[name]){
                templ[name][k] = into_templ[name][k];
            }
        }

        function copyList(name){
            for(let i = 0; i < from_templ[name].length; i++){
                templ[name][i] = from_templ[name][i];
            }
            for(let i = 0; i < into_templ[name].length; i++){
                templ[name][i] = into_templ[name][i];
            }
        }

        copyObj('atts');
        copyObj('funcs');
        copyObj('on');
        copyObj('mapVars');
        copyObj('classIfCond');
        copyObj('_misc');
        templ.classes = into_templ.classes.concat(from_templ.classes);
        templ.baseStyle = from_templ.baseStyle;
        if(into_templ.baseStyle && into_templ.baseStyle){
            templ.baseStyle += ';';
        }
        templ.baseStyle += into_templ.baseStyle;

        return templ;
    }

    function blankDestKLiteral(key){
        let key_direction = DIRECTION_SELF;
        if(key[0] === '_'){
            key_direction = DIRECTION_CHILD;
            key = key.substring(1);
        }else if(key[0] === '^'){
            key_direction = DIRECTION_PARENT;
            key = key.substring(1);
        }else if(key[0] === '.'){
            key_direction = DIRECTION_DATA;
            key = key.substring(1);
        }

        return {
            key: key,
            dest_key: key,
            value: null,
            dest_direction: DIRECTION_SELF,
            var_direction: key_direction,
            cash: {
                arg: key,
                result: key,
                isCash: false,
                vars: [],
            }
        };
    }

    function GetDestK(key){
        let var_k = key;
        let dest_k = var_k;
        let set_v = null;
        let var_direction = DIRECTION_SELF;
        let dest_direction = DIRECTION_SELF;
        let key_source = null;
        if(/=/.test(var_k)){
            const var_li = var_k.split('=');
            var_k = var_li[1];
            dest_k = var_li[0];
        }
        if(var_k.indexOf(':') != -1){
            const li = var_k.split(':');
            var_k = li[0];
            set_v = li[1];
        }

        if(var_k.length){ 
            if(var_k[0] === '_'){
                var_direction = DIRECTION_CHILD;
                var_k = var_k.substring(1);
            }else if(var_k[0] === '^'){
                var_direction = DIRECTION_PARENT;
                var_k = var_k.substring(1);
            }else if(var_k[0] === '.'){
                var_direction = DIRECTION_DATA;
                var_k = var_k.substring(1);
            }
        }

        if(dest_k.length){ 
            if(dest_k[0] === '_'){
                dest_direction = DIRECTION_CHILD;
                dest_k = dest_k.substring(1);
            }else if(dest_k[0] === '^'){
                dest_direction = DIRECTION_PARENT;
                dest_k = dest_k.substring(1);
            }else if(dest_k[0] === '.'){
                dest_direction = DIRECTION_DATA;
                dest_k = dest_k.substring(1);
            }
        }

        if(var_k.indexOf('.') != -1){
            var_k_li = var_k.split('.');
            key_source = var_k_li[0];
            if(dest_k == var_k){
                dest_k = var_k_li[var_k_li.length-1];
            }
            var_k = var_k_li[var_k_li.length-1];
        }

        const cash =  Cash(var_k, null, true);
        if(cash.isCash){
            var_k = cash.arg;
        }
        return {
            key: var_k,
            key_source: key_source,
            dest_key: dest_k,
            value: set_v,
            dest_direction: dest_direction,
            var_direction: var_direction,
            cash: cash,
        }
    }

    function Map_Make(vars_s){
        const li =  vars_s.split(',');
        var obj = {};
        for(let i = 0; i < li.length; i++){
            const keys = GetDestK(li[i]);
            if(keys){
                obj[keys.dest_key] = keys;
            }
            if(keys.cash.vars){
                for(let i = 0; i < keys.cash.vars.length; i++){
                    const k = keys.cash.vars[i];
                    obj[k] = blankDestKLiteral(k);
                }
            }
        }
        return obj;
    }

    function Templ_Parse(el, parentEl){
        var templ = {
            nodeName: el.nodeName.toUpperCase(),
            name: null,
            flags: 0,
            isMerged: false,
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
            baseStyle: '', 
            classIfCond: {},
            setters: [],
            asKey: null,
            body: '',
            _misc: {},
        };

        for(let i = 0, l = el.attributes.length; i < l; i++){
            const att = el.attributes[i];
            if(att.name == 'templ'){
                templ.name = att.value.toUpperCase();
            }else if(/^on:/.test(att.name)){
                const name = att.name.substring("on:".length);        
                templ.on[name] = Statements(att.value, Spec_Parse);
            }else if(/^func:/.test(att.name)){
                const name = att.name.substring("func:".length);        
                const spec = Statements(att.value, Spec_Parse);
                if(!spec.key){
                    spec.key = name;
                }
                if(framework.funcs[spec.key]){
                    templ.funcs[name] = framework.funcs[spec.key];
                }else{
                    templ.funcs[name] = spec.key;
                }
            }else if(att.name == 'drag'){
                templ.dragElementSpec = att.value;
                templ.flags |= FLAG_DRAG_CONTAINER;
            }else if(att.name == 'func'){
                templ.commandKeys = [att.value];
            }else if(att.name == 'data'){
                const keys = GetDestK(att.value);
                templ.dataKey = keys;
                if(keys){
                    templ.setters.push({scope: 'data', destK: templ.dataKey});
                }
            }else if(att.name == 'as'){
                const keys = GetDestK(att.value);
                templ.asKey = keys;
                if(keys){
                    if(keys.cash.isCash){
                        for(let i = 0; i < keys.cash.vars.length; i++){
                            const kd =  keys.cash.vars[i];
                            if(templ.mapVars[kd.key] === undefined){
                                templ.setters.push({scope: 'as', destK: kd});
                            }
                        }
                    }else{
                        templ.setters.push({scope: 'as', destK: keys});
                    }
                }
            }else if(att.name == 'vars'){
                const mapVars =  Statements(att.value, GetDestK, ',');
                const mapVarsObj = templ.mapVars;
                if(Array.isArray(mapVars)){
                    for(let i = 0; i < mapVars.length; i++){
                        const mv = mapVars[i];
                        mapVarsObj[mv.dest_key] = mv;
                    }
                }else{
                    mapVarsObj[mapVars.dest_key] = mapVars;
                }
            }else if(att.name == 'for'){
                templ.forKey = att.value;
            }else if(att.name == 'base-style'){
                templ.baseStyle = att.value;
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
            }else if(att.name == 'class-if'){
                templ.classIfCond = Statements(att.value, GetDestK);
                templ.setters.push({scope: 'class', destK: templ.classIfCond});
            }else{
                templ._misc[att.name] = att.value;
            }
        }

        if(templ.name){
            framework.templates[templ.name] = templ;
        }

        if(el.firstChild && el.firstChild.nodeType == Node.TEXT_NODE){
            templ.body = el.firstChild.nodeValue;
        }

        if(parentEl){
            parentEl.children.push(templ);
        }

        if(el.hasChildNodes()){
            for(let i = 0, l = el.childNodes.length; i < l; i++){
                const child = el.childNodes[i];
                if(child.nodeType === Node.ELEMENT_NODE){
                    Templ_Parse(child, templ);
                }
            }
        }
    }

    function El_RegisterSetters(node, templ){
        for(var i = 0; i < templ.setters.length; i++){
            const set = templ.setters[i];
            const scope = set.scope;
            const destK = set.destK;
            const compare = {vars: destK.key};
            if(destK.key_source){
                compare.name = destK.key_source;
            }

            const source = El_Query(node, {direction: destK.var_direction}, compare); 

            if(source){
                /*
                console.log('Source of setter :' , set);
                console.log('Source of setter source', source);
                console.log('Source of setter source node', node);
                console.log('--');
                */

                if(!source.varSetters[destK.key]){
                    source.varSetters[destK.key] = {};
                }
                const setter = {node: node, set: set, isMatch: false};

                source.varSetters[destK.key][node._idtag] = setter;
                El_RunIndividualSetter(source, setter, destK.key, source.vars[destK.key]);
            }else{
                console.warn("El_RegisterSetters '" + destK.key + "' not found in tree", node);
                console.warn("El_RegisterSetters '" + destK.key + "' not found in tree setter", set);
                console.warn('Source of setter :' +node.templ.asKey.key, set);
                console.warn('Source of setter source', source);
                console.warn('Source of setter source node', node);
                console.warn('--');
            }
        }
    }

    function El_RunSetter(setter, value){
        const set = setter.set;
        const node = setter.node;
        if(set.scope === 'class'){
            const value = Cash(set.destK.value, node.vars).result;
            if(setter.isMatch){
                El_SetStateStyle(node, node.templ, value, true);
            }else{
                El_SetStateStyle(node, node.templ, value, false);
            }
        }else if(set.scope === 'as'){
            if(value){
                ResetCtx({data: node._data, preserveVars: true}); 

                const asData = {}
                asData[set.destK.key] = value;

                El_MakeAs(setter.node, setter.node.parentNode, asData);
            }
        }else if(set.scope === 'data'){
            node._data = value; 
        }
    }
    
    function El_RunIndividualSetter(node, setter, prop, value){
        const setNode = setter.node;
        const setterSet = setter.set;
        let isMatch = null;
        if(setter.set.scope === 'data' && value){
            isMatch = value._idtag;
        }else if(setNode.vars && typeof setNode.vars[setterSet.destK.dest_key] !== 'undefined'){
            isMatch = setNode.vars[setterSet.destK.dest_key] === value;
        }

        if(isMatch == null || isMatch !== setter.isMatch){
            /*
            console.log('El_RunIndividualSetter '+ setter.set.scope +' | isMatch ' + prop + ' -> ' + value + ' vs '  + setNode.vars[setterSet.destK.dest_key] +  ' ' +isMatch + ' vs ' + setter.isMatch, setter);
            */
            setter.isMatch = isMatch;
            El_RunSetter(setter, value);
        }else{
            /*
            console.log('El_RunIndividualSetter '+ setter.set.scope  + ' not a mismatch', isMatch);
            console.log('El_RunIndividualSetter '+ setter.set.scope +' | isMatch ' + prop + ' -> ' + value + ' vs '  + setNode.vars[setterSet.destK.dest_key] +  ' ' +isMatch + ' vs ' + setter.isMatch, setter);
            console.log('El_RunIndividualSetter '+setter.set.scope , setterSet.destK);
            console.log('El_RunIndividualSetter '+setter.set.scope , setNode);
            */
        }
    }

    function El_RunNodeSetters(node, prop, value){
        /*
        console.log('--> node setters for ' + (node.templ.name || node.templ.nodeName), node.varSetters);
        */
        for(let k in node.varSetters[prop]){
            El_RunIndividualSetter(node, node.varSetters[prop][k], prop, value);
        }
    }

    function El_SetVar(node, prop, value){
        if(node.vars[prop] !== value){
            if(!node.templ.name && node.templ.nodeName == 'DIV'){
                /*
                console.log('El_SetVar: ' + prop + ' ' + value, node);
                */
            }else{
                /*
                console.log('    El_SetVar: ' + prop + ' ' + value, node);
                */
            }
            El_RunNodeSetters(node, prop, value);
            node.vars[prop] = value;
            framework._ctx.vars[prop] = value;
            return true;
        }
        return false;
    }

    function Data_MakeCtx(data){
        if(!data._ctx){
            return {_ctx: {vars: {}}, current: data, prevData: []};
        }
        return data;
    }

    function Data_Outdent(){
        framework._ctx.prevData.pop();
        framework._ctx.data = framework._ctx.prevData[0];
        framework._ctx.currentData = framework._ctx.data;
        framework._ctx.current_idx = 0;
    }

    function Data_Search(key, nest, order){
        let value = null;
        if(!order){
            order = [DIRECTION_VARS, DIRECTION_CURRENT_DATA, DIRECTION_DATA, DIRECTION_PREV_DATA];
        }
        /*
        console.log('Data_Search key:"' + key+'" nest:'+(!!nest), framework._ctx);
        */
        for(var i = 0; i < order.length; i++){
            if(order[i] === DIRECTION_DATA){
                const data = framework._ctx.data;
                if(data[key]){
                    if(nest){
                        framework._ctx.data = data[key];
                        framework._ctx.prevData.push(framework._ctx.data);
                        framework._ctx.currentData = data[key];
                    }
                    return {type: 'data', value: data[key]};
                }
            }else if(order[i] === DIRECTION_CURRENT_DATA){
                const data = framework._ctx.currentData;
                if(data && data[key]){
                    return {type: 'currentData', value: data[key]};
                }
            }else if(order[i] === DIRECTION_VARS){
                if(framework._ctx.vars[key]){
                    value = framework._ctx.vars[key];
                    if(nest){
                        if(typeof value === 'object'){
                            if(framework._ctx && framework._ctx.prevData.indexOf(value) == -1){
                                framework._ctx.prevData.push(value);
                            }
                            framework._ctx.currentData = value;
                        }
                    }
                    return {type: 'vars', value: value};
                }
            }else if(order[i] === DIRECTION_PREV_DATA){
                let idx = framework._ctx.prevData.length;
                for(let i = idx-1; i >= 0; i--){
                    const curData = framework._ctx.prevData[i];
                    if(curData[key]){
                        return {type: 'prevData', value: curData[key]};
                    }
                }
            }
        }

        return null;
    }

    function El_Make(templ, parent_el, reuseNode){

        let isTemplNodeName = false;
        if(typeof templ === 'string'){
            templ = framework.templates[templ.toUpperCase()];
        }

        if(!templ){
            console.warn('El_Make no templ', templ);
            return;
        }

        let forKey = null;
        if(framework.templates[templ.nodeName.toUpperCase()]){
            Data_Search(templ.nodeName.toLowerCase(), true, [DIRECTION_DATA]);
            forKey = templ.forKey;
            parent_templ = framework.templates[templ.nodeName.toUpperCase()];
            if(parent_templ){
                templ = Templ_Merge(templ, parent_templ);
            }
        }


        let data = framework._ctx.data;
        /*
        console.log('El_Make');
        console.log('  El_Make templ', templ);
        console.log('  El_Make data', data);
        */

        if(!templ){
            console.warn('El_Make no templ', templ);
            return;
        }

        if(forKey){
            if(Data_Search(forKey, true, [DIRECTION_DATA]) && Array.isArray(framework._ctx.currentData)){
                for(framework._ctx.current_idx = 0;
                        framework._ctx.current_idx < framework._ctx.currentData.length;
                        framework._ctx.current_idx++
                ){
                    framework._ctx.data = framework._ctx.currentData[framework._ctx.current_idx];
                    El_Make(templ, parent_el);
                }

                Data_Outdent();
            }else{
                console.warn('Warning: for children key not found '+ forKey, data);
                console.warn('Warning: for children key not found templ', templ);
                console.warn('Warning: for children key not framework', framework);
            }
            return;
        }

        const node = reuseNode || document.createElement(templ.nodeName);

        node.vars = {};
        node.varSetters = {};
        node.templ = templ;
        node._idtag = 'element_'+(++framework.el_idx);
        if(!reuseNode){
            parent_el.appendChild(node);
        }

        if(data._idflag){
            node._content_idflag = data._idflag;
        }

        for(let k in templ.mapVars){
            const map = templ.mapVars[k];
            const value = Data_Search(map.key, false, [
                DIRECTION_DATA, DIRECTION_CURRENT_DATA, DIRECTION_VARS
            ]);
            if(value){
                node.vars[map.dest_key] = value.value;
                if(value.type !== 'vars'){
                    framework._ctx.vars[map.dest_key] = value.value;
                }
            }else{
                node.vars[map.dest_key] = null;
                console.warn('El_Make: no var found for: ' + map.key, map);
                console.warn('El_Make: no var found for: ' + map.key + ' data:', data);
                console.warn('El_Make: no var found for: ' + map.key + ' node:', node);
            }
        }

        if(templ.classes){
            for(let i = 0; i < templ.classes.length; i++){
                node.classList.add(templ.classes[i]);
            }
        }

        Templ_SetFuncs(templ, framework.funcs);
        El_SetStateStyle(node, templ, null, false);
        if(!reuseNode){
            El_SetEvents(node, templ.on);
            El_SetEvents(node, templ.funcs);
            El_RegisterSetters(node, templ);
        }

        for(let i = 0; i < templ.atts.length; i++){
            const value = data[Cash(templ.atts[i], data).result];
            if(value){
                node.setAttribute(templ.atts, value);
            }
        }

        const body = Cash(templ.body, data).result;
        if(body){
            node.appendChild(document.createTextNode(body));
        }

        for(var k in templ._misc){
            const val = Cash(templ._misc[k], data).result;
            node.setAttribute(k, val);
        }

        if(templ.children){
            for(let i = 0; i < templ.children.length; i++){
                if(templ.name){
                    if(data[templ.name]){
                        data = data[templ.name];
                    }else{
                        const nameLower = templ.name.toLowerCase();
                        if(data[nameLower]){
                            data = data[nameLower];
                        }
                    }
                }
                El_Make(templ.children[i], node);
            }
        }
    }

    if(typeof framework.funcs === 'undefined'){
        framework.funcs = {};
    }
    if(typeof framework.templates === 'undefined'){
        framework.templates = {};
    }
    if(typeof framework._styleSheets === 'undefined'){
        framework._styleSheets = {};
    }

    ResetCtx({});

    if(templates_el){
        var nodes = templates_el.childNodes;
        for(var i = 0, l = nodes.length; i < l;i++){
            var el = nodes[i];
            if(el.nodeType == Node.ELEMENT_NODE){
                Templ_Parse(el, null);
            }
        }
    }

    function Make(name, root_el, data){
        ResetCtx({data: data, ev: null}); 
        El_Make(name, root_el);
    }

    if(!GetstyleSheet(null)){
        const sheet = document.createElement('style');
        document.head.appendChild(sheet);
    }

    AddStyle(null, '.full-height{height: '+ window.innerHeight + 'px}');
    AddStyle(null, '.full-width{width: '+ window.innerHeight + 'px}');

    framework.content_idx = 0;
    framework.el_idx = 0;

    framework.Make = Make;
    framework.Injest = Injest;
    framework.Cash = Cash;
    framework.ChangeStyle = ChangeStyle;
    framework.AddStyle = AddStyle;
}
