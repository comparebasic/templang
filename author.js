(function(){
    if(window.basic.templates){
        var main = document.getElementById('main'); 
        El_Make("menu", main, {items: [
            {name: "Preview", key: "preview"},
            {name: "Edit Page", key: "edit-page"},
            {name: "Undo/Redo", key: "undo-redo"},
            {name: "Library", key: "library"},
            {name: "Design Layout", key: "layout"}
        ]});
    }
})();
