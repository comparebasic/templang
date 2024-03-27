function Change_Init(){

    var flags = {
        FLAG_CHANGE_ADD: 1,
        FLAG_CHANGE_REMOVE: 2,
        FLAG_CHANGE_MODIFY: 2,
        FLAG_CHANGE_REDO: 4,
        FLAG_CHANGE_UNDO: 8,
        FLAG_CHANGE_COLOR: 16,
        FLAG_POS_BEFORE: 16,
        FLAG_POS_AFTER: 17,
        FLAG_POS_REPLACE: 18
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
            type: type,
            flags: flags,
            content: content._content_idtag,
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
            change_cg.to = event_ev.dest.uitem.el._content_idtag;
            change_cg.flags |= FLAG_POS_BEFORE;
        }

        return change_cg;
    }

    function RunChange(change_cg, view){
        ;
    }

    return {
        RegisterChange: RegisterChange,
        RunChange: RunChange,
        flags: flags,
        types: types
    };
}
