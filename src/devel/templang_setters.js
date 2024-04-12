/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation
*/

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
