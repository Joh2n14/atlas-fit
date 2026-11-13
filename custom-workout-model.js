'use strict';
// Calculs locaux et format des séances libres. Les anciennes séances restent compatibles.
const CustomWorkout = (() => {
  const singleDumbbell = new Set(['rowing-halteres','pullover','curl-concentration','extension-nuque','kickback','squat-goblet','hip-thrust-halteres']);
  const alternating = new Set(['curl-halteres','curl-marteau']);
  const unilateral = new Set(['rowing-halteres','curl-concentration','kickback','fentes','fentes-halteres','bulgare','step-up','kickback-poulie','bird-dog','dead-bug','mountain-climbers','bicycle-crunch']);
  const ascent = new Set(['cf-thruster','cf-wall-ball','cf-overhead-squat','squat-barre','front-squat','squat-goblet','squat-corps','fentes','fentes-halteres','bulgare','step-up']);
  const number = v => Number(String(v).replace(',','.'));
  const bounded = (v,min,max,fallback) => Number.isFinite(number(v)) ? Math.min(max,Math.max(min,number(v))) : fallback;
  function equipment(ex) {
    const count=ex.gear==='halteres'?(singleDumbbell.has(ex.id)?1:2):['barre','machine','poulie','kettlebell','wallball'].includes(ex.gear)?1:0;
    return {count,assistance:ex.id==='traction-assistee',dumbbell:ex.gear==='halteres'};
  }
  function repetitionLabel(ex) {
    if(ex.unit==='sec')return 'Secondes';
    if(alternating.has(ex.id))return 'Répétitions par bras';
    return unilateral.has(ex.id)?'Répétitions au total (deux côtés)':'Répétitions';
  }
  function entry(ex) {return {id:ex.id,sets:3,reps:ex.unit==='sec'?30:10,rest:60,tempo:3,ascentCm:null};}
  function normalize(e,ex) {
    return {id:ex.id,sets:Math.round(bounded(e.sets,1,20,3)),reps:Math.round(bounded(e.reps,1,ex.unit==='sec'?3600:500,10)),rest:Math.round(bounded(e.rest,0,900,60)),tempo:3,ascentCm:e.ascentCm==null||e.ascentCm===''?null:bounded(e.ascentCm,0,200,0)};
  }
  function estimate(entries,lookup) {
    const valid=entries.filter(e=>lookup(e.id));
    return valid.reduce((sum,e)=>sum+e.sets*e.reps*(lookup(e.id).unit==='sec'?1:3*(alternating.has(e.id)?2:1))+Math.max(0,e.sets-1)*e.rest,0)+Math.max(0,valid.length-1)*60;
  }
  function current(d) {
    for(const e of d.exercises){const i=d.sets[e.id].findIndex(s=>!s.done&&!s.skipped);if(i>=0)return {entry:e,set:d.sets[e.id][i],index:i};}
    return null;
  }
  function create(plan,lookup,memory,options) {
    const exercises=plan.exercises.filter(e=>lookup(e.id)).map(e=>normalize(e,lookup(e.id)));
    const sets={};
    for(const e of exercises){const count=equipment(lookup(e.id)).count;const remembered=memory[e.id];
      sets[e.id]=Array.from({length:e.sets},()=>({reps:e.reps,loads:Array.from({length:count},(_,i)=>Number.isFinite(remembered?.[i])?remembered[i]:null),kg:0,done:false,skipped:false,prepared:count===0}));
    }
    return {kind:'custom',id:options.id,dayId:'custom',title:plan.title||'Ma séance personnalisée',date:new Date(options.now).toISOString(),startedAtMs:options.now,bodyWeight:options.bodyWeight||null,avatar:options.avatar||null,exercises,sets,restEndsAt:0,notes:''};
  }
  function setLoads(d,lookup,loads,memory){
    const c=current(d);if(!c)return;
    const count=equipment(lookup(c.entry.id)).count;
    if(loads.length!==count||loads.some(v=>v!==null&&(!Number.isFinite(v)||v<0||v>1500)))throw Error('Charge invalide');
    c.set.loads=[...loads];c.set.prepared=true;
    memory[c.entry.id]=[...loads];
    for(const s of d.sets[c.entry.id])if(!s.done&&!s.skipped&&s!==c.set)s.loads=[...loads];
  }
  function complete(d,lookup,reps,now){
    const c=current(d);if(!c||!c.set.prepared||d.pausedAt!=null)return false;
    if(!Number.isInteger(reps)||reps<1||reps>(lookup(c.entry.id).unit==='sec'?3600:500))return false;
    c.set.reps=reps;c.set.done=true;c.set.completedAt=now;
    c.set.kg=equipment(lookup(c.entry.id)).assistance?0:c.set.loads.reduce((sum,x)=>sum+(x||0),0);
    const next=current(d);d.restEndsAt=next?now+c.entry.rest*1000:0;return true;
  }
  function finish(d,lookup,now){
    const exercises=[];let missingLoads=0,ascentMeters=0,ascentSets=0,missingAscent=0,totalSets=0,doneSets=0;
    for(const e of d.exercises){const ex=lookup(e.id),all=d.sets[e.id],valid=all.filter(s=>s.done);totalSets+=all.length;doneSets+=valid.length;
      if(valid.length)exercises.push({id:e.id,sets:valid.map(s=>({kg:s.kg,reps:s.reps,loads:[...s.loads],assistance:equipment(ex).assistance}))});
      for(const s of valid){if(s.loads.some(v=>v===null))missingLoads++;if(ascent.has(e.id)){ascentSets++;if(e.ascentCm===null)missingAscent++;else ascentMeters+=e.ascentCm/100*s.reps;}}
    }
    const durationSeconds=Math.floor(elapsed(d,now));
    const volumeKg=exercises.reduce((sum,e)=>sum+(lookup(e.id).unit==='sec'?0:e.sets.reduce((n,s)=>n+s.kg*s.reps,0)),0);
    return {id:d.id,kind:'custom',dayId:'custom',title:d.title,date:new Date(now).toISOString(),startedAt:d.date,notes:d.notes,exercises,
      summary:{durationSeconds,pauseExcluded:true,bodyWeight:d.bodyWeight,calories:d.bodyWeight&&doneSets?3.5*3.5*d.bodyWeight/200*(durationSeconds/60):null,met:3.5,volumeKg,doneSets,totalSets,missingLoads,ascentMeters:ascentSets?ascentMeters:null,missingAscent,ascentSets,avatar:d.avatar}};
  }
  function elapsed(d,now){return Math.max(0,((d.pausedAt??now)-d.startedAtMs-(d.pausedMs||0))/1000);}
  function pause(d,now){if(d.pausedAt!=null)return;d.pausedAt=now;d.restRemaining=Math.max(0,d.restEndsAt-now);}
  function resume(d,now){if(d.pausedAt==null)return;d.pausedMs=(d.pausedMs||0)+Math.max(0,now-d.pausedAt);d.pausedAt=null;d.restEndsAt=d.restRemaining?now+d.restRemaining:0;d.restRemaining=0;}
  function clock(seconds){seconds=Math.max(0,Math.floor(seconds));const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
  return {equipment,repetitionLabel,entry,normalize,estimate,current,create,setLoads,complete,finish,clock,ascent,elapsed,pause,resume};
})();
