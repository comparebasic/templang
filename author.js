var content = [
    {type: "title", text: "The Whole Chicken"},
    {type: "text", text: "Cooking a whole chicken can be a great way to provide a week or so of meals for two."},
    {type: "text", text: "When combined with rice, vegetables, and other ingredients it can make your cooking time worthwhile, on a budget."}, 
    {type: "gallery", images: ["chicken1.jpg", "chicken2.jpeg", "chicken3.jpg"]},
    {type: "text", text: "It's important to roas the front and the back of the chicken."}
];

(function(){
    function setFunc(event_ev){
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

    function AddViewport(author, type){
        var main = document.getElementById('main'); 

        var menu = MakeMenu(type);
        var data =  {type: type, menu: menu, split: splitFunc, content:author.vars['content']};
        El_Make("viewport", author, main, data);
        console.log('adding viewport');
    }

    function splitFunc(event_ev){
        var author = El_Query(event_ev.dest, {name: "^#author"});

        var type = event_ev.vars['type'];
        if(type === "preview"){
            type = "edit-page";
        }else{
            type = "preview";
        }

        El_Make("viewport", author, main, data);
        AddViewport(author, type);

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
        var data = {content:content};
        var author = El_Make("author", main, main, data);
        console.log('about to add viewport');
        AddViewport(author, type);
    }
})();
