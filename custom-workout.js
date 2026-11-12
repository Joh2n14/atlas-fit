'use strict';
(function customWorkoutUI(){
  const M=CustomWorkout;
  let search='',resultId=null;
  function plan(){
    if(!state.customPlan||!Array.isArray(state.customPlan.exercises))state.customPlan={title:'Ma séance personnalisée',muscles:[],exercises:[]};
    if(!Array.isArray(state.customPlan.muscles))state.customPlan.muscles=[];
    state.customPlan.exercises=state.customPlan.exercises.filter(e=>exById(e.id));
    return state.customPlan;
  }
  function memory(){return state.customLoads||(state.customLoads={});}
  function weight(){return [state.profile?.weight,state.nutrition?.profile?.weight,state.weightHistory?.at(-1)?.weight].map(Number).find(v=>Number.isFinite(v)&&v>=20&&v<=350)||null;}
  function avatar(){return state.nutrition?.profile?.sex==='female'?'female':'male';}
  function switcher(){return `<div class="panel atlas-switch"><div class="kicker">CHOISIR MON PROGRAMME</div><div class="atlas-switch-controls"><button class="btn small secondary" data-atlas="program" data-program="strength">Musculation classique</button><button class="btn small" data-atlas="program" data-program="custom" aria-current="true">Ma séance personnalisée</button><button class="btn small secondary" data-atlas="program" data-program="postpartum">Après mon bébé</button><button type="button" class="btn small secondary" data-atlas="program" data-program="crossfit">CrossFit</button></div></div>`;}
  const numberField=(id,label,value,min,max,step='1',attrs='')=>`<label class="field" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${value??''}" ${attrs}></label>`;
  function estimateText(){return `Environ ${Math.ceil(M.estimate(plan().exercises,exById)/60)} min`;} 
  function builder(){
    const p=plan(),selected=new Set(p.exercises.map(x=>x.id));
    const choices=EXERCISES.filter(e=>!e.id.startsWith('postpartum-')&&p.muscles.includes(e.muscle)&&(!search||`${e.name} ${GEAR_NAMES[e.gear]}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))));
    return header('ENTRAÎNEMENT LIBRE','Ma séance personnalisée','Choisis tes mouvements et règle ta séance à ton rythme, sans durée imposée ni profil obligatoire.')+switcher()+
      `${state.draft?'<div class="info cw-space">Une séance est déjà en cours. <button class="text-btn" data-act="resume">Reprendre ma séance →</button></div>':''}
      <section class="panel cw-space"><div class="kicker">1 · MES GROUPES MUSCULAIRES</div><h2>Qu’as-tu envie de travailler ?</h2><div class="cw-muscles">${GROUPS.map(g=>`<label class="cw-check ${p.muscles.includes(g.id)?'selected':''}"><input type="checkbox" data-cw-muscle="${esc(g.id)}" ${p.muscles.includes(g.id)?'checked':''}><span>${esc(g.id)}</span></label>`).join('')}</div><div class="cw-reset-row"><button type="button" class="text-btn cw-reset" data-cw="reset-selection">Réinitialisation</button></div></section>
      <section class="panel cw-space"><div class="kicker">2 · MES EXERCICES</div><div class="section-heading"><h2>Compose ta sélection</h2><span class="hint" id="cw-count">${selected.size} sélectionné${selected.size>1?'s':''}</span></div><label class="field"><span>Rechercher parmi les muscles cochés</span><input id="cw-search" type="search" value="${esc(search)}" placeholder="Nom ou matériel…"></label><p class="muted cw-small">Tous les matériels sont proposés. Les exercices déjà choisis restent dans ta séance quand tu changes les filtres.</p><div class="cw-choices" id="cw-choices">${choices.length?choices.map(e=>`<div class="cw-choice"><label class="cw-check ${selected.has(e.id)?'selected':''}"><input type="checkbox" data-cw-exercise="${e.id}" ${selected.has(e.id)?'checked':''}><span><b>${esc(e.name)}</b><small>${esc(e.muscle)} · ${esc(GEAR_NAMES[e.gear])}</small></span></label><button class="text-btn" data-act="ex-detail" data-exid="${e.id}" aria-label="Voir ${esc(e.name)}">Voir</button></div>`).join(''):`<p class="muted">${p.muscles.length?'Aucun exercice ne correspond à cette recherche.':'Coche au moins un groupe musculaire pour afficher ses exercices.'}</p>`}</div></section>
      <form id="cw-plan-form"><section class="panel cw-space"><div class="kicker">3 · MON DÉROULÉ</div><h2>Règle chaque exercice</h2><label class="field"><span>Nom de la séance</span><input name="title" id="cw-title" maxlength="80" value="${esc(p.title)}" required></label>
      ${p.exercises.map((e,i)=>{const ex=exById(e.id);return `<article class="cw-config"><div class="log-head"><h3>${i+1}. ${esc(ex.name)}</h3><div class="cw-actions"><button type="button" class="btn small secondary" data-cw="up" data-id="${e.id}" aria-label="Monter ${esc(ex.name)}" ${i===0?'disabled':''}>↑</button><button type="button" class="btn small secondary" data-cw="down" data-id="${e.id}" aria-label="Descendre ${esc(ex.name)}" ${i===p.exercises.length-1?'disabled':''}>↓</button><button type="button" class="text-btn red" data-cw="remove" data-id="${e.id}">Retirer</button></div></div><div class="cw-fields">
      ${numberField(`cw-sets-${e.id}`,'Séries',e.sets,1,20,'1',`required data-cw-value="sets" data-id="${e.id}"`)}
      ${numberField(`cw-reps-${e.id}`,M.repetitionLabel(ex),e.reps,1,ex.unit==='sec'?3600:500,'1',`required data-cw-value="reps" data-id="${e.id}"`)}
      ${numberField(`cw-rest-${e.id}`,'Repos entre séries (s)',e.rest,0,900,'1',`required data-cw-value="rest" data-id="${e.id}"`)}
      </div>
      ${M.ascent.has(e.id)?`<details class="cw-small"><summary>Estimer une montée verticale cumulée</summary><p>Facultatif : hauteur de remontée du corps par répétition (ou hauteur de la marche). Ce n’est pas un dénivelé mesuré.</p>${numberField(`cw-ascent-${e.id}`,'Hauteur de remontée (cm)',e.ascentCm,0,200,'1',`data-cw-value="ascentCm" data-id="${e.id}"`)}</details>`:''}</article>`;}).join('')||'<p class="muted">Sélectionne tes exercices ci-dessus.</p>'}
      </section><section class="panel cw-space"><div class="log-head"><div><div class="kicker">DURÉE PRÉVISIONNELLE</div><h2 id="cw-estimate">${estimateText()}</h2></div><span class="chip">Libre et modifiable</span></div><p class="subline cw-small">Calcul : 3 secondes par répétition en moyenne + repos entre séries + 1 minute de transition entre exercices. Le chronomètre mesurera le temps réellement écoulé, repos compris, pauses exclues.</p>
      <div class="cw-actions cw-space"><button type="button" class="btn secondary" data-cw="save-plan">Enregistrer ma séance</button><button type="submit" class="btn" ${p.exercises.length?'':'disabled'}>Lancer ma séance →</button></div><p class="muted cw-small">Ta sélection et tes réglages sont conservés sur cet appareil.</p></section></form>`;
  }
  function loadLabels(ex){const e=M.equipment(ex);return e.count===2?['Haltère gauche (kg)','Haltère droit (kg)']:e.assistance?['Assistance de la machine (kg)']:e.dumbbell?['Poids de l’haltère (kg)']:ex.gear==='barre'?['Charge totale, barre comprise (kg)']:['Charge sélectionnée (kg)'];}
  function loadDescription(s,ex){if(!s.loads.length)return 'Poids du corps / sans charge mesurée';const labels=loadLabels(ex);return s.loads.map((v,i)=>`${labels[i]} : ${v===null?'non renseigné':fmt(v,1)}`).join(' · ');}
  function session(){
    const d=state.draft,c=M.current(d),done=d.exercises.reduce((n,e)=>n+d.sets[e.id].filter(s=>s.done).length,0),total=d.exercises.reduce((n,e)=>n+d.sets[e.id].length,0);
    return header('SÉANCE LIBRE',esc(d.title),'Valide les séries que tu réalises. Tu peux terminer la séance à tout moment.')+
      `<div class="cw-session-bar"><span>⏱ <b class="cw-clock">${M.clock(M.elapsed(d,Date.now()))}</b></span><span>${done} / ${total} séries réalisées</span><span class="cw-rest">${restText(d)}</span></div>
      ${d.pausedAt!=null?'<section class="panel cw-space"><div class="kicker">SÉANCE EN PAUSE</div><h2>Prends ton temps.</h2><p class="subline">Le chronomètre et le repos sont suspendus. Reprends quand tu le souhaites.</p></section>':c?currentPanel(d,c):'<section class="panel cw-space"><div class="kicker">DERNIÈRE ÉTAPE</div><h2>Tous tes exercices sont parcourus.</h2><p class="subline">Termine l’entraînement pour enregistrer ton bilan.</p></section>'}
      <div class="cw-actions cw-space cw-session-controls"><button class="btn" data-cw="finish">Fin de l’entraînement</button><button class="btn secondary" data-cw="pause">${d.pausedAt!=null?'Reprendre':'Pause'}</button></div>
      <section class="panel cw-space"><h2>Mon déroulé</h2>${d.exercises.map(e=>{const ex=exById(e.id);return `<div class="cw-log"><h3>${esc(ex.name)}</h3><ol>${d.sets[e.id].map((s,i)=>`<li>${s.done?'✓':s.skipped?'↷':'○'} Série ${i+1} · ${s.reps} ${ex.unit==='sec'?'s':'rép.'}${s.done?' · '+esc(loadDescription(s,ex)):s.skipped?' · passée':''}</li>`).join('')}</ol></div>`;}).join('')}</section>
      <section class="panel cw-space"><label class="field"><span>Notes de séance</span><textarea id="cw-notes" maxlength="2000">${esc(d.notes)}</textarea></label></section>`;
  }
  function restText(d){if(d.pausedAt!=null)return 'En pause';const left=Math.max(0,Math.ceil((d.restEndsAt-Date.now())/1000));return left?'Repos · '+M.clock(left):'À ton rythme';}
  function currentPanel(d,c){
    const e=c.entry,ex=exById(e.id),s=c.set,eq=M.equipment(ex);
    return `<section class="panel cw-space cw-current"><div class="kicker">EXERCICE EN COURS · SÉRIE ${c.index+1} / ${d.sets[e.id].length}</div><div class="log-head"><h2>${esc(ex.name)}</h2><button class="text-btn" data-act="ex-detail" data-exid="${e.id}">Voir la démo</button></div><p class="subline">${esc(ex.tip)}</p>
    ${!s.prepared?`<form id="cw-load-form" class="cw-space"><h3>Quelle charge choisis-tu pour cette série ?</h3><div class="cw-fields">${loadLabels(ex).map((label,i)=>numberField(`cw-load-${i}`,label,s.loads[i],0,1500,'0.1',`name="load${i}" required`)).join('')}</div><p class="muted cw-small">${eq.assistance?'Cette valeur est une assistance : elle ne sera pas additionnée aux kilos soulevés.':eq.count===2?'Renseigne séparément chaque haltère. Les deux charges seront additionnées pour le volume.':'La charge est demandée avant chaque série.'}</p><div class="cw-actions"><button type="submit" class="btn">Utiliser cette charge</button><button type="button" class="btn secondary" data-cw="keep-load">Passer · garder la charge précédente</button></div><p class="muted cw-small">${s.loads.some(v=>v===null)?'Aucune charge précédente pour au moins un poids : passer conservera « non renseigné ».':esc(loadDescription(s,ex))}</p></form>`:
    `<form id="cw-complete-form" class="cw-space"><div class="info">${esc(loadDescription(s,ex))}${eq.count?'<button type="button" class="text-btn" data-cw="edit-load">Modifier</button>':''}</div><div class="cw-fields cw-space">${numberField('cw-actual-reps',M.repetitionLabel(ex)+' réalisées',s.reps,1,ex.unit==='sec'?3600:500,'1','name="reps" required')}</div><p class="muted cw-small">Le repos prévu de ${e.rest} s commence après la validation. Tu peux avancer à ton rythme.</p><button type="submit" class="btn">✓ Valider cette série</button></form>`}
    <button type="button" class="text-btn cw-space" data-cw="skip-set">Passer cette série sans la compter</button></section>`;
  }
  function summary(record,celebrate=false){
    const s=record.summary;
    const full=s.totalSets>0&&s.doneSets===s.totalSets;
    const media=`media/exercises/celebration-${s.avatar==='female'?'female':'male'}-${full?'complete':'partial'}.png`;
    return `<div class="cw-summary"><div class="kicker">${celebrate?'SÉANCE TERMINÉE':'BILAN DE SÉANCE'}</div><h2>${celebrate?'Bravo, ta séance est enregistrée !':esc(record.title)}</h2>
    ${celebrate?`<section class="cw-celebration"><h3>${full?'Séance complète, bravo !':'Chaque effort compte !'}</h3><img class="exercise-demo-image" src="${media}" alt="${full?'Personnage 3D aux bras fléchis, entouré d’un halo orange':'Personnage 3D qui applaudit, entouré d’un halo vert discret'}" width="1024" height="768"></section>`:''}
    <div class="grid grid-2 cw-space">${metricCard('Temps final',M.clock(s.durationSeconds),s.pauseExcluded?'Temps écoulé, repos compris, pauses exclues':'Temps écoulé, repos et interruptions compris')}${metricCard('Calories estimées',s.calories===null?'Non estimées':`≈ ${fmt(s.calories)} kcal`,s.bodyWeight?'Hypothèse : effort modéré, 3,5 MET':'Poids corporel non renseigné')}${metricCard('Volume de charges',`${fmt(s.volumeKg,1)} kg`,'Somme des charges × répétitions validées')}${metricCard('Séries réalisées',`${s.doneSets} / ${s.totalSets}`,'Les séries passées ne sont pas comptées')}</div>
    ${s.ascentMeters!==null?`<div class="info cw-space"><b>Montée verticale cumulée estimée : ${s.missingAscent===s.ascentSets?'non estimée':fmt(s.ascentMeters,1)+' m'}</b><br>Hauteur de remontée renseignée × répétitions validées. Ce n’est pas un dénivelé réel mesuré.${s.missingAscent?` ${s.missingAscent} série(s) sans hauteur, exclue(s) du calcul.`:''}</div>`:''}
    ${s.missingLoads?`<p class="muted">${s.missingLoads} série(s) comportent une charge non renseignée : le volume affiché est partiel.</p>`:''}
    <details class="cw-space cw-small"><summary>Comment sont calculées ces estimations ?</summary><p>Calories totales estimées = 3,5 MET × 3,5 × poids corporel (kg) ÷ 200 × durée (minutes). Hypothèse générique de musculation modérée ; le résultat dépend de l’effort réel. Les pauses déclenchées avec le bouton Pause sont exclues. Les kilos soulevés ne suffisent pas à déterminer les calories.</p><p><a href="https://pacompendium.com/wp-content/uploads/2024/01/2024-adult-compendium_1_2024.pdf" target="_blank" rel="noopener">Compendium des activités physiques 2024, activité 02054</a>.</p><p>Le volume exclut le poids du corps, les résistances élastiques, l’assistance des machines et les durées chronométrées. Deux haltères : (gauche + droit) × répétitions ; mouvements alternés : répétitions par bras. Pour un exercice unilatéral avec une seule charge, saisir le nombre total de répétitions réalisées des deux côtés.</p></details>
    ${celebrate?'<div class="cw-actions cw-space"><button class="btn" data-cw="close-summary">Retour à ma séance personnalisée</button><button class="btn secondary" data-act="nav" data-tab="progress">Voir ma progression</button></div>':''}</div>`;
  }
  const oldPlan=renderPlan;renderPlan=function(){return ui.atlasProgram==='custom'?builder():oldPlan();};
  const oldSession=renderSession;renderSession=function(){if(state.draft?.kind==='custom')return session();const record=resultId&&state.history.find(x=>x.id===resultId);return record?.summary?header('MA SÉANCE PERSONNALISÉE','Mon bilan','Tes résultats sont conservés dans Progression.')+`<section class="panel">${summary(record,true)}</section>`:oldSession();};
  const oldHistory=historyModal;historyModal=function(id){const h=state.history.find(x=>x.id===id);return h?.summary?summary(h)+oldHistory(id):oldHistory(id);};
  function refreshBuilder(selectionChanged){
    const fragment=document.createElement('template');fragment.innerHTML=builder();
    if(selectionChanged){
      document.getElementById('cw-plan-form').innerHTML=fragment.content.querySelector('#cw-plan-form').innerHTML;
      document.getElementById('cw-count').textContent=fragment.content.querySelector('#cw-count').textContent;
    }else document.getElementById('cw-choices').innerHTML=fragment.content.querySelector('#cw-choices').innerHTML;
    document.querySelectorAll('.cw-check input').forEach(el=>el.closest('.cw-check').classList.toggle('selected',el.checked));
  }
  function repaint(){render();tick();}
  function start(){
    const p=plan();if(!p.exercises.length)return toast('Choisis au moins un exercice.');
    if(state.draft)return toast('Termine ou reprends la séance déjà en cours avant d’en lancer une autre.');
    state.draft=M.create(p,exById,memory(),{id:uid(),now:Date.now(),bodyWeight:weight(),avatar:avatar()});resultId=null;save();ui.tab='session';repaint();window.scrollTo(0,0);
  }
  document.addEventListener('submit',event=>{
    if(event.target.id==='cw-plan-form'){event.preventDefault();start();}
    else if(event.target.id==='cw-load-form'&&state.draft?.kind==='custom'){event.preventDefault();const c=M.current(state.draft);if(!c)return;const fd=new FormData(event.target);const loads=loadLabels(exById(c.entry.id)).map((_,i)=>Number(fd.get('load'+i)));try{M.setLoads(state.draft,exById,loads,memory());save();repaint();}catch(_){toast('Vérifie les charges saisies.');}}
    else if(event.target.id==='cw-complete-form'&&state.draft?.kind==='custom'){event.preventDefault();const reps=Number(new FormData(event.target).get('reps'));if(M.complete(state.draft,exById,reps,Date.now())){save();repaint();window.scrollTo(0,0);}else toast('Vérifie les répétitions ou la durée.');}
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-cw]');if(!button)return;event.preventDefault();const action=button.dataset.cw,p=plan(),d=state.draft?.kind==='custom'?state.draft:null;
    if(action==='save-plan'){if(!document.getElementById('cw-plan-form').reportValidity())return;save();toast('Ta séance personnalisée est enregistrée.');}
    else if(action==='reset-selection'){p.muscles=[];p.exercises=[];search='';save();document.querySelectorAll('[data-cw-muscle]').forEach(el=>{el.checked=false;});const box=document.getElementById('cw-search');if(box)box.value='';refreshBuilder(false);refreshBuilder(true);toast('Groupes musculaires et exercices décochés.');}
    else if(action==='remove'){p.exercises=p.exercises.filter(e=>e.id!==button.dataset.id);save();repaint();}
    else if(action==='up'||action==='down'){const i=p.exercises.findIndex(e=>e.id===button.dataset.id),j=i+(action==='up'?-1:1);if(i>=0&&j>=0&&j<p.exercises.length){[p.exercises[i],p.exercises[j]]=[p.exercises[j],p.exercises[i]];save();repaint();}}
    else if(action==='keep-load'&&d){const c=M.current(d);if(c){M.setLoads(d,exById,c.set.loads,memory());save();repaint();}}
    else if(action==='edit-load'&&d){const c=M.current(d);if(c){c.set.prepared=false;save();repaint();}}
    else if(action==='skip-set'&&d){const c=M.current(d);if(c){c.set.skipped=true;d.restEndsAt=0;save();repaint();}}
    else if(action==='finish'&&d){const r=M.finish(d,exById,Date.now());if(r.summary.doneSets<r.summary.totalSets&&!confirm('Terminer maintenant ? Seules les séries validées seront comptées.'))return;if(!state.history.some(h=>h.id===r.id))state.history.push(r);resultId=r.id;state.draft=null;restUntil=0;save();ui.tab='session';repaint();window.scrollTo(0,0);}
    else if(action==='pause'&&d){if(d.pausedAt!=null)M.resume(d,Date.now());else M.pause(d,Date.now());save();repaint();}
    else if(action==='close-summary'){resultId=null;ui.atlasProgram='custom';switchTab('plan');}
  });
  document.addEventListener('input',event=>{
    const el=event.target;if(el.id==='cw-search'){search=el.value;refreshBuilder(false);return;}
    if(el.id==='cw-title'){plan().title=el.value.slice(0,80);save();}
    if(el.dataset.cwValue){const e=plan().exercises.find(x=>x.id===el.dataset.id);if(e&&el.validity.valid){e[el.dataset.cwValue]=el.value===''?null:Number(el.value);save();const target=document.getElementById('cw-estimate');if(target)target.textContent=estimateText();}}
    if(el.id==='cw-notes'&&state.draft?.kind==='custom'){state.draft.notes=el.value.slice(0,2000);save();}
  });
  document.addEventListener('change',event=>{
    const el=event.target,p=plan();
    if(el.dataset.cwMuscle){p.muscles=el.checked?[...new Set([...p.muscles,el.dataset.cwMuscle])]:p.muscles.filter(x=>x!==el.dataset.cwMuscle);save();refreshBuilder(false);}
    if(el.dataset.cwExercise){const id=el.dataset.cwExercise;if(el.checked&&!p.exercises.some(e=>e.id===id))p.exercises.push(M.entry(exById(id)));else if(!el.checked)p.exercises=p.exercises.filter(e=>e.id!==id);save();refreshBuilder(true);}
  });
  function tick(){if(state.draft?.kind!=='custom')return;for(const el of document.querySelectorAll('.cw-clock'))el.textContent=M.clock(M.elapsed(state.draft,Date.now()));for(const el of document.querySelectorAll('.cw-rest'))el.textContent=restText(state.draft);}
  setInterval(tick,1000);document.addEventListener('visibilitychange',tick);window.addEventListener('pageshow',tick);
  render();
})();
