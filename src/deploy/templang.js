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
    const DIRECTION_GLOBAL = 7;
    const DIRECTION_VARS = 8;
    const TYPE_HANDLER = 10;
    const TYPE_REDIR = 11;
    const TYPE_FUNC = 12;
    const TYPE_ELEM = 13;
    const REUSE_AFTER = 14;
    const REUSE_BEFORE = 15;
    const SPEC_REDIR = 16;

    const ASSIGN = 1000;
    const EQUAL = 1001;
    const NOT_EQUAL = 1002;

    const DELAY_DRAG_START = 300;

    const FLAG_NODE_STATE_HOVER = 1;
    const FLAG_NODE_STATE_DRAG = 2;
    const FLAG_DRAG_TARGET = 4;
    const FLAG_DROP_TARGET = 8;
    const FLAG_DRAG_CONT_CALCULATED = 16;
    const FLAG_SPLIT = 32;
    const FLAG_VSPLIT = 64;

    const COLOR_WHITE = '#fff';
    const COLOR_GREY = '#eee';
    const COLOR_RED = '#f00';
    const COLOR_BLUE = '#66f';
    const COLOR_GREEN = '#090';
    const COLOR_YELLOW = '#ff0';

    /*TODO: remove this temporary variable */
    let splitCount = 1;


    const TRANS_RETRY = 200;

    /* 
     *[Debugging]
     *
     */
     let _debug_el = null;
     function debug(msg, obj, color){
        let el = null;
        let obj_s = '';
        if(!_debug_el){
            console.log(msg, obj);
            return;
        }else{
            el = _debug_el;
            if(obj){
                obj_s = ' | ' + kv_toString(obj);
            }
        }

        const n = document.createElement('DIV');
        if(color){
            n.style.color = color;
        }
        n.style.padding = '4px';
        n.style.margin = 0;
        n.appendChild(document.createTextNode(msg + obj_s + '\n'));
        el.appendChild(n);
     }

     function Debug_SetEl(el){
        _debug_el = el;
     }

     try {

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
                            if((typeof node.vars[k] !== 'undefined' && (node.vars[k] == comp[k])) || (node.templ[k] && node.templ[k][key2])){
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

        function El_Query(node, spec, compare, ctx){
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

        function kv_toString(obj){
            let s = '';
            if(typeof obj === 'object'){
                if(Array.isArray(obj)){
                    s += '[';
                    for(let i = 0; i < obj.length; i++){
                         s += kv_toString(obj[i]);
                         if(i < obj.length-1){
                            s += ',';
                         }
                    }
                    s += ']';
                }else if(Object.keys(obj).length){
                    s += '{';
                    for(let k in obj){
                        if(s.length > 1){
                            s += ',';
                        }
                        s += k +'='+kv_toString(obj[k]);
                    }
                    s += '}';
                }else{
                    s = String(s);
                }
            }else{
                s = String(obj);
            }

            return s;
        }

        function swap(orig, place){
            if(orig.nextSibling){
                orig.parentNode.insertBefore(place, orig.nextSibling);
            }else{
                orig.parentNode.append(place);
            }
            orig.remove();
        }

        function Compare(dest, key, value, type){
            if(key){
                if(dest && typeof dest === 'object'){
                    if(!Array.isArray(dest)){
                        dest = dest[key];
                    }
                }else{
                    return (type === NOT_EQUAL) || false;
                }
            }

            if(dest && Array.isArray(dest)){
                if(type === NOT_EQUAL){
                    return (dest.indexOf(value) === -1);
                }else{
                    return (dest.indexOf(value) !== -1);
                }
            }else if(dest && typeof dest === 'object'){
                if(type === NOT_EQUAL){
                    return typeof dest[value] === 'undefined';
                }else{
                    return typeof dest[value] === 'undefined';
                }
            }else{
                if(type === NOT_EQUAL){
                    return typeof dest !== value;
                }else{
                    return typeof dest === value;
                }
            }

            return (type === NOT_EQUAL) || false;
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
            let dest_k = null;
            let qcache_key = key;
            let set_v = null;
            let var_direction = DIRECTION_SELF;
            let dest_direction = DIRECTION_SELF;
            let comparison = null;
            let key_source = null;
            if(var_k.indexOf('!=') != -1){
                const var_li = var_k.split('!=');
                var_k = var_li[1];
                dest_k = var_li[0];
                comparison = NOT_EQUAL;
            }else if(var_k.indexOf('==') != -1){
                const var_li = var_k.split('==');
                var_k = var_li[1];
                dest_k = var_li[0];
                comparison = EQUAL;
            }else if(var_k.indexOf('=') != -1){
                const var_li = var_k.split('=');
                var_k = var_li[1];
                dest_k = var_li[0];
                comparison = ASSIGN;
            }

            if(var_k.indexOf(':') != -1){
                const li = var_k.split(':');
                var_k = li[0];
                set_v = li[1];
            }

            if(var_k.length){ 
                if(var_k[0] === '_'){
                    var_direction = DIRECTION_CHILD;
                    qcache_key = var_k;
                    var_k = var_k.substring(1);
                }else if(var_k[0] === '^'){
                    var_direction = DIRECTION_PARENT;
                    qcache_key = var_k;
                    var_k = var_k.substring(1);
                }else if(var_k[0] === '.'){
                    var_direction = DIRECTION_DATA;
                    var_k = var_k.substring(1);
                }else if(var_k[0] === '@'){
                    var_direction = DIRECTION_GLOBAL;
                    var_k = var_k.substring(1);
                }else if(var_k[0] === '&'){
                    var_direction = SPEC_REDIR;
                    var_k = var_k.substring(1);
                }
            }

            if(dest_k && dest_k.length){
                if(var_k[0] === '&'){
                    dest_direction = SPEC_REDIR;
                    dest_k = dest_k.substring(1);
                }else if(dest_k[0] === '_'){
                    dest_direction = DIRECTION_CHILD;
                    qcache_key = dest_k;
                    dest_k = dest_k.substring(1);
                }else if(dest_k[0] === '^'){
                    qcache_key = dest_k;
                    dest_direction = DIRECTION_PARENT;
                    dest_k = dest_k.substring(1);
                }else if(dest_k[0] === '@'){
                    dest_direction = DIRECTION_GLOBAL;
                    dest_k = dest_k.substring(1);
                }
            }

            let var_k_li = [];
            if(var_k){
                var_k_li.push(var_k);
            }

            if(var_k.indexOf('.') != -1){
                var_k_li = var_k.split('.');
                key_source = var_k_li[0];
                if(dest_k == var_k){
                    dest_k = var_k_li[var_k_li.length-1];
                }
                var_k = var_k_li[var_k_li.length-1];
            }

            if(!dest_k){
                dest_k = var_k;
                dest_direction = var_direction;
            }

            const cash =  Cash(var_k, null, true);
            if(cash.isCash){
                var_k = cash.arg;
            }
            return {
                key: var_k,
                key_source: key_source,
                key_props: var_k_li,
                dest_key: dest_k,
                value: set_v,
                dest_direction: dest_direction,
                var_direction: var_direction,
                qcache_key: qcache_key,
                comparison: comparison,
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
                spec_s: spec_s,
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

            if(key[0] === '&'){
                spec.type = TYPE_REDIR;
                const destK = GetDestK(spec_s);
                spec.key = 'ref';
                key = key.substring(1);
                spec.mapVars = Map_Make(key);
                return spec;
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
        function Data_Add(ctx, dataOrKey, data){
            if(typeof dataOrKey === 'object'){

                for(let k in dataOrKey){
                    ctx.data[k] = dataOrKey[k]; 
                }
            }else if(typeof dataOrKey === 'string'){
                ctx.data[dataOrKey] = data; 
            }
        }

        function Data_Set(dataOrKey, data){
            Data_Add(framework.dataCtx, dataOrKey, data);
        }

        function Data_Push(ctx, key, data){
            const _data = {};
            _data[key] = data;
            const prev = [ctx];

            return {
                key: key,
                data: _data,
                vars: (ctx && ctx.vars) || {},
                idx: -1,
                isArr: false,
                isSub: true,
                prev: ctx && (Array.isArray(ctx.prev) && prev.concat(ctx.prev)) || prev,
                view: (ctx && ctx.view) || {},
                qcache: {},
            };
        }

        function Data_Sub(data, key, order){
            let ctx = null;

            if(data === null || data === undefined){
                return null;
            }else if(data.data){
                ctx = data; 
                data = data.data;
            }

            if(order && ctx){
                data = Data_Search(ctx, key, order).value;
                const prev = [ctx];
                if(data){
                    return {
                        key: null,
                        data: data,
                        vars: (ctx && ctx.vars) || {},
                        idx: key,
                        isArr: false,
                        isSub: true,
                        prev: ctx && (Array.isArray(ctx.prev) && prev.concat(ctx.prev)) || prev,
                        view: (ctx && ctx.view) || {},
                        qcache: {},
                    };
                }
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
                        qcache: {},
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
                        // this will be an El_Query cache at some point
                        qcache: {},
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
                    qcache: {},
                };
            }
        }

        function Data_Next(ctx){
            if(!ctx.isArr){
                return;
            }

            return Data_Sub(ctx, ++ctx.idx, [DIRECTION_DATA]); 
        }

        function ResetCtx(args){
            if(!("_ctx" in framework)){
               framework._ctx =  {vars: {}, ev: null, ev_trail: []};
            }

            if(args.ev !== undefined){
                framework._ctx.ev = args.ev;
            }

            if(!args.preserveVars){
                framework._ctx.vars = {};
            }

            framework._ctx.ev_trail = [];
        }

        function LogCtx(msg){
            if(framework._ctx){
                debug(msg + ' '+framework._ctx.ev_trail.join(', '), framework._ctx.vars, COLOR_GREY);
            }
        }

        function DataScope(sel, data){
            if(data && data[sel]){
                return data[sel];
            }
            return null;
        }

        function Data_Search(ctx, key, order){
            /*
            console.log('Data_Search "' + key + '" order: '+order, ctx);
            console.log('Data_Search "' + key + '" order: '+order + ' global', framework.dataCtx);
            */

            let value = null;
            let type = null;
            let found = null;
            if(!order){
                order = [DIRECTION_VARS, DIRECTION_DATA, DIRECTION_GLOBAL];
            }
            for(var i = 0; i < order.length; i++){
                if(order[i] === DIRECTION_DATA){
                    found = ctx.data[key];
                }else if(order[i] === DIRECTION_VARS){
                    if(ctx.vars[key] !== undefined){
                        found = ctx.vars[key];
                    }
                }else if(order[i] === DIRECTION_GLOBAL){
                    let data = framework.dataCtx.data;
                    if(typeof key === 'object' && Array.isArray(key)){
                        let i = 0;
                        let key_k = key[i];
                        while((i < key.length) && (data = data[key[i]])){
                            i++;
                        }
                    }
                    if(data){
                        found = data;
                    }
                    if(framework.dataCtx.data[key] !== undefined){
                        found = framework.dataCtx.data[key];
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
                    if(set.scope === 'if'){
                        setter.isMatch = true;
                    }

                    source.varSetters[destK.key][node._idtag] = setter;
                    El_RunIndividualSetter(source, setter, destK.key, source.vars[destK.key]);
                }else{
                    console.warn("El_RegisterSetters '" + destK.key + "' not found in tree", node);
                    console.warn("El_RegisterSetters '" + destK.key + "' not found in tree setter", set);
                    console.warn('Source of setter :' +(node.templ && node.templ.asKey &&  node.templ.asKey.key), set);
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
                if(setter.isMatch){
                    node.classes['set_' + set.destK.dest_key] = set.destK.value;
                }else{
                    node.classes['set_' + set.destK.dest_key] = null;
                }
                El_SetStateStyle(node, node.templ);
            }else if(set.scope === 'as'){
                if(value){
                    const start_s = El_Name(node)

                    const asData = {}
                    asData[set.destK.key] = value;

                    El_MakeAs(setter.node, setter.node.parentNode, Data_Sub(asData));

                    framework._ctx.ev_trail.push('[setting '+ start_s + '.'+ node._idtag +' to ' + El_Name(node)+ ' because ' +set.destK.key+'='+value+']');
                }
            }else if(set.scope === 'if'){
                node.classes.ifCls = (!set.isMatch ? 'templ-hide-if' : null);
                El_SetStateStyle(node, node.templ);
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
            }if(setter.set.scope === 'if'){
                isMatch = Compare(value, setter.set.destK.key, setNode.vars[setter.set.destK.dest_key], setter.set.destK.comparison);
            }else if(setNode.vars && typeof setNode.vars[setterSet.destK.dest_key] !== 'undefined'){
                isMatch = setNode.vars[setterSet.destK.dest_key] === value;
            }

            if(isMatch == null || isMatch !== setter.isMatch){
                setter.isMatch = isMatch;
                El_RunSetter(setter, value);
                return true;
            }

            return false;
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
                ifKey: null,
                dataKey: null,
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
                    const spec = Spec_Parse('split');
                    const vspec = Spec_Parse('vsplit');
                    const map = Map_Make(att.value);

                    spec.mapVars = map;
                    vspec.mapVars = map;
                    templ.on.split = spec;
                    templ.on.vsplit = vspec;
                    templ.on.close = Spec_Parse('close');
                }else if(att.name == 'for'){
                    templ.forKey = att.value;
                }else if(att.name == 'base-style'){
                    templ.baseStyle = att.value;
                }else if(att.name == 'with'){
                    templ.forKey = att.value;
                    templ.childrenKey = att.value;
                }else if(att.name == 'if'){
                    templ.ifKey = Statements(att.value, GetDestK);
                    templ.setters.push({scope: 'if', destK: templ.ifKey});
                }else if(att.name == 'if-not'){
                    templ.forKey = att.value;
                    templ.childrenKey = att.value;
                }else if(att.name == 'class'){
                    templ.classes._misc = att.value.split(' ');
                }else if(att.name == 'init-class'){
                    templ.classes.state = att.value.split(' ');
                }else if(att.name == 'class-if'){
                    const classIfCond = Statements(att.value, GetDestK);
                    if(Array.isArray(classIfCond)){
                        for(let i = 0; i < classIfCond.length; i++){
                            templ.setters.push({scope: 'class', destK: classIfCond[i]});
                        }
                    }else{
                        templ.setters.push({scope: 'class', destK: classIfCond});
                    }
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
                ifKey: from_templ.ifKey || into_templ.ifKey,
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
                dataKey: null,
            };

            if(overrides && "dataKey" in overrides){
                templ.dataKey = overrides.dataKey;
            }else{
                templ.dataKey = from_templ.dataKey || into_templ.dataKey;
            }

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

            function copyExtObj(name){
                for(let k in from_templ[name]){
                    if(templ[name][k]){
                        templ[name][k] = [templ[name][k], from_templ[name][k]];
                    }else{
                        templ[name][k] = from_templ[name][k];
                    }
                }
                if(into_templ){
                    for(let k in into_templ[name]){
                        if(templ[name][k]){
                            templ[name][k] = [templ[name][k], into_templ[name][k]];
                        }else{
                            templ[name][k] = into_templ[name][k];
                        }
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
            copyExtObj('on');
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

            Style_ClsOverlay(templ.classes, null, from_templ.classes);
            if(into_templ && into_templ.classes){
                templ.classes._into_misc = into_templ.classes._misc;
            }

            /*
            console.log('Temple on ' + templ.classes, templ.on);
            console.log('Temple from.on ' + from_templ.nodeName, from_templ.on);
            console.log('Temple into.on ' + into_templ.name, into_templ);
            console.log(' --- ');
            */

            return templ;
        }

        /*
         * [Events Native and Synthetic]
        */
        function Split_Disables(l, h, spec){

            const disable = [];
            const splitSizeW = window.innerWidth / l;
            const splitSizeH = window.innerHeight / h;
            let updated = false;

            if(spec.mapVars.h){
                const minH = Number(spec.mapVars.h.key);
                if(!isNaN(minH) && (splitSizeH < minH)){
                    disable.push('vsplit');
                }
            }
            if(spec.mapVars.w){
                const minW = Number(spec.mapVars.w.key);
                if(!isNaN(minW) && (splitSizeW < minW)){
                    disable.push('split');
                }
            }

            return disable;
        }

        function Event_Run(event_ev){
            let r = false;
            if(framework._ctx.ev === null){
                framework._ctx.ev = event_ev;
            }

            if(event_ev.spec.key === 'ref'){
                const direction = event_ev.spec.direction;
                for(let k in event_ev.spec.mapVars){
                    const map = event_ev.spec.mapVars[k];
                    if(event_ev.vars[map.key]){
                        event_ev.spec = Spec_Parse(event_ev.vars[map.key]);
                        if(direction != DIRECTION_SELF){
                            event_ev.spec.direction = direction;
                        }
                    }
                }
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

            if(event_ev.dest && event_ev.dest !== event_ev.target){
                framework._ctx.ev_trail.push(El_Name(event_ev.target) + ' > ' + El_Name(event_ev.dest) + '[' + event_ev.spec.spec_s + ']');
            }else{
                framework._ctx.ev_trail.push(El_Name(event_ev.target) + '[' + event_ev.spec.spec_s + ']');
            }


            if(event_ev.spec.key === 'size'){
                if(event_ev.target === framework._ctx.root){
                    ChangeStyle(null, '.full-width', 'width', window.innerWidth + 'px');
                    ChangeStyle(null, '.full-height', 'height', window.innerHeight + 'px');
                }
            }else if(event_ev.spec.key === 'move'){
                /*
                console.log('move', event_ev);
                */
            }else if(event_ev.spec.key === 'split'){
                let par_node = event_ev.dest.parentNode;
                if((par_node.flags & FLAG_SPLIT) === 0){
                    const new_par = El_Make('view', par_node, Data_Sub({}), {
                        after: event_ev.dest 
                    });

                    w = El_SetSize(new_par, par_node, 'w');
                    El_SetSize(new_par, event_ev.dest, 'h');

                    new_par.flags |= FLAG_SPLIT;
                    new_par.appendChild(event_ev.dest);
                    new_par.classes.layout = ['split'];
                    new_par.varSetters = {};
                    new_par.varSetters['split-opts'] = par_node.varSetters['split-opts'];
                    new_par.vars['split-opts'] = null;
                    par_node = new_par;
                }

                const disables_li = Split_Disables(par_node.children.length+1, 1, event_ev.dest.templ.on.split);
                if(disables_li.length){
                    El_SetVar(par_node, 'split-opts', disables_li);
                }

                El_Make(event_ev.dest.templ, par_node, Data_Sub(event_ev.dest._ctx));
                for(let i = 0, l = par_node.children.length; i < l; i++){
                    const child = par_node.children[i];
                    El_SetSize(child, l, '/w');
                    El_SetSize(child, par_node, 'h');
                }


                splitCount++;

                return true;
            }else if(event_ev.spec.key === 'vsplit'){
                let par_node = event_ev.dest;
                let w = par_node.getBoundingClientRect().width;
                if((par_node.flags & FLAG_VSPLIT) === 0){
                    const new_par = El_Make('view', par_node.parentNode, Data_Sub({}), {
                        after: par_node 
                    });
                    new_par.templ.on.split = par_node.templ.on.split;
                    new_par.templ.on.vsplit = par_node.templ.on.vsplit;
                    new_par.templ.on.close = par_node.templ.on.close;

                    w = El_SetSize(new_par, par_node, 'w');
                    El_SetSize(new_par, par_node, 'h');

                    new_par.flags |= FLAG_VSPLIT;
                    new_par.appendChild(event_ev.dest);
                    new_par.classes.layout = ['vsplit'];
                    par_node = new_par;
                }

                El_Make(event_ev.dest.templ, par_node, Data_Sub(event_ev.dest._ctx));

                const cls_li = Split_Disables(1, par_node.children.length+1, event_ev.dest.templ.on.split);
                if(cls_li.length){
                    par_node.classes.vsplit = cls_li;
                    El_SetStateStyle(par_node, par_node.templ);
                }

                for(let i = 0, l = par_node.children.length; i < l; i++){
                    const child = par_node.children[i];
                    El_SetSize(child, l, '/h');
                    El_SetStyle(child, 'width', w + 'px');
                }

                splitCount++;

                return true;
            }else if(event_ev.spec.key === 'close'){
                if(splitCount <= 1){
                    return false;
                }
                const pane = event_ev.dest;
                let par_node = pane.parentNode; 

                if(pane._view){
                    if(pane._view.content._views[pane._idtag]){
                        delete pane._view.content._views[pane._idtag];
                    }
                }

                pane.remove();
                if((par_node.flags & FLAG_SPLIT)){
                    if(par_node.children.length === 0){
                        const sub_node = par_node;
                        par_node = par_node.parentNode;
                        sub_node.remove();
                        for(let i = 0, l = par_node.children.length; i < l; i++){
                            const child = par_node.children[i];
                            if(par_node.flags & FLAG_VSPLIT){
                                El_SetSize(child, l, '/h');
                            }
                            if(par_node.flags & FLAG_SPLIT){
                                El_SetSize(child, l, '/w');
                            }
                        }
                    }else{
                        for(let i = 0, l = par_node.children.length; i < l; i++){
                            const child = par_node.children[i];
                            El_SetSize(child, l, '/w');
                        }
                    }
                }

                if((par_node.flags & FLAG_VSPLIT)){
                    if(par_node.children.length === 0){
                        const sub_node = par_node;
                        par_node = par_node.parentNode;
                        sub_node.remove();
                        for(let i = 0, l = par_node.children.length; i < l; i++){
                            const child = par_node.children[i];
                            if(par_node.flags & FLAG_VSPLIT){
                                El_SetSize(child, l, '/h');
                            }
                            if(par_node.flags & FLAG_SPLIT){
                                El_SetSize(child, l, '/w');
                            }
                        }
                    }else{
                        for(let i = 0, l = par_node.children.length; i < l; i++){
                            const child = par_node.children[i];
                            El_SetSize(child, l, '/h');
                        }
                    }
                }

                par_node.classes.split = Split_Disables(par_node.children.length+1, 1,  pane.templ.on.split);
                par_node.classes.vsplit = Split_Disables(1, par_node.children.length+1, event_ev.dest.templ.on.split);
                El_SetStateStyle(par_node, par_node.templ);
                splitCount--;

                return true;
            }else if(event_ev.spec.key === 'style'){
                if(event_ev.eventType === 'hover'){
                    if(event_ev.spec.varIsPair){
                        El_SetStateStyle(event_ev.target, event_ev.target.templ, event_ev.spec.varList[0]);
                        r = true;
                    }
                }else if(event_ev.eventType === 'unhover'){
                    if(event_ev.spec.varIsPair){
                        El_SetStateStyle(event_ev.target, event_ev.target.templ, event_ev.spec.varList[1]);
                        r = true;
                    }
                }else{
                    const stateStyle = event_ev.target.classes && event_ev.target.classes.state[0];
                    const style = event_ev.spec.varList[0];
                    if(stateStyle !== style){
                        El_SetStateStyle(event_ev.target, event_ev.target.templ, style);
                        r = true;
                    }else{
                        r = false;
                    }

                }
                return r;
            }if(event_ev.spec.key === 'unhover'){
                if(event_ev.dest.templ && event_ev.dest.templ.on.hover){
                    sub_ev = {spec: event_ev.dest.templ.on.hover, target: event_ev.dest, eventType: "unhover"};
                }
            }else if(event_ev.spec.key === 'set'){
                var tg = event_ev.dest || event_ev.target;
                if(Object.keys(event_ev.spec.mapVars).length){
                    for(var k in event_ev.spec.mapVars){
                        r = El_SetVar(tg, k, event_ev.vars[k]);
                    }
                }else{
                    r = true;
                }
                if(event_ev.dest && event_ev.dest.templ.on.set){
                   sub_ev = {spec: event_ev.dest.templ.on.set, target: event_ev.dest};
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
                if(sub_ev && sub_ev.spec && Array.isArray(sub_ev.spec)){
                    for(let i = 0; i < sub_ev.spec.length; i++){
                        const spec = sub_ev.spec[i];
                        const merged_ev = Event_Merge({spec: spec, target: sub_ev.target}, event_ev);
                        const _r = Event_Run(merged_ev); 
                        if(_r !== undefined){
                            r = _r;
                        }
                    }
                }else{
                    const merged_ev = Event_Merge(sub_ev, event_ev)
                    const _r = Event_Run(merged_ev); 
                    if(_r !== undefined){
                        r = _r;
                    }
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
                node: node,
            };
        }

        function getDragAndContPos(node){
            let dragContainer = null;
            let el = node;
            let x = 0;
            let y = 0;
            do {
                if(el.flags && (el.flags & FLAG_DROP_TARGET)){
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
                    node: dragContainer,
                }
            }else{
                console.warn('drag container not found');
                return null;
            }
        }

        function Event_SetDragContPos(node){
            if(node._view){
                if((node.flags & FLAG_DRAG_CONT_CALCULATED) == 0){
                    node.flags |= FLAG_DRAG_CONT_CALCULATED;
                    const v = node._view;
                    for(let i = 0; i <  v.el_li.length; i++){
                        let elObj = v.el_li[i];
                        elObj.pos = getDragPos(elObj.el);
                    }
                    /*
                    console.log('[Event_SetDragContPos] el_li', node._view.el_li);
                    */
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

        function Event_DragTargetCalc(drag_ev){
            const e = drag_ev.e;
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
                    if(cont.node !== drag_ev.props.cont.node){
                        drag_ev.props.cont = cont;
                        Event_SetDragContPos(cont.node);
                    }
                }
            }

            // outside the bounds of any drop container
            if(!drag_ev.props.cont){
                return; 
            }

            let dragView_li = drag_ev.props.cont.node._view.el_li;
            for(let i = 0; i < dragView_li.length; i++){
                let t = dragView_li[i];

                if(t.el === current){
                    wasCurrent = t;
                    wasCurrent_i = i;
                    drag_ev.props.current_idx = i;
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
                    return {idx: i, node: t.el, content_idtag: t.el._content_idtag, current: {idx: wasCurrent_i, node: wasCurrent}};
                }
            }

            return null;
        }


        function Event_SetupDrag(event_ev, dragObj){
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
                dragContainer = dragPos.node;
                Event_SetDragContPos(dragContainer);
            }else{
                console.warn('unable to get drag container');
                return null;
            }

            let place = document.createElement('SPAN');
            swap(node, place);
            dragVessel.appendChild(node);

            let viewSet = dragContainer._view;
            let containers = [];
            for(let k in viewSet.content._views){
                const cont_node = viewSet.content._views[k].container;
                containers.push({
                    node: cont_node,
                    pos: getDragPos(cont_node)
                });
            }

            let clientX = e.clientX;
            let clientY = e.clientY;
            if("_touch" in framework){
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }

            event_ev.props = {
                w:w,
                h:h,
                x:x,
                y:y,
                offsetX: clientX - x,
                offsetY: clientY - y,
                vessel: dragVessel,
                place: place,
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


            Event_SetSpacer(framework._drag);
            dragVessel.appendChild(node);

            debug('Setup props offsetX' + event_ev.props.offsetX, Object.keys(event_ev.props).join(', '), COLOR_GREY);
        }

        function Event_DragRelease(event_ev){
            if(framework._drag.onto){
                console.log('DRAG [release] drop onto', framework._drag);
            }

            swap(event_ev.props.place, event_ev.target);
            if(framework._drag.ev){
                const drag_ev = framework._drag.ev;

                const orig = {
                        idx: drag_ev.props.current_idx,
                        node: drag_ev.target,
                        content_idtag: drag_ev.target._content_idtag,
                }

                const complete = function(){
                    drag_ev.props.cont.node.flags &= ~FLAG_DRAG_CONT_CALCULATED;
                    Event_SetDragContPos(drag_ev.props.cont.node);
                    Changes_Add(this, framework.changes);
                }

                const trans = Transaction_New(drag_ev.props.cont.node._view.content, 
                    'move', 
                    orig,
                    drag_ev.props.onto, 
                    complete);

                Transaction_Register(trans)
                framework._drag.ev = null;
            }

            Event_CloseCurrentSpacer(framework._drag);
        }

        function Event_CloseCurrentSpacer(dragObj){
            if(dragObj.spacers._current){
                El_Destroy(dragObj.spacers._current);
                dragObj.spacers._current = null;
            }
        }

        function Event_SetSpacer(dragObj){
            Event_CloseCurrentSpacer(dragObj);
            if(dragObj.ev.props.onto){
                dragObj.spacers._current = El_Make(dragObj.spacer_templ,
                    dragObj.ev.props.cont.node,
                    Data_Sub({}),
                    {after: dragObj.ev.props.onto.node}
                );

                El_SetStyle(dragObj.spacers._current, 'height', dragObj.ev.props.h + 'px');
                El_SetStyle(dragObj.spacers._current, 'width', dragObj.ev.props.w + 'px');

            }else{
                dragObj.spacers._current = El_Make(dragObj.spacer_templ,
                    dragObj.ev.props.cont.node,
                    Data_Sub({}),
                    {after: dragObj.ev.target}
                );

                El_SetStyle(dragObj.spacers._current, 'height', dragObj.ev.props.h + 'px');
                El_SetStyle(dragObj.spacers._current, 'width', dragObj.ev.props.w + 'px');
            }
        }

        function Event_UpdateDrag(event_ev){
            let x = 0;
            let y = 0;

            if(event_ev.e.touches){
                x = event_ev.e.touches[0].clientX - event_ev.props.offsetX;
                y = event_ev.e.touches[0].clientY - event_ev.props.offsetY;
            }else{
                x = event_ev.e.clientX - event_ev.props.offsetX;
                y = event_ev.e.clientY - event_ev.props.offsetY;
            }

            El_SetStyle(event_ev.props.vessel, 'top', y + 'px');
            El_SetStyle(event_ev.props.vessel, 'left', x + 'px');

            const dropObj = Event_DragTargetCalc(event_ev);
            if(dropObj && 
                    (!framework._drag.ev.props.onto || dropObj.idx !== framework._drag.ev.props.onto.idx) &&
                    dropObj.node !== event_ev.target){
                framework._drag.ev.props.onto = dropObj;
                Event_SetSpacer(framework._drag);
            }
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
                LogCtx('Event (Drag) ');
            }
            e.stopPropagation(); e.preventDefault();
        }

        function onDrop(e){
            var node = this;
            let r = false;
            ResetCtx({ev: null});
            if(node.templ && node.templ.on.drop){
                r = Event_Run(Event_New(node, e, node.templ.on.drop));
                LogCtx('Event (Drop) ');
            }
            e.stopPropagation(); e.preventDefault();
        }

        function onMove(e){
            if(framework._drag.ev){
                framework._drag.ev.e = e;
                Event_UpdateDrag(framework._drag.ev);
            }
        }

        function onTouchTiming(){
            ResetCtx({ev: null});
            const node = this;
            if(framework._touch.inter >= 0){
                clearTimeout(framework._touch.inter);
            }
            framework._touch.inter = -1;

            const e = framework._touch.started.pop();
            LogCtx('Event (TouchTiming '+El_Name(node) +')' +(typeof e));
            framework._touch.started = [];
            if(e){
                if(node.templ && node.templ.on.drag){
                    onDrag.call(node, e);
                    if("_touch" in framework){
                        if(framework._touch.mv_node){
                            framework._touch.mv_node.ontouchmove = null;
                        }
                        node.ontouchmove = onMove;
                        framework._touch.mv_node = node;
                    }
                }
            }
        }

        function onTouchEnd(e){
            ResetCtx({ev: null});
            if(framework._touch.inter >= 0){
                clearTimeout(framework._touch.inter);
            }
            framework._touch.inter = -1;

            const node = this;
            LogCtx('Event (TouchEnd '+El_Name(node)+')');

            if(framework._touch.started.length){
                const e = framework._touch.started.pop();
                framework._touch.started = [];
                onUp.call(node, e);
                e.stopPropagation(); e.preventDefault();
            }
            if(framework._touch.mv_node){
                framework._touch.mv_node.ontouchmove = null;
            }
        }

        function onTouchStart(e){
            ResetCtx({ev: null});
            if(framework._touch){
                framework._touch.started.push(e);
            }
            const node = this;
            if(node.templ && node.templ.on.click){
                const ev = Event_New(node, e, node.templ.on.click);
                r = Event_Run(ev);
                LogCtx('Event (TouchStart - click '+El_Name(node)+ ' '+ r +')');
                if(r){
                    e.stopPropagation(); e.preventDefault();
                }
            }
            if(node.templ && node.templ.on.touch){
                const ev = Event_New(node, e, node.templ.on.touch);
                r = Event_Run(ev);
                LogCtx('Event (TouchStart '+El_Name(node)+')');
                if(r){
                    e.stopPropagation(); e.preventDefault();
                }
            }

            if(node.templ && node.templ.on.drag){
                framework._touch.inter = setTimeout(onTouchTiming.bind(this), DELAY_DRAG_START);
                e.stopPropagation(); e.preventDefault();
            }
        }

        function onDown(e){
            // detect right click
            if (typeof e.button !== 'undefined' && e.button !== 0){
                 return;
            } else if(typeof e.which !== 'undefined' && e.which === 3){
                 return;
            }

            var node = this;
            let r = false;
            ResetCtx({ev: null});
            if(node.templ && node.templ.on.mousedown){
                r = Event_Run(Event_New(node, e, node.templ.on.mousedown));
                LogCtx('Event (Down) ');
            }
            if(node.templ && node.templ.on.click){
                const ev = Event_New(node, e, node.templ.on.click)
                r = Event_Run(ev);
                LogCtx('Event (Click) ');
            }
            if(node.templ && node.templ.on.drag){
                r = onDrag.call(node, e);
            }
            if(r){
                e.stopPropagation(); e.preventDefault();
            }
        }

        function onResize(e){
            var node = this;
            let r = false;
            ResetCtx({ev: null});
            if(node.templ && node.templ.on.resize){
                r = Event_Run(Event_New(node, e, node.templ.on.resize));
                LogCtx('Event (Resize) ');
            }
            e.stopPropagation(); e.preventDefault();
        }

        function onUp(e){
            ResetCtx({ev: null});
            var node = this;
            if(node.templ && node.templ.on.mouseup){
                r = Event_Run(Event_New(node, e, node.templ.on.mouseup));
                LogCtx('Event (Up) ');
            }
            if(node.templ && node.templ.on.drop){
                r = onDrop.call(node, e);
            }

            if(framework._drag.ev){
                Event_DragRelease(framework._drag.ev);
                LogCtx('Event (DragRelease)');
            }
            e.stopPropagation(); e.preventDefault();
        }

        function onScroll(e){
            var node = this;
            if(node.templ && node.templ.on.drop && node._viewRef){
                const container = node._viewRef.container;
                container.flags &= ~FLAG_DRAG_CONT_CALCULATED;
                Event_SetDragContPos(container);
            }
        }

        function onHover(e){
            ResetCtx({ev: null});
            var node = this;

            if(("_touch" in framework) && ("_hoverbound" in node)){
                node._hoverbound++;
                framework._touch.hover[node._idtag] = node;
            }

            if(node.flags & FLAG_NODE_STATE_HOVER){
                return;
            }
            node.flags |= FLAG_NODE_STATE_HOVER;
            if(node.templ && node.templ.on.hover){
                if("_hoverbound" in node){
                    node._hoverbound++;
                }
                node.classes.hover = 'hover';
                Event_Run(Event_New(node, e, node.templ.on.hover, 'hover'));
            }
        }

        function onUnHover(e){
            ResetCtx({ev: null});
            let node = this;

            if(("_touch" in framework)){
                for(let k in framework._touch.hover){
                    const n =  framework._touch.hover[k];
                    n._hoverbound--;
                    if(n._hoverbound <= 0){
                        delete framework._touch.hover[node._idtag];
                        if(n != node){
                            onUnHover.call(n, e);
                        }
                    }
                }
                if(node._hoverbound > 0){
                    return;
                }
            }

            debug('unhover RUN <' + ((this.templ && this.templ.name) || this.nodeName) + '>' + node._hoverbound);

            if((node.flags & FLAG_NODE_STATE_HOVER) == 0){
                return;
            }
            node.flags &= ~FLAG_NODE_STATE_HOVER;
            if(node.templ && node.templ.on.hover){
                node.classes.hover = null;
                Event_Run(Event_New(node, e, node.templ.on.hover, 'unhover'));
                if(!("_touch" in framework)){
                    e.stopPropagation(); e.preventDefault();
                }
            }
        }

        function El_SetEvents(node, events){
            if(events.mousedown || events.click || events.drag){
                if(typeof framework._touch !== 'undefined'){
                    if(!node._touchbound){
                        node.addEventListener('touchstart', onTouchStart, true);
                        node.addEventListener('touchend', onTouchEnd, true);
                        node._touchbound = true;
                    }
                }else{
                    node.onmousedown = onDown;
                }
            }
            if(events.touch && ("_touch" in framework)){
                node.addEventListener('touchstart', onTouchStart, true);
                node.addEventListener('touchend', onTouchEnd, true);
            }
            if(events.mouseup || (node.flags & FLAG_DRAG_TARGET)){
                node.onmouseup = onUp;
            }
            if(events.resize){
                node.onresize = onResize;
            }

            if(events.hover){
                if(!events.click && ("_touch" in framework)){
                    // no action
                }else{
                    node.onmouseover = onHover;
                    node.onmouseout = onUnHover;
                }
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
                let w = window.innerWidth-1;
                const rect = node.getBoundingClientRect().width;
                if( rect.width < w){
                    w = rect.width-1;
                }
                El_SetStyle(node, 'width', (w / arg) + 'px');
                return (w / arg);
            }else if(unit === '/h'){
                let h = window.innerHeight-1;
                El_SetStyle(node, 'height', (h / arg) + 'px');
                return (h / arg);
            }else if (unit === 'w'){
                if(arg && arg.nodeType === Node.ELEMENT_NODE){
                    const rect = arg.getBoundingClientRect();
                    El_SetStyle(node, 'width', rect.width + 'px');
                    return rect.width;
                }
            }else if (unit === 'h'){
                if(arg && arg.nodeType === Node.ELEMENT_NODE){
                    const rect = arg.getBoundingClientRect();
                    El_SetStyle(node, 'height', rect.height + 'px');
                    return rect.width;
                }
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
            if(templ.name){
                classes.templ = templ.name.toLowerCase();
            }

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

            node.classes.state = classes.state;

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
                if(classList[i]){
                    node.classList.add(classList[i]);
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
            dest._misc = dest._misc || [];
            for(let k in from){
                if(k == '_misc'){
                    dest[k] = dest[k].concat(from[k]);
                }else{
                    dest[k] = from[k];
                }
            }
            if(into){
                for(let k in into){
                    if(k == '_misc'){
                        dest[k] = dest[k].concat(into[k]);
                    }else{
                        dest[k] = into[k];
                    }
                }
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
            content._changes = {
                pending: [],
                done: []
            };
            content._views = {};
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
         * [Transactions and Changes]
         */

         function Transaction_New(content, type, origObj, newObj, complete){
            return {
                content:content,
                changeType: type,
                origObj: origObj,
                newObj: newObj,
                complete: complete
            };
         }

         function Transaction_Register(trans){
            trans.content._changes.pending.push(trans);
            Content_Transact(trans.content);
         }

         function El_CompareContent(node, content){
            return node._content_idtag && node._content_idtag === content._idtag;
         }

         function _Transaction_CheckAlignment(view){
            let el = view.container.firstChild;
            for(let i = 0; el && i < content.length; /* in body */){
                if(el.nodeType === Node.ELEMENT_NODE && el.flags & FLAG_DRAG_TARGET){
                    if(el._content_idtag !== content[i]._idtag){
                        console.error('_Transaction_CheckAlignment: nodes do not align to content ' + i + ' ' +el._content_idtag + ' vs ' + content[i]._idtag + ' "' + el.innerHTML + '"', content);
                        break;
                    }
                    if(el !== view.el_li[i].el){
                        console.error('_Transaction_CheckAlignment: ei_li does not align ' + i + ' ' + el._idtag + ' vs ' + view.el_li[i].el._idtag + ' "'+ el.innerHTML + '" ', view.el_li);
                        break;
                    }
                    i++;
                }

                el = el.nextSibling;
            }
         }

         function Transaction_ModifyView(trans, view){
            const startIdx = trans.origObj.idx;
            let endIdx = trans.newObj.idx;
            if(startIdx == endIdx){
                return true;
            }

            if(endIdx < startIdx){
                endIdx++;
            }

            const item = view.el_li.splice(startIdx, 1);
            view.el_li.splice(endIdx, 0, item[0]);

            return true;
         }

         function Transaction_ModifyNodes(trans, view){
            let el = view.container.firstChild;
            let start_el = el;
            const startIdx = trans.origObj.idx;
            let endIdx = trans.newObj.idx;

            if(startIdx == endIdx){
                return true;
            }

            let moveNode = null;
            let r = false;
            for(idx = 0; el && idx <= startIdx; /* incr in body */){
                if(el.nodeType == Node.ELEMENT_NODE && (el.flags & FLAG_DRAG_TARGET)){
                    if(idx === startIdx){
                        moveNode = el;
                        break;
                    }
                    idx++;
                }

                el = el.nextSibling;
            }

            if(!moveNode){
                console.warn('Transaction_ModifyNodes: did not find node to move', startIdx);
                return false;
            }

            el = start_el;
            for(idx = 0; el && idx <= endIdx; /* incr in body */){
                if(el.nodeType == Node.ELEMENT_NODE && (el.flags & FLAG_DRAG_TARGET)){
                    if(idx === endIdx){
                        el.parentNode.insertBefore(moveNode, el.nextSibling);
                        r = true;
                    }
                    idx++;
                }

                el = el.nextSibling;
            }

            Transaction_ModifyView(trans, view);
            return r;
         }

         function Transaction_ModifyNodes(trans, view){
            let el = view.container.firstChild;
            let start_el = el;
            const startIdx = trans.origObj.idx;
            let endIdx = trans.newObj.idx;

            if(startIdx == endIdx){
                return true;
            }

            let moveNode = null;
            let r = false;
            for(idx = 0; el && idx <= startIdx; /* incr in body */){
                if(el.nodeType == Node.ELEMENT_NODE && (el.flags & FLAG_DRAG_TARGET)){
                    if(idx === startIdx){
                        moveNode = el;
                        break;
                    }
                    idx++;
                }

                el = el.nextSibling;
            }

            if(!moveNode){
                console.warn('Transaction_ModifyNodes: did not find node to move', startIdx);
                return false;
            }

            el = start_el;
            for(idx = 0; el && idx <= endIdx; /* incr in body */){
                if(el.nodeType == Node.ELEMENT_NODE && (el.flags & FLAG_DRAG_TARGET)){
                    if(idx === endIdx){
                        el.parentNode.insertBefore(moveNode, el.nextSibling);
                        r = true;
                    }
                    idx++;
                }

                el = el.nextSibling;
            }

            Transaction_ModifyView(trans, view);
            return r;
         }

         function Transaction_AddNodes(trans, view){
            const node = El_Make(trans.newObj, view.container, Data_Sub(trans.origObj));
            if(node){
                return true;
            }
            return false;
         }
         function Transaction_AddContent(trans){
            trans.content.push(trans.origObj);
            return true;
         }

         function Transaction_ModifyContent(trans){
            const startIdx = trans.origObj.idx;
            let endIdx = trans.newObj.idx;
            if(startIdx == endIdx){
                return true;
            }

            if(endIdx < startIdx){
                endIdx++;
            }

            const item = trans.content.splice(startIdx, 1);
            trans.content.splice(endIdx, 0, item[0]);

            return true;
         }

         function Content_Transact(content){
            if(!content._transacting){
                content._transacting = true;
                for(let i = 0; i < content._changes.pending.length;/* no increment unless there is an error */){
                    let r = true;
                    const trans = content._changes.pending[i];
                    if(trans.changeType === 'add'){
                        r = Transaction_AddContent(trans); 
                        if(r){
                            for(let k in content._views){
                                Transaction_AddNodes(trans, content._views[k]); 
                            }
                        }
                    }else if(trans.changeType === 'move'){
                        r = Transaction_ModifyContent(trans); 
                        if(r){
                            for(let k in content._views){
                                Transaction_ModifyNodes(trans, content._views[k]); 
                                _Transaction_CheckAlignment(content._views[k]);
                            }
                        }
                    }
                        if(r){
                       content._changes.pending.splice(i, 1); 
                       content._changes.done.push(trans);
                       trans.execTime = Date.now();
                       if(trans.complete){
                            trans.complete();
                       }
                    }else{
                        if(!("failTimes" in trans)){
                            trans.failTimes = [];
                        }
                       trans.failTimes.push(Date.now());
                       i++;
                    }
                }
                content._transacting = false;
            }else{
                setTimeout(function(){
                    Content_Transact(content);
                }, TRANS_RETRY);
            }
         }
         
         function Content_FindByTag(content, tag){
            for(let i = 0; i < content.length; i++){
                if(tag === content[i]._idtag){
                    return content[i];
                }
            }

            return null;
         }

         function Changes_Add(trans, changes){
             if(changes){
                changes.push({
                    time: (new Date(trans.execTime)).toISOString(),
                    type: trans.changeType,
                    target: Content_FindByTag(trans.content, trans.origObj.content_idtag).text,
                    dest: Content_FindByTag(trans.content, trans.newObj.content_idtag).text,
                });
                Transaction_Register(
                    Transaction_New(changes, 'add', changes[changes.length-1], 'change-log')
                );
                framework._ctx.ev_trail.push('Transaction:'+content._idtag+'['+trans.changeType+' '+trans.origObj.idx+' to '+trans.newObj.idx+']'); 
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
        function El_Make(templ, parent_el, ctx, reuse){
            /* Begin by sorting out which template or combination of templates to use */
            let isTemplNodeName = false;
            if(typeof templ === 'string'){
                templ = framework.templates[templ.toUpperCase()];
            }

            if(!templ){
                console.warn('El_Make no templ', templ);
                return;
            }

            let reuseNode = null;
            let reuseType = 0;
            if(reuse){
                if(reuse.nodeType === Node.ELEMENT_NODE){
                    reuseNode = reuse;
                }else if(reuse.after){
                    reuseNode = reuse.after;
                    reuseType = REUSE_AFTER;
                }else if(reuse.before){
                    reuseNode = reuse.before;
                    reuseType = REUSE_BEFORE;
                }
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
            console.log('El_Make ctx', ctx);
            */

            if(templ.on.split){
                const cls_li = Split_Disables(parent_el.children.length+2, 1, templ.on.split);
                if(cls_li.length){
                    parent_el.classes.split = cls_li;
                    El_SetStateStyle(parent_el, parent_el.templ);
                }
                if(typeof parent_el.vars['split-opts'] === 'undefined'){
                    parent_el.vars['split-opts'] = null;
                }
            }

            if(templ.dataKey){
                if(templ.dataKey.var_direction === DIRECTION_GLOBAL){
                    const content = Data_Sub(ctx, templ.dataKey.key_props, [DIRECTION_GLOBAL]);
                    if(content){
                        ctx = Data_Push(ctx, templ.dataKey.dest_key, content.data);
                    }
                }else{
                    const compare = {
                        vars: templ.dataKey.key,
                        name: templ.dataKey.key_source,
                        _tries: 2,
                    };
                    const source_el = El_Query(parent_el, {direction: templ.dataKey.var_direction},  compare);
                    if(source_el && source_el.vars[templ.dataKey.key]){
                        const data = {};
                        const content = source_el.vars[templ.dataKey.key];
                        data[templ.dataKey.dest_key] = content;
                        ctx = Data_Sub(data);
                    }
                }
            }

            /* Now handle if the element has an attirbute that makes it a bunch of children 
             * instead of a single elemenet
             */
            if(forKey){
                let subCtx;

                if(subCtx = Data_Sub(ctx, forKey)){
                    const par_templ = templ;

                    if(typeof subCtx.data._views !== 'undefined'){
                        const cont_el = El_Make("drop-container", parent_el, ctx);

                        const content = subCtx.data;

                        const dropTarget = El_Query(cont_el, {direction: DIRECTION_PARENT}, [
                            {on: "drop"},
                        ]);

                        view = {
                            content: content,
                            dataKey: forKey,
                            container: cont_el,
                            dropTarget: dropTarget,
                            onDrop: dropTarget && dropTarget.templ.on.drop,
                            el_li: [],
                        };

                        if(dropTarget){
                            dropTarget.onscroll = onScroll;
                            dropTarget._viewRef = view;
                            cont_el.flags |= FLAG_DROP_TARGET;
                        }

                        cont_el._view = view;
                        ctx.view = view;
                        content._views[cont_el._idtag] = view;

                        El_SetStyle(cont_el, 'position', 'relative');
                        parent_el = cont_el;
                    }

                    let subData;
                    while(subData = Data_Next(subCtx)){
                        let sub_templ = null;
                        if(par_templ.asKey){
                            const templ_s = Cash(par_templ.asKey.key, subData.data).result;
                            sub_templ = framework.templates[templ_s.toUpperCase()];
                        }

                        if(sub_templ){
                            sub_templ = Templ_Merge(par_templ, sub_templ, {dataKey: null});
                        }else{
                            sub_templ = Templ_Merge(null, par_templ);
                        }

                        El_Make(sub_templ, parent_el, subData);
                    }
                }else{
                    /*
                    console.warn('Warning: for children key not found '+ forKey, ctx);
                    console.warn('Warning: for children key not found templ', templ);
                    console.warn('Warning: for children key not framework', framework);
                    */
                }
                return;
            }

            /* Begin makeing the actual node 
             */
            const node = (!reuseType && reuseNode) || document.createElement(templ.nodeName);

            node.vars = {};
            node.flags = templ.flags;
            node._idtag = 'element_'+(++framework.el_idx);
            node.classes = {};

            /*
            console.warn('El_Make' + node._idtag, ctx);
            */

            node.varSetters = {};
            node.templ = templ;
            if(templ.on.split){
                node._ctx = ctx;
            }

            if(!reuseNode){
                parent_el.appendChild(node);
            }else if(reuseType === REUSE_AFTER){
                reuseNode.parentNode.insertBefore(node, reuseNode.nextSibling);
            }else if(reuseType === REUSE_BEFORE){
                reuseNode.parentNode.insertBefore(node, reuseNode);
            }

            if(templ.on.split && parent_el.children.length === 1){
                El_SetSize(node, 1, '/w');
                El_SetSize(node, 1, '/h');
            }

            if(parent_el._view && (node.flags & FLAG_DRAG_TARGET)){
                parent_el._view.el_li.push({el:node, pos: null});
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
                let order = null;
                let value = null;
                if(map.var_direction === DIRECTION_GLOBAL){
                    value = Data_Search(ctx, map.key_props, [DIRECTION_GLOBAL]);
                }else{
                    value = Data_Search(ctx, map.key, [DIRECTION_DATA, DIRECTION_VARS]);
                }

                if(value && value.value){
                    node.vars[map.dest_key] = value.value;
                    if(value.type !== 'vars'){
                        ctx.vars[map.dest_key] = value.value;
                    }
                }else{
                    node.vars[map.dest_key] = null;
                    /*
                    console.warn('El_Make: no var found for: ' + map.key, map);
                    console.warn('El_Make: no var found for: ' + map.key + ' ctx:', ctx);
                    console.warn('El_Make: no var found for: ' + map.key + ' node:', node);
                    */
                }
            }

            /* In-depth setup starts now, this is listeners and fnction/handler bindings
               as well as updating syles based on data
            */

            Templ_SetFuncs(templ, framework.funcs);
            El_SetStateStyle(node, templ);
            if(!reuseNode || (!reuseNode.nodeType)){
                El_SetEvents(node, templ.on);
                El_SetEvents(node, templ.funcs);
                El_RegisterSetters(node, templ);
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
                
                let val = Data_Search(ctx, name,  [DIRECTION_DATA, DIRECTION_VARS]).value;
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

        function El_Name(el){
            // return ((el.templ && el.templ.name.toLowerCase()) || el.nodeName.toLowerCase() || 'El') + '.' + (el._idtag || '');
            return ((el.templ && el.templ.name && el.templ.name.toLowerCase()) || el.nodeName.toLowerCase() || 'El');
        }

        function El_Destroy(node){
            node.remove();
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
                    const content = source_el.vars[templ.dataKey.key];
                    data[templ.dataKey.key] = content;
                    ctx = Data_Sub(data);
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
            node.classes = {};
            
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
        if(!("_styleSheets" in framework)){
            framework._styleSheets = {};
        }
        if(!GetstyleSheet(null)){
            const sheet = document.createElement('style');
            document.head.appendChild(sheet);
        }

        if(!("data" in framework)){
            framework.dataCtx = Data_Sub({});
        }

        if(!("funcs" in framework)){
            framework.funcs = {};
        }
        if(!("content" in framework)){
            framework.content = {};
        }
        if(!("templates" in framework)){
            framework.templates = {};
        }

        if(!!('ontouchstart' in window)){
            framework._touch = {started: [], inter: -1, hover: {}}; 
        }

        if(!("_drag" in framework)){
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
                spacers: {},
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
        AddStyle(null, '.templ-hide-if{ display: none !important;}');

    }catch(e){
        debug('ERROR: ' + String(e), null, COLOR_RED);
        throw e;
    }

    /* Amend relevant public properties to the framework object */
    framework.content_idx = 0;
    framework.el_idx = 0;
    framework.Make = Make;
    framework.Injest = Injest;
    framework.Cash = Cash;
    framework.ChangeStyle = ChangeStyle;
    framework.AddStyle = AddStyle;
    framework.AddStyle = AddStyle;
    framework.Data_Set = Data_Set;
    framework.Debug_SetEl = Debug_SetEl;
}
