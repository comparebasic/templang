function UI_Init(){
    
    var SPACER_HEIGHT = 40;
    var SPACER_PADDING = 20;

    var dragTarget = null; 

    var dragVessel = null;
    var dragHighlighter = null;

    var SpacerCtx = {spacers: {}, confirms: {}};

    function confirmSpacerClosed(a){
        if(a && a.phases[0].target){
             a.phases[0].target.remove();
        }

        if(SpacerCtx.confirms[a.idtag]){
            delete SpacerCtx.confirms[a.idtag];
        }

        anim.UnStashAnim(a);
    }

    function setSpacer(beforeNode, height){
        SpacerCtx._spacer_idtag = null;
        closeSpacers();

        var dragSpacer = document.createElement('DIV');
        dragSpacer.classList.add('drag-spacer');

        beforeNode.parentNode.insertBefore(dragSpacer, beforeNode);

        height -= SPACER_PADDING *2;
        var idtag = anim.PushAnim([
            {target:dragSpacer, duration: 100, targetObj: dragSpacer.style, prop: 'height', set:0},
            {target:dragSpacer, targetObj: dragSpacer.style, prop: 'height', start:0, end: height,
                duration: 300, metric: 'px'},
            {stash: true},
        ]);

        SpacerCtx._spacer_idtag = idtag;
        SpacerCtx.spacers[idtag] = true;

        return idtag;
    }

    function closePlace(event_ev){
        if(event_ev.props.place){
            var node = event_ev.props.place;
            var rect = node.getBoundingClientRect();
            anim.PushAnim([
                {target:node, duration: 100, targetObj: node.style, prop: 'height', set:rect.height},
                {target:node, targetObj: node.style, prop: 'height', start:rect.height, end: 0,
                    duration: 300, metric: 'px'},
            ]);
        }
    }

    function openPlace(event_ev){
        if(event_ev.props.place){
            var node = event_ev.props.place;
            var rect = node.getBoundingClientRect();
            anim.PushAnim([
                {target:node, targetObj: node.style, prop: 'height', start:rect.height, end: event_ev.props.h,
                    duration: 300, metric: 'px'},
            ]);
        }
    }

    function removeSpacer(idtag){
        if(SpacerCtx.spacers[idtag]){
            var a = anim.GetAnim(idtag);
            if(a){
                var p = a.phases[1];
                if(p.target){
                    p.target.remove();
                }
            }
            delete SpacerCtx.spacers[idtag];
        }
    }

    function closeSpacers(){
        var current = SpacerCtx._spacer_idtag;
        var spacers = SpacerCtx.spacers;
        var animUpdates = {};
        for(var idtag in spacers){
            if(idtag != current){
                var a = anim.GetAnim(idtag);
                if(a && a.phases[0]){
                    var p = a.phases[1];
                    var b = [
                        {target:p.target, targetObj: p.targetObj, prop: p.prop, start:p.end, end:p.start,
                            duration: 150, metric: 'px'},
                        {action: confirmSpacerClosed}
                    ];
                    animUpdates[idtag] = anim.PushAnim(b);
                }else{
                    console.warn('closeSpacer: unable to find idtag', idtag);
                }
            }
        }
        for(var k in animUpdates){
            SpacerCtx.confirms[animUpdates[k]] = true;
            delete SpacerCtx.spacers[k];
        }
    }

    function swap(orig, place){
        console.log('swap orig', orig);
        console.log('swap place', place);
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
        if(event_ev.dest !== null){
            var content = event_ev.props.dragContainer._view._elements;
            var change_cg = change.RegisterChange(event_ev, content); 
            var trans_tn = change.GetChangeTrans(change_cg, content, event_ev.props.dragContainer._view.el_li);
            var viewSet = event_ev.props.dragContainer._view._elements._views;
            if(viewSet){
                change.Dispatch(trans_tn, content, viewSet);
                change.RunQ(content, viewSet);
                console.log('CONTENT', content);
            }else{
                console.warn('ReleaseDrag no viewSet found');
            }
            removeSpacer(SpacerCtx._spacer_idtag);
        }else{
            closeSpacers();
        }
    }

    function Event_DragTargetCalc(e, drag_ev){
        var dragView_li = drag_ev.props.dragContainer._view.el_li;
        var mouseY = e.clientY;
        var mouseX = e.clientX;
        var current = drag_ev.target;
        var wasCurrent = null;
        var wasCurrent_i = 0;
        for(var i = 0; i < dragView_li.length; i++){
            var t = dragView_li[i];

            if(t.el === current){
                wasCurrent = t;
                wasCurrent_i = i;
            }

            var rect = {
                startX: t.pos.x,
                startY: t.pos.y,
                endX: t.pos.x + t.pos.rect.width,
                endY: t.pos.y + t.pos.rect.height
            };

            if((mouseY >= rect.startY && mouseY <= rect.endY) &&
                (mouseX >= rect.startX && mouseX <= rect.endX)
            ){
                return {idx: i, uitem: t, current: {idx: wasCurrent_i, uitem: wasCurrent}};
            }
        }

        return null;
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
            dragContainer: dragContainer,
            spacers: {},
            _spacer_idtag: null
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

                if(targetData && targetData.idx != dragTarget.props._prev_idx){
                    var overOrig = false;
                    if(targetData.uitem.el === dragTarget.target || (
                        targetData.current.uitem && targetData.current.idx === targetData.idx-1
                    )){
                        overOrig = true
                    }

                    if(overOrig){
                        dragTarget.dest = null; 
                        SpacerCtx._spacer_idtag = null;
                        closeSpacers();
                        openPlace(dragTarget);
                    }else{
                        dragTarget.dest = targetData; 
                        closePlace(dragTarget);
                        setSpacer(targetData.uitem.el, dragTarget.props.h);
                    }
                }
                dragTarget.props._prev_idx = targetData.idx;
            }else{
                dragTarget.dest = null; 
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
            /*
            dragTarget = null;
            */
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
        Event_SetDragContPos: Event_SetDragContPos,
    }
}
