function Change_Init(){

    var flags = {
        FLAG_CHANGE_ADD: 1,
        FLAG_CHANGE_REMOVE: 2,
        FLAG_CHANGE_MODIFY: 2,
        FLAG_CHANGE_REDO: 4,
        FLAG_CHANGE_UNDO: 8,
        FLAG_CHANGE_COLOR: 16,
        FLAG_CHANGE_MOVE: 32,
        FLAG_POS_BEFORE: 64,
        FLAG_POS_AFTER: 138,
        FLAG_POS_REPLACE: 256
    }

    var types = {
        CHANGE_TEXT: 1,
        CHANGE_IMAGE: 2,
        CHANGE_MOVE: 3,
        CHANGE_COLOR: 4,
        CHANGE_NAVITAGION: 5,
        CHANGE_PAGE: 6,
        CHANGE_SUBSECTION: 7
    };

    var change_idx = 0;
    function RegisterChange(event_ev, content){
        var idflag = 'change_' + (++change_idx);
        var change_cg = {
            idflag: idflag,
            type: 0,
            flags: 0,
            content: content._idtag,
            source: content,
            time: Date.now(),
            source_ev: event_ev,
            from: null,
            to: null,
            original_cg: null,
            props: {},
        };

        if(event_ev.sourceType === 'drag'){
            change_cg.from = event_ev.target._content_idtag;
            // console.log('FROM', event_ev.target);
            change_cg.to = event_ev.dest.uitem.el._content_idtag;
            // console.log('TO', event_ev.target);
            change_cg.flags |= flags.FLAG_POS_BEFORE | flags.FLAG_CHANGE_MOVE;
        }

        return change_cg;
    }

    function Verify(changeView){
        if(changeView._elements && changeView.el_li){
            for(var i = 0; i < changeView.el_li.length; i++){
                if(!Equals(changeView._elements[i], changeView.el_li[i].source._idtag)){
                    console.warn('Verify found a discrepency at ' + i, changeView);
                    return false;
                }
            }
            return true;
        }else{
            console.log('Verify recieved a changeView without both _elements and el_li');
        }
        return false;
    }

    function Equals(a, b){
        if(a === b){
            return true;
        }
        if(typeof b === 'string'){
            return (a._idtag && a._idtag === b);
        }else if(a._idtag && a._idtag === b._idtag){
            return true;
        }
        return false;
    }

    var trans_idx = 0;
    function GetChangeTrans(change_cg, content){
        var from = null;
        var from_idx = -1;
        var to = null;
        var to_idx = -1;
        var idflag = 'trans_' + (++trans_idx);
        for(var i = 0; i < content.length; i++){
            var t = content[i];
            if(Equals(t, change_cg.from)){
                from = t;
                from_idx = i;
            }
            if(Equals(t, change_cg.to)){
                to = t;
                to_idx = i;
                if(change_cg.flags & flags.FLAG_POS_BEFORE){
                    if(to_idx < 0){
                        to_idx = 0;        
                    }
                }
            }
        }

        return {
            idflag: idflag,
            from: from,
            from_idx: from_idx,
            to: to,
            to_idx: to_idx,
            change_cg: change_cg,
            content: content,
        }
    }

    function execute(trans_tn, content){
        // console.log('EXECUTE', trans_tn);
        if(trans_tn.change_cg.flags & flags.FLAG_CHANGE_MOVE){
            var li = content.splice(trans_tn.from_idx, 1);
            var toMove = li[0];

            var to_idx = trans_tn.to_idx;
            if(trans_tn.from_idx > trans_tn.to_idx){
                to_idx--;
            }
            if(to_idx < 0){
                to_idx = 0;
            }

            content.splice(to_idx, 0, toMove);

            return {
                to_idx: to_idx,
                from_idx: trans_tn.to_idx,
            };
        }
        return null;
    }

    function executeUI(trans_tn, view, aliases){
        // console.log('EXECUTE UI', trans_tn);
        if(trans_tn.change_cg.flags & flags.FLAG_CHANGE_MOVE){
            var moveBefore = view.el_li[trans_tn.to_idx];
            var li = view.el_li.splice(trans_tn.from_idx, 1);
            var toMove = li[0];

            var to_idx = trans_tn.to_idx;
            if(trans_tn.from_idx > trans_tn.to_idx){
                to_idx--;
            }
            if(to_idx < 0){
                to_idx = 0;
            }

            view.el_li.splice(to_idx, 0, toMove);

            console.log('MOVE Item', toMove.el.innerHTML);
            console.log('MOVE BEFORE', moveBefore.el.innerHTML);
            moveBefore.el.parentNode.insertBefore(toMove.el, moveBefore.el);
            console.log('NEXT SIBLING', toMove.el.nextSibling.innerHTML);

            Verify(view);
            view.viewNode.flags &= ~FLAG_DRAG_CONT_CALCULATED;
            ui.Event_SetDragContPos(view.viewNode);
        }
    }

    function resolveStatus(pending, done){
        var i = 0;
        while(i < pending.length){
            var tn = pending[i];
            if(tn._done){
                var li = pending.splice(i, 1);
                var toMove_tn = li[0];
                done.push(toMove_tn);
            }else{
                i++;
            }
        }
    }

    function RunQ(content, viewSet){
        // console.log('RUN QUEUES content', content);
        // console.log('RUN QUEUES viewSet', viewSet);
        for(var i = 0; i < content._queue.pending.length; i++){
            var tn = content._queue.pending[i];
            var aliases = execute(tn, content);
            if(aliases){
                tn._done = true;
            }
        }
        resolveStatus(content._queue.pending, content._queue.done);

        if(viewSet){
            for(var k in viewSet){
                var view = viewSet[k];
                if(view.queue.pending.length){
                    for(var i = 0; i < view.queue.pending.length; i++){
                        var tn = view.queue.pending[i];
                        if(executeUI(tn, view, aliases)){
                            tn._done = true;
                        }
                    }
                    resolveStatus(view.queue.pending, view.queue.done);
                }
            }
        }
    }

    function Dispatch(trans_tn, content, viewSet){
        if(content._queue){
            content._queue.pending.push(trans_tn);
            for(var k in viewSet){
                var view = viewSet[k];
                // console.log('Dispatching:', trans_tn);
                // console.log('Dispatching to:', view);
                view.queue.pending.push(trans_tn);
            }
        }else{
            console.warn('Dispatch content is missing _queue', content);
        }
    }

    function Queue_Make(view){
        return {
            view: view,
            pending: [],
            done: [],
        }
    }

    return {
        RegisterChange: RegisterChange,
        RunQ:RunQ,
        GetChangeTrans: GetChangeTrans,
        Dispatch: Dispatch,
        Queue_Make: Queue_Make,
        Equals: Equals,
        flags: flags,
        types: types
    };
}
