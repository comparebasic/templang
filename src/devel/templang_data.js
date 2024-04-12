/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation
*/

    /*
     * [Data And Context Functions]
     */
    function Data_MakeCtx(data){
        if(!data._ctx){
            return {_ctx: {vars: {}}, current: data, prevData: []};
        }
        return data;
    }

    function Data_Outdent(){
        framework._ctx.prevData.pop();
        framework._ctx.data = framework._ctx.prevData[0];
        framework._ctx.currentData = framework._ctx.data;
        framework._ctx.current_idx = 0;
    }

    function ResetCtx(args){
        if(typeof framework._ctx === 'undefined'){
           framework._ctx =  {vars: {}, data: {}, current_idx: 0, currentData: {}, prevData:[], ev: null};
        }
        if(args.data){
            const data = args.data;
            framework._ctx.data = data;
            framework._ctx.currentData = data;
            framework._ctx.current_idx = 0;
            if(framework._ctx.prevData.indexOf(data) == -1){
                framework._ctx.prevData.push(data);
            }
        }else{
            framework._ctx.currentData = null;
            framework._ctx.current_idx = 0;
        }

        if(args.ev !== undefined){
            framework._ctx.ev = args.ev;
        }

        if(!args.preserveVars){
            framework._ctx.vars = {};
        }
    }

    function ClearCtx(){
        framework._ctx.vars = {};
        framework._ctx.data = {};
        framework._ctx.currentData = {};
        framework._ctx.prevData = [];
    }

    function PopDataCtx(data){
        const idx = framework._ctx.prevData.length;
        if(idx == 0){
           return null; 
        }

        idx--;
        if(data === framework._ctx.prevData[idx]){
            return framework._ctx.prevData.pop();
        }

       return null; 
    }

    function DataScope(sel, data){
        if(data && data[sel]){
            return data[sel];
        }
        return null;
    }

    function Data_Search(key, nest, order){
        let value = null;
        if(!order){
            order = [DIRECTION_VARS, DIRECTION_CURRENT_DATA, DIRECTION_DATA, DIRECTION_PREV_DATA];
        }
        for(var i = 0; i < order.length; i++){
            if(order[i] === DIRECTION_DATA){
                const data = framework._ctx.data;
                if(data[key]){
                    if(nest){
                        framework._ctx.data = data[key];
                        framework._ctx.prevData.push(framework._ctx.data);
                        framework._ctx.currentData = data[key];
                    }
                    return {type: 'data', value: data[key]};
                }
            }else if(order[i] === DIRECTION_CURRENT_DATA){
                const data = framework._ctx.currentData;
                if(data && data[key]){
                    return {type: 'currentData', value: data[key]};
                }
            }else if(order[i] === DIRECTION_VARS){
                if(framework._ctx.vars[key]){
                    value = framework._ctx.vars[key];
                    if(nest){
                        if(typeof value === 'object'){
                            if(framework._ctx && framework._ctx.prevData.indexOf(value) == -1){
                                framework._ctx.prevData.push(value);
                            }
                            framework._ctx.currentData = value;
                        }
                    }
                    return {type: 'vars', value: value};
                }
            }else if(order[i] === DIRECTION_PREV_DATA){
                let idx = framework._ctx.prevData.length;
                for(let i = idx-1; i >= 0; i--){
                    const curData = framework._ctx.prevData[i];
                    if(curData[key]){
                        return {type: 'prevData', value: curData[key]};
                    }
                }
            }
        }

        return null;
    }
