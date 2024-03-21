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
        var author = El_Query(event_ev.dest, {name: "^#author"});

        var type = event_ev.vars['type'];
        if(type === "preview"){
            type = "edit-page";
        }else{
            type = "preview";
        }

        var menu = MakeMenu(type);
        var data = {type: type, menu: menu, split: splitFunc};
        El_Make("viewport", author, main, data);

        var count = 1;
        if(!author.vars['count'] || Number(author.vars['count']) < 1){
            count = 1;
        }else{
            count = Number(author.vars['count']);
        }

        console.log(count);

        count++;
        author.vars['count'] = count;
        var style = 'single';
        if(count == 1){
            style = 'single'; 
        }else if(count == 2){
            style = 'double'; 
        }else if(count == 3){
            style = 'tripple'; 
        }else if(count == 4){
            style = 'quad'; 
        }
    
        console.log('setting style for author ' + style);
        El_SetStyle(style, author.templ, author);
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
        var data = {viewport: {type: type, menu: menu, split: splitFunc}};

        El_Make("author", main, main, data);
    }
})();
