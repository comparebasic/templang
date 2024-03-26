function Anim_Init(){
    var TICK_LENGTH = 32;
    var queue = {};
    var queueStash = {};

    var anim_idx = 0;

    function RemoveNode(phase, _){
        if(phase.target){
            console.log('REMOVING', phase.target);
            phase.target.remove();
        }
    }

    var prevTick = Date.now();
    function tick(amount){
        var now = Date.now()
        var delta = now - prevTick;
        for(var k in queue){
            var a = queue[k];
            var p = a.phases[a._phase_i];
            if(typeof p._progress === 'undefined'){
                p._progress = 0;
            }
            var done = false;
            if(p){
                p._progress += delta;
                var val = null;
                if(p.duration){
                    if(p._progress >= p.duration){
                        console.log('END');
                        val = p.end;
                        done = true;
                    }else{
                        val = p.start + ((p.end - p.start) * (p._progress / p.duration));
                    }
                }

                if(val !== null){
                    if(p.metric){
                        val += p.metric;
                    }

                    p.targetObj[p.prop] = val;
                }
            }else{
                done = true;
            }

            if(done){
                a._phase_i++;
                while(done){
                    p = a.phases[a._phase_i];
                    if(p && !p.duration){
                        if(p.action){
                            p.action(p, a);
                            a._phase_i++;
                        }else if(p.stash){
                            queueStash[a.idtag] = a;
                            a._phase_i++;
                            done = false;
                        }else{
                            done = false;
                        }
                    }
                }
            }

            if(a._phase_i >= a.phases.length){
                RemoveAnim(a.idtag);
            }
        }

        prevTick = now;
    }

    function PushAnim(phases){
        anim_idx++;
        var idtag = 'anim_'+anim_idx;
        queue[idtag] = {
            idtag: idtag,
            phases: phases,
            _phase_i: 0
        };

        Run();
        return idtag;
    }

    function GetAnim(idtag){
        if(queue[idtag]){
            return queue[idtag];
        }
        if(queueStash[idtag]){
            var a = queueStash[idtag];
            delete queueStash[idtag];
            return a;
        }
        return null;
    }

    function RemoveAnim(idtag){
        if(queue[idtag]){
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
        interval = -1;
    }

    function Stop(){
        clearInterval(interval);
    }

    return {
        PushAnim: PushAnim, 
        RemoveAnim, RemoveAnim,
        GetAnim: GetAnim,
        Run: Run,
        Stop: Stop,
    };
}
