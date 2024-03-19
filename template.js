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
            children: [],
        };

        for(var i = 0, l = el.attributes.length; i < l; i++){
            var att = el.attributes[i];
            if(att.name == 'data:templ'){
                templ_s = att.value;
                templ.name = att.value;
            }else if(att.name.substring(0, 3) == 'data-on:'){
                var funcName = att.name.substring(3);        
                templ.on[funcName] = att.value;
            }else if(att.name == 'data:style'){
                templ.styleOptions = att.value.split(',');
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
            }else if(att.name == 'data:children'){
                templ.childrenKey = att.value;
            }else if(att.name == 'data:children-as'){
                templ.childrenTemplKey = att.value;
            }
        }

        if(templ_s){
            window.basic.templates[templ_s] = templ;
        }

        if(parentEl){
            parentEl.children.push(templ);
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

        console.log('templates');
        console.log(window.basic.templates);
    }
})();
