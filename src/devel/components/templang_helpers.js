/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Helper Functions]
*/
        /*
         * [Helper Functions]
         */

        function kv_toString(obj){
            let s = '';
            if(obj === null){
                return 'null';
            }
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
                    return dest !== value;
                }else{
                    return dest === value;
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

