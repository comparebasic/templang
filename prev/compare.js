var MAX_FUTURE_GUESS = 3;

var change_types = {
    TYPE_CHANGE_REMOVE: 1,
    TYPE_CHANGE_ADD:2,
    TYPE_CHANGE_REPLACE:3
};

function Changer_Make(props, func){
    return {
        props,
        func,
    }
}

function Changer_DomFunc(node, action){
    var changer = this;
    if(action.type == change.flags.FLAG_CHANGE_ADD){
        changer.root.insertBefore(node ,changer._latest);
        return true;
    }else if(action.type == change.flags.FLAG_CHANGE_REMOVE){
        node.remove();
        return true;
    }

    return false;
}

function Changer_DomChanger(root){
    return Changer_Make({
            root: root,
            _latest: root.firstChild,
            _nextMatch: null,
            _currentIdx: 0,
            _rangeStartIdx: 0,
        }, Changer_DomFunc);
}

function nextEl(node){
    while(node){
        if(node.nodeType === Node.ELEMENT_NODE){
            return node;
        }
        node = node.nextSibling;
    }
    return null;
}

function ContentMatch(node, contentItem){
    if(!node  || !contentItem){
        return false;
    }

    return content[i].idtag === node._content_idtag
}

function Run_ChangeList(changer, content, source){
    changer.props._latest = nextEl(source.firstChild);

    if(!Array.isArray(content)){
        console.warn("Warning: Run_ChangeList, content is expected to be an array");
    }

    changer.props._currentIdx = 0;
    while(changer.props._currentIdx < content.length){
        // match
        if(ContentMatch(changer.props._latest, content[i])){
            changer.props._currentIdx++;
            changer.props._latest = nextEl(changer.props._latest);
            continue;
        }else{
            // remove - look for a future match
            changer.props._nextMatch = changer.props._latest;
            changer.props._rangeStartIdx = i;
            while(!ContentMatch(changer.props._nextMatch, content[i]) && 
                    changer.props._currentIdx < (changer.props._rangeStartIdx + MAX_FUTURE_GUESS)){
                changer.props._nextMatch = nextEl(changer.props._nextMatch);
                changer.props._currentIdx++;
            }

            if(ContentMatch(changer.props._nextMatch, content[i]) && changer.props._rangeStartIdx != i){
                changer.props._nextMatch = changer.props._latest;
                while(!ContentMatch(changer.props._nextMatch, content[i])){
                    changer.func(changer.props._nextMatch, {
                        type: change.flags.FLAG_CHANGE_REMOVE,
                        root: changer.root,
                    });
                    changer.props._nextMatch = nextEl(changer.props._nextMatch);
                }
                changer.props._currentIdx = changer.props._rangeStartIdx+1;
                changer.props._rangeStartIdx = 0;
                continue;
            }

            // new
            changer.func(El_MakeChild(changer.root.templ, changer.root, content[i]) ,{
                type: change.flags.FLAG_CHANGE_ADD,
                root: changer.root
            });
            changer.props._currentIdx++;
            changer.props._latest = nextEl(changer.props._latest);
        }
    }
    
    // purge all the remaining ones
    while(changer.props._latest){
        var latest = changer.props._latest;
        changer.props._latest = nextEl(changer.props._latest);
        changer.func(latest, {
            type: change.flags.FLAG_CHANGE_REMOVE,
            root: changer.root,
        });
    }
}
