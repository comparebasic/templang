function UI_Init(){
    
    var SPACER_HEIGHT = 40;

    var dragTarget = null; 

    var dragVessel = null;
    var dragHighlighter = null;

    var spacers = {};

    function setSpacer(beforeNode, height){
        var dragSpacer = document.createElement('DIV');
        dragSpacer.classList.add('drag-spacer');

        if(beforeNode.nextSibling){
            beforeNode.parentNode.insertBefore(dragSpacer, beforeNode.nextSibling);
        }else{
            beforeNode.parentNode.append(dragSpacer);
        }

        var idtag = anim.PushAnim([
            {target:dragSpacer, targetObj: dragSpacer.style, prop: 'height', start:0, end: height,
                duration: 300, metric: 'px'},
            {stash: true}
        ]);

        return idtag;
    }

    function closeSpacers(){
        var activeTag = dragTarget && dragTarget.props && dragTarget.props._spacer_idtag;
        if(Object.keys(spacers).length){
            console.log('SPACERS', spacers);
            for(var idtag in spacers){
                if(idtag != activeTag){
                    var a = anim.GetAnim(idtag);
                    if(a && a.phases[0]){
                        var p = a.phases[0];
                        var b = [
                            {target:p.target, targetObj: p.targetObj, prop: p.prop, start:p.end, end:p.start,
                                duration: 150, metric: 'px'},
                            {target: p.target, action: anim.RemoveNode}
                        ];
                        anim.PushAnim(b);
                        delete spacers[idtag];
                    }
                }
            }
        }
    }

    function swap(orig, place){
        if(orig.nextSibling){
            orig.parentNode.insertBefore(place, orig.nextSibling);
        }else{
            orig.parentNode.append(place);
        }
        orig.remove();
    }

    function Event_ReleaseDrag(event_ev){
        swap(event_ev.props.place, event_ev.target);
        dragHighlighter.style.display = 'none';
        for(var k in spacers){
            // dragSpacer.remove();
        }
    }

    function Event_DragTargetCalc(e, drag_ev){
        var dragView_li = drag_ev.props.dragContainer._view.el_li;
        var mouseY = e.clientY;
        for(var i = 0; i < dragView_li.length; i++){
            var t = dragView_li[i];
            var mid = t.pos.y + (t.pos.rect.height / 2);
            if(mouseY > t.pos.y && mouseY <= mid){
                return {idx: i-1, uitem: t};
            }

            if(mouseY > t.pos.y && mouseY > mid && mouseY < (t.pos.y + (t.pos.rect.height))){
                return {idx: i, uitem: t};
            }

            if(mouseY < t.pos.y){
                return {idx: i, uitem: t};
            }
        }
        return -1;
    }

    function Event_SetDragContPos(node){
        if(node._view){
            if((node.flags & FLAG_DRAG_CONT_CALCULATED) == 0){
                node.flags |= FLAG_DRAG_CONT_CALCULATED;
                for(var i = 0; i <  node._view.el_li.length; i++){
                    var elObj = node._view.el_li[i];
                    elObj.pos = getDragPos(elObj.el);
                }
            }
        }
    }

    function getDragPos(node){
        var el = node;
        var x = 0;
        var y = 0;
        do {
            y += el.offsetTop  || 0;
            x += el.offsetLeft || 0;
            if(el.scrollTop){
                y -= el.scrollTop;
            }
            el = el.offsetParent;
        } while(el);

        return {
            x: x,
            y: y,
            rect: node.getBoundingClientRect(),
        };
    }

    function getDragAndContPos(node){
        var dragContainer = null;
        var el = node;
        var x = 0;
        var y = 0;
        do {
            if(el.flags && (el.flags & FLAG_DRAG_CONTAINER)){
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
                dragContainer: dragContainer,
            }
        }else{
            console.warn('drag container not found');
            return null;
        }
    }

    function Event_SetupDrag(e, node, orig_ev, orig_spec_s){
        if(!dragVessel){
            return null; 
        }

        var x = 0;
        var y = 0;
        var h = 0;
        var w = 0;
        var dragContainer = null;
        
        var rect = node.getBoundingClientRect();
        h = rect.height;
        w = rect.width;
        var dragPos = getDragAndContPos(node);
        if(dragPos){
            x = dragPos.x;
            y = dragPos.y;
            dragContainer = dragPos.dragContainer;
            Event_SetDragContPos(dragContainer);
        }else{
            console.warn('unable to get drag container');
            return null;
        }

        var place = document.createElement('DIV');
        var style = window.getComputedStyle(node);
        place.style.display = style.display;
        place.style.position = style.position;
        place.style.width = w + 'px';
        place.style.height = h + 'px';
        place.style.padding = style.padding + 'px';
        place.style.margin = style.margin + 'px';

        for(var i = 0; i < node.classList.length; i++){
            place.classList.add(node.classList[i]);
        }

        swap(node, place);
        dragVessel.appendChild(node);
        dragVessel.style.left = x + 'px';
        dragVessel.style.top = y + 'px';

        var ev = Event_Clone(node, node._drag_ev, node._drag_ev.spec.spec_s)
        ev.props = {
            w:w,
            h:h,
            x:x,
            y:y,
            offsetX: e.clientX - x,
            offsetY: e.clientY - y,
            place: place,
            vessel: dragVessel,
            dragContainer: dragContainer
        };

        return ev;
    }

    function onMouseMove(e){
        var x = e.clientX;
        var y = e.clientY;
        if(dragTarget && dragVessel){
            dragVessel.style.left = (x - dragTarget.props.offsetX) + 'px';
            dragVessel.style.top = (y - dragTarget.props.offsetY) + 'px';
            Event_SetDragContPos(dragTarget.props.dragContainer);
            var targetData = Event_DragTargetCalc(e, dragTarget);
            if(targetData && (typeof targetData.idx == 'number') && targetData.uitem.el){

                dragHighlighter.style.display = 'block';
                dragHighlighter.style.width = targetData.uitem.pos.rect.width + 'px';
                dragHighlighter.style.height = targetData.uitem.pos.rect.height + 'px';
                dragHighlighter.style.top = targetData.uitem.pos.y + 'px';
                dragHighlighter.style.left = targetData.uitem.pos.x + 'px';

                if(dragTarget.props.targetData && dragTarget.props.targetData.idx != targetData.idx){
                    dragTarget.props._spacer_idtag = '';
                    if(Object.keys(spacers).length){
                        closeSpacers();
                    }
                    if(targetData.uitem.el !== dragTarget.target){
                        dragTarget.props._spacer_idtag = setSpacer(targetData.uitem.el, SPACER_HEIGHT);
                        spacers[dragTarget.props._spacer_idtag] = true;
                    }
                }
                dragTarget.props.targetData = targetData;
            }
        }
    }

    function onDown(e){
        var node = this;
        var node = this;
        if(node._drag_ev && (node.flags & FLAG_HAS_DRAG)){
            var ev = Event_SetupDrag(e, node, node._drag_ev, node._drag_ev.spec.spec_s);
            dragTarget = ev;
        }
        if(node._down_ev){
            handleEvent(node._down_ev);
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onUp(e){
        var node = this;
        if(dragTarget){
            Event_ReleaseDrag(dragTarget);
            dragTarget = null;
        }
        if(node._up_ev){
            handleEvent(node._up_ev);
        }
        if(node._click_ev){
            handleEvent(node._click_ev);
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onScroll(e){
        var node = this;
        if(node.flags && (node.flags & FLAG_DRAG_CONTAINER)){
            node.flags &= ~FLAG_DRAG_CONT_CALCULATED;
            Event_SetDragContPos(node);
        }
    }

    function onHover(e){
        var node = this;
        if(node._hover_ev){
            handleEvent(node._hover_ev);
        }
        e.stopPropagation(); e.preventDefault();
    }

    function onUnHover(e){
        var node = this;
        if(node === dragTarget){
            dragTarget = null;
        }
        if(node._unhover_ev){
            handleEvent(node._unhover_ev);
        }
    }

    function setMouseClick(node, event_ev){
        node._click_ev = event_ev;
        node.onmouseup = onUp;
    }

    function setMouseDown(node, event_ev){
        node._down_ev = event_ev;
        node.onmousedown = onDown;
    }

    function setMouseUp(node, event_ev){
        node._up_ev = event_ev;
        node.onmouseup = onUp;
    }

    function setMouseHover(node, event_ev){
        node._hover_ev = event_ev;
        node.onmouseover = onHover;
    }

    function setMouseUnHover(node, event_ev){
        node._unhover_ev = event_ev;
        node.onmouseout = onUnHover;
    }

    function setMouseDrag(node, event_ev){
        node._drag_ev = event_ev;
        node.flags |= FLAG_HAS_DRAG;
        node.onmousedown = onDown;
        node.onmouseup = onUp;
    }

    function setMouseDrop(node, event_ev){
        node._drop_ev = event_ev;
        node.onscroll = onScroll;
        node.onmouseover = onHover;
        node.onmouseout = onUnHover;
    }

    window.addEventListener('load', function(){
        dragVessel = document.createElement('DIV');
        dragVessel.classList.add('drag-vessel');

        dragHighlighter = document.createElement('DIV');
        dragHighlighter.classList.add('drag-highlighter');

        var body = document.getElementsByTagName('body');
        if(!body || !body[0]){
            return;
        }
        body[0].appendChild(dragVessel);
        body[0].appendChild(dragHighlighter);

        window.addEventListener('mousemove', onMouseMove);
        window.onmouseup = onUp;
    })

    return  {
        SetMouseClick: setMouseClick,
        SetMouseDown: setMouseDown,
        SetMouseUp: setMouseUp,
        SetHover: setMouseHover,
        SetUnHover: setMouseUnHover,
        SetMouseDrag: setMouseDrag,
        SetMouseDrop: setMouseDrop,
    }
}
