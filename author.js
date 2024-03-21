(function(){

    function setFunc(event_ev){
        console.log('setFunc called ', event_ev.dest.vars);
        console.log('setFunc called ', event_ev.dest);
        var prevKey = event_ev.dest.vars['key'];
        if(prevKey){
            var prev = El_Query(event_ev.dest, {name:"_#menu-item" , data: {key: prevKey}});
            if(prev){
                El_RemoveStyle('active', prev.templ, prev);
            }else{
                console.log('PREV NOT FOUND');
            }
        }
    }

    function splitFunc(target, source, name, spec, event_d){
        console.log('SPLIT ' + name + ' : ' + spec, event_d);
    }

    if(window.basic.templates){
        var main = document.getElementById('main'); 
        var menu = {key:"preview", items: [
                {name: "Preview", key: "preview"},
                {name: "Edit Page", key: "edit-page"},
                {name: "Undo/Redo", key: "undo-redo"},
                {name: "Library", key: "library"},
                {name: "Design Layout", key: "layout"}
            ],
            update: setFunc,
        };

        var data = {type: "preview", menu: menu, split: splitFunc};
        El_Make("viewport", main, main, data);
    }
})();
