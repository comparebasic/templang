function Content_Init(){

    var weights = {
        WEIGHT_GLOBAL: 1000,
        WEIGHT_PAGE: 100,
        WEIGHT_SECTION: 60,
        WEIGHT_SECTION_sub2: 40,
        WEIGHT_SECTION_sub3: 20,
        WEIGHT_SECTION_sub4: 10,
        WEIGHT_ITEM: 0
    };


    var content_idx = 0;

    function Content_GetHierWeights(item){
        if(item.type){
            if(item.type === 'page'){
                return weights.WEIGHT_PAGE;
            }else if(item.type === "title"){
                return weights.WEIGHT_SECTION;
            }else if(item.type === "subtitle"){
                return weights.WEIGHT_SECTION_sub2;
            }else if(item.type === "gallery"){
                return weights.WEIGHT_SECTION_sub2;
            }
        }

        return 0;
    }

    function makeIdTag(content, heir){
        var tag = 'content_' + (++content_idx);
        if(content.type){
            tag += '.' + content.type;
        }
        return tag;
    }

    function Content_Injest(content, heir){
        if(content._idtag){
            console.warn("Content_Injest: content already tagged, returning");
            return null;
        }
        content._idtag = makeIdTag(content, heir);
        if(!heir){
            content_weight = injest.weights.WEIGHT_GLOBAL;
            content._heir = [{weight: injest.weights.WEIGHT_GLOBAL, idtag: content._idtag}];
            heir = content._heir;
        }else{
            content._weight = Content_GetHierWeights(content);
            content._heir = [{weight: content._weight, idtag: content._idtag}];
        }

        for(var i = heir.length-1; i >= 0; i--){
            if(heir[i].weight > content._weight){
                content._heir.unshift(heir[i]);
            }
        }

        if(Array.isArray(content)){
            for(var i = 0; i < content.length; i++){
                Content_Injest(content[i], heir);
                heir = content[i]._heir;
            }
        }

        return content;
    }

    return {
        Content_Injest: Content_Injest,
        weights: weights,
    }
}
