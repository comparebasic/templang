/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Transactions and Changes]
*/
        /* 
         * [Transactions and Changes]
         */

         function View_Destroy(node){
            if(node._dropKey && node._view ){
                if(framework._drag && framework._drag.byName[node._dropKey][node._idtag]){
                    console.log('view exists');
                }else{
                    console.log('no eisting view', framework._drag.byName);
                }
            }
         }

         function Transaction_New(type, origObj, newObj, complete){
            return {
                changeType: type,
                origObj: origObj,
                newObj: newObj,
                complete: complete
            };
         }

         function Content_AddPending(content, trans){
            content._changes = content._changes || {
                pending: [],
                done: []
            };
            content._changes.pending.push(trans);
         }

         function Transaction_Register(trans){
            Content_AddPending(trans.origObj.content, trans);
            Content_Transact(trans.origObj.content);
            console.log('TRANS WHEN DONE', trans);
            if(typeof trans.newObj ===  'object' && trans.newObj.content._idtag !== trans.origObj.content._idtag){
                console.log('Transacting new content too', trans.newObj.content);
                Content_AddPending(trans.newObj.content, trans);
                Content_Transact(trans.newObj.content);
            }
         }

         function El_CompareContent(node, content){
            return node._content_idtag && node._content_idtag === content._idtag;
         }

         function _Transaction_CheckAlignment(content, view){
            let el = view.container.firstChild;
            for(let i = 0; el && i < content.length; /* in body */){
                if(el.nodeType === Node.ELEMENT_NODE && el.flags & FLAG_DRAG_TARGET){
                    if(el._content_idtag !== content[i]._idtag){
                        console.error('_Transaction_CheckAlignment: nodes do not align to content at' + i + ' ' +el._content_idtag + ' vs ' + content[i]._idtag + ' "' + el.innerHTML + '"', content);
                        break;
                    }
                    if(el !== view.el_li[i].el){
                        console.error('_Transaction_CheckAlignment: ei_li does not align at ' + i + ' ' + el._idtag + ' vs ' + view.el_li[i].el._idtag + ' "'+ el.innerHTML + '" ', view.el_li);
                        break;
                    }
                    i++;
                }

                el = el.nextSibling;
            }
         }

         function Transaction_ModifyView(content, trans, view){
            const startIdx = trans.origObj.idx;
            let endIdx = trans.newObj.idx;
            if(startIdx == endIdx && trans.origObj.content === trans.newObj.content){
                return true;
            }

            const node = trans.origObj.node;
            if(trans.origObj.content === content){
                view.el_li.splice(startIdx, 1);
            }

            if(trans.origObj.content === trans.newObj.content){
                if(endIdx < startIdx){
                    endIdx++;
                }


                view.el_li.splice(endIdx, 0, {
                    el: node,
                    pos: getDragPos(node),
                });
            }else{
                const node = trans.newObj.node;
                trans.newObj.view.el_li.splice(endIdx, 0, {
                    el: node,
                    pos: getDragPos(node),
                });
            }

            return true;
         }

         function Transaction_ModifyNodes(content, trans, view){
            let el = view.container.firstChild;
            let start_el = el;
            const startIdx = trans.origObj.idx;
            let endIdx = trans.newObj.idx;
            let r = false;
            let moveNode = null;
            
            if((typeof trans.origObj === 'object') && content == trans.origObj.content){
                if(startIdx == endIdx){
                    return true;
                }

                for(idx = 0; el && idx <= startIdx; /* incr in body */){
                    if(el.nodeType == Node.ELEMENT_NODE && (el.flags & FLAG_DRAG_TARGET)){
                        if(idx === startIdx){
                            moveNode = el;
                            break;
                        }
                        idx++;
                    }

                    el = el.nextSibling;
                }

            }

            if(!moveNode){
                console.warn('Transaction_ModifyNodes: did not find node to move', startIdx);
                return false;
            }

            if((typeof trans.newObj === 'object') && content === trans.newObj.content){
                el = start_el;
                for(idx = 0; el && idx <= endIdx; /* incr in body */){
                    if(el.nodeType == Node.ELEMENT_NODE && (el.flags & FLAG_DRAG_TARGET)){
                        if(idx === endIdx){
                            el.parentNode.insertBefore(moveNode, el.nextSibling);
                            r = true;
                        }
                        idx++;
                    }

                    el = el.nextSibling;
                }
            }else{
                moveNode.remove();

                el = trans.newObj.view.container.firstChild;
                moveNode = null;
                for(idx = 0; el && idx <= endIdx; /* incr in body */){
                    if(el.nodeType == Node.ELEMENT_NODE && (el.flags & FLAG_DRAG_TARGET)){
                        if(idx === endIdx){
                            moveNode = el;
                            break;
                        }
                        idx++;
                    }

                    el = el.nextSibling;
                }

                if(!moveNode){
                    console.warn('dest node for move-change not found');
                }

                const subData = Data_Sub(trans.origObj.data);
                const templ = trans.newObj.view.templ;
                console.log('making thing for', content);
                const node = El_MakeChild(templ, trans.newObj.view.container, subData, {after: el});
                trans.newObj.node = node;
            }

            Transaction_ModifyView(content, trans, view);

            return r;
         }

         function Transaction_AddNodes(trans, view){
            const node = El_Make(trans.newObj, view.container, Data_Sub(trans.origObj));
            if(node){
                return true;
            }
            return false;
         }

         function Transaction_AddContent(content, trans){
            content.push(trans.origObj);
            return true;
         }

         function Transaction_ShiftNodes(trans, view){
            const node = El_Make(trans.newObj, view.container, Data_Sub(trans.origObj), {shift: true});
            if(node){
                return true;
            }
            return false;
         }

         function Transaction_ShiftContent(content, trans){
            content.unshift(trans.origObj);
            return true;
         }

         function Transaction_ModifyContent(content, trans){
            const startIdx = trans.origObj.idx;
            let endIdx = trans.newObj.idx;
            if(startIdx == endIdx){
                return true;
            }

            const item = trans.origObj.content[startIdx]; 

            if((typeof trans.newObj === 'object') && content === trans.newObj.content){
                trans.origObj.content.splice(startIdx, 1);
                if(endIdx < startIdx){
                    endIdx++;
                }
            }else{
                trans.newObj.content.splice(endIdx+1, 0, item);
            }

            return true;
         }

         function Content_Transact(content){
            if(!content._transacting){
                content._transacting = true;
                for(let i = 0; i < content._changes.pending.length;/* no increment unless there is an error */){
                    let r = true;
                    const trans = content._changes.pending[i];
                    if(trans.changeType === 'add'){
                        r = Transaction_AddContent(content, trans); 
                        if(r){
                            for(let k in content._views){
                                Transaction_AddNodes(trans, content._views[k]); 
                            }
                        }
                    }else if(trans.changeType === 'shift'){
                        r = Transaction_ShiftContent(content, trans); 
                        if(r){
                            for(let k in content._views){
                                Transaction_ShiftNodes(trans, content._views[k]); 
                            }
                        }
                    }else if(trans.changeType === "move"){
                        r = Transaction_ModifyContent(content, trans); 
                        if(r){
                            for(let k in content._views){
                                Transaction_ModifyNodes(content, trans, content._views[k]); 
                                _Transaction_CheckAlignment(content, content._views[k]);
                            }
                        }
                    }

                    if(r){
                       content._changes.pending.splice(i, 1); 
                       content._changes.done.push(trans);
                       trans.execTime = Date.now();
                       if(trans.complete){
                            trans.complete();
                       }
                    }else{
                        if(!("failTimes" in trans)){
                            trans.failTimes = [];
                        }
                       trans.failTimes.push(Date.now());
                       i++;
                    }
                }
                content._transacting = false;
            }else{
                setTimeout(function(){
                    Content_Transact(content);
                }, TRANS_RETRY);
            }
         }
         
         function Content_FindByTag(content, tag){
            for(let i = 0; i < content.length; i++){
                if(tag === content[i]._idtag){
                    return content[i];
                }
            }

            return null;
         }

         function Changes_Add(trans, changes){
             if(changes){
                const from = Content_FindByTag(trans.origObj.content, trans.origObj.content_idtag);
                const to = Content_FindByTag(trans.newObj.content, trans.newObj.content_idtag);
                const ch = {
                    time: (new Date(trans.execTime)).toISOString(),
                    type: trans.changeType,
                    target: from && from.text,
                    dest: to && to.text,
                    content: changes
                };
                changes.unshift(ch);
                Transaction_Register(
                    Transaction_New('shift', ch, 'change-log')
                );
             }
         }
