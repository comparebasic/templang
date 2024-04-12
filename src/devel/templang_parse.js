/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation
*/

    /* 
     * [Parsing Templates]
     *
     * This is the main parse function, it interprets HTML elmeents which
     * contain tags and attributes used to form templates used to inflate
     * elements.
     */
    function Templ_Parse(el, parentEl){
        var templ = {
            nodeName: el.nodeName.toUpperCase(),
            name: null,
            flags: 0,
            isMerged: false,
            el: el,
            on: {},
            funcs: {},
            func: {},
            forKey: null,
            withkey: null,
            mapVars: {},
            children: [],
            classes: [],
            baseStyle: '', 
            classIfCond: {},
            setters: [],
            asKey: null,
            body: '',
            _misc: {},
        };

        for(let i = 0, l = el.attributes.length; i < l; i++){
            const att = el.attributes[i];
            if(att.name == 'templ'){
                templ.name = att.value.toUpperCase();
            }else if(/^on:/.test(att.name)){
                const name = att.name.substring("on:".length);        
                templ.on[name] = Statements(att.value, Spec_Parse);
            }else if(/^func:/.test(att.name)){
                const name = att.name.substring("func:".length);        
                const spec = Statements(att.value, Spec_Parse);
                if(!spec.key){
                    spec.key = name;
                }
                if(framework.funcs[spec.key]){
                    templ.funcs[name] = framework.funcs[spec.key];
                }else{
                    templ.funcs[name] = spec.key;
                }
            }else if(att.name == 'drag'){
                templ.dragElementSpec = att.value;
                templ.flags |= FLAG_DRAG_CONTAINER;
            }else if(att.name == 'func'){
                templ.commandKeys = [att.value];
            }else if(att.name == 'data'){
                const keys = GetDestK(att.value);
                templ.dataKey = keys;
                if(keys){
                    templ.setters.push({scope: 'data', destK: templ.dataKey});
                }
            }else if(att.name == 'as'){
                const keys = GetDestK(att.value);
                templ.asKey = keys;
                if(keys){
                    if(keys.cash.isCash){
                        for(let i = 0; i < keys.cash.vars.length; i++){
                            const kd =  keys.cash.vars[i];
                            if(templ.mapVars[kd.key] === undefined){
                                templ.setters.push({scope: 'as', destK: kd});
                            }
                        }
                    }else{
                        templ.setters.push({scope: 'as', destK: keys});
                    }
                }
            }else if(att.name == 'vars'){
                const mapVars =  Statements(att.value, GetDestK, ',');
                const mapVarsObj = templ.mapVars;
                if(Array.isArray(mapVars)){
                    for(let i = 0; i < mapVars.length; i++){
                        const mv = mapVars[i];
                        mapVarsObj[mv.dest_key] = mv;
                    }
                }else{
                    mapVarsObj[mapVars.dest_key] = mapVars;
                }
            }else if(att.name == 'for'){
                templ.forKey = att.value;
            }else if(att.name == 'base-style'){
                templ.baseStyle = att.value;
            }else if(att.name == 'with'){
                templ.forKey = att.value;
                templ.childrenKey = att.value;
            }else if(att.name == 'if'){
                templ.forKey = att.value;
                templ.childrenKey = att.value;
            }else if(att.name == 'if-not'){
                templ.forKey = att.value;
                templ.childrenKey = att.value;
            }else if(att.name == 'class'){
                templ.classes = att.value.split(' ');
            }else if(att.name == 'class-if'){
                templ.classIfCond = Statements(att.value, GetDestK);
                templ.setters.push({scope: 'class', destK: templ.classIfCond});
            }else{
                templ._misc[att.name] = att.value;
            }
        }

        if(templ.name){
            framework.templates[templ.name] = templ;
        }

        if(el.firstChild && el.firstChild.nodeType == Node.TEXT_NODE){
            templ.body = el.firstChild.nodeValue;
        }

        if(parentEl){
            parentEl.children.push(templ);
        }

        if(el.hasChildNodes()){
            for(let i = 0, l = el.childNodes.length; i < l; i++){
                const child = el.childNodes[i];
                if(child.nodeType === Node.ELEMENT_NODE){
                    Templ_Parse(child, templ);
                }
            }
        }
    }

    /* 
     * Merging happens when a template populates a different one, usually using
     * `as`, `for` or `with` attributes 
     */
    function Templ_Merge(into_templ, from_templ){
        const templ = {
            nodeName: from_templ.nodeName,
            name: into_templ.name || from_templ.name,
            isMerged: true,
            flags: into_templ.flags | from_templ.flags,
            el: into_templ.el,
            asKey: from_templ.asKey,
            on: {},
            funcs: {},
            forKey: null,
            withkey: null,
            mapVars: {},
            children: from_templ.children,
            body: into_templ.body.trim() || from_templ.body.trim(),
            classIfCond: {},
            baseStyle: '',
            setters: from_templ.setters,
            _misc: {},
        };

        function copyObj(name){
            for(let k in from_templ[name]){
                templ[name][k] = from_templ[name][k];
            }
            for(let k in into_templ[name]){
                templ[name][k] = into_templ[name][k];
            }
        }

        function copyList(name){
            for(let i = 0; i < from_templ[name].length; i++){
                templ[name][i] = from_templ[name][i];
            }
            for(let i = 0; i < into_templ[name].length; i++){
                templ[name][i] = into_templ[name][i];
            }
        }

        copyObj('funcs');
        copyObj('on');
        copyObj('mapVars');
        copyObj('classIfCond');
        copyObj('_misc');
        templ.classes = into_templ.classes.concat(from_templ.classes);
        templ.baseStyle = from_templ.baseStyle;
        if(into_templ.baseStyle && into_templ.baseStyle){
            templ.baseStyle += ';';
        }
        templ.baseStyle += into_templ.baseStyle;

        return templ;
    }
