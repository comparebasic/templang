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
                var val = null;
                if(p.duration){
                    if(p._progress >= p.duration){
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
                var finalized = false;
                a._phase_i++;
                while(!finalized){
                    if(a._phase_i >= a.phases.length){
                        finalized = true
                        continue;
                    }
                    p = a.phases[a._phase_i];
                    if(!p.duration){
                        if(p.action){
                            p.action(p, a);
                            a._phase_i++;
                        }else if(p.stash){
                            queueStash[a.idtag] = a;
                            a._phase_i++;
                        }else{
                            a._phase_i++;
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
            console.log('REMOVEING at end', a.idtag);
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
            var a = queueStash[idtag];
            delete queueStash[idtag];
            return a;
        }
        return null;
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
            console.log('----- ANIM RUN -----', interval);
        }
    }

    function Stop(){
        console.log('----- ANIM STOPPED -----');
        clearInterval(interval);
        interval = -1;
    }

    return {
        PushAnim: PushAnim, 
        RemoveAnim, RemoveAnim,
        GetAnim: GetAnim,
        Run: Run,
        Stop: Stop,
    };
}
