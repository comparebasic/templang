/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Events Native and Synthetic]
*/

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

