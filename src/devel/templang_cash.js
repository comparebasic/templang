/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation
*/


    /* 
     *[Cash Variable-in-strin Parser]
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
