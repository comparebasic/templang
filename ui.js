function UI_Init(){
    var dragTarget = null; 

    var dragContainer = null;

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
    }

    function Event_SetupDrag(e, node, orig_ev, orig_spec_s){
        if(!dragContainer){
            return null; 
        }

        var x = 0;
        var y = 0;
        var h = 0;
        var w = 0;
        
        var rect = node.getBoundingClientRect();
        console.log('getDrag bouding node', node);
        console.log('getDrag bouding rect', rect);
        h = rect.height;
        w = rect.width;

        var el = node;
        do {
            y += el.offsetTop  || 0;
            x += el.offsetLeft || 0;
            if(el.scrollTop){
                y -= el.scrollTop;
            }
            el = el.offsetParent;
        } while(el);

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
        dragContainer.appendChild(node);
        dragContainer.style.left = x + 'px';
        dragContainer.style.top = y + 'px';

        var ev = Event_Clone(node, node._drag_ev, node._drag_ev.spec.spec_s)
        ev.props = {
            w:w,
            h:h,
            x:x,
            y:y,
            offsetX: e.clientX - x,
            offsetY: e.clientY - y,
            place: place
        };

        return ev;
    }

    function onMouseMove(e){
        var x = e.clientX;
        var y = e.clientY;
        if(dragTarget && dragContainer){
            dragContainer.style.left = (x - dragTarget.props.offsetX) + 'px';
            dragContainer.style.top = (y - dragTarget.props.offsetY) + 'px';
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

    function onHover(e){
        var node = this;
        handleEvent(node._hover_ev);
        e.stopPropagation(); e.preventDefault();
    }

    function onUnHover(e){
        var node = this;
        if(node === dragTarget){
            console.log('unover clearing dragTarget', dragTarget);
            dragTarget = null;
        }
        handleEvent(node._unhover_ev);
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

    window.addEventListener('load', function(){
        dragContainer = document.createElement('DIV');
        dragContainer.classList = [];
        dragContainer.classList.add('drag-container');
        var body = document.getElementsByTagName('body');
        if(!body || !body[0]){
            return;
        }
        body[0].appendChild(dragContainer);
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
    }
}
