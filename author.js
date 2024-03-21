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

    function splitFunc(event_ev){

        console.log(event_ev);
        console.log('SPLITTING', event_ev.vars);
        var main = document.getElementById('main'); 

        var type = event_ev.vars['type'];
        if(type === "preview"){
            type = "edit-page";
        }else{
            type = "preview";
        }

        var menu = MakeMenu(type);
        var data = {type: type, menu: menu, split: splitFunc};
        El_Make("viewport", main, main, data);
    }

    function MakeMenu(type){
        return {key:type, items: [
                {name: "Preview", key: "preview"},
                {name: "Edit Page", key: "edit-page"},
                {name: "Undo/Redo", key: "undo-redo"},
                {name: "Library", key: "library"},
                {name: "Design Layout", key: "layout"}
            ],
            update: setFunc,
        };
    }


    if(window.basic.templates){
        var main = document.getElementById('main'); 

        var type = "preview";
        var menu = MakeMenu(type);
        var data = {type: type, menu: menu, split: splitFunc};

        El_Make("viewport", main, main, data);
    }
})();
