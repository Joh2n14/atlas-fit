/* ATLAS Fit — extension Nutrition + « Après mon bébé »
 * Compatible avec la structure publique Joh2n14/atlas-fit du 10 novembre 2026.
 * Ce fichier se charge APRES data.js et app.js.
 * Sauvegarde inchangée : clé localStorage « atlas-fit-v1 », version 1.
 * Les photos ne sont pas analysées par IA. Aucun diagnostic médical.
 */
(function atlasV3Extension(){
  'use strict';
  if(typeof state==='undefined'||typeof NAV==='undefined'||typeof render!=='function'||typeof EXERCISES==='undefined'){
    console.error('ATLAS V3 : charger data.js puis app.js avant atlas-v3.js');
    return;
  }

  const POSTPARTUM_EXERCISES=[
    {id:'postpartum-respiration',name:'Respiration diaphragmatique douce',muscle:'Abdominaux',gear:'corps',type:'iso',tip:'En position confortable, inspire calmement, puis expire sans pousser ni bloquer la respiration. 5 à 8 cycles lents.',unit:'rep'},
    {id:'postpartum-transverse',name:'Activation douce du transverse',muscle:'Abdominaux',gear:'corps',type:'iso',tip:'Sur le dos ou le côté, expire et rentre très doucement le bas du ventre. Relâche complètement à l’inspiration. Sans douleur ni bombement.',unit:'rep'},
    {id:'postpartum-pelvien',name:'Bascule du bassin au sol',muscle:'Abdominaux',gear:'corps',type:'iso',tip:'Sur le dos, genoux fléchis. À l’expiration, bascule doucement le bassin pour réduire le creux lombaire, puis relâche.',unit:'rep'},
    {id:'postpartum-perinee',name:'Contractions douces du périnée',muscle:'Abdominaux',gear:'corps',type:'iso',tip:'Contracte et remonte doucement les muscles du plancher pelvien sans serrer les fessiers ni retenir le souffle, puis relâche complètement. Adapte la durée à ta tolérance.',unit:'rep'},
    {id:'postpartum-talon',name:'Glissé de talon contrôlé',muscle:'Abdominaux',gear:'corps',type:'iso',tip:'Sur le dos, genoux pliés. Fais glisser lentement un talon, puis reviens sans laisser le ventre bomber ni le bassin bouger. Alterne les côtés.',unit:'rep'},
    {id:'postpartum-genou',name:'Ouverture de genou plié',muscle:'Abdominaux',gear:'corps',type:'iso',tip:'Allongée, pieds au sol, ouvre doucement un genou sur le côté en maintenant le bassin immobile puis reviens. Amplitude réduite.',unit:'rep'},
    {id:'postpartum-pont',name:'Petit pont fessier progressif',muscle:'Fessiers',gear:'corps',type:'iso',tip:'Après accord du soignant si nécessaire : sur le dos, genoux fléchis, lève légèrement le bassin en expirant. Stoppe si douleur, pesanteur ou bombement abdominal.',unit:'rep'},
    {id:'postpartum-marche',name:'Marche confortable et progressive',muscle:'Quadriceps',gear:'corps',type:'poly',tip:'Marche à allure confortable, sans douleur ni sensation de pesanteur pelvienne. Saisis la durée en secondes dans la séance.',unit:'sec'}
  ];
  for(const exercise of POSTPARTUM_EXERCISES){
    if(!EXERCISES.some(e=>e.id===exercise.id)) EXERCISES.push(exercise);
  }
  const POST_IDS=new Set(POSTPARTUM_EXERCISES.map(x=>x.id));
  const POST_DAYS=[
    {id:'atlas-postpartum-a',title:'Après mon bébé · Séance A',focus:'Respiration, transverse et bassin',exercises:[
      {id:'postpartum-respiration',sets:1,reps:'6 cycles',rest:30},
      {id:'postpartum-transverse',sets:1,reps:'6–8',rest:30},
      {id:'postpartum-pelvien',sets:1,reps:'6–8',rest:30},
      {id:'postpartum-perinee',sets:1,reps:'5–8',rest:30}
    ]},
    {id:'atlas-postpartum-b',title:'Après mon bébé · Séance B',focus:'Contrôle du tronc et mouvements progressifs',exercises:[
      {id:'postpartum-respiration',sets:1,reps:'6 cycles',rest:30},
      {id:'postpartum-talon',sets:1,reps:'6–8',rest:30},
      {id:'postpartum-genou',sets:1,reps:'6–8',rest:30},
      {id:'postpartum-pont',sets:1,reps:'5–8 si confortable',rest:45}
    ]}
  ];

  const DEFAULT_NUTRITION={
    profile:{age:'',height:'',weight:'',sex:'',activity:'sedentary',goal:'maintain',goalDelta:200,lactation:'no',customAdjustment:0},
    entries:[],selectedDate:localDate()
  };
  function localDate(d=new Date()){
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function N(){
    if(!state.nutrition||typeof state.nutrition!=='object')state.nutrition=JSON.parse(JSON.stringify(DEFAULT_NUTRITION));
    const n=state.nutrition;
    n.profile={...DEFAULT_NUTRITION.profile,...(n.profile||{})};
    if(n.profile.weight===''&&Number(state.profile?.weight)>=20) n.profile.weight=Number(state.profile.weight);
    n.entries=Array.isArray(n.entries)?n.entries:[];
    if(!/^\d{4}-\d\d-\d\d$/.test(n.selectedDate||''))n.selectedDate=localDate();
    return n;
  }
  N();
  const activityFactors={sedentary:1.2,light:1.375,moderate:1.55,high:1.725,very:1.9};
  const mealNames={breakfast:'Petit-déjeuner',lunch:'Déjeuner',snack:'Collation',dinner:'Dîner'};
  const reduceSum=(arr,k)=>arr.reduce((sum,x)=>sum+(Number(x[k])||0),0);
  const round=(v,d=0)=>Math.round(v*10**d)/10**d;
  const format=(v,d=0)=>Number(v||0).toLocaleString('fr-FR',{maximumFractionDigits:d});
  function calculate(){
    const p=N().profile,w=Number(p.weight),h=Number(p.height),a=Number(p.age);
    if(!(w>=20&&w<=350&&h>=120&&h<=230&&a>=18&&a<=100))return null;
    if(!['male','female'].includes(p.sex))return null;
    const bmr=10*w+6.25*h-5*a+(p.sex==='male'?5:-161);
    const factor=activityFactors[p.activity]||1.2;
    const maintenance=bmr*factor;
    const goalOffset=p.goal==='mass'?Math.max(0,Math.min(700,Number(p.goalDelta)||0)):p.goal==='loss'?-Math.max(0,Math.min(700,Math.abs(Number(p.goalDelta)||0))):0;
    const custom=Math.max(-500,Math.min(1000,Number(p.customAdjustment)||0));
    const kcal=Math.max(0,Math.round(maintenance+goalOffset+custom));
    const proteins=Math.round(w*1.8),fat=Math.round(w*0.9);
    const carbs=Math.max(0,Math.round((kcal-proteins*4-fat*9)/4));
    return {bmr:Math.round(bmr),maintenance:Math.round(maintenance),kcal,proteins,fat,carbs};
  }
  function tally(day){
    const entries=N().entries.filter(x=>x.date===day);
    return {entries,kcal:reduceSum(entries,'kcal'),protein:reduceSum(entries,'protein'),carbs:reduceSum(entries,'carbs'),fat:reduceSum(entries,'fat')};
  }
  function escapeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function opt(value,label,current){return `<option value="${escapeText(value)}" ${String(current)===String(value)?'selected':''}>${escapeText(label)}</option>`;}
  function progressBar(value,max){return `<div class="bar-track" style="height:11px;margin:11px 0 5px"><div class="bar-fill" style="width:${max?Math.min(100,Math.max(0,100*value/max)):0}%"></div></div>`;}

  function profileNutrition(){
    const p=N().profile,r=calculate();
    return `<section class="panel" id="atlas-nutrition-profile" style="margin-top:18px">
      <div class="kicker">NUTRITION · CALCUL DANS PROFIL</div>
      <h2 style="margin:9px 0 7px">Mes besoins caloriques</h2>
      <p class="subline">Estimation initiale par Mifflin–St Jeor, à ajuster selon l’évolution réelle du poids et la situation de santé.</p>
      <form id="atlas-nutr-profile" class="form-grid" style="margin-top:20px">
        <div class="field"><label for="an-age">Âge (années)</label><input id="an-age" name="age" type="number" min="18" max="100" required value="${escapeText(p.age)}"></div>
        <div class="field"><label for="an-height">Taille (cm)</label><input id="an-height" name="height" type="number" min="120" max="230" required value="${escapeText(p.height)}"></div>
        <div class="field"><label for="an-weight">Poids de calcul (kg)</label><input id="an-weight" name="weight" type="number" min="20" max="350" step="0.1" required value="${escapeText(p.weight)}"></div>
        <div class="field"><label for="an-sex">Paramètre de la formule</label><select id="an-sex" name="sex" required>${opt('','Choisir…',p.sex)}${opt('male','Masculin (+5)',p.sex)}${opt('female','Féminin (−161)',p.sex)}</select></div>
        <div class="field"><label for="an-activity">Activité quotidienne</label><select id="an-activity" name="activity">${opt('sedentary','Sédentaire (×1,20)',p.activity)}${opt('light','Légèrement actif (×1,375)',p.activity)}${opt('moderate','Modérément actif (×1,55)',p.activity)}${opt('high','Très actif (×1,725)',p.activity)}${opt('very','Extrêmement actif (×1,90)',p.activity)}</select></div>
        <div class="field"><label for="an-goal">Objectif nutritionnel</label><select id="an-goal" name="goal">${opt('mass','Prise de masse',p.goal)}${opt('maintain','Maintien',p.goal)}${opt('loss','Perte de poids',p.goal)}</select></div>
        <div class="field"><label for="an-delta">Écart calorique associé (kcal/j)</label><input id="an-delta" name="goalDelta" type="number" min="0" max="700" step="25" value="${escapeText(p.goalDelta)}"><small>Surplus si prise de masse, déficit si perte.</small></div>
        <div class="field"><label for="an-lactation">Allaitement</label><select id="an-lactation" name="lactation">${opt('no','Non',p.lactation)}${opt('yes','Oui',p.lactation)}</select></div>
        <div class="field"><label for="an-custom">Ajustement personnel (kcal/j)</label><input id="an-custom" name="customAdjustment" type="number" min="-500" max="1000" step="25" value="${escapeText(p.customAdjustment)}"><small>Ne pas fixer arbitrairement le besoin supplémentaire lié à l’allaitement.</small></div>
        <div style="grid-column:1/-1"><button class="btn" type="submit">Calculer et enregistrer mon objectif</button></div>
      </form>
      ${r?`<div class="grid grid-4" style="margin-top:20px">
        <div class="panel stat"><div class="stat-label">Métabolisme de base estimé</div><div class="stat-value" style="font-size:25px">${format(r.bmr)}</div><small class="muted">kcal/j</small></div>
        <div class="panel stat"><div class="stat-label">Maintenance estimée</div><div class="stat-value" style="font-size:25px">${format(r.maintenance)}</div><small class="muted">kcal/j</small></div>
        <div class="panel stat"><div class="stat-label">Cible quotidienne</div><div class="stat-value" style="font-size:25px;color:var(--lime)">${format(r.kcal)}</div><small class="muted">kcal/j</small></div>
        <div class="panel stat"><div class="stat-label">Macros indicatives</div><div class="stat-value" style="font-size:17px">${r.proteins} / ${r.carbs} / ${r.fat} g</div><small class="muted">Protéines / glucides / lipides</small></div>
      </div>`:'<div class="info warning" style="margin-top:20px">Renseigne un âge, une taille et un poids valides pour obtenir une estimation.</div>'}
      ${p.lactation==='yes'?'<div class="info warning" style="margin-top:15px"><b>Allaitement :</b> cette estimation ne tient pas automatiquement compte de tes besoins supplémentaires. Demande un conseil personnalisé à un professionnel de santé, surtout en période post-partum.</div>':''}
      <p class="subline" style="font-size:12px;margin-top:15px">Référence : Mifflin et al. (1990), <a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noopener">PubMed</a>. Les coefficients d’activité et les objectifs de macros sont des hypothèses modifiables ; ce calcul ne remplace pas un suivi médical.</p>
    </section>`;
  }

  function nutritionPage(){
    const n=N(),t=tally(n.selectedDate),target=calculate(),goal=target?.kcal||0;
    const remaining=goal-t.kcal;
    return header('CARNET ALIMENTAIRE','Nutrition','Ajoute chaque aliment ou ingrédient de la journée. La cible est définie dans Profil.')+
    `<div class="panel" style="margin-bottom:18px"><div class="log-head"><div><div class="kicker">BILAN JOURNALIER</div><h2 style="margin:8px 0">${format(t.kcal)} ${goal?`/ ${format(goal)}`:''} kcal</h2><div class="subline">${goal?remaining>=0?`${format(remaining)} kcal restantes selon l’objectif estimé`:`${format(-remaining)} kcal au-dessus de l’objectif estimé`:'Définis ta cible dans Profil'}</div></div><div class="field"><label for="atlas-day">Journée</label><input type="date" id="atlas-day" value="${escapeText(n.selectedDate)}"></div></div>
    ${progressBar(t.kcal,goal)}
    <div class="meta" style="margin-top:14px"><span class="chip">Protéines : ${format(t.protein,1)} g</span><span class="chip">Glucides : ${format(t.carbs,1)} g</span><span class="chip">Lipides : ${format(t.fat,1)} g</span></div><small class="muted" style="display:block;margin-top:10px">Macros comptées uniquement lorsqu'elles sont renseignées. Les calories restent des estimations.</small></div>
    <div class="grid grid-2"><section class="panel"><div class="kicker">AJOUTER UNE CONSOMMATION</div><h2 style="margin:8px 0 17px">Mon repas</h2>
      <form id="atlas-food-form" class="form-grid" style="gap:12px">
        <div class="field"><label for="af-meal">Repas</label><select name="meal" id="af-meal">${Object.entries(mealNames).map(([v,l])=>opt(v,l,'lunch')).join('')}</select></div>
        <div class="field"><label for="af-name">Aliment ou plat</label><input name="name" id="af-name" required maxlength="120" placeholder="Ex. Riz cuit ou lasagnes"></div>
        <div class="field"><label for="af-grams">Quantité consommée (g)</label><input name="grams" id="af-grams" type="number" min="1" max="20000" step="0.1" required placeholder="150"></div>
        <div class="field"><label for="af-kcal">Calories pour 100 g</label><input name="kcal100" id="af-kcal" type="number" min="0" max="1200" step="0.1" required placeholder="Sur étiquette ou table"></div>
        <div class="field"><label for="af-protein">Protéines / 100 g (facultatif)</label><input name="protein100" id="af-protein" type="number" min="0" max="100" step="0.1" placeholder="g"></div>
        <div class="field"><label for="af-carbs">Glucides / 100 g (facultatif)</label><input name="carbs100" id="af-carbs" type="number" min="0" max="100" step="0.1" placeholder="g"></div>
        <div class="field"><label for="af-fat">Lipides / 100 g (facultatif)</label><input name="fat100" id="af-fat" type="number" min="0" max="100" step="0.1" placeholder="g"></div>
        <div style="grid-column:1/-1"><button class="btn full" type="submit">+ Ajouter au journal</button></div>
      </form>
      <div class="info" style="margin-top:14px">Pour un plat composé, ajoute chaque ingrédient avec son poids. Les données pour 100 g peuvent venir d’une étiquette ou de la <a href="https://ciqual.anses.fr/" target="_blank" rel="noopener">table Ciqual (Anses)</a>. Aucune valeur nutritionnelle n’est devinée.</div>
    </section>
    <section class="panel"><div class="kicker">PHOTO DU REPAS</div><h2 style="margin:8px 0 17px">Photographier une assiette</h2>
      <div class="field"><label for="af-photo">Prendre ou choisir une photo</label><input id="af-photo" type="file" accept="image/*" capture="environment"></div>
      <div id="af-photo-preview" style="margin-top:14px"></div>
      <div class="info warning" style="margin-top:14px"><b>Limite actuelle :</b> la photo peut être affichée, mais aucune IA ne reconnaît les aliments ni n’estime leurs quantités dans cette version. Renseigne les ingrédients et leurs portions manuellement.</div>
      <div class="section-heading"><h2>Conseil de saisie</h2></div><p class="subline">Pour un repas composé de pâtes, sauce et fromage, saisis séparément les grammes et les données nutritionnelles de chacun. Les calories seront additionnées automatiquement.</p>
    </section></div>
    <section class="panel" style="margin-top:18px"><div class="section-heading" style="margin-top:0"><h2>Consommations du ${escapeText(n.selectedDate)}</h2><span class="hint">${t.entries.length} ligne${t.entries.length>1?'s':''}</span></div>
    ${t.entries.length?t.entries.slice().reverse().map(e=>`<div class="mini-row"><div style="min-width:0"><strong>${escapeText(e.name)}</strong><br><small>${escapeText(mealNames[e.meal]||e.meal)} · ${format(e.grams,1)} g · ${format(e.kcal)} kcal${e.macrosComplete?' · macros renseignées':''}</small></div><button type="button" class="btn small danger" data-atlas="delete-food" data-id="${escapeText(e.id)}" aria-label="Supprimer ${escapeText(e.name)}">Supprimer</button></div>`).join(''):'<p class="subline">Aucun aliment enregistré pour cette journée.</p>'}
    </section><section class="panel" style="margin-top:18px"><h2>Historique récent</h2><div class="atlas-history-grid">${Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);const day=localDate(d),v=tally(day);return `<button class="day-button" data-atlas="select-day" data-day="${day}"><strong>${escapeText(d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}))}</strong><small>${format(v.kcal)} kcal</small></button>`;}).join('')}</div></section>`;
  }

  function switcher(){return `<div class="panel atlas-switch" style="margin-bottom:18px"><div class="kicker">CHOISIR MON PROGRAMME</div><div class="atlas-switch-controls"><button type="button" class="btn small ${ui.atlasProgram==='strength'?'':'secondary'}" data-atlas="program" data-program="strength">Musculation classique</button><button type="button" class="btn small ${ui.atlasProgram==='custom'?'':'secondary'}" data-atlas="program" data-program="custom">Ma séance personnalisée</button><button type="button" class="btn small ${ui.atlasProgram==='postpartum'?'':'secondary'}" data-atlas="program" data-program="postpartum">Après mon bébé</button></div></div>`;}
  function postpartumSafety(){return `<div class="info warning"><b>Sécurité post-partum :</b> ces exercices sont des propositions générales inspirées de fiches de physiothérapie NHS, et non un protocole médical certifié individuel. Après une césarienne, des complications, en cas de douleur, fuite urinaire, lourdeur pelvienne ou bombement (« doming ») persistant de l’abdomen, arrête le mouvement concerné et demande un avis médical ou à une kinésithérapeute spécialisée. Reprends progressivement, sans retenir ton souffle. Pour un diastasis encore marqué vers 8 semaines, consulte.<br><br><small>Sources : <a href="https://www.nhs.uk/baby/support-and-services/your-post-pregnancy-body/" target="_blank" rel="noopener">NHS — Your post-pregnancy body</a> · <a href="https://www.ruh.nhs.uk/patients/patient_information/PHY048_Diastasis_Rectus_Abdominus_leaflet.pdf" target="_blank" rel="noopener">RUH NHS — Diastasis recti</a> · <a href="https://www.acog.org/womens-health/faqs/exercise-after-pregnancy" target="_blank" rel="noopener">ACOG — Exercise after pregnancy</a>.</small></div>`;}
  function postpartumPage(){
    return header('PROGRAMME SPÉCIFIQUE','Après mon bébé','Reprise progressive et douce : respiration, périnée, transverse et stabilité.')+switcher()+postpartumSafety()+
    `<div class="grid grid-2" style="margin-top:18px">${POST_DAYS.map((day,i)=>`<section class="panel"><div class="kicker">SÉANCE ${i+1} · ADAPTABLE</div><h2 style="margin:9px 0">${escapeText(day.title)}</h2><p class="subline">${escapeText(day.focus)}. 1 série légère par mouvement, seulement si confortable.</p>${day.exercises.map(e=>`<div class="mini-row"><div><strong>${escapeText(exById(e.id)?.name||e.id)}</strong><br><small>${escapeText(e.reps)} · ${e.sets} série</small></div></div>`).join('')}<button class="btn full" type="button" data-atlas="start-postpartum" data-index="${i}" style="margin-top:15px">Commencer cette séance →</button></section>`).join('')}</div>
    <div class="panel" style="margin-top:18px"><h2>Progression recommandée</h2><p class="subline">Privilégie la qualité du mouvement. Tu peux répéter une séance autant que nécessaire et réduire les répétitions. Une marche confortable peut être ajoutée selon la récupération. Augmente progressivement après réévaluation de tes symptômes et, si besoin, avec un professionnel.</p><button class="btn secondary small" data-atlas="show-post-exercises" style="margin-top:13px">Voir les exercices de ce programme →</button></div>`;
  }
  function showPostpartumExercises(){return header('BIBLIOTHÈQUE','Exercices · Après mon bébé','Sélection conçue pour une reprise douce, selon la tolérance.')+
    `<button class="btn secondary small" data-atlas="show-all-exercises" style="margin-bottom:16px">← Tous les exercices</button>${postpartumSafety()}<div class="exercise-grid" style="margin-top:17px">${EXERCISES.filter(e=>POST_IDS.has(e.id)).map(e=>exerciseCard(e)).join('')}</div>`;}

  // Navigation : les cinq anciens écrans demeurent ; Nutrition se place au milieu.
  NAV.splice(0,NAV.length,
    ['home','⌂','Vue d’ensemble'],
    ['plan','▦','Entraînement'],
    ['exercises','◈','Exercices'],
    ['nutrition','◷','Nutrition'],
    ['progress','⌁','Progression'],
    ['profile','◎','Profil']
  );
  ui.atlasProgram='strength';
  ui.atlasPostExercises=false;

  const style=document.createElement('style');
  style.textContent=`
    @media(max-width:750px){
      .bottom-nav{grid-template-columns:repeat(6,minmax(0,1fr))!important;padding-left:2px;padding-right:2px}
      .bottom-nav button{min-width:0;font-size:9px!important;padding:7px 0!important;gap:3px;white-space:normal;line-height:1.15}
      .bottom-nav .nav-ico{font-size:19px}
      .bottom-nav .nav-label{font-size:8.5px;line-height:1.15;overflow-wrap:anywhere}
      .atlas-history-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    .atlas-switch-controls{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
    .atlas-history-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px}
    #af-photo-preview img{max-width:100%;max-height:300px;object-fit:contain;border-radius:14px;border:1px solid var(--line)}
    #atlas-nutrition-profile .form-grid{margin:0}
    #atlas-nutrition-profile .field small{color:var(--muted)}
    @media(min-width:751px) and (max-width:1100px){.side-nav button{font-size:11px}}
  `;
  document.head.append(style);

  const originalProfile=renderProfile;
  renderProfile=function(){return originalProfile()+profileNutrition();};
  const originalHome=renderHome;
  renderHome=function(){
    const day=localDate(),n=tally(day),goal=calculate();
    return originalHome()+`<div class="section-heading"><h2>Ma nutrition aujourd’hui</h2><button class="text-btn" data-act="nav" data-tab="nutrition">Ouvrir le journal →</button></div>
      <div class="grid grid-3">${metricCard('Calories consommées',`${format(n.kcal)} kcal`,'Depuis minuit')}${metricCard('Objectif journalier',goal?`${format(goal.kcal)} kcal`:'À définir','Réglable dans Profil')}${metricCard('Protéines déclarées',`${format(n.protein,1)} g`,'Selon les valeurs saisies')}</div>`;
  };
  const originalPlan=renderPlan;
  renderPlan=function(){
    if(ui.atlasProgram==='postpartum')return postpartumPage();
    const base=originalPlan(),pos=base.indexOf('<div class="panel"');
    return pos>=0?base.slice(0,pos)+switcher()+base.slice(pos):base+switcher();
  };
  const originalExercises=renderExercises;
  renderExercises=function(){
    if(ui.atlasPostExercises)return showPostpartumExercises();
    const base=originalExercises(),pos=base.indexOf('<div class="tabs"');
    const button=`<div class="panel" style="margin-bottom:15px"><div class="log-head"><div><strong>Programme « Après mon bébé »</strong><p class="subline" style="font-size:12px">8 mouvements doux et progressifs, avec précautions pour le diastasis.</p></div><button class="btn small secondary" data-atlas="show-post-exercises">Découvrir →</button></div></div>`;
    return pos>=0?base.slice(0,pos)+button+base.slice(pos):base+button;
  };
  const originalProgress=renderProgress;
  renderProgress=function(){
    const post=(state.history||[]).filter(h=>String(h.title||'').startsWith('Après mon bébé'));
    return originalProgress()+`<section class="panel" style="margin-top:18px"><div class="kicker">APRÈS MON BÉBÉ</div><h2>Suivi du programme</h2><p class="subline">${post.length} séance${post.length>1?'s':''} enregistrée${post.length>1?'s':''}. Les séances apparaissent aussi dans l’historique général de progression.</p></section>`;
  };
  const originalRender=render;
  render=function(){
    if(ui.tab==='nutrition'){
      renderNav();
      document.getElementById('app').innerHTML=nutritionPage()+`<div class="footer-tip">ATLAS Fit · Données sauvegardées localement · Nutrition v3</div>`;
      renderModal();
      return;
    }
    return originalRender();
  };

  let photoURL=null;
  document.addEventListener('click',function(event){
    const button=event.target.closest('[data-atlas]');
    if(!button)return;
    event.preventDefault();
    const action=button.dataset.atlas;
    if(action==='program'){
      ui.atlasProgram=['strength','custom','postpartum'].includes(button.dataset.program)?button.dataset.program:'strength';
      ui.tab='plan';render();
    }else if(action==='start-postpartum'){
      const i=Number(button.dataset.index),day=POST_DAYS[i];if(!day)return;
      // La séance est ajoutée TEMPORAIREMENT au plan pour utiliser le suivi natif.
      const copy=JSON.parse(JSON.stringify(day));
      state.plan.push(copy);
      try{startSession(copy.id);}finally{state.plan=state.plan.filter(x=>x!==copy);save();}
    }else if(action==='show-post-exercises'){
      ui.atlasPostExercises=true;ui.tab='exercises';render();window.scrollTo(0,0);
    }else if(action==='show-all-exercises'){
      ui.atlasPostExercises=false;ui.tab='exercises';render();
    }else if(action==='delete-food'){
      if(!confirm('Supprimer cette consommation ?'))return;
      N().entries=N().entries.filter(x=>x.id!==button.dataset.id);save();render();
    }else if(action==='select-day'){
      N().selectedDate=button.dataset.day;save();render();
    }
  });
  document.addEventListener('submit',function(event){
    if(event.target.id==='atlas-nutr-profile'){
      event.preventDefault();const fd=new FormData(event.target),p=N().profile;
      const values={age:Number(fd.get('age')),height:Number(fd.get('height')),weight:Number(fd.get('weight')),sex:String(fd.get('sex')),activity:String(fd.get('activity')),goal:String(fd.get('goal')),goalDelta:Number(fd.get('goalDelta')),lactation:String(fd.get('lactation')),customAdjustment:Number(fd.get('customAdjustment'))};
      if(!(values.age>=18&&values.age<=100&&values.height>=120&&values.height<=230&&values.weight>=20&&values.weight<=350))return toast('Profil nutrition : valeurs invalides.');
      Object.assign(p,values);save();render();toast('Objectif nutritionnel recalculé.');
    }else if(event.target.id==='atlas-food-form'){
      event.preventDefault();const fd=new FormData(event.target),n=N();
      const grams=Number(fd.get('grams')),kcal100=Number(fd.get('kcal100'));
      if(!(grams>0&&grams<=20000&&kcal100>=0&&kcal100<=1200))return toast('Vérifie la quantité et les kcal pour 100 g.');
      const optional=['protein100','carbs100','fat100'];
      const values=optional.map(k=>{const v=String(fd.get(k)??'').trim();return v===''?null:Number(v);});
      if(values.some(v=>v!==null&&(!Number.isFinite(v)||v<0||v>100)))return toast('Macronutriments pour 100 g invalides.');
      const m=grams/100;
      n.entries.push({id:uid(),date:n.selectedDate,meal:String(fd.get('meal')),name:String(fd.get('name')).trim().slice(0,120),grams:round(grams,1),kcal:round(m*kcal100,1),protein:round(m*(values[0]||0),1),carbs:round(m*(values[1]||0),1),fat:round(m*(values[2]||0),1),macrosComplete:values.every(v=>v!==null)});
      save();render();toast('Aliment ajouté au journal.');
    }else if(event.target.id==='profile-form'){
      // Synchronise le poids, le reste est géré par le formulaire d’origine.
      const entered=new FormData(event.target).get('weight');
      if(entered!==''&&Number(entered)>=20&&Number(entered)<=350)N().profile.weight=Number(entered);
    }else if(event.target.id==='weight-form'){
      const entered=new FormData(event.target).get('weight');
      if(entered!==''&&Number(entered)>=20&&Number(entered)<=350)N().profile.weight=Number(entered);
    }
  },true);
  document.addEventListener('change',function(event){
    if(event.target.id==='atlas-day'){
      const v=event.target.value;
      if(/^\d{4}-\d\d-\d\d$/.test(v)){N().selectedDate=v;save();render();}
    }else if(event.target.id==='af-photo'){
      const file=event.target.files?.[0],container=document.getElementById('af-photo-preview');
      if(photoURL){URL.revokeObjectURL(photoURL);photoURL=null;}
      if(!file||!container)return;
      if(!file.type.startsWith('image/')||file.size>10*1024*1024){container.textContent='Choisis une image de moins de 10 Mo.';return;}
      photoURL=URL.createObjectURL(file);
      const img=document.createElement('img');img.src=photoURL;img.alt='Aperçu de ton repas (non analysé par IA)';container.replaceChildren(img);
    }
  });
  // L’application native ayant déjà appelé render() au chargement, on redessine avec les nouveaux onglets.
  render();
})();
