(function(){

    function setFunc(target, source, name, spec){
        var valKey = spec[1];
        var value = target.vars[valKey];

        var prevKey = source.vars[valKey]
        if(prevKey){
            var prev = El_Query(source, null, "_#menu-item", {key: prevKey});
            if(prev){
                El_RemoveStyle('active', prev.templ, prev);
            }
        }

        source.vars[valKey] = value;
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

        var data = {type: "preview", menu: menu};
        El_Make("viewport", main, main, data);
    }
})();
