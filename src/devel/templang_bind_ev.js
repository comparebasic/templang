/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

*/

    /* 
     * [Bind and Assign Browser Events]
     */

    function onMouseMove(e){
        var x = e.clientX;
        var y = e.clientY;
    }

    function onDown(e){
        var node = this;
        let r = false;
        ResetCtx({ev: null});
        if(node.templ && node.templ.on.mousedown){
            r = Event_Run(Event_New(node, e, node.templ.on.mousedown));
        }
        if(node.templ && node.templ.on.click){
            r = Event_Run(Event_New(node, e, node.templ.on.click));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onUp(e){
        ResetCtx({ev: null});
        var node = this;
        if(node.templ && node.templ.on.mouseup){
            r = Event_Run(Event_New(node, e, node.templ.on.mouseup));
        }
        if(node.templ && node.templ.on.click){
            r = Event_Run(Event_New(node, e, node.templ.on.click));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onScroll(e){
        var node = this;
    }

    function onHover(e){
        ResetCtx({ev: null});
        var node = this;
        if(node.flags & FLAG_NODE_STATE_HOVER){
            return;
        }
        node.flags |= FLAG_NODE_STATE_HOVER;
        if(node.templ && node.templ.on.hover){
            Event_Run(Event_New(node, e, node.templ.on.hover));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onUnHover(e){
        ResetCtx({ev: null});
        var node = this;
        if((node.flags & FLAG_NODE_STATE_HOVER) == 0){
            return;
        }
        node.flags &= ~FLAG_NODE_STATE_HOVER;
        if(node.templ && node.templ.on.hover){
            Event_Run(Event_New(node, e, node.templ.on.hover));
        }
        e.stopPropagation(); e.preventDefault();
    }

    function El_SetEvents(node, events){
        if(events.mousedown || events.click){
            node.onmousedown = onDown;
        }
        if(events.mouseup){
            node.onmouseup = onUp;
        }

        if(events.hover){
            /*
            if(!events.click && isTouchDevice){
                node.onmouseup = onHover;
            }else{
                node.onmouseover = onHover;
            }
            */
            node.onmouseover = onHover;
            node.onmouseout = onUnHover;
        }
    }

