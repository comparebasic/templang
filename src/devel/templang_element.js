/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation
*/

    /* 
     * [Core Functions For Element Creation]
     */

    /*   This the main way of making an element internally
     *
     *   @templ - this is the template string or object to create
     *   @parent_el - this is the element that it will be placed inside of
     *   @reuseNode - this is only used for internal updates
     */
    function El_Make(templ, parent_el, reuseNode){

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
        if(framework.templates[templ.nodeName.toUpperCase()]){
            Data_Search(templ.nodeName.toLowerCase(), true, [DIRECTION_DATA]);
            forKey = templ.forKey;
            parent_templ = framework.templates[templ.nodeName.toUpperCase()];
            if(parent_templ){
                templ = Templ_Merge(templ, parent_templ);
            }
        }


        let data = framework._ctx.data;
        if(!templ){
            console.warn('El_Make no templ', templ);
            return;
        }

        /* Now handle if the element has an attirbute that makes it a bunch of children 
         * instead of a single elemenet
         */
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

        /* Begin makeing the actual node 
         */
        const node = reuseNode || document.createElement(templ.nodeName);

        node.vars = {};
        node.varSetters = {};
        node.templ = templ;
        node._idtag = 'element_'+(++framework.el_idx);
        if(!reuseNode){
            parent_el.appendChild(node);
        }

        /* if the data comes from an injested data source, store the flag here
         */
        if(data._idflag){
            node._content_idflag = data._idflag;
        }

        /* Copy vars in from the data to this element */
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
        El_SetStateStyle(node, templ, null, false);
        if(!reuseNode){
            El_SetEvents(node, templ.on);
            El_SetEvents(node, templ.funcs);
            El_RegisterSetters(node, templ);
        }

        /* Copy in the body if it's there, Cash is used for templating values 
         * from the data */
        const body = Cash(templ.body, data).result;
        if(body){
            node.appendChild(document.createTextNode(body));
        }

        /* _misc has every non-templang html property for the elements
         * it looks at the data for these to see if they include variables
         * otherwise they are placed as literals of what they were 
         * in the templates
         */
        for(var k in templ._misc){
            const val = Cash(templ._misc[k], data).result;
            node.setAttribute(k, val);
        }

        /* Make children the same was as this, recursively if they were
         * part of the original template 
         */
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
        ResetCtx({data: data, ev: null}); 
        El_Make(name, root_el);
    }
