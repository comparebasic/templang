(function(){

    function setFunc(target, source, name, eventSpec_s){
        console.log('set ', eventSpec_s, target.vars);
    }

    if(window.basic.templates){
        var main = document.getElementById('main'); 
        var data = {items: [
                {name: "Preview", key: "preview"},
                {name: "Edit Page", key: "edit-page"},
                {name: "Undo/Redo", key: "undo-redo"},
                {name: "Library", key: "library"},
                {name: "Design Layout", key: "layout"}
            ],
            update: setFunc,
        };

        El_Make("menu", main, main, data);
    }
})();
