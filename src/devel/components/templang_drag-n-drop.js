/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Drag-n-drop Setup]
*/

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

            const rect = node.getBoundingClientRect();

            return {
                node: node,
                x: x,
                y: y,
                w: rect.width,
                h: rect.height
            };
        }

        function PosObj_SetCached(posObj){
            if(!(posObj.node.flags & FLAG_SIZE_CALCULATED)){
                posObj.pos = getDragPos(posObj.node);
                posObj.node.flags |= FLAG_SIZE_CALCULATED;
            }
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
                    if(node.getBoundingClientRect().height == 0){
                        return;
                    }
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

        function Event_CheckCountBounds(drag_ev, cont, mouseY, mouseX){
            if(cont.node.getBoundingClientRect().height == 0){
                return false;
            }

            PosObj_SetCached(cont);

            let t = cont;
            let rect = {
                startX: t.pos.x,
                startY: t.pos.y,
                endX: t.pos.x + t.pos.w,
                endY: t.pos.y + t.pos.h
            };

            if((mouseY >= rect.startY && mouseY <= rect.endY) &&
                (mouseX >= rect.startX && mouseX <= rect.endX)
            ){
                if(cont.node !== drag_ev.props.cont.node){
                    return true;
                }
            }
            return false;
        }

        function Event_DragTargetCalc(drag_ev){
            const e = drag_ev.e;
            let mouseY = e.clientY;
            let mouseX = e.clientX;
            let current = drag_ev.target;
            let wasCurrent = null;
            let wasCurrent_i = 0;

            const updateKey = drag_ev.props.updateKey;

            if(!Event_CheckCountBounds(drag_ev, drag_ev.props.cont, mouseY, mouseX)){
                let containers = framework._drag.byName[updateKey];
                for(let k in containers){
                    let cont = containers[k];

                    if(Event_CheckCountBounds(drag_ev, cont, mouseY, mouseX)){
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
                    endX: t.pos.x + t.pos.w,
                    endY: t.pos.y + t.pos.h
                };

                if((mouseY >= rect.startY && mouseY <= rect.endY) &&
                    (mouseX >= rect.startX && mouseX <= rect.endX)
                ){
                    return {
                        idx: i,
                        node: t.el,
                        content_idtag: t.el._content_idtag,
                        content: drag_ev.props.cont.view.content,
                        view: drag_ev.props.cont.view,
                        current: {
                            idx: wasCurrent_i, 
                            node: wasCurrent
                        }
                    };
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

            let dragPos = getDragPos(node);
            const updateKey = node.templ.updateKey;


            const cont_node = El_Query(node, {direction: DIRECTION_PARENT}, {drop: updateKey});

            Event_SetDragContPos(cont_node);

            let clientX = e.clientX;
            let clientY = e.clientY;
            if("_touch" in framework){
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }

            const homeCont = {
                node: cont_node,
                pos: getDragPos(cont_node),
                view: cont_node._view
            };

            event_ev.props = {
                current_idx: -1,
                dragPos: dragPos,
                offsetX: clientX - dragPos.x,
                offsetY: clientY - dragPos.y,
                vessel: dragVessel,
                place: null,
                cont: homeCont,
                homeCont: homeCont,
                item: {
                    node: node,
                    pos: dragPos,
                },
                updateKey: updateKey,
                spacers: {},
                _spacer_idtag: null
            };

            framework._drag.ev = event_ev;

            event_ev.props.place = document.createElement('SPAN');
            swap(node, event_ev.props.place);
            dragVessel.appendChild(node);

            Event_SetSpacer(framework._drag);
            dragVessel.appendChild(node);
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
                    data: drag_ev.props.homeCont.view.content[drag_ev.props.current_idx],
                    content_idtag: drag_ev.target._content_idtag,
                    content: drag_ev.props.homeCont.view.content
                };

                const newObj = drag_ev.props.onto;

                const complete = function(){
                    drag_ev.props.cont.node.flags &= ~FLAG_DRAG_CONT_CALCULATED;
                    Event_SetDragContPos(drag_ev.props.cont.node);
                    Changes_Add(this, framework.changes);
                }

                let trans = null;
                trans = Transaction_New( 
                    'move', 
                    orig,
                    drag_ev.props.onto, 
                    complete);
                Transaction_Register(trans);

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

