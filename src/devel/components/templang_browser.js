/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Bind and Assign Browser Events]
*/
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
                for(let i = 0; i < node._viewRef.length; i++){
                    const container = node._viewRef[i].container;
                    container.flags &= ~FLAG_DRAG_CONT_CALCULATED;
                    Event_SetDragContPos(container);
                }
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
