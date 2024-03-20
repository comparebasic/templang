(function(){
    if(typeof window.basic == 'undefined'){
        window.basic = {}
    }
    if(typeof window.basic.templates == 'undefined'){
        window.basic.templates = {};
    }

    function bootStrapEl(el, parentEl){
        var templ_s = null;
        var templ = {
            nodeName: el.nodeName,
            flags: 0,
            el: el,
            on: {},
            vars: {},
            tags: {},
            children: [],
            styleOptions: {},
            styleSetters: [],
            commandKeys: {},
        };

        for(var i = 0, l = el.attributes.length; i < l; i++){
            var att = el.attributes[i];
            var eventStart_s = "data-on:";
            if(att.name == 'data:templ'){
                templ_s = att.value;
                templ.name = att.value;
            }else if(/^data-on:/.test(att.name)){
                var funcName = att.name.substring("data-on:".length);        
                templ.on[funcName] = att.value;
            }else if(att.name == 'data:styles'){
                templ.styleOptions = att.value.split(',');
            }else if(att.name == 'data:classes'){
                templ.classList = att.value.split(',');
            }else if(att.name == 'data:style'){
                templ.styleOptions = [att.value];
            }else if(att.name == 'data:style-if'){
                templ.styleSetters = att.value.split(';');
            }else if(att.name == 'data:commands'){
                templ.commandKeys = att.value.split(',');
            }else if(att.name == 'data:command'){
                templ.commandKeys = [att.value];
            }else if(att.name == 'style'){
                templ.style = att.value;
            }else if(att.name == 'data:vars'){
                var vars = {};
                var varNames = att.value.split(',');
                for(var j = 0; j < varNames.length; j++){
                    vars[varNames[j]] = null;
                }
                templ.vars = vars;
            }else if(att.name == 'data:for'){
                templ.forKey = att.value;
            }else if(att.name == 'data:child'){
                templ.childTempl = att.value;
            }else if(att.name == 'data:child-as-value'){
                templ.childSetter = att.value;
            }else if(att.name == 'data:children'){
                templ.childrenKey = att.value;
            }else if(att.name == 'data:children-as'){
                templ.childrenTempl = att.value;
            }else{
                templ.tags[att.name] = att.value;
            }
        }

        if(templ_s){
            window.basic.templates[templ_s] = templ;
        }

        if(parentEl){
            parentEl.children.push(templ);
        }

        if(el.firstChild && el.firstChild.nodeType == Node.TEXT_NODE){
            templ.body = el.firstChild.nodeValue;
        }

        if(el.hasChildNodes()){
            for(var i = 0, l = el.childNodes.length; i < l; i++){
                var child = el.childNodes[i];
                if(child.nodeType == Node.ELEMENT_NODE){
                    bootStrapEl(child, templ);
                }
            }
        }
    }

    var templates_el =  document.getElementById('templates');
    if(templates_el){
        var nodes = templates_el.childNodes;
        for(var i = 0, l = nodes.length; i < l;i++){
            var el = nodes[i];
            if(el.nodeType == Node.ELEMENT_NODE){
                bootStrapEl(el, null);
            }
        }
        console.log(window.basic.templates);
    }
})();
