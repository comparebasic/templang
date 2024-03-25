function UI_Init(){
    var downTarget = null; 

    var dragContainer = null;

    function getDragSet(e, set){
        if(!dragContainer){
            return null; 
        }
        dragContainer.appendChild(set);
    }

    function setDrag(e, set){
        console.log('SETTING DRAG: ', set);
        console.log('SETTING DRAG e: ', e);
    }

    function releaseDrag(e, set){
        console.log('SETTING DOWN: ', set);
        console.log('SETTING DOWN e: ', e);
    }

    function onMouseMove(e){
        var x = e.clientX;
        var y = e.clientY;
        if(downTarget){
            var set = getDragSet(downTarget);
            setDrag(e, set);
        }
    }

    function onDown(e){
        var node = this;
        if(node.el_idx && (node.flags & FLAG_HAS_DRAG)){
            downTarget = node;
        }
        handleEvent(node._down_ev);
        e.stopPropagation(); e.preventDefault();
    }

    function onUp(e){
        console.log('UP', e);
        var node = this;
        if(node.el_idx && downTarget === node){
            releaseDrag(e, node);
            downTarget = null;
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
        if(node.el_idx && node === downTarget){
            downTarget = node;
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
        console.log("DRAG SET", node);
        node._drage_ev = event_ev;
        node.flags |= FLAG_HAS_DRAG;
    }

    window.addEventListener('load', function(){
        dragContainer = document.createElement('DIV');
        var body = document.getElementsByTagName('body');
        if(!body || !body[0]){
            return;
        }
        body[0].appendChild(dragContainer);
        window.addEventListener('mousemove', onMouseMove);
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
