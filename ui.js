function UI_Init(){
    var dragTarget = null; 

    var dragVessel = null;
    var dragSpacer = null;

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
        dragSpacer.remove();
    }

    function Event_DragTargetCalc(e, drag_ev){
        var dragView_li = drag_ev.props.dragContainer._view.el_li;
        var mouseY = e.clientY;
        for(var i = 0; i < dragView_li.length; i++){
            var t = dragView_li[i];
            if(mouseY > t.pos.y && mouseY < (t.pos.y +t.pos.rect.h)){
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
                console.log('DRAG CALC', node);
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
            console.log('Found drag container', dragContainer);
            Event_SetDragContPos(dragContainer);
        }else{
            console.log('unable to get drag container');
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
            console.log('Position vessel x' +dragVessel.style.left + ' y' +dragVessel.style.top);

            Event_SetDragContPos(dragTarget.props.dragContainer);
            var targetData = Event_DragTargetCalc(e, dragTarget);
            console.log('DRAG TO ', targetData);
            if(targetData && (typeof targetData.idx == 'number') && targetData.uitem.el){
                if(targetData.uitem.el === dragTarget.target){
                    dragSpacer.remove();
                    return;
                }
                dragSpacer.style.width = targetData.uitem.pos.rect.width + 'px';
                dragSpacer.style.height = 40 + 'px';
                if(targetData.uitem.el.nextSibling){
                    targetData.uitem.el.parentNode.insertBefore(dragSpacer, targetData.uitem.el.nextSibling);
                }else{
                    targetData.uitem.el.parentNode.append(dragSpacer);
                }
                console.log('INSERTING spacer after', targetData.uitem.el);
                console.log('INSERTING spacer', dragSpacer);
            }
        }
    }

    function onDown(e){
        var node = this;
        console.log('DOWN ' + node.idx, e);
        console.log('DOWN', node._drag_ev);
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
        console.log('UP', e);
        console.log('UP', dragTarget);
        var node = this;
        if(dragTarget){
            console.log('releasing drag', dragTarget);
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
            console.log('unover clearing dragTarget', dragTarget);
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
        dragSpacer = document.createElement('DIV');
        dragSpacer.classList = [];
        dragSpacer.classList.add('drag-spacer');

        dragVessel = document.createElement('DIV');
        dragVessel.classList = [];
        dragVessel.classList.add('drag-vessel');
        var body = document.getElementsByTagName('body');
        if(!body || !body[0]){
            return;
        }
        body[0].appendChild(dragVessel);

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
