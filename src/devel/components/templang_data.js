/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Data And Context Functions]
*/

        /*
         * [Data And Context Functions]
         */
        function Data_Add(ctx, dataOrKey, data){
            if(typeof dataOrKey === 'object'){

                for(let k in dataOrKey){
                    ctx.data[k] = dataOrKey[k]; 
                }
            }else if(typeof dataOrKey === 'string'){
                ctx.data[dataOrKey] = data; 
            }
        }

        function Data_Set(dataOrKey, data){
            Data_Add(framework.dataCtx, dataOrKey, data);
        }

        function Data_Push(ctx, key, data){
            const _data = {};
            _data[key] = data;
            const prev = [ctx];

            return {
                key: key,
                data: _data,
                vars: (ctx && ctx.vars) || {},
                idx: -1,
                isArr: false,
                isSub: true,
                prev: ctx && (Array.isArray(ctx.prev) && prev.concat(ctx.prev)) || prev,
                view: (ctx && ctx.view) || {},
                qcache: {},
            };
        }

        function Data_Sub(data, key, order, destK){
            let ctx = null;

            if(data === null || data === undefined){
                return null;
            }else if(data.data){
                ctx = data; 
                data = data.data;
            }

            if(order && ctx){
                data = Data_Search(ctx, key, order).value;
                const prev = [ctx];
                if(data){
                    return {
                        key: null,
                        data: data,
                        vars: (ctx && ctx.vars) || {},
                        idx: key,
                        isArr: false,
                        isSub: true,
                        prev: ctx && (Array.isArray(ctx.prev) && prev.concat(ctx.prev)) || prev,
                        view: (ctx && ctx.view) || {},
                        qcache: {},
                    };
                }
            }

            if(destK){
                if(destK.comparison === ASSIGN){
                    let k = destK.key;
                    let v = ctx.vars[destK.key];
                    if(!v){
                        key = 0;
                    }else{
                        if(destK.cash.isCash){
                            k = Cash(k, ctx.data).result;
                            console.debug('Yay', k);
                        }
                    }
                }
            }

            if((typeof key === 'number')){
                if(Array.isArray(data) && key < data.length){
                    return {
                        key: key,
                        data: data[key],
                        vars: (ctx && ctx.vars) || {},
                        idx: key,
                        isArr: false,
                        isSub: true,
                        prev: ctx && (Array.isArray(ctx.prev) && [].concat(ctx.prev)) || [ctx],
                        view: (ctx && ctx.view) || {},
                        qcache: {},
                    };
                }else{
                    return null;
                }
            }else if(key){
                if(data[key]){
                    return {
                        key: key,
                        data: data[key],
                        vars: (ctx && ctx.vars) || {},
                        idx: -1,
                        isArr: Array.isArray(data[key]),
                        isSub: true,
                        prev: ctx && (Array.isArray(ctx.prev) && [].concat(ctx.prev)) || [ctx],
                        view: (ctx && ctx.view) || {},
                        // this will be an El_Query cache at some point
                        qcache: {},
                    };
                }else{
                    return null;
                }
            }else{
                return {
                    key: null,
                    data: data,
                    idx: -1,
                    isArr: false,
                    isSub: false,
                    vars: (ctx && ctx.vars) || {},
                    prev: ctx && (Array.isArray(ctx.prev) && [].concat(ctx.prev)) || [ctx],
                    view: {},
                    qcache: {},
                };
            }
        }

        function Data_Next(ctx){
            if(!ctx.isArr){
                return;
            }

            return Data_Sub(ctx, ++ctx.idx, [DIRECTION_DATA]); 
        }

        function ResetCtx(args){
            if(!("_ctx" in framework)){
               framework._ctx =  {vars: {}, ev: null, ev_trail: []};
            }

            if(args.ev !== undefined){
                framework._ctx.ev = args.ev;
            }

            if(!args.preserveVars){
                framework._ctx.vars = {};
            }

            framework._ctx.ev_trail = [];
        }

        function LogCtx(msg){
            if(DEBUG_EVENTS){
                if(framework._ctx){
                    debug(msg + ' '+framework._ctx.ev_trail.join(', '), framework._ctx.vars, COLOR_GREY);
                }
            }
        }

        function DataScope(sel, data){
            if(data && data[sel]){
                return data[sel];
            }
            return null;
        }

        function Data_Search(ctx, key, order){
            /*
            console.log('Data_Search "' + key + '" order: '+order, ctx);
            console.log('Data_Search "' + key + '" order: '+order + ' global', framework.dataCtx);
            */

            let value = null;
            let type = null;
            let found = null;
            if(!order){
                order = [DIRECTION_VARS, DIRECTION_DATA, DIRECTION_GLOBAL, DIRECTION_PRIOR];
            }
            for(var i = 0; i < order.length; i++){
                if(order[i] === DIRECTION_DATA){
                    found = ctx.data[key];
                }else if(order[i] === DIRECTION_VARS){
                    if(ctx.vars[key] !== undefined){
                        found = ctx.vars[key];
                    }
                }else if(order[i] === DIRECTION_GLOBAL){
                    let data = framework.dataCtx.data;
                    if(typeof key === 'object' && Array.isArray(key)){
                        let i = 0;
                        let key_k = key[i];
                        while((i < key.length) && (data = data[key[i]])){
                            i++;
                        }
                    }
                    if(data){
                        found = data;
                    }
                    if(framework.dataCtx.data[key] !== undefined){
                        found = framework.dataCtx.data[key];
                    }
                }
                if(found){
                    value = found;
                    break;
                }
            }

            return {value: value, type: type};
        }

