/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Parsing Templates]
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
                ifKey: null,
                dataKey: null,
                withkey: null,
                mapVars: {},
                children: [],
                classes: {},
                baseStyle: '', 
                classIfCond: {},
                setters: [],
                asKey: null,
                body: '',
                uiSplit: false,
                updateKey: null,
                dropKey: null,
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
                    templ.flags |= FLAG_DRAG_TARGET;
                    templ.on.drag = Spec_Parse('move');
                    templ.updateKey = att.value;
                }else if(att.name == 'sync'){
                    templ.updateKey = att.value;
                }else if(att.name == 'drop'){
                    templ.on.drop = Spec_Parse('drop');
                    templ.dropKey = att.value;
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
                }else if(att.name == 'split'){
                    const spec = Spec_Parse('split');
                    const vspec = Spec_Parse('vsplit');
                    const map = Map_Make(att.value);

                    spec.mapVars = map;
                    vspec.mapVars = map;
                    templ.on.split = spec;
                    templ.on.vsplit = vspec;
                    templ.on.close = Spec_Parse('close');
                }else if(att.name == 'for'){
                    templ.forKey = att.value;
                }else if(att.name == 'base-style'){
                    templ.baseStyle = att.value;
                }else if(att.name == 'with'){
                    templ.forKey = att.value;
                    templ.childrenKey = att.value;
                }else if(att.name == 'if'){
                    templ.ifKey = Statements(att.value, GetDestK);
                    templ.setters.push({scope: 'if', destK: templ.ifKey});
                }else if(att.name == 'if-not'){
                    templ.forKey = att.value;
                    templ.childrenKey = att.value;
                }else if(att.name == 'class'){
                    templ.classes._misc = att.value.split(' ');
                }else if(att.name == 'init-class'){
                    templ.classes.state = att.value.split(' ');
                }else if(att.name == 'class-if'){
                    const classIfCond = Statements(att.value, GetDestK);
                    if(Array.isArray(classIfCond)){
                        for(let i = 0; i < classIfCond.length; i++){
                            templ.setters.push({scope: 'class', destK: classIfCond[i]});
                        }
                    }else{
                        templ.setters.push({scope: 'class', destK: classIfCond});
                    }
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
        function Templ_Merge(into_templ, from_templ, overrides){
            if(!into_templ){
                into_templ = {};
            }
            const templ = {
                nodeName: from_templ.nodeName,
                name: into_templ.name || from_templ.name,
                isMerged: true,
                flags: into_templ.flags | from_templ.flags,
                el: into_templ.el || from_templ.el,
                asKey: from_templ.asKey,
                on: {},
                funcs: {},
                forKey: null,
                ifKey: from_templ.ifKey || into_templ.ifKey,
                updateKey: from_templ.updateKey || into_templ.updateKey,
                dropKey: from_templ.dropKey || into_templ.dropKey,
                withkey: null,
                mapVars: {},
                children: (overrides && overrides.children) || (from_templ.children.length && from_templ.children) || into_templ.children || [],
                body: (into_templ.body && into_templ.body.trim()) || from_templ.body.trim(),
                classIfCond: {},
                baseStyle: '',
                setters: from_templ.setters,
                uiSplit: from_templ.uiSplit || into_templ && into_templ.uiSplit,
                classes: {},
                _misc: {},
                dataKey: null,
            };

            if(overrides && "dataKey" in overrides){
                templ.dataKey = overrides.dataKey;
            }else{
                templ.dataKey = from_templ.dataKey || into_templ.dataKey;
            }

            function copyObj(name){
                for(let k in from_templ[name]){
                    templ[name][k] = from_templ[name][k];
                }
                if(into_templ){
                    for(let k in into_templ[name]){
                        templ[name][k] = into_templ[name][k];
                    }
                }
            }

            function copyExtObj(name){
                for(let k in from_templ[name]){
                    if(templ[name][k]){
                        templ[name][k] = [templ[name][k], from_templ[name][k]];
                    }else{
                        templ[name][k] = from_templ[name][k];
                    }
                }
                if(into_templ){
                    for(let k in into_templ[name]){
                        if(templ[name][k]){
                            templ[name][k] = [templ[name][k], into_templ[name][k]];
                        }else{
                            templ[name][k] = into_templ[name][k];
                        }
                    }
                }
            }

            function copyList(name){
                for(let i = 0; i < from_templ[name].length; i++){
                    templ[name].push(from_templ[name][i]);
                }
                if(into_templ[name]){
                    for(let i = 0; i < into_templ[name].length; i++){
                        templ[name].push(into_templ[name][i]);
                    }
                }
            }

            copyObj('funcs');
            copyExtObj('on');
            copyObj('mapVars');
            copyObj('classIfCond');
            copyObj('_misc');

            templ.baseStyle = from_templ.baseStyle;
            if(into_templ.baseStyle){
                if(into_templ.baseStyle && into_templ.baseStyle){
                    templ.baseStyle += ';';
                }
                templ.baseStyle += into_templ.baseStyle;
            }

            Style_ClsOverlay(templ.classes, null, from_templ.classes);
            if(into_templ && into_templ.classes){
                templ.classes._into_misc = into_templ.classes._misc;
            }

            /*
            console.log('Temple on ' + templ.classes, templ.on);
            console.log('Temple from.on ' + from_templ.nodeName, from_templ.on);
            console.log('Temple into.on ' + into_templ.name, into_templ);
            console.log(' --- ');
            */

            return templ;
        }

