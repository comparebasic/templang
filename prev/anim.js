function Anim_Init(){
    var TICK_LENGTH = 16;
    var queue = {};
    var queueStash = {};

    var anim_idx = 0;

    function RemoveNode(phase, _){
        if(phase.target){
            phase.target.remove();
        }
    }

    var prevTick = Date.now();
    function tick(amount){
        var now = Date.now()
        var delta = now - prevTick;
        var removes = [];
        for(var k in queue){
            var a = queue[k];
            var p = a.phases[a._phase_i];

            if(typeof p._progress === 'undefined'){
                p._progress = 0;
            }
            var done = false;
            if(p){
                p._progress += delta;
                if(p.duration && p.targetObj){
                    var val = null;
                    if(p._progress >= p.duration){
                        val = p.end;
                        done = true;
                    }else{
                        if(typeof p.start !== 'undefined'){
                            val = p.start + ((p.end - p.start) * (p._progress / p.duration));
                        }else if( typeof p.set !== 'undefined'){
                            val = p.set;
                        }
                    }
                    if(val !== null){
                        if(p.metric){
                            val += p.metric;
                        }

                        p.targetObj[p.prop] = val;
                    }
                }else{
                    if(p._progress >= p.duration){
                        done = true;
                    }
                }
            }else{
                done = true;
            }

            if(done){
                a._phase_i++;
                if(a._phase_i < a.phases.length){
                    p = a.phases[a._phase_i];
                    if(!p.duration){
                        var finalmax = a.phases.length;
                        var i = 0;
                        while(++i < finalmax){
                            if(a._phase_i >= a.phases.length){
                                break;
                            }

                            if(p.action){
                                p.action(a);
                                a._phase_i++;
                            }else if(p.stash){
                                queueStash[a.idtag] = a;
                                a._phase_i++;
                            }else{
                                a._phase_i++;
                            }
                        }
                        if(i > finalmax){
                            console.error('Error: Final max exceeded in Anim');
                        }
                    }
                }
            }

            if(a._phase_i >= a.phases.length){
                removes.push(a.idtag);
            }
        }

        prevTick = now;
        for(var i = 0; i < removes.length; i++){
            RemoveAnim(removes[i]);
        }
    }

    function PushAnim(phases){
        anim_idx++;
        var idtag = 'anim_'+anim_idx;
        queue[idtag] = {
            idtag: idtag,
            phases: phases,
            _phase_i: 0
        };

        for(var i = 0; i < phases; i++){
            var p = phases[i];
            if(p.target && p._anim_tag){
                RemoveAnim(p._anim_tag);
            }
        }
        for(var i = 0; i < phases; i++){
            var p = phases[i];
            if(p.target){
                p.target._anim_tag = idtag;
            }
        }

        Run();
        return idtag;
    }

    function GetAnim(idtag){
        if(queue[idtag]){
            return queue[idtag];
        }
        if(queueStash[idtag]){
            return queueStash[idtag];
        }
        return null;
    }

    function UnStashAnim(a){
        if(a){
            if(queueStash[a.idtag]){
                delete queueStash[a.idtag];
            }
        }
    }

    function RemoveAnim(idtag){
        if(queue[idtag]){
            var a = queue[idtag];
            for(var i = 0; i <  a.phases.length; i++){
                var p = a.phases[i];
                if(p.target){
                    delete p.target['_anim_tag'];
                }
            }
            delete queue[idtag];
        }
        if(Object.keys(queue).length == 0){
            Stop();
        }
    }

    var interval = -1;
    function Run(){
        prevTick = Date.now();
        if(interval === -1){
            interval = setInterval(tick,TICK_LENGTH);
        }
    }

    function Stop(){
        clearInterval(interval);
        interval = -1;
    }

    return {
        PushAnim: PushAnim, 
        RemoveAnim, RemoveAnim,
        GetAnim: GetAnim,
        UnStashAnim: UnStashAnim,
        Run: Run,
        Stop: Stop,
    };
}
