var content = [
    {type: "title", text: "The Whole Chicken"},
    {type: "text", text: "Cooking a whole chicken can be a great way to provide a week or so of meals for two."},
    {type: "text", text: "When combined with rice, vegetables, and other ingredients it can make your cooking time worthwhile, on a budget."}, 
    {type: "subtitle", text: "Ingredients"}, 
    {type: "gallery", images: [{src: "images/chicken_ingredients.jpg", style:"hero"}]},
    {type: "text", text: "These are the ingredients."},

    {type: "subtitle", text: "Orange Peel Pepper Sauce"},
    {type: "text", text: "Whole chickens have <i>lots of juice</i>, which is great for making a sauce that can be used in other dishes."},
    {type: "text", text: "I usually add the peppers and half of the onions to a pan and open the chicken into the pan, letting the juices merge with the onion, peppers, and orange peel."},
    {type: "gallery", images: [{src: "images/chicken_peel-sauce-done.jpg"},{src: "images/chicken_orange-peel.jpg"}, {src: "images/chicken_onions-peppers.jpg"}]},

    {type: "subtitle", text: "Roast the back first"},
    {type: "text", text: "I like to cook the chicken upside down for 12 minutes, and then flip, and add the potatoes and onions underneight afterwards."},
    {type: "text", text: "To prepare the chicken, I add the spices, and juice one orange."},
    {type: "text", text: "The other orange is used to make the <i>peel sauce</i>, and then the oragnes are stuffed inside the body."},
    {type: "gallery", images: [{src: "images/chicken_oj-perspective.jpg"},{src: "images/chicken_pass-1-done.jpg"},{src: "images/chicken_flip-add-potatoes.jpg"}]},

    {type: "subtitle", text: "Rice and Lentils"},
    {type: "text", text: "While the chicken is roasting, we will make a rice and lentil dish, using the orange peel sauce we just made."},
    {type: "gallery", images: [{src: "images/rice-lentils_rice-toasted-2.jpg"}, {src: "images/rice-lentils_water-added.jpg"}, {src: "images/rice-lentils_needs-more-water.jpg"}]},
    

    {type: "subtitle", text: "Side of Veggies"},
    {type: "text", text: "The third part of our meal is a simple arrangement of canned vegetables"},
    {type: "gallery", images: [{src: "images/canned-veggies.jpg"}]},

    {type: "subtitle", text: "Not Done Yet!"},
    {type: "text", text: "The most common concern witha whle chicken is knowing when it's done, " +
        "cutting it open is not as flattering to take pictures of, but popping it back in for 10 minutes works just fine."},
    {type: "gallery", images: [{src: "images/chicken_done-or-not-2.jpg"},{src: "images/chicken_is-not-done.jpg"}]},
    {type: "subtitle", text: "Done!"},
    {type: "gallery", images: [{src: "images/chicken_done-perspective.jpg"},{src: "images/chicken_all-together.jpg"}]},
];

(function(){

    function dragFunc(event_ev){
        console.log('DRAG FUNC', drag);
    }

    function updateAuthorSegs(author, inc){
        var count = 1;
        if(!author.vars['count'] || Number(author.vars['count']) < 1){
            count = 1;
        }else{
            count = Number(author.vars['count']);
        }

        var count = 0;
        var child = author.firstChild;
        while(child){
            if(child.nodeType === Node.ELEMENT_NODE){
                count++;
            }
            child = child.nextSibling;
        }

        var rect = document.documentElement.getBoundingClientRect();
        rect.height = window.innerHeight;
        var remaining = rect.width;

        console.log('COUNTED', count);
        var child = author.firstChild;
        var i = 0;
        while(i < count){
            console.log('outer i ' + i + ' count ' + count);
            if(child.nodeType === Node.ELEMENT_NODE){
                console.log('i ' + i + ' count ' + count);
                if(child.vars && child.vars['width']){
                    remaining -= child.vars['width'];
                }else{
                    var amount = remaining / (count - i);
                    child.style.width = amount + 'px';
                    child.style.height = rect.height + 'px';
                    var views = child.getElementsByClassName('view');
                    for(var j = 0; j < views.length; j++){
                        views[j].style.height = (rect.height - 16) + 'px';
                    }
                    remaining -= amount;
                }
                i++;
                console.log('incr');
            }
            child = child.nextSibling;
        }
    }

    function splitFunc(event_ev){
        var author = El_Query(event_ev.dest, {name: "^#author"});

        var type = event_ev.vars['type'];
        if(type === "preview"){
            type = "edit-page";
        }else{
            type = "preview";
        }

        AddViewport(author, type);
;
        var dragTarget = ui.GetDragTarget();
        if(dragTarget && dragTarget.props.dragContainer._view){
            var viewSet = dragTarget.props.dragContainer._view._elements._views;
            dragTarget.props.containers = ui.Event_GetDropContTargets(viewSet);
        }
    }

    function closeFunc(event_ev){
        if(event_ev.dest){
            event_ev.dest.remove();
            updateAuthorSegs(author);
        }
    }

    function setFunc(event_ev){
        var prevKey = event_ev.dest.vars['key'];
        if(prevKey){
            var prev = El_Query(event_ev.dest, {name:"_#menu-item" , data: {key: prevKey}});
            if(prev){
                El_RemoveStyle('active', prev.templ, prev);
            }else{
                console.warn('PREV NOT FOUND');
            }
        }
    }

    function AddViewport(author, type){

        var menu = MakeMenu(type);
        var data =  {type: type, menu: menu, split: splitFunc, close: closeFunc, content:author.vars['content']};
        El_Make("viewport", author, author, data);
        updateAuthorSegs(author);
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
        main.flags |= FLAG_CONTAINER;

        var type = "preview";
        var injested = injest.Content_Injest(content, null, content);
        console.log('CONTENT', injested);
        var data = {drag: dragFunc, content:injested};
        var author = El_Make("author", main, main, data);
        AddViewport(author, type);
    }
})();
