// ============================================================
// ui.js
// 界面操作：操作按钮、UI更新、当前洞高亮、信息板刷新
// ============================================================

// ── SHOT LABEL HELPERS ──
function shotTypeLabel(t){
  const map={TEE:T('toeOff'),APPR:T('approach'),LAYUP:T('layup'),CHIP:T('chip'),PUTT:T('putt'),FOR_BIRDIE:T('forBirdie'),FOR_PAR:T('forPar'),FOR_BOGEY:T('forBogey'),FOR_DOUBLE:T('forDouble'),FOR_TRIPLE:T('forTriple')};
  return (map[t]||t||'').toUpperCase();
}
function autoType(h,idx){
  const gross=getGross(h);
  if(!gross) return 'TEE';
  if(idx===0) return 'TEE';
  if(idx===gross-1){
    if(h.delta<=-1) return 'FOR_BIRDIE';
    if(h.delta===0) return 'FOR_PAR';
    if(h.delta===1) return 'FOR_BOGEY';
    if(h.delta===2) return 'FOR_DOUBLE';
    return 'FOR_TRIPLE';
  }
  // Par 5: shot[1]=LAYUP, shot[2]=APPR
  if(h.par>=5){
    if(idx===1) return 'LAYUP';
    if(idx===2) return 'APPR';
  }
  if(idx===1&&h.par>=4) return 'APPR';
  return 'CHIP';
}

// ── MINI TOAST ──
function miniToast(msg,isErr){
  const t=document.getElementById('mini-toast');
  t.textContent=msg; t.classList.remove('err-toast');
  if(isErr) t.classList.add('err-toast');
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),isErr?2500:1800);
}

// ── HOLE NAV ──
function buildHoleNav(){
  const f9P=S.holes.slice(0,9).reduce((a,h)=>a+h.par,0);
  const f9G=S.holes.slice(0,9).reduce((a,h)=>a+h.par+(h.delta??0),0);
  const b9P=S.holes.slice(9,18).reduce((a,h)=>a+h.par,0);
  const b9G=S.holes.slice(9,18).reduce((a,h)=>a+h.par+(h.delta??0),0);

  ['nav-row1','nav-row2'].forEach((id,row)=>{
    const cont=document.getElementById(id); cont.innerHTML='';
    for(let i=row*9;i<row*9+9;i++){
      const h=S.holes[i];
      const card=document.createElement('div');
      card.className='hcard '+deltaCardClass(h.delta);
      if(i===S.currentHole) card.classList.add('active');
      let sc='—';
      if(h.delta!==null) sc=S.displayMode==='topar'?fmtDeltaDisplay(h.delta):String(h.par+h.delta);
      card.innerHTML=`<div class="hn">${i+1}</div><div class="hp">P${h.par}</div><div class="hs">${sc}</div>`;
      card.onclick=()=>{
        // v5.2: switching holes resets last-shot manual type (exit FOR mode → result mode)
        if(S.currentHole!==i){
          const prev=S.holes[S.currentHole];
          const pg=getGross(prev);
          if(pg&&pg>0) delete prev.manualTypes[pg-1];
        }
        S.currentHole=i;
        S.scorecardSummary=null; // return to hole view
        const ch=S.holes[i];
        if(ch.delta!==null){
          const g=getGross(ch);
          if(g&&g>0) ch.shotIndex=g-1;
          // Also reset last-shot manual type for the target hole
          if(g&&g>0) delete ch.manualTypes[g-1];
        } else {
          ch.shotIndex=0;
        }
        render(); scheduleSave();
      };
      cont.appendChild(card);
    }
    if(row===0){
      const fc=makeStatCard('F',f9P,f9G);
      fc.style.cursor='pointer';
      fc.onclick=()=>{ S.scorecardSummary='out'; render(); scheduleSave(); };
      cont.appendChild(fc);
    } else {
      const bc=makeStatCard('B',b9P,b9G);
      bc.style.cursor='pointer';
      bc.onclick=()=>{ S.scorecardSummary='in'; render(); scheduleSave(); };
      cont.appendChild(bc);
      const tc=makeStatCard('T',f9P+b9P,f9G+b9G);
      tc.style.cursor='pointer';
      tc.onclick=()=>{ S.scorecardSummary='tot'; render(); scheduleSave(); };
      cont.appendChild(tc);
    }
  });
}

function makeStatCard(lbl,par,gross){
  const el=document.createElement('div');
  el.className='stat-card';
  el.innerHTML=`<div class="sc-lbl">${lbl}</div><div class="sc-val"><span style="color:var(--gold);font-size:9px">${par}</span><br><span class="sc-num">${gross}</span></div>`;
  return el;
}

// ── DELTA BUTTON ──
function buildDeltaBtn(){
  const h=curHole();
  const btn=document.getElementById('delta-val-btn');
  const mainTxt=document.getElementById('delta-main-txt');
  const hintTxt=document.getElementById('delta-hint-txt');

  if(h.delta===null){
    btn.className='unfilled'; btn.style.cssText='';
    mainTxt.textContent='—';
    hintTxt.style.display='none';
  } else {
    const d=h.delta;
    const bg=deltaColorHex(d);
    btn.className='';
    btn.style.background=bg; btn.style.color='#fff'; btn.style.borderColor=bg;
    mainTxt.textContent=fmtDeltaDisplay(d);
    hintTxt.style.display='none';
  }
}

// ── TYPE BUTTONS ──
const ACTION_TYPES=[
  {type:'TEE',   labelKey:'typeTee'},
  {type:'APPR',  labelKey:'typeAppr'},
  {type:'LAYUP', labelKey:'typeLayup'},
  {type:'CHIP',  labelKey:'typeChip'},
  {type:'PUTT',  labelKey:'typePutt'},
];
const CONTEXT_TYPES=[
  {type:'FOR_BIRDIE', labelKey:'typeFB'},
  {type:'FOR_PAR',    labelKey:'typeFP'},
  {type:'FOR_BOGEY',  labelKey:'typeFBo'},
];

function buildTypeButtons(){
  const h=curHole();
  const hasDelta=h.delta!==null;
  const gross=getGross(h);
  const si=h.shotIndex;
  const isLast=hasDelta && gross && si===gross-1;
  const curType=hasDelta?(h.shots[si]?.type||''):'';

  ['type-row1','type-row2'].forEach((id,ri)=>{
    const row=document.getElementById(id); row.innerHTML='';
    (ri===0?ACTION_TYPES:CONTEXT_TYPES).forEach(({type,labelKey})=>{
      const btn=document.createElement('button');
      btn.className='tbtn'+(curType===type?' active':'');
      btn.dataset.type=type;
      btn.textContent=T(labelKey).toUpperCase();
      // On last shot: FOR types are always available; action types also available to switch back to result mode
      btn.onclick=()=>setShotType(type);
      row.appendChild(btn);
    });
  });
}

// ── RIGHT PANEL REFRESH ──
function updateRightPanel(){
  const h=curHole(), idx=S.currentHole, gross=getGross(h);
  document.getElementById('hole-num-big').textContent=T('holeHero',idx+1);
  document.getElementById('hole-par-big').textContent=T('parLabel',h.par);
  [3,4,5].forEach(p=>document.getElementById('par'+p).classList.toggle('active',h.par===p));
  // Per-shot To Pin — data-driven, no checkbox
  const shotToPin=getShotToPin(h,h.shotIndex);
  const distInput=document.getElementById('inp-dist');
  distInput.value=shotToPin!==null?shotToPin:'';
  distInput.placeholder='';
  document.getElementById('chk-total').checked=S.showTotal;
  buildDeltaBtn();
  const hasDelta=h.delta!==null;
  document.getElementById('btn-prev').disabled=!hasDelta;
  document.getElementById('btn-next').disabled=!hasDelta;
  document.getElementById('shot-info').textContent=hasDelta&&gross?`${h.shotIndex+1} / ${gross}`:'— / —';
  const isManual=hasDelta&&h.manualTypes[h.shotIndex];
  const badge=document.getElementById('type-mode-badge');
  if(badge){badge.textContent=isManual?'MANUAL':'AUTO';badge.style.background=isManual?'#3a2a1a':'#2a3a2a';badge.style.color=isManual?'#c8843c':'#5c8c5c';badge.style.borderColor=isManual?'#6a4a2a':'#3a5a3a';}
  document.getElementById('mode-tp').classList.toggle('active',S.displayMode==='topar');
  document.getElementById('mode-gr').classList.toggle('active',S.displayMode==='gross');
  document.getElementById('score-sub').style.display=S.showScore?'flex':'none';
}

// ── DELTA PICKER — anchored popover ──
function buildPickerItems(){
  const cont=document.getElementById('picker-scroll'); cont.innerHTML='';
  const h=curHole();

  const clearItem=document.createElement('div');
  clearItem.className='picker-item pi-clear';
  clearItem.textContent=T('pickerRows','clear');
  clearItem.onclick=()=>{ clearHole(); closePicker(); miniToast(LANG==='zh'?'本洞已清空':'Hole cleared'); };
  cont.appendChild(clearItem);

  for(let d=-6;d<=12;d++){
    const item=document.createElement('div');
    item.className='picker-item';
    item.textContent=T('pickerRows',d);
    if(h.delta===d) item.classList.add(pickerClass(d));
    item.onclick=()=>{ setDelta(d); closePicker(); };
    cont.appendChild(item);
  }

  setTimeout(()=>{
    const target=h.delta??0;
    const idx=target+6+1;
    const items=cont.querySelectorAll('.picker-item');
    if(items[idx]) items[idx].scrollIntoView({block:'center',behavior:'instant'});
  },40);
}

function openPicker(e){
  buildPickerItems();
  const pop=document.getElementById('picker-popover');
  const bd=document.getElementById('picker-backdrop');
  const btn=document.getElementById('delta-val-btn');
  const rect=btn.getBoundingClientRect();
  const pW=200, pH=280;
  let left=rect.left;
  let top=rect.bottom+5;
  if(left+pW>window.innerWidth) left=window.innerWidth-pW-8;
  if(top+pH>window.innerHeight) top=rect.top-pH-5;
  if(top<0) top=8;
  pop.style.left=Math.max(4,left)+'px';
  pop.style.top=top+'px';
  pop.classList.add('show');
  bd.classList.add('show');
}
function closePicker(){
  document.getElementById('picker-popover').classList.remove('show');
  document.getElementById('picker-backdrop').classList.remove('show');
}

// ── SETTINGS DRAWER ──
function openSettings(){
  document.getElementById('settings-drawer').classList.add('open');
  document.getElementById('sd-overlay').classList.add('show');
}
function closeSettings(){
  document.getElementById('settings-drawer').classList.remove('open');
  document.getElementById('sd-overlay').classList.remove('show');
}

// ── NEW ROUND MODAL ──
function openNewRound(){ document.getElementById('newround-modal').style.display='flex'; }
function closeNewRound(){ document.getElementById('newround-modal').style.display='none'; }
function doNewRound(){
  if(document.getElementById('m-scores').checked)
    S.holes.forEach(h=>{h.delta=null;h.shots=[];h.shotIndex=0;h.manualTypes={};h.toPins={};});
  if(document.getElementById('m-pars').checked)
    S.holes.forEach(h=>h.par=4);
  closeNewRound(); render(); scheduleSave();
}

// ── LONG PRESS ──
function setupLongPress(btn,fn){
  let t=null;
  const start=()=>{ fn(); t=setInterval(fn,200); };
  const stop=()=>{ clearInterval(t);t=null; };
  btn.addEventListener('mousedown',start);
  btn.addEventListener('touchstart',e=>{e.preventDefault();start();},{passive:false});
  btn.addEventListener('mouseup',stop);
  btn.addEventListener('mouseleave',stop);
  btn.addEventListener('touchend',stop);
}

// ── EVENT WIRING ──
function wireAll(){
  // Background files
  document.getElementById('bg-file-cover').addEventListener('change',e=>{
    setBgFile(e.target.files[0]); e.target.value='';
  });
  document.getElementById('bg-file-input').addEventListener('change',e=>{
    setBgFile(e.target.files[0]); e.target.value='';
  });
  const pv=document.getElementById('preview');
  pv.addEventListener('dragover',e=>e.preventDefault());
  pv.addEventListener('drop',e=>{ e.preventDefault(); setBgFile(e.dataTransfer.files[0]); });

  // Settings
  document.getElementById('sd-clear-bg').onclick=clearBg;
  document.getElementById('bg-opacity').oninput=e=>{
    const v=parseInt(e.target.value)/100; S.bgOpacity=v;
    document.getElementById('bg-opacity-val').textContent=e.target.value+'%';
    const img=document.getElementById('bg-img'); if(img.src) img.style.opacity=v;
    scheduleSave();
  };
  document.getElementById('chk-sz').onchange=e=>{ S.safeZone=e.target.checked; redrawOnly(); scheduleSave(); };
  document.getElementById('sz-size').onchange=e=>{ S.szSize=e.target.value; redrawOnly(); scheduleSave(); };

  // Overlay opacity
  document.getElementById('overlay-opacity').oninput=e=>{
    const v=parseInt(e.target.value)/100;
    S.overlayOpacity=v;
    document.getElementById('overlay-opacity-val').textContent=e.target.value+'%';
    redrawOnly(); scheduleSave();
  };

  // Player / course
  document.getElementById('inp-player').oninput=e=>{ S.playerName=e.target.value||'PLAYER'; redrawOnly(); scheduleSave(); };
  document.getElementById('inp-course').oninput=e=>{ S.courseName=e.target.value||''; scheduleSave(); };

  // Per-shot To Pin — data driven, no checkbox
  document.getElementById('inp-dist').oninput=e=>{
    const val=e.target.value===''?null:parseInt(e.target.value);
    setShotToPin(isNaN(val)?null:val);
  };
  document.getElementById('chk-total').onchange=e=>{ S.showTotal=e.target.checked; redrawOnly(); scheduleSave(); };

  // Overlays
  document.getElementById('chk-shot').onchange=e=>{ S.showShot=e.target.checked; redrawOnly(); scheduleSave(); };
  document.getElementById('chk-score').onchange=e=>{
    S.showScore=e.target.checked;
    document.getElementById('score-sub').style.display=e.target.checked?'flex':'none';
    redrawOnly(); scheduleSave();
  };
  // v4.5: auto-center scorecard when range changes
  document.querySelectorAll('[name=scr]').forEach(r=>r.onchange=()=>{
    S.scoreRange=r.value;
    // Auto center on range switch
    S.scorecardPos[S.ratio]={x:0.5, y:S.scorecardPos[S.ratio]?.y??0.83, centered:true};
    redrawOnly(); scheduleSave();
  });

  // Mode
  document.getElementById('mode-tp').onclick=()=>setMode('topar');
  document.getElementById('mode-gr').onclick=()=>setMode('gross');

  // Shot nav
  setupLongPress(document.getElementById('btn-prev'),prevShot);
  setupLongPress(document.getElementById('btn-next'),nextShot);

  // Par
  [3,4,5].forEach(p=>document.getElementById('par'+p).onclick=()=>setPar(p));

  // Modals
  document.getElementById('newround-modal').onclick=e=>{
    if(e.target===document.getElementById('newround-modal')) closeNewRound();
  };

  // Keyboard
  window.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
    if(e.key==='ArrowRight'||e.key==='.') nextShot();
    else if(e.key==='ArrowLeft'||e.key===',') prevShot();
    else if(e.key.toLowerCase()==='h') gotoNextHole();
  });
  window.addEventListener('resize',()=>render());
}
