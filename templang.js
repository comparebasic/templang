function TempLang_Init(templates_el, framework){

    var STATE_TEXT = 0;
    var STATE_PRE_KEY = 1;
    var STATE_KEY = 2;

    function cash(s, data){
        if(DEBUG_CASH){
            console.debug('CASH of :' + s, data);
        }
        var state = STATE_TEXT;
        var key = "";
        var shelf = "";
        for(var i = 0; i < s.length; i++){
            var c = s.charAt(i);
            if(state == STATE_TEXT){
                if(c == '$'){
                    state = STATE_PRE_KEY;
                    continue;
                }else{
                    shelf += c;
                }
            }else if(state == STATE_PRE_KEY){
                if(c == '{'){
                   state = STATE_KEY; 
                }else{
                    return "";
                }
            }else if(state == STATE_KEY){
                if(c == '}'){
                    var scope = DataScope(key, data);
                    if(!scope.data || (typeof scope.data === 'object')){
                        return "";
                    }
                    shelf += scope.data;
                    key = "";
                    state = STATE_TEXT;
                    continue;
                }else{
                    key += c;
                }
            }
        }
        if(DEBUG_CASH){
            console.debug('cash result:', shelf);
        }
        return shelf;
    }

    function Templ_Merge(into_templ, from_templ){
        var templ = {
            nodeName: into_templ.nodeName,
            name: into_templ.name,
            flags: into_templ.flags | from_templ.flags,
            el: into_templ.el,
            on: {},
            func: {},
            atts: {},
            forKey: null,
            withkey: null,
            mapVars: {},
            children: from_templ.children,
        };

        // atts
        for(var k in from_templ.atts){
            templ[k] = from_templ.atts[k];
        }
        for(var k in into_templ.atts){
            templ[k] = into_templ.atts[k];
        }

        // mapVars
        for(var k in from_templ.mapVars){
            templ[k] = from_templ.mapVars[k];
        }
        for(var k in into_templ.mapVars){
            templ[k] = into_templ.mapVars[k];
        }

        // _misc 
        for(var k in from_templ._misc){
            templ[k] = from_templ._misc[k];
        }
        for(var k in into_templ._misc){
            templ[k] = into_templ._misc[k];
        }

        templ.classes = into_templ.classes.concat(from_templ.classes);

        return templ;
    }

    function El_Make(templ, parent_el, data){
        if(typeof templ === 'string'){
            templ = framework.templates[templ];
        }

        if(!templ){
            console.warn('El_Make no templ', templ);
            return;
        }

        if(templ.forKey){
            var childList = data[templ.forKey];
            _templ = framework.templates[templ.nodeName];
            if(_templ && Array.isArray(childList)){
                var childTempl = Templ_Merge(_templ, templ);
                for(var i = 0; i < childList.length; i++){
                    El_Make(childTempl, parent_el, childList[i]);
                }
            }
            return;
        }

        var node = document.createElement(templ.nodeName);
        node.vars = {};
        node.templ = templ;
        if(data._idflag){
            node._content_idflag = data._idflag;
        }
        
        for(var k in templ.mapVars){
            var value = data[templ.mapVars[k]];
            if(value){
                node.vars[k] = value;
            }
        }

        for(var i = 0; i < templ.atts.length; i++){
            var value = data[cash(templ.atts[i], data)];
            if(value){
                node.setAttribute(templ.atts, value);
            }
        }

        var body = cash(templ.body, data);
        if(body){
            node.appendChild(document.createTextNode(body));
        }

        parent_el.appendChild(node);
    }

    function GetDestK(key){
        var var_k = key;
        var dest_k = var_k;
        if(/=/.test(var_k)){
            var var_li = var_k.split('=');
            var_k = var_li[1];
            dest_k = var_li[0];
        }
        return {
            key: var_k,
            dest_key: dest_k
        }
    }

    function Templ_Parse(el, parentEl, dest){
        var templ = {
            nodeName: el.nodeName.toUpperCase(),
            name: null,
            flags: 0,
            el: el,
            on: {},
            func: {},
            atts: {},
            forKey: null,
            withkey: null,
            mapVars: {},
            children: [],
            classes: [],
            _misc: {},
        };

        for(var i = 0, l = el.attributes.length; i < l; i++){
            var att = el.attributes[i];
            if(att.name == 'templ'){
                templ.name = att.value.toUpperCase();
            }else if(/^on:/.test(att.name)){
                var funcName = att.name.substring("on:".length);        
                templ.on[funcName] = att.value;
                templ.classList = att.value.split(',');
            }else if(att.name == 'drag'){
                templ.dragElementSpec = att.value;
                templ.flags |= FLAG_DRAG_CONTAINER;
            }else if(att.name == 'class-if'){
                templ.styleSetters = att.value.split(';');
            }else if(att.name == 'func'){
                templ.commandKeys = [att.value];
            }else if(att.name == 'vars'){
                var varNames = att.value.split(',');
                for(var j = 0; j < varNames.length; j++){
                    var k = varNames[j]
                    var keys = GetDestK(k);
                    if(keys){
                        templ.mapVars[keys.dest_key] = keys.key;
                    }
                }
            }else if(att.name == 'for'){
                templ.forKey = att.value;
            }else if(att.name == 'with'){
                templ.forKey = att.value;
                templ.childrenKey = att.value;
            }else if(att.name == 'if'){
                templ.forKey = att.value;
                templ.childrenKey = att.value;
            }else if(att.name == 'if-not'){
                templ.forKey = att.value;
                templ.childrenKey = att.value;
            }else if(att.name == 'atts'){
                templ.atts = att.value.split(',');
            }else if(att.name == 'class'){
                templ.classes = att.value.split(' ');
            }else{
                templ._misc[att.name] = att.value;
            }
        }

        if(templ.name){
            dest[templ.name] = templ;
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
                    Templ_Parse(child, templ, dest);
                }
            }
        }
    }

    if(templates_el){
        var nodes = templates_el.childNodes;
        if(!framework.templates){
            framework.templates = {};
        }
        for(var i = 0, l = nodes.length; i < l;i++){
            var el = nodes[i];
            if(el.nodeType == Node.ELEMENT_NODE){
                Templ_Parse(el, null, framework);
            }
        }
    }
}
