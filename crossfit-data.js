'use strict';
// Références : crossfit.com/benchmark/{cindy,annie,helen,fran,grace}.
// Les variantes adaptées sont des propositions ATLAS, non des standards de score Rx.
const CF_EXERCISES=[
 {id:'cf-thruster',name:'Thruster à la barre',muscle:'Quadriceps',gear:'barre',type:'poly',unit:'rep',tip:'Barre devant les épaules, effectue un squat puis prolonge la poussée des jambes jusqu’à tendre les bras au-dessus de la tête. Garde les talons stables et le tronc gainé.'},
 {id:'cf-clean-jerk',name:'Épaulé-jeté en puissance',muscle:'Épaules',gear:'barre',type:'poly',unit:'rep',tip:'Décolle la barre près du corps, réceptionne-la sur les épaules avec une légère flexion, puis utilise une nouvelle impulsion des jambes pour la stabiliser au-dessus de la tête. Apprends le mouvement à charge légère avant de le chronométrer.'},
 {id:'cf-swing',name:'Swing américain avec kettlebell',muscle:'Fessiers',gear:'kettlebell',type:'poly',unit:'rep',tip:'Recule les hanches, dos neutre, puis propulse la kettlebell avec les hanches. Accompagne-la au-dessus de la tête sans creuser le dos. Adapte la charge et l’amplitude à ton contrôle.'},
 {id:'cf-double-under',name:'Double saut à la corde',muscle:'Mollets',gear:'corde',type:'poly',unit:'rep',tip:'Un saut vertical, deux passages de corde sous les pieds. Garde les coudes près du corps et tourne surtout les poignets. Réception souple. Une répétition correspond à un saut réussi.'},
 {id:'cf-single-under',name:'Saut simple à la corde',muscle:'Mollets',gear:'corde',type:'poly',unit:'rep',tip:'Petits sauts réguliers, un passage de corde sous les pieds à chaque saut. Coudes près du buste et réception souple.'},
 {id:'cf-situp',name:'Sit-up au sol',muscle:'Abdominaux',gear:'corps',type:'iso',unit:'rep',tip:'Allongé, genoux ouverts et plantes des pieds ensemble, relève le buste jusqu’à toucher les pieds, puis redescends avec contrôle. Un petit coussin abdominal est facultatif.'},
 {id:'cf-run',name:'Course à pied',muscle:'Quadriceps',gear:'course',type:'poly',unit:'sec',tip:'Cours à une allure régulière sur un parcours mesuré. Dans CrossFit, valide les mètres réellement parcourus ; dans une séance classique ou libre, saisis la durée en secondes.'},
 {id:'cf-ring-row',name:'Tirage aux anneaux',muscle:'Dos',gear:'anneaux',type:'poly',unit:'rep',tip:'Anneaux fixés solidement, corps aligné et pieds au sol. Tire la poitrine vers les anneaux puis tends les bras avec contrôle. Redresse le corps pour diminuer la difficulté.'}
];
Object.assign(GEAR_NAMES,{kettlebell:'Kettlebell',corde:'Corde à sauter',course:'Parcours de course',anneaux:'Anneaux de gymnastique'});
for(const ex of CF_EXERCISES){if(!EXERCISES.some(e=>e.id===ex.id))EXERCISES.push(ex);EXERCISE_MEDIA[ex.id]='media/exercises/'+ex.id;}
const CF_LIBRARY_IDS=new Set([...CF_EXERCISES.map(e=>e.id),'tractions','pompes','pompes-inclinees','squat-corps']);
const CF_WORKOUTS=[
 {id:'cindy',name:'Cindy',tag:'Endurance · Poids du corps',format:'amrap',time:1200,scaledTime:720,hint:'20 min fixes',scaledHint:'12 min fixes',gear:'Barre de traction',scaledGear:'Anneaux et support stable pour les pompes',rx:[['tractions',5],['pompes',10],['squat-corps',15]],scaled:[['cf-ring-row',3],['pompes-inclinees',6],['squat-corps',9]]},
 {id:'annie',name:'Annie',tag:'Coordination · Sangle abdominale',format:'time',rounds:[50,40,30,20,10],scaledRounds:[35,25,15,10,5],hint:'Repère : 10–12 min',scaledHint:'Repère : 10–12 min',gear:'Corde à sauter, tapis ; coussin abdominal facultatif',rx:[['cf-double-under','round'],['cf-situp','round']],scaled:[['cf-single-under','round'],['cf-situp','round']]},
 {id:'helen',name:'Helen',tag:'Course · Force-endurance',format:'time',rounds:[1,1,1],hint:'Repère : moins de 15 min',scaledHint:'Repère : moins de 15 min',gear:'Parcours de 400 m, kettlebell, barre de traction',scaledGear:'Parcours de 200 m, kettlebell, anneaux',rx:[['cf-run',400,'m'],['cf-swing',21,'rep',24,16],['tractions',12]],scaled:[['cf-run',200,'m'],['cf-swing',15,'rep',12,8],['cf-ring-row',9]]},
 {id:'fran',name:'Fran',tag:'Barre · Tractions',format:'time',rounds:[21,15,9],hint:'Repère : jusqu’à 10–12 min',scaledHint:'Repère : jusqu’à 10–12 min',gear:'Barre, disques, barre de traction',scaledGear:'Barre, disques, anneaux',rx:[['cf-thruster','round','rep',43,29.5],['tractions','round']],scaled:[['cf-thruster','round','rep',20,15],['cf-ring-row','round']]},
 {id:'grace',name:'Grace',tag:'Haltérophilie · Puissance',format:'time',rounds:[1],hint:'Repère : moins de 7 min',scaledHint:'Repère : moins de 7 min',gear:'Barre et disques',rx:[['cf-clean-jerk',30,'rep',61,43]],scaled:[['cf-clean-jerk',30,'rep',35,25]]}
];
const CrossFitModel=(()=>{
 const get=id=>CF_WORKOUTS.find(w=>w.id===id);
 function build(id,variant='rx',category='male',loads={}){
  const w=get(id);if(!w)throw Error('Séance inconnue');const scaled=variant==='scaled';
  const rows=(scaled?w.scaled:w.rx).map(([id,amount,unit='rep',male=0,female=0])=>({id,amount,unit,kg:male?Number(loads[id]??(category==='female'?female:male)):0,weighted:male>0}));
  if(rows.some(r=>!Number.isFinite(r.kg)||r.kg<0||r.kg>500))throw Error('Charge invalide');
  const rounds=w.format==='amrap'?[1]:(scaled?w.scaledRounds:null)||w.rounds;
  const steps=rounds.flatMap((amount,i)=>rows.map(r=>({...r,amount:r.amount==='round'?amount:r.amount,round:i+1})));
  return {id,name:w.name,format:w.format,variant,category,rows,steps,rounds:rounds.length,time:w.format==='amrap'?(scaled?w.scaledTime:w.time):null,hint:scaled?w.scaledHint:w.hint,gear:scaled?(w.scaledGear||w.gear):w.gear,modified:rows.some(r=>r.weighted&&loads[r.id]!=null),source:'https://www.crossfit.com/benchmark/'+id};
 }
 function create(config,now,id,avatar){return {kind:'crossfit',id,dayId:'crossfit-'+config.id,title:'CrossFit · '+config.name,date:new Date(now).toISOString(),startedAtMs:now,pausedAt:null,pausedMs:0,finishedAt:null,config:JSON.parse(JSON.stringify(config)),cursor:0,progress:0,logs:[],notes:'',avatar:avatar==='female'?'female':'male'};}
 function elapsed(d,now){const end=d.finishedAt??d.pausedAt??now;const t=Math.max(0,(end-d.startedAtMs-(d.pausedMs||0))/1000);return d.config.time?Math.min(t,d.config.time):t;}
 function expired(d,now){return d.config.format==='amrap'&&elapsed(d,now)>=d.config.time;}
 function current(d){return d.config.steps[d.config.format==='amrap'?d.cursor%d.config.steps.length:d.cursor]||null;}
 function add(d,amount,now){const step=current(d);if(!step||d.pausedAt!=null||d.finishedAt!=null||expired(d,now)||!Number.isInteger(amount)||amount<1||amount>step.amount-d.progress)return false;
  d.logs.push({...step,amount,cursor:d.cursor,previous:d.progress,round:d.config.format==='amrap'?Math.floor(d.cursor/d.config.steps.length)+1:step.round,at:now});d.progress+=amount;
  if(d.progress===step.amount){d.cursor++;d.progress=0;}if(d.config.format==='time'&&!current(d))d.finishedAt=now;return true;
 }
 function undo(d,now){if(d.pausedAt!=null||expired(d,now)||!d.logs.length)return false;const last=d.logs.pop();d.cursor=last.cursor;d.progress=last.previous;d.finishedAt=null;return true;}
 function pause(d,now){if(d.pausedAt==null&&d.finishedAt==null&&!expired(d,now))d.pausedAt=now;}
 function resume(d,now){if(d.pausedAt==null)return;d.pausedMs+=Math.max(0,now-d.pausedAt);d.pausedAt=null;}
 function stats(d,now){const complete=d.config.format==='amrap'?expired(d,now):!current(d);const rounds=d.config.format==='amrap'?Math.floor(d.cursor/d.config.steps.length):new Set(d.logs.filter(l=>d.cursor>d.config.steps.findLastIndex(s=>s.round===l.round)).map(l=>l.round)).size;
  const extra=d.config.format==='amrap'?d.logs.filter(l=>l.round===rounds+1).reduce((s,l)=>s+l.amount,0):0;
  return {durationSeconds:Math.floor(elapsed(d,now)),complete,rounds,extra,reps:d.logs.filter(l=>l.unit!=='m').reduce((s,l)=>s+l.amount,0),distance:d.logs.filter(l=>l.unit==='m').reduce((s,l)=>s+l.amount,0),volumeKg:d.logs.reduce((s,l)=>s+(l.unit==='m'?0:l.kg*l.amount),0)};
 }
 function finish(d,now){const exercises=[];for(const l of d.logs){let e=exercises.find(e=>e.id===l.id);if(!e){e={id:l.id,sets:[]};exercises.push(e);}e.sets.push({kg:l.kg,reps:l.unit==='m'?0:l.amount,...(l.unit==='m'?{distance:l.amount}:{})});}return {id:d.id,kind:'crossfit',dayId:d.dayId,title:d.title,date:new Date(now).toISOString(),startedAt:d.date,notes:d.notes,exercises,crossfit:{...stats(d,now),config:d.config,logs:d.logs,avatar:d.avatar}};}
 return {get,build,create,elapsed,expired,current,add,undo,pause,resume,stats,finish};
})();
