function Template_Init(){
    if(typeof window.basic == 'undefined'){
        window.basic = {}
    }
    if(typeof window.basic.templates == 'undefined'){
        window.basic.templates = {};
    }

    function Templ_Merge(into_templ, from_templ){
        var templ = {
            nodeName: into_templ.nodeName,
            name: into_templ.name,
            classList: [],
            style: into_templ.style,
            forKey: into_templ.forKey,
            childTempl: into_templ.childTempl,
            childSetter: into_templ.childSetter,
            childrenKey: into_templ.childrenKey,
            childrenTempl: into_templ.childrenTempl,
            flags: into_templ.flags | from_templ.flags,
            el: into_templ.el,
            on: {},
            vars: {},
            tags: {},
            children: into_templ.children,
            body: into_templ.body,
            styleOptions: [],
            styleSetters: [],
            commandKeys: {},
            mapVars: {},
            childrenDataKeys: [],
            atts: [],
        };

        for(var k in from_templ.on){
            templ.on[k] = from_templ.on[k];
        }
        for(var k in into_templ.on){
            templ.on[k] = into_templ.on[k];
        }

        for(var k in from_templ.vars){
            templ.vars[k] = from_templ.vars[k];
        }
        for(var k in into_templ.vars){
            templ.vars[k] = into_templ.vars[k];
        }

        for(var k in from_templ.tags){
            templ.tags[k] = from_templ.tags[k];
        }
        for(var k in into_templ.tags){
            templ.tags[k] = into_templ.tags[k];
        }

        for(var k in from_templ.commandKeys){
            templ.commandKeys[k] = from_templ.commandKeys[k];
        }
        for(var k in into_templ.commandKeys){
            templ.commandKeys[k] = into_templ.commandKeys[k];
        }

        for(var k in from_templ.mapVars){
            templ.mapVars[k] = from_templ.mapVars[k];
        }
        for(var k in into_templ.mapVars){
            templ.mapVars[k] = into_templ.mapVars[k];
        }

        for(var i=0; i < from_templ.childrenDataKeys.length; i++){
            templ.childrenDataKeys.push(from_templ.childrenDataKeys[i]);
        }
        for(var i=0; i < into_templ.childrenDataKeys.length; i++){
            templ.childrenDataKeys.push(to_templ.childrenDataKeys[i]);
        }

        for(var i=0; i < from_templ.tags.length; i++){
            templ.tags.push(from_templ.tags[i]);
        }
        for(var i=0; i < into_templ.tags.length; i++){
            templ.tags.push(to_templ.tags[i]);
        }

        for(var i = 0; i < from_templ.styleOptions.length; i++){
            templ.styleOptions.push(from_templ.styleOptions[i]);
        }
        for(var i = 0; i < into_templ.styleOptions.length; i++){
            templ.styleOptions.push(into_templ.styleOptions[i]);
        }


        for(var i = 0; i < from_templ.classList.length; i++){
            templ.classList.push(from_templ.classList[i]);
        }
        for(var i = 0; i < into_templ.classList.length; i++){
            templ.classList.push(into_templ.classList[i]);
        }

        for(var k in from_templ.styleSetters){
            templ.styleSetters[k] = from_templ.styleSetters[k];
        }
        for(var k in into_templ.styleSetters){
            templ.styleSetters[k] = into_templ.styleSetters[k];
        }


        for(var k in from_templ.atts){
            templ.atts[k] = from_templ.atts[k];
        }
        for(var k in into_templ.atts){
            templ.atts[k] = into_templ.atts[k];
        }

        return templ;
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
            mapVars: {},
            childrenDataKeys: [],
            classList: [],
        };

        for(var i = 0, l = el.attributes.length; i < l; i++){
            var att = el.attributes[i];
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
            }else if(att.name == 'data:map-vars'){
                var varNames = att.value.split(',');
                for(var j = 0; j < varNames.length; j++){
                    var keys = GetDestK(varNames[j]);
                    if(keys){
                        templ.mapVars[keys.dest_key] = keys.key;
                    }

                }
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
            }else if(att.name == 'data:children-data'){
                templ.childrenDataKeys = att.value.split(',');
            }else if(att.name == 'data:atts'){
                templ.atts = att.value.split(',');
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

    return {
        Templ_Merge: Templ_Merge,
    }
}
