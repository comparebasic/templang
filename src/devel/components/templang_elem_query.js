/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Elem Query and Match]
*/

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
                if(!compare.name && !compare.vars && !compare.drop){
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

                if(match && compare.drop){
                    if(node._dropKey !== compare.drop){
                        match = false;
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

