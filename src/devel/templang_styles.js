/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation
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
            var rule = GetStyleRule(sheetObj, name);
            rule.style[att] = value;
        }
    }

    function El_SetStateStyle(node, templ, stateStyle, add){
        node.classList = [];
        for(var i = 0; i < templ.classes.length; i++){
            node.classList.add(templ.classes[i]);
        }

        let custom_rule = 'custom-' + node._idtag.replace('_', '-');

        let style_s = Cash(templ.baseStyle, node.vars).result;
        if(style_s){
            const rule = '.' + custom_rule + ' {' + style_s + '}';
            if(!GetStyleRule(GetstyleSheet(null), custom_rule)){
                AddStyle(null, rule);
            }
        }

        if(add && stateStyle){
            node.classList.add(stateStyle);
            if(custom_rule && style_s){
                node.classList.remove(custom_rule);
            }
        }else{
            if(stateStyle){
                node.classList.remove(stateStyle);
            }
            if(custom_rule && style_s){
                node.classList.add(custom_rule);
            }
        }
    }

    function El_SetClasses(node, templ, data){
        if(!data){
            data = {};
            GatherData(node, templ.classIfCond, data);
        }

        const cond = templ.classIfCond;
        if(cond && cond.key){
            const propval = data[cond.key];
            if(propval !== null && propval === node.vars[cond.dest_key]){
                node.classList.add(cond.value); 
            }else{
                node.classList.remove(cond.value); 
            }
        }
    }


    function AddStyle(sheet_s, rule_s){
        var sheetObj = GetstyleSheet(sheet_s);
        if(sheetObj){
            sheetObj.sheet.insertRule(rule_s, sheetObj.sheet.rules.length);
        }
    }
