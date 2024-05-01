/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Core Functions For Element Creation]
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
                }else if(reuse.shift){
                    reuseType = REUSE_SHIFT;
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

                if(subCtx = Data_Sub(ctx, forKey, null, templ.dataKey)){
                    const par_templ = templ;

                    if(templ.updateKey){
                        
                        subCtx.data._views = subCtx.data._views || {};
                        subCtx.data._changes = subCtx.data._changes || {
                            pending: [],
                            done: []
                        };

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
                            updateKey: templ.updateKey,
                            el_li: [],
                            templ: templ,
                        };

                        if(dropTarget){
                            dropTarget.onscroll = onScroll;
                            dropTarget._viewRef =  dropTarget._viewRef || [];
                            dropTarget._viewRef.push(view);
                            cont_el.flags |= FLAG_DROP_TARGET;
                        }

                        cont_el._view = view;
                        cont_el._dropKey = templ.updateKey;
                        ctx.view = view;
                        content._views[cont_el._idtag] = view;
                        framework._drag.byName[templ.updateKey] = framework._drag.byName[templ.updateKey] || {};
                        framework._drag.byName[templ.updateKey][cont_el._idtag] = {
                            node: cont_el,
                            pos: getDragPos(cont_el),
                            view: view,
                        };

                        El_SetStyle(cont_el, 'position', 'relative');
                        parent_el = cont_el;
                    }

                    let subData;
                    while(subData = Data_Next(subCtx)){
                        El_MakeChild(par_templ, parent_el, subData);
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
                if(reuseType === REUSE_SHIFT){
                    parent_el.parentNode.insertBefore(node, parent_el.parentNode.firstChild);
                }else{
                    parent_el.appendChild(node);
                }
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
                }else if(map.var_direction === DIRECTION_PARENT){
                    const source = El_Query(node,
                        {direction: map.var_direction}, {vars: map.key});
                    if(source && source.vars[map.key]){
                        value = {value: source.vars[map.key], type: 'elem'};
                    }
                }else{
                    value = Data_Search(ctx, map.key, [DIRECTION_DATA, DIRECTION_VARS]);
                    /* TODO:
                    if(map.key === 'page'){
                        console.log(El_Name(node) + ' Searched for ' + kv_toString(value.value) + ' from ' +map.key, framework._ctx.vars);
                    }
                    */
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

        function El_MakeChild(templ, parent_el, ctx, reuse){
            let sub_templ = null;
            if(templ.asKey){
                const templ_s = Cash(templ.asKey.key, ctx.data).result;
                sub_templ = framework.templates[templ_s.toUpperCase()];
            }

            if(sub_templ){
                sub_templ = Templ_Merge(templ, sub_templ, {dataKey: null});
            }else{
                sub_templ = Templ_Merge(null, templ);
            }

            return El_Make(sub_templ, parent_el, ctx, reuse);
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
            View_Destroy(node);
            
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
