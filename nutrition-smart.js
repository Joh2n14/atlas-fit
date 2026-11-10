/* ATLAS Fit — Nutrition intuitive v4.
 * Chargement : data.js, app.js, atlas-v3.js, puis ce fichier.
 * Les données restent dans atlas-fit-v1 (localStorage), sans migration destructive.
 * Open Food Facts : recherche explicite uniquement (pas à chaque frappe), limites API respectées.
 */
(function atlasSmartNutrition(){
  'use strict';
  if(typeof state==='undefined'||typeof render!=='function'||typeof save!=='function'||typeof header!=='function'){
    console.error('ATLAS Nutrition v4 : scripts principaux manquants');
    return;
  }

  const MEALS={breakfast:'Petit-déjeuner',lunch:'Déjeuner',snack:'Collation',dinner:'Dîner'};
  const SOURCE_OFF='Open Food Facts (base collaborative)';
  const SAMPLE={
    id:'intermarche-fleury-michon-3302740047114',code:'3302740047114',name:'Jambon de porc sans couenne – Simplement Bon',
    brand:'Fleury Michon · Intermarché',quantity:'4 tranches – 160 g',serving:'1 tranche = 40 g',
    portionGrams:40,portionLabel:'tranche',kcal100:115,protein100:22,carbs100:0.5,fat100:2.8,
    source:'Fiche produit Intermarché',sourceUrl:'https://www.intermarche.com/produit/jambon-de-porc-sans-couenne-simplement-bon/3302740047114'
  };
  const page={query:'',intentCount:1,results:[],selected:null,count:1,grams:100,meal:'lunch',
    status:'',busy:false,scan:false,lookupId:0,searchCache:new Map()};
  let cameraStream=null,scanFrame=null,scanning=false;
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numeric=x=>Number.isFinite(Number(x))?Number(x):null;
  const valid=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
  const round=(v,d=1)=>Math.round(v*10**d)/10**d;
  const fmt=(v,d=1)=>Number(v).toLocaleString('fr-FR',{maximumFractionDigits:d});
  const read=(obj,key,max=10000)=>{const x=obj?.[key];if(x===undefined||x===null||x==='')return null;const v=Number(x);return valid(v,0,max)?v:null;};
  const safeLink=s=>{try{const u=new URL(String(s));return ['https:','http:'].includes(u.protocol)?safe(u.href):'#';}catch(_){return '#';}};
  const mealOptions=current=>Object.entries(MEALS).map(([k,v])=>`<option value="${k}" ${k===current?'selected':''}>${v}</option>`).join('');

  function store(){
    if(!state.nutrition||typeof state.nutrition!=='object')state.nutrition={entries:[],selectedDate:localDay()};
    const n=state.nutrition;
    if(!Array.isArray(n.entries))n.entries=[];
    if(!Array.isArray(n.favorites))n.favorites=[];
    if(!Array.isArray(n.recipes))n.recipes=[];
    if(!/^\d{4}-\d\d-\d\d$/.test(n.selectedDate||''))n.selectedDate=localDay();
    return n;
  }
  function localDay(date=new Date()){
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function totals(items){
    return items.reduce((acc,e)=>{
      for(const k of ['kcal','protein','carbs','fat'])acc[k]+=Number(e[k])||0;
      if(e.macrosComplete===false)acc.incomplete=true;
      return acc;
    },{kcal:0,protein:0,carbs:0,fat:0,incomplete:false});
  }
  function nutritionTarget(){
    const p=store().profile||{},w=Number(p.weight),h=Number(p.height),a=Number(p.age);
    if(!valid(w,20,350)||!valid(h,120,230)||!valid(a,18,100)||!['male','female'].includes(p.sex))return null;
    const fac={sedentary:1.2,light:1.375,moderate:1.55,high:1.725,very:1.9}[p.activity]||1.2;
    const offset=p.goal==='mass'?Math.max(0,Math.min(700,Number(p.goalDelta)||0)):
      p.goal==='loss'?-Math.max(0,Math.min(700,Number(p.goalDelta)||0)):0;
    const custom=Math.max(-500,Math.min(1000,Number(p.customAdjustment)||0));
    return Math.round(Math.max(0,(10*w+6.25*h-5*a+(p.sex==='male'?5:-161))*fac+offset+custom));
  }
  function parseWeight(value){
    const m=String(value||'').match(/(\d+(?:[.,]\d+)?)\s*(?:g|grammes?)\b/i);
    const g=m?Number(m[1].replace(',','.')):null;
    return valid(g,1,20000)?g:null;
  }
  function packagingPortion(q){
    const text=String(q||'');
    let m=text.match(/\b(\d{1,3})\s*tranches?\b[^\d]{0,14}(\d+(?:[.,]\d+)?)\s*g\b/i);
    if(m){const g=Number(m[2].replace(',','.'))/Number(m[1]);return valid(g,1,500)?g:null;}
    m=text.match(/\b(\d{1,3})\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*g\b/i);
    if(m){const g=Number(m[2].replace(',','.'));return valid(g,1,500)?g:null;}
    return null;
  }
  function normalizeProduct(product){
    if(!product||typeof product!=='object')return null;
    const n=product.nutriments||{};
    let energy=read(n,'energy-kcal_100g',1200);
    if(energy===null){const kj=read(n,'energy-kj_100g',5500);energy=kj===null?null:round(kj/4.184,1);}
    if(energy===null)return null;
    const name=String(product.product_name_fr||product.product_name||'').trim();
    if(!name)return null;
    const code=String(product.code||'').trim();
    const serving=String(product.serving_size||'').slice(0,80);
    const quantity=String(product.quantity||'').slice(0,90);
    const explicitServing=parseWeight(serving);
    const fromPack=packagingPortion(quantity);
    const hasSlices=/tranche/i.test(serving)||/tranche/i.test(quantity);
    const sm=serving.match(/(\d{1,3})\s*tranches?/i);
    const servingPerSlice=explicitServing&&sm?explicitServing/Number(sm[1]):null;
    const portionGrams=hasSlices?(servingPerSlice||fromPack||explicitServing):(explicitServing||fromPack);
    const portionLabel=hasSlices&&portionGrams?'tranche':'portion';
    return {id:code||`off-${name}`,code,name:name.slice(0,120),brand:String(product.brands||'').slice(0,90),
      quantity,serving,portionGrams,portionLabel,kcal100:energy,protein100:read(n,'proteins_100g',100),
      carbs100:read(n,'carbohydrates_100g',100),fat100:read(n,'fat_100g',100),
      source:SOURCE_OFF,sourceUrl:code?`https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`:'https://world.openfoodfacts.org/'};
  }
  function validSavedProduct(p){
    return p&&typeof p.name==='string'&&valid(Number(p.kcal100),0,1200)&&typeof p.id==='string';
  }
  function labelOf(p){return p.portionGrams?`${p.portionLabel==='tranche'?'tranche':'portion'} (${fmt(p.portionGrams)} g)`:'grammes';}
  function selectedGrams(){if(!page.selected)return 0;return page.selected.portionGrams?round(page.count*page.selected.portionGrams,1):page.grams;}
  function scaled(p,grams){const ratio=grams/100;return {
    kcal:round(p.kcal100*ratio),protein:p.protein100===null?null:round(p.protein100*ratio),
    carbs:p.carbs100===null?null:round(p.carbs100*ratio),fat:p.fat100===null?null:round(p.fat100*ratio)
  };}
  function valueLabel(n,unit){return n===null?'Non renseigné':`${fmt(n)} ${unit}`;}
  function productCard(p,i){return `<button type="button" class="smart-result" data-smart="select" data-index="${i}">
    <span><strong>${safe(p.name)}</strong><small>${safe(p.brand||'Marque non renseignée')}${p.quantity?' · '+safe(p.quantity):''}</small></span>
    <span class="smart-result-meta">${fmt(p.kcal100)} kcal/100 g <span aria-hidden="true">›</span></span></button>`;}
  function selectionPanel(){
    const p=page.selected;if(!p)return `<p class="subline">Sélectionne un produit pour choisir directement une quantité et afficher les calories.</p>`;
    const grams=selectedGrams(),s=scaled(p,grams),hasWeight=!!p.portionGrams;
    const isFav=store().favorites.some(x=>x.id===p.id);
    return `<div class="smart-product-title"><div><div class="kicker">PRODUIT SÉLECTIONNÉ</div><h3>${safe(p.name)}</h3>
      <p class="subline">${safe(p.brand)} · ${safe(p.quantity||'Conditionnement non renseigné')}</p></div>
      <button class="btn small secondary" type="button" data-smart="favorite" aria-label="${isFav?'Retirer des favoris':'Ajouter aux favoris'}">${isFav?'★ Favori':'☆ Favori'}</button></div>
      <div class="smart-quantity">
        ${hasWeight?`<div><strong>Nombre de ${p.portionLabel==='tranche'?'tranches':'portions'}</strong><small>${safe(p.serving||`${fmt(p.portionGrams)} g par ${p.portionLabel}`)}${!p.serving&&p.quantity?' · calculé depuis le paquet':''}</small></div>
        <div class="smart-counter"><button type="button" data-smart="minus" aria-label="Diminuer">−</button><strong>${fmt(page.count)}</strong><button type="button" data-smart="plus" aria-label="Augmenter">+</button></div>`:
        `<div class="field" style="width:100%"><label for="smart-grams">Quantité consommée (g) · portion inconnue</label><input type="number" id="smart-grams" min="1" max="20000" step="1" value="${safe(page.grams)}"><small>La base ne fournit pas de poids de portion fiable pour ce produit. Renseigne la quantité de l'emballage ou pesée.</small></div>`}
      </div>
      <div class="smart-totals" id="smart-totals"><div><strong>${fmt(s.kcal)}</strong><small>kcal</small></div>
      <div><strong>${valueLabel(s.protein,'g')}</strong><small>Protéines</small></div><div><strong>${valueLabel(s.carbs,'g')}</strong><small>Glucides</small></div><div><strong>${valueLabel(s.fat,'g')}</strong><small>Lipides</small></div></div>
      <div class="smart-source">${fmt(grams)} g consommés · <a href="${safeLink(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${safe(p.source)}</a>. Vérifie les informations sur l'emballage.</div>
      <button class="btn full" type="button" data-smart="add">+ Ajouter au journal</button>`;
  }
  function journal(){
    const n=store(),dayEntries=n.entries.filter(e=>e.date===n.selectedDate);
    const groups=Object.entries(MEALS).map(([key,label])=>{
      const items=dayEntries.filter(e=>e.meal===key);if(!items.length)return '';
      const t=totals(items);
      return `<section class="smart-meal"><div class="smart-meal-top"><h3>${label} · ${fmt(t.kcal,0)} kcal</h3>
        <button class="btn small secondary" data-smart="save-recipe" data-meal="${key}">☆ Enregistrer comme repas favori</button></div>
        ${items.map(e=>`<div class="smart-entry"><div><strong>${safe(e.name)}</strong><small>${fmt(e.grams||0)} g${e.portionLabel?' · '+safe(e.portionLabel):''} · ${fmt(e.kcal||0)} kcal${e.macrosComplete===false?' · macros partielles':''}</small></div>
          <button type="button" class="btn small danger" data-smart="remove" data-id="${safe(e.id)}" aria-label="Supprimer ${safe(e.name)}">Supprimer</button></div>`).join('')}</section>`;
    }).filter(Boolean).join('');
    return groups||`<div class="empty"><strong>Pas encore de repas enregistré</strong><p>Ajoute ton premier aliment, avec une portion ou en grammes.</p></div>`;
  }
  function recipeList(){return store().recipes.map((r,i)=>{
    const sum=totals(r.items||[]);return `<div class="smart-recipe"><div><strong>${safe(r.name)}</strong><small>${(r.items||[]).length} aliment(s) · ${fmt(sum.kcal,0)} kcal</small></div>
    <div class="smart-recipe-actions"><button type="button" class="btn small secondary" data-smart="use-recipe" data-index="${i}">+ Ajouter</button>
    <button type="button" class="btn small ghost" data-smart="delete-recipe" data-index="${i}" aria-label="Supprimer la recette">×</button></div></div>`;
  }).join('');}
  function overview(){
    const n=store(),day=n.selectedDate,t=totals(n.entries.filter(e=>e.date===day)),goal=nutritionTarget();
    return `<div class="panel smart-overview"><div class="smart-overview-head"><div><div class="kicker">BILAN DU JOUR</div><h2>${fmt(t.kcal,0)} ${goal!==null?`<span>/ ${fmt(goal,0)}</span>`:''} kcal</h2>
      <p class="subline">${goal===null?'Définis ta cible dans Profil.':t.kcal<=goal?`${fmt(goal-t.kcal,0)} kcal restantes (objectif estimé)`:`${fmt(t.kcal-goal,0)} kcal au-dessus de la cible estimée`}</p></div>
      <div class="field"><label for="smart-day">Date</label><input type="date" id="smart-day" value="${safe(day)}"></div></div>
      ${goal?`<div class="bar-track" style="height:11px;margin:14px 0"><div class="bar-fill" style="width:${Math.min(100,Math.max(0,t.kcal/goal*100))}%"></div></div>`:''}
      <div class="meta"><span class="chip">Protéines : ${fmt(t.protein)} g</span><span class="chip">Glucides : ${fmt(t.carbs)} g</span><span class="chip">Lipides : ${fmt(t.fat)} g</span></div>
      ${t.incomplete?'<small class="muted">Certains aliments ne disposent pas de tous les macronutriments : les totaux sont partiels.</small>':''}</div>`;
  }
  function renderNutrition(){
    const fav=store().favorites.filter(validSavedProduct);
    return header('CARNET ALIMENTAIRE','Nutrition','Des aliments réels, des portions simples, et un journal de repas sans calcul manuel.')+
      overview()+`<div class="grid grid-2 smart-main"><section class="panel smart-search-card"><div class="kicker">RECHERCHE ALIMENTAIRE</div><h2>Ajouter un aliment</h2>
      <label class="field" for="smart-query"><span>Nom, marque ou code-barres</span></label>
      <form id="smart-search-form" class="smart-searchbar"><input id="smart-query" name="query" class="search-input" maxlength="100" value="${safe(page.query)}" placeholder="Ex. 2 tranches de jambon" autocomplete="off">
        <button class="btn" type="submit" ${page.busy?'disabled':''}>${page.busy?'Recherche…':'Rechercher'}</button></form>
      <div class="smart-quick"><button type="button" class="btn small secondary" data-smart="sample">Exemple : 1 tranche de jambon</button>
        <button type="button" class="btn small ghost" data-smart="scan">📷 Scanner</button></div>
      ${page.scan?`<div class="smart-scanner"><video id="smart-video" autoplay muted playsinline aria-label="Caméra pour scanner le code-barres"></video><button class="btn small secondary" type="button" data-smart="stop-scan">Arrêter la caméra</button></div>`:''}
      <div class="smart-status" role="status" aria-live="polite">${safe(page.status)}</div>
      ${page.results.length?`<div class="smart-results">${page.results.map(productCard).join('')}</div>`:''}
      ${fav.length?`<div class="section-heading"><h3>Mes aliments favoris</h3></div><div class="smart-results">${fav.slice(0,12).map((p,i)=>`<button class="smart-result" type="button" data-smart="select-favorite" data-index="${i}"><span><strong>★ ${safe(p.name)}</strong><small>${safe(p.brand||'')}</small></span><span>›</span></button>`).join('')}</div>`:''}
      <details class="smart-manual"><summary>Je ne trouve pas l'aliment · saisie manuelle</summary>
        <form id="smart-manual-form" class="form-grid"><div class="field"><label for="sm-name">Nom</label><input id="sm-name" name="name" required maxlength="120" placeholder="Ex. Riz cuit"></div>
        <div class="field"><label for="sm-grams">Quantité en grammes</label><input id="sm-grams" name="grams" type="number" min="1" max="20000" step="0.1" required></div>
        <div class="field"><label for="sm-kcal">Calories / 100 g (étiquette)</label><input id="sm-kcal" name="kcal" type="number" min="0" max="1200" step="0.1" required></div>
        <div class="field"><label for="sm-p">Protéines / 100 g (facultatif)</label><input id="sm-p" name="protein" type="number" min="0" max="100" step="0.1"></div>
        <div class="field"><label for="sm-c">Glucides / 100 g (facultatif)</label><input id="sm-c" name="carbs" type="number" min="0" max="100" step="0.1"></div>
        <div class="field"><label for="sm-f">Lipides / 100 g (facultatif)</label><input id="sm-f" name="fat" type="number" min="0" max="100" step="0.1"></div>
        <button class="btn" type="submit">+ Ajouter manuellement</button></form></details>
      </section><section class="panel smart-selection"><div class="field"><label for="smart-meal">Repas concerné</label><select id="smart-meal">${mealOptions(page.meal)}</select></div>
        <div id="smart-selection-panel">${selectionPanel()}</div></section></div>
      <div class="grid grid-2 smart-bottom"><section class="panel"><div class="section-heading" style="margin-top:0"><h2>Mon journal alimentaire</h2></div>${journal()}</section>
      <section class="panel"><div class="section-heading" style="margin-top:0"><h2>Mes repas favoris</h2></div>
        <p class="subline">Enregistre un repas du journal pour le réutiliser en un clic.</p>
        ${recipeList()||'<p class="subline" style="margin-top:16px">Aucun repas favori pour le moment.</p>'}</section></div>
      <p class="smart-legal">Recherche via <a target="_blank" rel="noopener noreferrer" href="https://world.openfoodfacts.org/">Open Food Facts</a> (licence ODbL, données collaboratives). Recherche et scanner nécessitent Internet. Les fiches peuvent être incomplètes ; vérifie toujours l'étiquette. Le calcul ATLAS Fit et tes favoris restent enregistrés sur cet appareil. ATLAS Fit n'est affiliée ni à Intermarché ni à Jow.</p>`;
  }
  function redraw(){if(ui.tab!=='nutrition')return;stopCamera();renderNav();const root=document.getElementById('app');
    root.innerHTML=renderNutrition()+`<div class="footer-tip">ATLAS Fit · Nutrition intuitive v4 · Données locales</div>`;renderModal();}
  function refreshSelection(){const el=document.getElementById('smart-selection-panel');if(el)el.innerHTML=selectionPanel();}
  function choose(product){if(!validSavedProduct(product))return;stopCamera();page.selected={...product};page.count=page.intentCount||1;page.grams=100;refreshSelection();}
  function addEntry(p,grams,portionLabel){
    if(!validSavedProduct(p)||!valid(grams,0.1,20000))return false;
    const n=store(),calc=scaled(p,grams);
    n.entries.push({id:uid(),date:n.selectedDate,meal:page.meal,name:p.name,grams:round(grams,1),
      kcal:calc.kcal,protein:calc.protein??0,carbs:calc.carbs??0,fat:calc.fat??0,
      macrosComplete:calc.protein!==null&&calc.carbs!==null&&calc.fat!==null,
      portionLabel:portionLabel||'',source:p.source,sourceUrl:p.sourceUrl,barcode:p.code||''});
    save();return true;
  }
  function parseSearch(raw){
    let query=String(raw||'').trim();let count=1;
    const m=query.match(/^(\d+(?:[.,]\d+)?)\s*(?:tranches?|portions?|parts?|unités?|oeufs?|œufs?|bananes?)\s*(?:de|d'|du|des)?\s*(.*)$/i);
    if(m){count=Number(m[1].replace(',','.'));query=m[2]?.trim()||query.replace(/^\d+\s*/, '');
      if(/^(?:oeufs?|œufs?|bananes?)$/i.test(String(raw).trim().split(/\s+/).slice(1).join(' ')))query=String(raw).trim().split(/\s+/).slice(1).join(' ');
    }
    return {query,count:valid(count,0.5,30)?count:1};
  }
  async function searchProducts(raw){
    const parsed=parseSearch(raw);page.query=raw;page.intentCount=parsed.count;
    const query=parsed.query;if(query.length<2){page.status='Saisis au moins 2 caractères.';redraw();return;}
    if(/^\d{8,14}$/.test(query))return lookupBarcode(query);
    const cached=page.searchCache.get(query.toLowerCase());
    if(cached){page.results=cached;page.status=`${cached.length} résultat(s) en mémoire. Sélectionne le produit exact.`;redraw();return;}
    const requestId=++page.lookupId;page.busy=true;page.status='Recherche sur Open Food Facts…';page.results=[];redraw();
    try{
      const u=new URL('https://world.openfoodfacts.org/cgi/search.pl');
      u.search=new URLSearchParams({search_terms:query,search_simple:'1',action:'process',json:'1',page_size:'14',
        fields:'code,product_name,product_name_fr,brands,quantity,serving_size,nutriments'}).toString();
      const response=await fetch(u.toString(),{headers:{Accept:'application/json'}});
      if(!response.ok)throw Error(`HTTP ${response.status}`);
      const json=await response.json();if(requestId!==page.lookupId)return;
      const found=(Array.isArray(json.products)?json.products:[]).map(normalizeProduct).filter(Boolean);
      page.searchCache.set(query.toLowerCase(),found);page.results=found;
      page.status=found.length?`${found.length} produit(s) avec calories renseignées. Choisis la marque et la référence.`:'Aucun produit exploitable trouvé. Essaie une autre marque ou la saisie manuelle.';
    }catch(error){if(requestId!==page.lookupId)return;
      page.status='Recherche indisponible (connexion, limite de l’API ou accès navigateur). Utilise la fiche exemple ou la saisie manuelle.';}
    finally{if(requestId===page.lookupId){page.busy=false;redraw();}}
  }
  async function lookupBarcode(code){
    const requestId=++page.lookupId;page.busy=true;page.status='Recherche du code-barres…';page.results=[];redraw();
    try{
      const u=`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_fr,brands,quantity,serving_size,nutriments`;
      const response=await fetch(u,{headers:{Accept:'application/json'}});
      if(!response.ok)throw Error(`HTTP ${response.status}`);
      const json=await response.json();if(requestId!==page.lookupId)return;
      const product=json.status===1?normalizeProduct(json.product):null;
      page.results=product?[product]:[];page.status=product?'Produit identifié. Vérifie le paquet avant de l’ajouter.':'Code inconnu ou informations nutritionnelles absentes.';
      if(product){page.selected=product;page.count=page.intentCount||1;page.grams=100;}
    }catch(error){if(requestId!==page.lookupId)return;page.status='Lecture du produit impossible. Vérifie la connexion ou renseigne les informations manuellement.';}
    finally{if(requestId===page.lookupId){page.busy=false;redraw();}}
  }
  function stopCamera(){scanning=false;page.scan=false;
    if(scanFrame!==null){cancelAnimationFrame(scanFrame);scanFrame=null;}
    if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;}
  }
  // Le rendu normal de la page reste sans caméra. Le scanner utilise un bloc monté sans redessiner.
  async function activateCamera(){
    if(!('BarcodeDetector'in window)||!navigator.mediaDevices?.getUserMedia){page.status='Scanner caméra non disponible ici : saisis les chiffres du code-barres.';redraw();return;}
    try{
      const detector=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});
      cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      scanning=true;page.scan=true;
      const target=document.querySelector('.smart-quick');
      if(!target){stopCamera();return;}
      const area=document.createElement('div');area.className='smart-scanner';area.id='smart-live-camera';
      area.innerHTML='<video autoplay muted playsinline aria-label="Caméra pour scanner un code-barres"></video><button type="button" class="btn small secondary" data-smart="stop-scan">Arrêter la caméra</button>';
      target.insertAdjacentElement('afterend',area);
      const video=area.querySelector('video');video.srcObject=cameraStream;await video.play();
      const detect=async()=>{
        if(!scanning||ui.tab!=='nutrition')return;
        try{const found=await detector.detect(video);if(found.length){const code=String(found[0].rawValue||'');stopCamera();area.remove();if(/^\d{8,14}$/.test(code)){page.query=code;page.intentCount=1;await lookupBarcode(code);}else{page.status='Code détecté au format non pris en charge.';redraw();}return;}}catch(_error){}
        if(scanning)scanFrame=requestAnimationFrame(detect);
      };
      scanFrame=requestAnimationFrame(detect);
    }catch(error){stopCamera();document.getElementById('smart-live-camera')?.remove();page.status='Caméra indisponible ou accès refusé. Saisis les chiffres du code-barres.';redraw();}
  }

  const style=document.createElement('style');
  style.textContent=`
    .smart-main,.smart-bottom{margin-top:18px}.smart-overview-head{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap}
    .smart-overview h2{font-size:31px;margin:8px 0}.smart-overview h2 span{color:var(--muted);font-weight:500;font-size:20px}
    .smart-overview .field{min-width:160px}.smart-search-card h2{margin:9px 0 14px}.smart-searchbar{display:flex;gap:7px;margin:9px 0}
    .smart-searchbar .search-input{min-width:0;flex:1}.smart-quick{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}
    .smart-status{font-size:12px;color:var(--muted);min-height:20px;line-height:1.5;margin:10px 0}
    .smart-results{display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto}
    .smart-result{width:100%;border:1px solid var(--line);border-radius:12px;background:var(--panel2);color:var(--text);
      text-align:left;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .smart-result:hover{border-color:var(--lime)}.smart-result strong{display:block;font-size:13px}.smart-result small{display:block;margin-top:4px;font-size:11px;color:var(--muted);line-height:1.4}
    .smart-result-meta{white-space:nowrap;font-size:11px;color:var(--lime)}.smart-manual{border-top:1px solid var(--line);margin-top:18px;padding-top:14px}
    .smart-manual summary{cursor:pointer;color:var(--teal);font-size:13px;font-weight:750}.smart-manual .form-grid{margin-top:15px}
    .smart-selection .field{margin-bottom:14px}.smart-product-title{display:flex;justify-content:space-between;gap:12px;align-items:start}
    .smart-product-title h3{margin:8px 0;font-size:20px}.smart-quantity{display:flex;gap:14px;align-items:center;justify-content:space-between;
      padding:17px 0;border-top:1px solid var(--line);margin-top:15px}.smart-quantity small{display:block;color:var(--muted);margin-top:5px;font-size:11px;line-height:1.4}
    .smart-counter{display:flex;align-items:center;gap:12px}.smart-counter button{border:1px solid var(--line);background:var(--panel2);
      width:34px;height:34px;color:var(--text);border-radius:10px;font-size:20px}.smart-counter strong{min-width:18px;text-align:center}
    .smart-totals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0 16px}
    .smart-totals>div{background:#1c2b3e;border:1px solid var(--line);padding:15px 12px;border-radius:13px}
    .smart-totals strong{font-size:19px;color:var(--lime);display:block;line-height:1.25}.smart-totals small{display:block;margin-top:4px;color:var(--muted)}
    .smart-source{color:var(--muted);font-size:12px;line-height:1.5;margin-bottom:18px}.smart-meal{padding:14px 0;border-top:1px solid var(--line)}
    .smart-meal-top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}.smart-meal h3{margin:0;font-size:15px}
    .smart-entry,.smart-recipe{padding:11px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line)}
    .smart-entry strong,.smart-recipe strong{display:block;font-size:13px}.smart-entry small,.smart-recipe small{display:block;color:var(--muted);font-size:11px;margin-top:4px}
    .smart-recipe-actions{display:flex;gap:6px;align-items:center}.smart-legal{font-size:12px;line-height:1.6;color:var(--muted);margin:20px 0 0}
    .smart-scanner{padding:12px 0;display:flex;flex-direction:column;gap:10px}.smart-scanner video{width:100%;max-height:290px;background:#000;border-radius:12px}
    @media(max-width:520px){.smart-searchbar{flex-direction:column}.smart-searchbar .btn{width:100%}.smart-product-title{flex-direction:column}
      .smart-overview-head{align-items:stretch}.smart-counter{gap:8px}.smart-result-meta{white-space:normal;text-align:right}}
  `;
  document.head.append(style);
  const previousRender=render;
  render=function(){if(ui.tab==='nutrition'){redraw();return;}stopCamera();return previousRender();};

  document.addEventListener('submit',function(e){
    if(e.target.id==='smart-search-form'){
      e.preventDefault();if(page.busy)return;const raw=String(new FormData(e.target).get('query')||'').trim();searchProducts(raw);
    }else if(e.target.id==='smart-manual-form'){
      e.preventDefault();const fd=new FormData(e.target),name=String(fd.get('name')||'').trim();
      const grams=Number(fd.get('grams')),kcal=Number(fd.get('kcal'));
      const readOptional=k=>{const raw=String(fd.get(k)||'').trim();return raw===''?null:Number(raw);};
      const protein=readOptional('protein'),carbs=readOptional('carbs'),fat=readOptional('fat');
      if(!name||!valid(grams,0.1,20000)||!valid(kcal,0,1200)||[protein,carbs,fat].some(v=>v!==null&&!valid(v,0,100))){toast('Vérifie les valeurs de ton aliment.');return;}
      if(addEntry({id:'manual-'+uid(),name,brand:'',code:'',portionGrams:null,kcal100:kcal,protein100:protein,carbs100:carbs,fat100:fat,source:'Saisie manuelle',sourceUrl:'https://ciqual.anses.fr/'},grams)){
        page.status='Aliment ajouté à ton journal.';redraw();toast('Aliment ajouté.');
      }
    }
  });
  document.addEventListener('input',function(e){
    if(e.target.id==='smart-query')page.query=e.target.value;
    if(e.target.id==='smart-grams'){
      const grams=Number(e.target.value);page.grams=grams;
      const el=document.getElementById('smart-totals');if(!el||!page.selected)return;
      const s=scaled(page.selected,valid(grams,0.1,20000)?grams:0);
      el.innerHTML=`<div><strong>${fmt(s.kcal)}</strong><small>kcal</small></div><div><strong>${valueLabel(s.protein,'g')}</strong><small>Protéines</small></div><div><strong>${valueLabel(s.carbs,'g')}</strong><small>Glucides</small></div><div><strong>${valueLabel(s.fat,'g')}</strong><small>Lipides</small></div>`;
    }
  });
  document.addEventListener('change',function(e){
    if(e.target.id==='smart-day'&&/^\d{4}-\d\d-\d\d$/.test(e.target.value)){store().selectedDate=e.target.value;save();redraw();}
    if(e.target.id==='smart-meal'&&MEALS[e.target.value])page.meal=e.target.value;
  });
  document.addEventListener('click',function(e){
    const button=e.target.closest('[data-smart]');if(!button)return;e.preventDefault();
    const action=button.dataset.smart,n=store();
    if(action==='sample'){page.query='1 tranche de jambon';page.intentCount=1;page.results=[SAMPLE];page.selected=SAMPLE;page.count=1;page.status='Exemple : Fleury Michon, 4 tranches pour 160 g (fiche Intermarché).';redraw();}
    else if(action==='select'){choose(page.results[Number(button.dataset.index)]);}
    else if(action==='select-favorite'){choose(n.favorites.filter(validSavedProduct)[Number(button.dataset.index)]);}
    else if(action==='minus'&&page.selected){page.count=Math.max(0.5,round(page.count-0.5));refreshSelection();}
    else if(action==='plus'&&page.selected){page.count=Math.min(100,round(page.count+0.5));refreshSelection();}
    else if(action==='favorite'&&page.selected){const idx=n.favorites.findIndex(p=>p.id===page.selected.id);
      if(idx>=0)n.favorites.splice(idx,1);else n.favorites.unshift({...page.selected});save();redraw();}
    else if(action==='add'&&page.selected){const grams=selectedGrams();if(!valid(grams,0.1,20000)){toast('Renseigne une quantité valable.');return;}
      const label=page.selected.portionGrams?`${fmt(page.count)} ${page.selected.portionLabel}${page.count>1?'s':''}`:'';
      if(addEntry(page.selected,grams,label)){redraw();toast('Aliment ajouté au journal.');}}
    else if(action==='remove'){if(!window.confirm('Supprimer cet aliment du journal ?'))return;
      n.entries=n.entries.filter(x=>x.id!==button.dataset.id);save();redraw();}
    else if(action==='save-recipe'){
      const meal=button.dataset.meal,items=n.entries.filter(x=>x.date===n.selectedDate&&x.meal===meal);
      if(!items.length)return;const name=window.prompt('Nom de ce repas favori',`${MEALS[meal]||'Mon repas'} du ${n.selectedDate}`);
      if(name===null)return;const trimmed=name.trim().slice(0,90);if(!trimmed){toast('Donne un nom à ce repas.');return;}
      n.recipes.push({id:uid(),name:trimmed,items:items.map(x=>({...x}))});save();redraw();toast('Repas enregistré dans tes favoris.');
    }else if(action==='use-recipe'){
      const recipe=n.recipes[Number(button.dataset.index)];if(!recipe||!Array.isArray(recipe.items))return;
      for(const original of recipe.items){const item={...original,id:uid(),date:n.selectedDate,meal:page.meal};n.entries.push(item);}
      save();redraw();toast('Repas favori ajouté au journal.');
    }else if(action==='delete-recipe'){
      const idx=Number(button.dataset.index);if(!n.recipes[idx]||!window.confirm('Supprimer ce repas des favoris ?'))return;
      n.recipes.splice(idx,1);save();redraw();
    }else if(action==='scan')activateCamera();
    else if(action==='stop-scan'){stopCamera();document.getElementById('smart-live-camera')?.remove();}
  });
  store();
  render();
})();
