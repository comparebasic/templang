/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation


How to Read This for Documentation:

Sections:

Internal Stuff:

    [Elem Query and Match]
    [Helper Functions]
    [Data And Context Functions]
    [Setters Run and Register]
    [Parsing Templates]
    [Events Native and Synthetic]
    [Bind and Assign Browser Events]


External Stuff:

    [Styles and Stylesheet Management]
    [Cash Variable-In-String Parser]
    [Injest and Tag Data]
    [Core Functions For Element Creation]
    [Initialized the Framework Object]
*/

function TempLang_Init(templates_el, framework){

    const STATE_TEXT = 0;
    const STATE_PRE_KEY = 1;
    const STATE_KEY = 2;

    const DIRECTION_SELF = 3;
    const DIRECTION_PARENT = 4;
    const DIRECTION_CHILD = 5;
    const DIRECTION_DATA = 6;
    const DIRECTION_VARS = 8;
    const TYPE_HANDLER = 10;
    const TYPE_FUNC = 11;
    const TYPE_ELEM = 12;

    const FLAG_NODE_STATE_HOVER = 1;
    const FLAG_NODE_STATE_DRAG = 2;
    const FLAG_DRAG_TARGET = 4;
    const FLAG_DROP_TARGET = 8;
    const FLAG_DRAG_CONT_CALCULATED = 16;

    const isTouchDevice = !!('ontouchstart' in window);

    /* 
     * [Elem Query and Match]
     */
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
        }else{
            let match = true;
            if(!compare.name && !compare.vars){
                match = false;
            }

            if(compare.name){
                if((!node.templ) || (
                            node.templ.name !== compare.name && 
                            node.templ.name !== compare.name.toUpperCase()
                        )
                    ){
                    match = false;
                }
            }

            if(match && compare.vars){
                let typeofVars = typeof compare.vars;
                if(typeofVars === 'string'){
                    if(compare.vars && node.vars && (typeof node.vars[compare.vars] === 'undefined')){
                        match = false;
                    }
                }else if(typeofVars === 'object'){
                    if(Array.isArray(compare.vars)){
                        for(let i = 0; i < compare.vars.length; i++){
                            if(typeof node.vars[compare.vars[i]] === 'undefined'){
                                match = false;
                                break;
                            }
                        }
                    }else{
                        for(let k in compare.vars){
                            if(node.vars[k] != compare.vars[k]){
                                match = false;
                                break;
                            }
                        }
                    }
                }
            }

            return match;
        }

        return false;
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

    /*
     * [Helper Functions]
     */

    function swap(orig, place){
        if(orig.nextSibling){
            orig.parentNode.insertBefore(place, orig.nextSibling);
        }else{
            orig.parentNode.append(place);
        }
        orig.remove();
    }

    /* 
     * This is the workhorse behind the alias and whery method.
     * It makese sense of things like
     *
     * ^type - refering to the `type` variable of a parent
     * key=value - refers to a property named `key` derived from a peroperty named `value`
     */
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

    function CopyVars(map, to, from){
        if(Array.isArray(map)){
            for(let i = 0; i < map.length; i++){
                if(from[map[i]] !== undefined){
                    const _k = map[i];
                    const _v = from[map[i]]
                    to[_k] = _v;
                    framework._ctx.vars[_k] = _v;
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

    function GatherData(node, cond, dest){
        propval = El_VarFrom(node, cond.key, cond.var_direction);
        if(propval !== null){
            dest[cond.key] = propval
        }
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


    /* 
    * Spec parse is the frist line of interpreting handler declarations 
    */
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

    /*
     * [Data And Context Functions]
     */

    function Data_Sub(data, key){
        let ctx = null;

        if(data === null || data === undefined){
            return null;
        }else if(data.data){
            ctx = data; 
            data = data.data;
        }

        if((typeof key === 'number')){
            if(Array.isArray(data) && key < data.length){
                return {
                    key: key,
                    data: data[key],
                    vars: (ctx && ctx.vars) || {},
                    idx: key,
                    isArr: false,
                    isSub: true,
                    prev: ctx && (Array.isArray(ctx.prev) && [].concat(ctx.prev)) || [],
                    view: (ctx && ctx.view) || {},
                };
            }else{
                return null;
            }
        }else if(key){
            if(data[key]){
                return {
                    key: key,
                    data: data[key],
                    vars: (ctx && ctx.vars) || {},
                    idx: -1,
                    isArr: Array.isArray(data[key]),
                    isSub: true,
                    prev: ctx && (Array.isArray(ctx.prev) && [].concat(ctx.prev)) || [],
                    view: (ctx && ctx.view) || {},
                };
            }else{
                return null;
            }
        }else{
            return {
                key: null,
                data: data,
                idx: -1,
                isArr: false,
                isSub: false,
                vars: (ctx && ctx.vars) || {},
                prev: ctx && (Array.isArray(ctx.prev) && [].concat(ctx.prev)) || [],
                view: {},
            };
        }
    }

    function Data_Next(ctx){
        if(!ctx.isArr){
            return;
        }

        return Data_Sub(ctx, ++ctx.idx); 
    }

    function ResetCtx(args){
        if(typeof framework._ctx === 'undefined'){
           framework._ctx =  {vars: {}, ev: null};
        }

        if(args.ev !== undefined){
            framework._ctx.ev = args.ev;
        }

        if(!args.preserveVars){
            framework._ctx.vars = {};
        }
    }

    function DataScope(sel, data){
        if(data && data[sel]){
            return data[sel];
        }
        return null;
    }

    function Data_Search(key, ctx, order){
        /*
        console.debug('Data_Search ' + key, ctx);
        */
        let value = null;
        let type = null;
        if(!order){
            order = [DIRECTION_VARS, DIRECTION_DATA];
        }
        for(var i = 0; i < order.length; i++){
            if(order[i] === DIRECTION_DATA){
                found = ctx.data[key];
            }else if(order[i] === DIRECTION_VARS){
                if(ctx.vars[key] !== undefined){
                    found = ctx.vars[key];
                }
            }
            if(found){
                value = found;
                break;
            }
        }

        return {value: value, type: type};
    }

    /*
     * [Setters Run and Register]
     */
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
                El_SetStateStyle(node, node.templ, value);
            }else{
                El_SetStateStyle(node, node.templ, []);
            }
        }else if(set.scope === 'as'){
            /*
            console.debug('RUNNING as value:' + value, setter);
            */
            if(value){

                const asData = {}
                asData[set.destK.key] = value;

                El_MakeAs(setter.node, setter.node.parentNode, Data_Sub(asData));
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
            setter.isMatch = isMatch;
            El_RunSetter(setter, value);
        }
    }

    function El_RunNodeSetters(node, prop, value){
        for(let k in node.varSetters[prop]){
            El_RunIndividualSetter(node, node.varSetters[prop][k], prop, value);
        }
    }

    /* 
     * Set a variable on an object, this is instrumental in running listeners
     * which trigger most of the interactive behaviour of the framework. 
     */
    function El_SetVar(node, prop, value){
        if(node.vars[prop] !== value){
            if(!node.templ.name && node.templ.nodeName == 'DIV'){
            }else{
            }
            El_RunNodeSetters(node, prop, value);
            node.vars[prop] = value;
            framework._ctx.vars[prop] = value;
            return true;
        }
        return false;
    }

    /* 
     * [Parsing Templates]
     *
     * This is the main parse function, it interprets HTML elmeents which
     * contain tags and attributes used to form templates used to inflate
     * elements.
     */
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
            forKey: null,
            withkey: null,
            mapVars: {},
            children: [],
            classes: {},
            baseStyle: '', 
            classIfCond: {},
            setters: [],
            asKey: null,
            body: '',
            uiSplit: false,
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
                templ.flags |= FLAG_DRAG_TARGET;
                templ.on.drag = Spec_Parse('move');
            }else if(att.name == 'drop'){
                templ.flags |= FLAG_DROP_TARGET;
                templ.on.drop = Spec_Parse('drop');
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
            }else if(att.name == 'split'){
                templ.uiSplit = true;
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
            }else if(att.name == 'class'){
                templ.classes._misc = att.value.split(' ');
            }else if(att.name == 'init-class'){
                templ.classes.state = att.value.split(' ');
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

    /* 
     * Merging happens when a template populates a different one, usually using
     * `as`, `for` or `with` attributes 
     */
    function Templ_Merge(into_templ, from_templ, overrides){
        if(!into_templ){
            into_templ = {};
        }
        const templ = {
            nodeName: from_templ.nodeName,
            name: into_templ.name || from_templ.name,
            isMerged: true,
            flags: into_templ.flags | from_templ.flags,
            el: into_templ.el || from_templ.el,
            asKey: from_templ.asKey,
            on: {},
            funcs: {},
            forKey: null,
            dataKey: from_templ.dataKey,
            withkey: null,
            mapVars: {},
            children: (overrides && overrides.children) || (from_templ.children.length && from_templ.children) || into_templ.children || [],
            body: (into_templ.body && into_templ.body.trim()) || from_templ.body.trim(),
            classIfCond: {},
            baseStyle: '',
            setters: from_templ.setters,
            uiSplit: from_templ.uiSplit || into_templ && into_templ.uiSplit,
            classes: {},
            _misc: {},
        };

        function copyObj(name){
            for(let k in from_templ[name]){
                templ[name][k] = from_templ[name][k];
            }
            if(into_templ){
                for(let k in into_templ[name]){
                    templ[name][k] = into_templ[name][k];
                }
            }
        }

        function copyList(name){
            for(let i = 0; i < from_templ[name].length; i++){
                templ[name].push(from_templ[name][i]);
            }
            if(into_templ[name]){
                for(let i = 0; i < into_templ[name].length; i++){
                    templ[name].push(into_templ[name][i]);
                }
            }
        }

        copyObj('funcs');
        copyObj('on');
        copyObj('mapVars');
        copyObj('classIfCond');
        copyObj('_misc');

        templ.baseStyle = from_templ.baseStyle;
        if(into_templ.baseStyle){
            if(into_templ.baseStyle && into_templ.baseStyle){
                templ.baseStyle += ';';
            }
            templ.baseStyle += into_templ.baseStyle;
        }

        Style_ClsOverlay(templ.classes, into_templ.classes, from_templ.classes);

        /*
        console.debug('Temple on ' + templ.classes, templ.on);
        console.debug('Temple from.on ' + from_templ.nodeName, from_templ.on);
        console.debug('Temple into.on ' + into_templ.name, into_templ);
        console.debug(' --- ');
        */

        return templ;
    }

    /*
     * [Events Native and Synthetic]
    */
    function Event_Run(event_ev){
        let r = false;
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
        if(event_ev.spec.key === 'size'){
            if(event_ev.target === framework._ctx.root){
                ChangeStyle(null, '.full-width', 'width', window.innerWidth + 'px');
                ChangeStyle(null, '.full-height', 'height', window.innerHeight + 'px');
            }
        }else if(event_ev.spec.key === 'move'){
            console.debug('move', event_ev);
        }else if(event_ev.spec.key === 'split'){
            El_Make(event_ev.dest.templ, event_ev.dest.parentNode, Data_Sub(event_ev.dest._ctx));
            for(let i = 0, l = event_ev.dest.parentNode.children.length; i < l; i++){
                const child = event_ev.dest.parentNode.children[i];
                El_SetSize(child, l, '/w');
            }
        }else if(event_ev.spec.key === 'style'){
            if(event_ev.eventType === 'hover'){
                if(event_ev.spec.varIsPair){
                    El_SetStateStyle(event_ev.target, event_ev.target.templ, event_ev.spec.varList[0]);
                }
            }else if(event_ev.eventType === 'unhover'){
                if(event_ev.spec.varIsPair){
                    El_SetStateStyle(event_ev.target, event_ev.target.templ, event_ev.spec.varList[1]);
                }
            }
        }if(event_ev.spec.key === 'unhover'){
            if(event_ev.dest.templ && event_ev.dest.templ.on.hover){
                sub_ev = {spec: event_ev.dest.templ.on.hover, target: event_ev.dest, eventType: "unhover"};
            }
        }else if(event_ev.spec.key === 'set'){
            var tg = event_ev.dest || event_ev.target;
            for(var k in event_ev.spec.mapVars){
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

    /* Events are merged when they trigger a related event */
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

        return ev;
    }

    function Event_New(target_el, e, spec, type){
        var event_ev = {
            target: target_el, /* the source of the event, e.g. clicked element */
            dest: null, /* the destination that has the event on it */
            e: e,
            spec: spec,
            eventType: (type || GetTypeFromE(e)),
            vars: {}, /* end result of target vars + gathers */
            _pior: null, /* event this event is based on */
        }

        if(target_el.vars){
            if(spec.mapVars){
                CopyVars(spec.mapVars, event_ev.vars, target_el.vars);
            }
        }
        if(event_ev.eventType === 'drag'){
            Event_SetupDrag(event_ev, framework._drag);
            Event_UpdateDrag(event_ev);
            console.debug('DRAG SETUP', framework._drag);
        }

        return event_ev;
    }

    /* 
     * [Drag-n-drop Setup]
     */

    function getDragPos(node){
        let el = node;
        let x = 0;
        let y = 0;
        do {
            y += el.offsetTop  || 0;
            x += el.offsetLeft || 0;
            if(el.scrollTop){
                y -= el.scrollTop;
            }
            el = el.offsetParent;
        } while(el);

        return {
            x: x,
            y: y,
            rect: node.getBoundingClientRect(),
        };
    }

    function getDragAndContPos(node){
        console.debug('getDragAndContPos', node);
        let dragContainer = null;
        let el = node;
        let x = 0;
        let y = 0;
        do {
            if(el.flags && (el.flags & FLAG_DROP_TARGET)){
                console.debug('DROP TARGET [FOUND]', el);
                dragContainer = el;     
            }
            y += el.offsetTop  || 0;
            x += el.offsetLeft || 0;
            if(el.scrollTop){
                y -= el.scrollTop;
            }
            el = el.offsetParent;
        } while(el);
        if(dragContainer){
            return {
                x: x,
                y: y,
                dragContainer: dragContainer,
            }
        }else{
            console.warn('drag container not found');
            return null;
        }
    }

    function Event_SetDragContPos(node){
        if(node._views){
            if((node.flags & FLAG_DRAG_CONT_CALCULATED) == 0){
                node.flags |= FLAG_DRAG_CONT_CALCULATED;
                for(let k in node._views){
                    const v = node._views[k];
                    for(let i = 0; i <  v.el_li.length; i++){
                        let elObj = v.el_li[i];
                        elObj.pos = getDragPos(elObj.el);
                    }
                }
                console.debug('updated positions for ' + node.nodeName, node._views);
            }
        }
    }

    function Event_GetDropContTargets(viewSet){
        let targets = [];
        for(let k in viewSet){
            let view = viewSet[k];
            if(view && view.container ){
                targets.push({
                    node: view.container,
                    pos: getDragPos(view.container)
                });
            }
        }
        return targets;
    }

    function Event_DragTargetCalc(e, drag_ev){
        let mouseY = e.clientY;
        let mouseX = e.clientX;
        let current = drag_ev.target;
        let wasCurrent = null;
        let wasCurrent_i = 0;

        let containers = drag_ev.props.containers;
        for(let i = 0; i < containers.length; i++){
            let cont = containers[i];
            let t = cont;
            let rect = {
                startX: t.pos.x,
                startY: t.pos.y,
                endX: t.pos.x + t.pos.rect.width,
                endY: t.pos.y + t.pos.rect.height
            };

            if((mouseY >= rect.startY && mouseY <= rect.endY) &&
                (mouseX >= rect.startX && mouseX <= rect.endX)
            ){
                if(cont.node !== drag_ev.props.dragContainer){
                    console.log('Switching drag container', cont.node._idtag);
                    drag_ev.props.dragContainer = cont.node;
                    Event_SetDragContPos(cont.node);
                }
            }
        }

        let dragView_li = drag_ev.props.dragContainer._view.el_li;

        for(let i = 0; i < dragView_li.length; i++){
            let t = dragView_li[i];

            if(t.el === current){
                wasCurrent = t;
                wasCurrent_i = i;
            }

            let rect = {
                startX: t.pos.x,
                startY: t.pos.y,
                endX: t.pos.x + t.pos.rect.width,
                endY: t.pos.y + t.pos.rect.height
            };

            if((mouseY >= rect.startY && mouseY <= rect.endY) &&
                (mouseX >= rect.startX && mouseX <= rect.endX)
            ){
                return {idx: i, uitem: t, current: {idx: wasCurrent_i, uitem: wasCurrent}};
            }
        }

        return null;
    }


    function Event_SetupDrag(event_ev, dragObj){
        console.debug('Setting up DRAG', event_ev);
        console.debug('Setting up DRAG dragObj', dragObj);

        dragObj.ev = event_ev;

        const dragVessel = dragObj.vessel_el;
        const node = event_ev.target;
        const e = event_ev.e;
        if(!node || !dragVessel){
            console.warn('Error: no drag taget in event or dragVessel in document');
            return;
        }

        let x = 0;
        let y = 0;
        let h = 0;
        let w = 0;
        let dragContainer = null;
        
        let rect = node.getBoundingClientRect();
        h = rect.height;
        w = rect.width;

        let dragPos = getDragAndContPos(node);
        if(dragPos){
            x = dragPos.x;
            y = dragPos.y;
            dragContainer = dragPos.dragContainer;
            Event_SetDragContPos(dragContainer);
        }else{
            console.warn('unable to get drag container');
            return null;
        }

        let place = document.createElement('DIV');
        let style = window.getComputedStyle(node);
        place.style.display = style.display;
        place.style.position = style.position;
        place.style.width = w + 'px';
        place.style.height = h + 'px';
        place.style.padding = style.padding + 'px';
        place.style.margin = style.margin + 'px';

        for(let i = 0; i < node.classList.length; i++){
            place.classList.add(node.classList[i]);
        }

        swap(node, place);
        dragVessel.appendChild(node);

        let viewSet = dragContainer._views;
        let containers = Event_GetDropContTargets(viewSet);
        event_ev.props = {
            w:w,
            h:h,
            x:x,
            y:y,
            offsetX: e.clientX - x,
            offsetY: e.clientY - y,
            place: place,
            vessel: dragVessel,
            cont: dragPos,
            item: {
                node: node,
                pos: getDragPos(node)
            },
            containers: containers,
            spacers: {},
            _spacer_idtag: null
        };

        dragObj.ev = event_ev;
    }

    function Event_DragRelease(event_ev){
        console.debug('DRAG [release]', event_ev);
        framework._drag.ev = null;
    }

    function Event_UpdateDrag(event_ev){

        const x = event_ev.e.clientX - event_ev.props.offsetX;
        const y = event_ev.e.clientY - event_ev.props.offsetY;

        console.debug('Update Drag x' + x +' y' + y);

        El_SetStyle(event_ev.props.vessel, 'top', y + 'px');
        El_SetStyle(event_ev.props.vessel, 'left', x + 'px');
    }


    /* 
     * [Bind and Assign Browser Events]
     */

    function onMouseMove(e){
        var x = e.clientX;
        var y = e.clientY;
    }

    function onDrag(e){
        var node = this;
        let r = false;
        ResetCtx({ev: null});
        if(node.templ && node.templ.on.drag){
            r = Event_Run(Event_New(node, e, node.templ.on.drag, 'drag'));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onDrop(e){
        var node = this;
        let r = false;
        ResetCtx({ev: null});
        if(node.templ && node.templ.on.drop){
            r = Event_Run(Event_New(node, e, node.templ.on.drop));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onMove(e){
        if(framework._drag.ev){
            framework._drag.ev.e = e;
            Event_UpdateDrag(framework._drag.ev);
        }
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
        if(node.templ && node.templ.on.drag){
            r = onDrag.call(node, e);
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onResize(e){
        var node = this;
        let r = false;
        ResetCtx({ev: null});
        if(node.templ && node.templ.on.resize){
            r = Event_Run(Event_New(node, e, node.templ.on.resize));
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
        if(node.templ && node.templ.on.drop){
            r = onDrop.call(node, e);
        }

        if(framework._drag.ev){
            Event_DragRelease(framework._drag.ev);
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
        if(events.mousedown || events.click || events.drag){
            node.onmousedown = onDown;
        }
        if(events.mouseup || (node.flags & FLAG_DRAG_TARGET)){
            node.onmouseup = onUp;
        }
        if(events.resize){
            node.onresize = onResize;
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

    /*
     * [Styles and Stylesheet Management]
     */
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
            const rule = GetStyleRule(sheetObj, name);
            if(!rule){
            }else{
                rule.style[att] = value;
            }
        }
    }

    function El_SetStyle(node, att, value){
        if(node._idtag){
            const clsName = El_GetClsName(node);
            let rule_s = '.' + clsName;
            if(!GetStyleRule(GetstyleSheet(null), rule_s)){
                rule_s +='{'+att+':'+value+'}';
                AddStyle(null, rule_s);
                node.classList.add(clsName);
            }else{
                ChangeStyle(null, rule_s, att, value);
            }
        }
    }

    function El_SetSize(node, arg, unit){
        if(unit === '/w'){
            El_SetStyle(node, 'width', 100 / arg + '%');
        }
    }

    function El_GetClsName(el){
        if(el._idtag){
            return  'custom-' + el._idtag.replace('_', '-');
        }
        return null;
    }

    function El_SetStateStyle(node, templ, stateStyle){
        const classes = {};

        Style_ClsOverlay(classes, node.classes, templ.classes);

        let custom_rule = El_GetClsName(node);
        classes.custom = [custom_rule];
        if(stateStyle){
            if(typeof stateStyle === 'string'){
                classes.state = [stateStyle];
            }else if(Array.isArray(stateStyle)){
                classes.state = stateStyle;
            }
        }

        /*
        let style_s = Cash(templ.baseStyle, node.vars).result;
        if(style_s){
            const rule = '.' + custom_rule + ' {' + style_s + '}';
            if(!GetStyleRule(GetstyleSheet(null), custom_rule)){
                AddStyle(null, rule);
            }
        }
        */

        while(node.classList.length){
            node.classList.remove(node.classList[0]);
        }

        const classList = Style_ToCls(classes);
        for(let i = 0; i < classList.length; i++){
            node.classList.add(classList[i]);
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


    function AddStyle(sheet_s, rule_s){
        var sheetObj = GetstyleSheet(sheet_s);
        if(sheetObj){
            sheetObj.sheet.insertRule(rule_s, sheetObj.sheet.rules.length);
        }
    }

    
    function Style_ClsOverlay(dest, into, from){
        for(let k in from){
            dest[k] = from[k];
        }
        for(let k in into){
            dest[k] = into[k];
        }
    }

    function Style_ToCls(classes){
        let cls = [];
        for(let k in  classes){
            cls = cls.concat(classes[k]);
        }
        return cls;
    }


    /* 
     *[Cash Variable-In-String Parser]
     *
     * This is the function that allows variables to exist in strings
     */
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

    /*
     * [Injest and Tag Data]
     */
    function Injest(content){
        const framework = this;
        content._idtag = 'content_' + (++framework.content_idx);
        framework.content[content._idtag] = content;
        if(Array.isArray(content)){
            for(let i = 0; i < content.length; i++){
                content[i]._idtag = 'content_' + (++framework.content_idx);
                if(typeof content[i].rev === 'undefined'){
                    content[i].rev = 0;
                }
            }
        }
    }

    /* 
     * [Core Functions For Element Creation]
     */

    /*   This the main way of making an element internally
     *
     *   @templ - this is the template string or object to create
     *   @parent_el - this is the element that it will be placed inside of
     *   @reuseNode - this is only used for internal updates
     */
    function El_Make(templ, parent_el, ctx, reuseNode){
        /* Begin by sorting out which template or combination of templates to use */
        let isTemplNodeName = false;
        if(typeof templ === 'string'){
            templ = framework.templates[templ.toUpperCase()];
        }

        if(!templ){
            console.warn('El_Make no templ', templ);
            return;
        }

        let forKey = null;
        let outdent = false;
        if(framework.templates[templ.nodeName.toUpperCase()]){
            ctx = (templ.nodeName && 
                (Data_Sub(ctx, templ.nodeName) || Data_Sub(ctx, templ.nodeName.toLowerCase()))
            ) || ctx;


            forKey = templ.forKey;
            child_templ = framework.templates[templ.nodeName.toUpperCase()];
            if(child_templ){
                templ = Templ_Merge(templ, child_templ);
            }

        }else{
            forKey = templ.forKey;
        }

        if(!templ){
            console.warn('El_Make no templ', templ);
            return;
        }

        /*
        console.debug('El_Make ctx', ctx);
        */

        /* Now handle if the element has an attirbute that makes it a bunch of children 
         * instead of a single elemenet
         */
        if(forKey){
            let subCtx;
            if(subCtx = Data_Sub(ctx, forKey)){
                const par_templ = templ;

                let subData;
                while(subData = Data_Next(subCtx)){
                    let sub_templ = null;
                    if(par_templ.asKey){
                        const templ_s = Cash(par_templ.asKey.key, subData.data).result;
                        sub_templ = framework.templates[templ_s.toUpperCase()];
                    }

                    if(sub_templ){
                        sub_templ = Templ_Merge(par_templ, sub_templ);
                    }else{
                        sub_templ = Templ_Merge(null, par_templ);
                    }

                    El_Make(sub_templ, parent_el, subData);
                }
            }else{
                console.warn('Warning: for children key not found '+ forKey, ctx);
                console.warn('Warning: for children key not found templ', templ);
                console.warn('Warning: for children key not framework', framework);
            }
            return;
        }

        /* Begin makeing the actual node 
         */
        const node = reuseNode || document.createElement(templ.nodeName);

        node.vars = {};
        node.flags = templ.flags;
        node._idtag = 'element_'+(++framework.el_idx);

        /*
        console.warn('El_Make' + node._idtag, ctx);
        */

        node.varSetters = {};
        node.templ = templ;
        if(templ.uiSplit){
            node._ctx = ctx;
        }
        if(!reuseNode){
            parent_el.appendChild(node);
        }

        if(ctx.view.container && (node.flags & FLAG_DRAG_TARGET)){
            ctx.view.el_li.push({el:node, pos: null});
        }

        /* if the data comes from an injested data source, store the flag here
         */
        if(ctx.data._idtag){
            node._content_idtag = ctx.data._idtag;
            node._content_key = ctx.key;
        }

        /* Copy vars in from the data to this element */
        for(let k in templ.mapVars){
            const map = templ.mapVars[k];
            const value = Data_Search(map.key, ctx, [
                DIRECTION_DATA, DIRECTION_VARS
            ]);
            if(value.value){
                node.vars[map.dest_key] = value.value;
                if(value.type !== 'vars'){
                    ctx.vars[map.dest_key] = value.value;
                }
            }else{
                node.vars[map.dest_key] = null;
                console.warn('El_Make: no var found for: ' + map.key, map);
                console.warn('El_Make: no var found for: ' + map.key + ' ctx:', ctx);
                console.warn('El_Make: no var found for: ' + map.key + ' node:', node);
            }
        }

        /* Add the classes if they exist */
        if(templ.classes){
            for(let i = 0; i < templ.classes.length; i++){
                node.classList.add(templ.classes[i]);
            }
        }

        /* In-depth setup starts now, this is listeners and fnction/handler bindings
           as well as updating syles based on data
        */

        Templ_SetFuncs(templ, framework.funcs);
        El_SetStateStyle(node, templ);
        if(!reuseNode){
            El_SetEvents(node, templ.on);
            El_SetEvents(node, templ.funcs);
            El_RegisterSetters(node, templ);
        }else{
            console.log('Reusing Node', reuseNode);
            console.log('Reusing Node templ', templ);
        }

        /* Copy in the body if it's there, Cash is used for templating values 
         * from the data */
        const body = Cash(templ.body, ctx.data).result;
        if(body){
            node.appendChild(document.createTextNode(body));
        }

        /* _misc has every non-templang html property for the elements
         * it looks at the data for these to see if they include variables
         * otherwise they are placed as literals of what they were 
         * in the templates
         */
        for(var k in templ._misc){
            let name = templ._misc[k];
            if(!name){
                name = k;
            }

            name = Cash(name, ctx.data).result;
            
            let val = Data_Search(name, ctx, [DIRECTION_DATA, DIRECTION_VARS]).value;
            if(!val){
                val = name;
            }

            node.setAttribute(k, val);
        }

        /* Make children the same was as this, recursively if they were
         * part of the original template 
         */
        if(templ.children.length){
            for(let i = 0; i < templ.children.length; i++){
                const subCtx = (templ.name && 
                    (Data_Sub(ctx, templ.name) || Data_Sub(ctx, templ.name.toLowerCase()))
                ) || ctx;
                El_Make(templ.children[i], node, subCtx);
            }
        }

        return node;
    }

    function El_MakeAs(node, parent_el, ctx){
        let templ = null;
        templ = node.templ;

        let templ_s = '';
        if(templ.asKey){
            const keys = templ.asKey;

            templ_s = keys.key;
            if(keys.cash.isCash){
                templ_s = Cash(keys.key, ctx.data).result; 
            }else{
                templ_s = keys.key;
            }
        }

        if(templ.dataKey){
            const compare = {
                vars: templ.dataKey.key,
                name: templ.dataKey.key_source,
            };
            const source_el = El_Query(node, {direction: templ.dataKey.var_direction},  compare);
            if(source_el && source_el.vars[templ.dataKey.key]){
                const data = {};
                const content = source_el.vars[templ.dataKey.key]
                data[templ.dataKey.key] = content;
                ctx = Data_Sub(data);

                if(templ.flags & FLAG_DROP_TARGET){
                    parent_el.flags |= FLAG_DROP_TARGET;

                    if(typeof parent_el._views === 'undefined'){
                       parent_el._views = {};
                    }

                    const view = {
                        content: content,
                        dataKey: templ.dataKey,
                        container: parent_el,
                        el_li: [],
                    };

                    parent_el._views[node._idtag] = view;
                    ctx.view = view;

                    El_SetStyle(parent_el, 'position', 'relative');
                }
            }
        }

        if(framework.templates[templ_s.toUpperCase()]){
            new_templ = framework.templates[templ_s.toUpperCase()];
            templ = Templ_Merge(new_templ, templ, {children: new_templ.children}); 
        }

        while(node.hasChildNodes()){
            node.firstChild.remove();
        }

        while(node.classList.length){
            node.classList.remove(node.classList[0]);
        }
        
        El_Make(templ, parent_el, ctx, node);
    }


    /* 
     *   Main function for inflating a template with data to make elements
     *
     *   Make(templ, parent_el, data) -> undefined
     *       - templ: string or template object that was added to framework.templates
     *       - parent_el: where to place the newly created element
     *       - data: data used to populate the nodes that are designated by the "templ"
     *
     *   Wrapper for El_Make which sets up the data 
     */
    function Make(name, root_el, data){
        const ctx = Data_Sub(data);
        El_Make(name, root_el, ctx);
    }

    /*
     * [Initialized the Framework Object]
     */

    /* Setup default styles */
    if(typeof framework._styleSheets === 'undefined'){
        framework._styleSheets = {};
    }
    if(!GetstyleSheet(null)){
        const sheet = document.createElement('style');
        document.head.appendChild(sheet);
    }

    if(typeof framework.funcs === 'undefined'){
        framework.funcs = {};
    }
    if(typeof framework.content === 'undefined'){
        framework.content = {};
    }
    if(typeof framework.templates === 'undefined'){
        framework.templates = {};
    }

    if(typeof framework._drag === 'undefined'){
        dragVessel = document.createElement('DIV');
        dragVessel._idtag = 'drag-vessel';
        El_SetStyle(dragVessel, 'position', 'absolute');
        El_SetStyle(dragVessel, 'z-index', '1000');

        dragHighlighter = document.createElement('DIV');
        dragHighlighter.classList.add('drag-highlighter');

        const bodies = document.getElementsByTagName('body');
        if(bodies && bodies[0]){
            const body = bodies[0]
            body._idtag = 'body';
            body.appendChild(dragVessel);
            body.appendChild(dragHighlighter);
            El_SetStyle(body, 'position', 'relative');
        }


        framework._drag = {
            vessel_el: dragVessel,
            highlighter_el: dragHighlighter,
            spacer_templ: null,
            ev: null
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('mousedown', onDown);
    }

    ResetCtx({});
    const root = document.documentElement;

    root.vars = {};
    root.varSetters = {};
    root._idtag = 'root';
    root.templ = { 
            on: { resize: Spec_Parse('size')},
            /* blank */
            nodeName: "_WINDOW",
            name: "",
            isMerged: false,
            flags: 0,
            el: document.documentElement,
            asKey: null,
            funcs: {},
            forKey: null,
            dataKey: null,
            withkey: null,
            mapVars: {},
            children:  [],
            body: "",
            classIfCond: {},
            baseStyle: '',
            setters: [],
            _misc: {},

    };

    framework._ctx.root = root;

    window.onresize = function(e){
        onResize.call(framework._ctx.root, e);
    };

    /* Parse templates from the elment in the page */
    if(templates_el){
        var nodes = templates_el.childNodes;
        for(var i = 0, l = nodes.length; i < l;i++){
            var el = nodes[i];
            if(el.nodeType == Node.ELEMENT_NODE){
                Templ_Parse(el, null);
            }
        }
    }

    if(framework.templates['DRAG-SPACER']){
        framework._drag.spacer_templ = framework.templates['DRAG-SPACER'];
    }
    AddStyle(null, '.full-height{height: '+ window.innerHeight + 'px}');
    AddStyle(null, '.full-width{width: '+ window.innerWidth + 'px}');

    /* Amend relevant public properties to the framework object */
    framework.content_idx = 0;
    framework.el_idx = 0;
    framework.Make = Make;
    framework.Injest = Injest;
    framework.Cash = Cash;
    framework.ChangeStyle = ChangeStyle;
    framework.AddStyle = AddStyle;
}
