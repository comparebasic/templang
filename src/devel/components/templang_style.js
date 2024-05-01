/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Styles and Stylesheet Management]
*/
        /*
         * [Styles and Stylesheet Management]
         */
        function GetstyleSheet(sheet_s){
            var name_s = sheet_s;
            if(sheet_s === null){
                name_s === 'default';
            }
            if(framework._styleSheets[name_s]){
                return framework._styleSheets[name_s];
            }
            for(var i = 0; i < document.styleSheets.length; i++){
                var s = document.styleSheets[i];
                if(!sheet_s){
                    if(!s.href){
                        framework._styleSheets[name_s] = {sheet: s, cls: {}};
                        return framework._styleSheets[name_s];
                    }
                }else if(s.href){
                    if(s.href && s.href.substring(s.href.length - sheet_s.length) === sheet_s){
                        framework._styleSheets[sheet_s] = {sheet: s, cls: {}};
                        return framework._styleSheets[sheet_s];
                    }
                }
            }
            return null;
        }

        function GetStyleRule(sheetObj, cls){
            if(sheetObj.cls[cls]){
                return sheetObj.cls[cls];
            }
            for(var i = 0; i < sheetObj.sheet.rules.length; i++){
                var rule = sheetObj.sheet.rules[i];
                if(rule.selectorText == cls){
                    sheetObj.cls[cls] = rule;
                    return rule;
                }
            }
            return null;
        }

        function ChangeStyle(sheet_s, name, att, value){
            var sheetObj = GetstyleSheet(sheet_s);
            if(sheetObj){
                const rule = GetStyleRule(sheetObj, name);
                if(!rule){
                }else{
                    rule.style[att] = value;
                }
            }
        }

        function El_SetStyle(node, att, value){
            if(node._idtag){
                const clsName = El_GetClsName(node);
                let rule_s = '.' + clsName;
                if(!GetStyleRule(GetstyleSheet(null), rule_s)){
                    rule_s +='{'+att+':'+value+'}';
                    AddStyle(null, rule_s);
                    node.classList.add(clsName);
                }else{
                    ChangeStyle(null, rule_s, att, value);
                }
            }
        }

        function El_SetSize(node, arg, unit){
            if(unit === '/w'){
                let w = window.innerWidth-1;
                const rect = node.getBoundingClientRect().width;
                if( rect.width < w){
                    w = rect.width-1;
                }
                El_SetStyle(node, 'width', (w / arg) + 'px');
                return (w / arg);
            }else if(unit === '/h'){
                let h = window.innerHeight-1;
                El_SetStyle(node, 'height', (h / arg) + 'px');
                return (h / arg);
            }else if (unit === 'w'){
                if(arg && arg.nodeType === Node.ELEMENT_NODE){
                    const rect = arg.getBoundingClientRect();
                    El_SetStyle(node, 'width', rect.width + 'px');
                    return rect.width;
                }
            }else if (unit === 'h'){
                if(arg && arg.nodeType === Node.ELEMENT_NODE){
                    const rect = arg.getBoundingClientRect();
                    El_SetStyle(node, 'height', rect.height + 'px');
                    return rect.width;
                }
            }
        }

        function El_GetClsName(el){
            if(el._idtag){
                return  'custom-' + el._idtag.replace('_', '-');
            }
            return null;
        }

        function El_SetStateStyle(node, templ, stateStyle){
            const classes = {};
            if(templ.name){
                classes.templ = templ.name.toLowerCase();
            }

            Style_ClsOverlay(classes, node.classes, templ.classes);

            let custom_rule = El_GetClsName(node);
            classes.custom = [custom_rule];
            if(stateStyle){
                if(typeof stateStyle === 'string'){
                    classes.state = [stateStyle];
                }else if(Array.isArray(stateStyle)){
                    classes.state = stateStyle;
                }
            }

            node.classes.state = classes.state;

            /*
            let style_s = Cash(templ.baseStyle, node.vars).result;
            if(style_s){
                const rule = '.' + custom_rule + ' {' + style_s + '}';
                if(!GetStyleRule(GetstyleSheet(null), custom_rule)){
                    AddStyle(null, rule);
                }
            }
            */

            while(node.classList.length){
                node.classList.remove(node.classList[0]);
            }

            const classList = Style_ToCls(classes);
            for(let i = 0; i < classList.length; i++){
                if(classList[i]){
                    node.classList.add(classList[i]);
                }
            }
        }

        function AddStyle(sheet_s, rule_s){
            var sheetObj = GetstyleSheet(sheet_s);
            if(sheetObj){
                sheetObj.sheet.insertRule(rule_s, sheetObj.sheet.rules.length);
            }
        }

        
        function Style_ClsOverlay(dest, into, from){
            dest._misc = dest._misc || [];
            for(let k in from){
                if(k == '_misc'){
                    dest[k] = dest[k].concat(from[k]);
                }else{
                    dest[k] = from[k];
                }
            }
            if(into){
                for(let k in into){
                    if(k == '_misc'){
                        dest[k] = dest[k].concat(into[k]);
                    }else{
                        dest[k] = into[k];
                    }
                }
            }
        }

        function Style_ToCls(classes){
            let cls = [];
            for(let k in  classes){
                cls = cls.concat(classes[k]);
            }
            return cls;
        }


        /* 
         *[Cash Variable-In-String Parser]
         *
         * This is the function that allows variables to exist in strings
         */
        function Cash(s, data, prepare){
            const result = {
                arg: s,
                result: null,
                isCash: false,
                vars: [],
            };
            
            if(!s){
                return "";
            }

            let state = STATE_TEXT;
            let key = "";
            let shelf = "";
            for(let i = 0; i < s.length; i++){
                const c = s.charAt(i);
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
                        shelf = "";
                        break;
                    }
                }else if(state == STATE_KEY){
                    if(c == '}'){
                        if(data){
                            var value = DataScope(key, data);
                            if(!value){
                                shelf = "";
                                break;
                            }
                            shelf += value;
                        }
                        if(prepare){
                            const destK = blankDestKLiteral(key);
                            result.vars.push(destK);
                            shelf += '${'+destK.key+'}';
                        }
                        result.isCash = true;
                        key = "";
                        state = STATE_TEXT;
                        continue;
                    }else{
                        key += c;
                    }
                }
            }

            result.result = shelf || s;
            if(prepare){
                result.arg = shelf;
            }

            return result;
        }
