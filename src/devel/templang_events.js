/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation
*/

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

        return event_ev;
    }
