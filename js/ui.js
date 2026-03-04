// ============================================================
// ui.js
// 界面操作：操作按钮、UI更新、当前洞高亮、信息板刷新
// ============================================================

// ── SHOT LABEL HELPERS ──
function shotTypeLabel(t){
  const map={TEE:T('toeOff'),APPR:T('approach'),LAYUP:T('layup'),CHIP:T('chip'),PUTT:T('putt'),PROV:T('provisional'),FOR_BIRDIE:T('forBirdie'),FOR_PAR:T('forPar'),FOR_BOGEY:T('forBogey'),FOR_DOUBLE:T('forDouble'),FOR_TRIPLE:T('forTriple')};
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

// ── PLAYER AREA ──
function buildPlayerArea(){
  const grid=document.getElementById('player-btn-grid');
  if(!grid) return;
  grid.innerHTML='';
  const players=S.players||[];
  if(players.length===0){
    const btn=document.createElement('button');
    btn.className='player-add-single';
    btn.textContent='+ '+(LANG==='zh'?'添加球员':LANG==='ja'?'プレーヤー追加':LANG==='ko'?'플레이어 추가':'Add Player');
    btn.onclick=()=>openPlayerManager();
    grid.appendChild(btn);
    return;
  }
  players.forEach((p,i)=>{
    const btn=document.createElement('button');
    btn.className='player-btn'+(p.id===S.currentPlayerId?' active':'');
    const num=i<9?`${i+1} `:'';
    btn.textContent=num+p.name;
    btn.title=p.name;
    btn.onclick=()=>switchToPlayer(p.id);
    grid.appendChild(btn);
  });
}

function openPlayerManager(){
  // clear search on open, then wire live filter
  const srch=document.getElementById('pm-hist-search');
  if(srch){ srch.value=''; srch.oninput=()=>buildPlayerManager(); }
  buildPlayerManager();
  const m=document.getElementById('player-modal');
  const bg=document.getElementById('player-modal-bg');
  if(m) m.style.display='flex';
  if(bg) bg.style.display='block';
  const inp=document.getElementById('pm-add-input');
  if(inp) inp.focus();
}

function closePlayerManager(){
  const m=document.getElementById('player-modal');
  const bg=document.getElementById('player-modal-bg');
  if(m) m.style.display='none';
  if(bg) bg.style.display='none';
}

function buildPlayerManager(){
  const activeList=document.getElementById('pm-active-list');
  if(activeList){
    activeList.innerHTML='';
    (S.players||[]).forEach(p=>{
      const row=document.createElement('div');
      row.className='pm-player-row'+(p.id===S.currentPlayerId?' pm-current':'');
      const nameSpan=document.createElement('span');
      nameSpan.textContent=p.name;
      const delBtn=document.createElement('button');
      delBtn.className='pm-del-btn';
      delBtn.textContent='×';
      delBtn.onclick=()=>{ removePlayer(p.id); buildPlayerManager(); buildPlayerArea(); };
      row.appendChild(nameSpan);
      row.appendChild(delBtn);
      activeList.appendChild(row);
    });
    if((S.players||[]).length===0){
      const emp=document.createElement('div');
      emp.style.cssText='font-size:12px;color:var(--t3);padding:6px 0';
      emp.textContent=LANG==='zh'?'暂无球员':'No players yet';
      activeList.appendChild(emp);
    }
  }
  // history
  const histList=document.getElementById('pm-hist-list');
  if(histList){
    histList.innerHTML='';
    const searchVal=(document.getElementById('pm-hist-search')||{}).value||'';
    const searchLc=searchVal.trim().toLowerCase();
    const hist=(S.playerHistory||[]).filter(name=>!(S.players||[]).some(p=>p.name===name)&&(!searchLc||name.toLowerCase().includes(searchLc)));
    if(hist.length===0){
      const emp=document.createElement('div');
      emp.style.cssText='font-size:12px;color:var(--t3);padding:4px 0';
      emp.textContent=LANG==='zh'?'无历史球员':'No history';
      histList.appendChild(emp);
    } else {
      hist.forEach(name=>{
        const item=document.createElement('div');
        item.className='pm-history-item';
        const nameSpan=document.createElement('span');
        nameSpan.textContent=name;
        const addBtn=document.createElement('button');
        addBtn.className='pm-hist-add-btn';
        addBtn.textContent='+';
        addBtn.onclick=()=>{ if(addPlayer(name)){buildPlayerManager();buildPlayerArea();miniToast(name+(LANG==='zh'?' 已添加':' added'));} };
        item.appendChild(nameSpan);
        item.appendChild(addBtn);
        histList.appendChild(item);
      });
    }
  }
}

function addPlayerFromInput(){
  const inp=document.getElementById('pm-add-input');
  if(!inp) return;
  const name=inp.value.trim();
  if(!name) return;
  if(addPlayer(name)){
    inp.value='';
    buildPlayerManager();
    buildPlayerArea();
    miniToast(name+(LANG==='zh'?' 已添加':' added'));
  }
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
      const fc=makeStatCard('F',f9P,f9G,S.scorecardSummary==='out');
      fc.style.cursor='pointer';
      fc.onclick=()=>{ S.scorecardSummary='out'; render(); scheduleSave(); };
      cont.appendChild(fc);
    } else {
      const bc=makeStatCard('B',b9P,b9G,S.scorecardSummary==='in');
      bc.style.cursor='pointer';
      bc.onclick=()=>{ S.scorecardSummary='in'; render(); scheduleSave(); };
      cont.appendChild(bc);
      const tc=makeStatCard('T',f9P+b9P,f9G+b9G,S.scorecardSummary==='tot');
      tc.style.cursor='pointer';
      tc.onclick=()=>{ S.scorecardSummary='tot'; render(); scheduleSave(); };
      cont.appendChild(tc);
    }
  });
}

function makeStatCard(lbl,par,gross,isActive){
  const el=document.createElement('div');
  el.className='stat-card'+(isActive?' stat-active':'');
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
const SHOT_KEYS={TEE:'T',APPR:'A',LAYUP:'L',CHIP:'C',PUTT:'U',PROV:'V',FOR_BIRDIE:'B',FOR_PAR:'P',FOR_BOGEY:'O'};
const ACTION_TYPES=[
  {type:'TEE',   labelKey:'typeTee'},
  {type:'APPR',  labelKey:'typeAppr'},
  {type:'LAYUP', labelKey:'typeLayup'},
  {type:'CHIP',  labelKey:'typeChip'},
  {type:'PUTT',  labelKey:'typePutt'},
  {type:'PROV',  labelKey:'typeProv'},
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

// ── SHOT NUMBER BUTTONS ──
function buildShotButtons(){
  const cont=document.getElementById('shot-btns');
  if(!cont) return;
  cont.innerHTML='';
  const h=curHole(), gross=getGross(h);
  if(!gross||h.delta===null){ return; }
  for(let i=0;i<gross;i++){
    const btn=document.createElement('button');
    const isCur=i===h.shotIndex, isPast=i<h.shotIndex;
    btn.className='snum-btn '+(isCur?'cur':isPast?'past':'future');
    btn.textContent=String(i+1);
    btn.onclick=(()=>{ const idx=i; return ()=>{ curHole().shotIndex=idx; render(); scheduleSave(); }; })();
    cont.appendChild(btn);
  }
}

// ── RIGHT PANEL REFRESH ──
function updateRightPanel(){
  const h=curHole(), idx=S.currentHole, gross=getGross(h);
  document.getElementById('hole-num-big').textContent=T('holeHero',idx+1);
  const _hpb=document.getElementById('hole-par-big'); if(_hpb) _hpb.textContent=T('parLabel',h.par);
  [3,4,5].forEach(p=>document.getElementById('par'+p).classList.toggle('active',h.par===p));
  // Per-shot To Pin — data-driven, no checkbox
  const shotToPin=getShotToPin(h,h.shotIndex);
  const distInput=document.getElementById('inp-dist');
  distInput.value=shotToPin!==null?shotToPin:'';
  distInput.placeholder='';
  document.getElementById('chk-total').checked=S.showTotal;
  buildDeltaBtn();
  buildShotButtons();
  const hasDelta=h.delta!==null;
  document.getElementById('btn-prev').disabled=!hasDelta;
  document.getElementById('btn-next').disabled=!hasDelta;
  const isManual=hasDelta&&h.manualTypes[h.shotIndex];
  const badge=document.getElementById('type-mode-badge');
  if(badge){badge.textContent=isManual?'MANUAL':'AUTO';badge.style.background=isManual?'#3a2a1a':'#2a3a2a';badge.style.color=isManual?'#c8843c':'#5c8c5c';badge.style.borderColor=isManual?'#6a4a2a':'#3a5a3a';}
  document.getElementById('mode-tp').classList.toggle('active',S.displayMode==='topar');
  document.getElementById('mode-gr').classList.toggle('active',S.displayMode==='gross');
  const _scoreSec=document.getElementById('score-range-sec');
  if(_scoreSec){ _scoreSec.style.display=''; _scoreSec.classList.toggle('show',S.showScore); }
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
  if(document.getElementById('m-scores').checked){
    S.holes.forEach(h=>{h.delta=null;h.shots=[];h.shotIndex=0;h.manualTypes={};h.toPins={};});
    // also clear all per-player byPlayer data
    if(S.byPlayer){
      Object.keys(S.byPlayer).forEach(pid=>{
        if(S.byPlayer[pid]&&S.byPlayer[pid].holes)
          S.byPlayer[pid].holes.forEach(h=>{h.delta=null;h.shots=[];h.shotIndex=0;h.manualTypes={};h.toPins={};});
      });
    }
  }
  if(document.getElementById('m-pars').checked)
    S.holes.forEach(h=>h.par=4);
  // Clear all players so user can re-select for new round
  S.players=[]; S.currentPlayerId=null; S.byPlayer={};
  if(typeof buildPlayerArea==='function') buildPlayerArea();
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
  const _inpPlayer=document.getElementById('inp-player'); if(_inpPlayer) _inpPlayer.oninput=e=>{ S.playerName=e.target.value||'PLAYER'; redrawOnly(); scheduleSave(); };
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
    const sec=document.getElementById('score-range-sec');
    if(sec){ sec.style.display=''; sec.classList.toggle('show',e.target.checked); }
    redrawOnly(); scheduleSave();
  };
  // show player name in scorecard
  const chkPN=document.getElementById('chk-show-pname');
  if(chkPN) chkPN.onchange=e=>{ S.showPlayerName=e.target.checked; redrawOnly(); scheduleSave(); };
  // player manager modal backdrop
  const pmBg=document.getElementById('player-modal-bg');
  if(pmBg) pmBg.onclick=closePlayerManager;
  // player manager input enter key
  const pmInp=document.getElementById('pm-add-input');
  if(pmInp) pmInp.addEventListener('keydown',e=>{ if(e.key==='Enter') addPlayerFromInput(); });
  // v4.5: auto-center scorecard when range changes
  document.querySelectorAll('[name=scr]').forEach(r=>r.onchange=()=>{
    S.scoreRange=r.value;
    S.scorecardSummary=null; // exit stat-card summary view so scoreRange takes effect
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
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
    const k=e.key;
    if(k==='ArrowRight'||k==='.'){nextShot();e.preventDefault();}
    else if(k==='ArrowLeft'||k===','){prevShot();e.preventDefault();}
    else if(k==='ArrowUp'){gotoPrevHole();e.preventDefault();}
    else if(k==='ArrowDown'){gotoNextHole();e.preventDefault();}
    else if(!e.metaKey&&!e.ctrlKey&&!e.altKey){
      const kl=k.toLowerCase();
      if(kl==='h') gotoNextHole();
      else if(kl==='t') setShotType('TEE');
      else if(kl==='a') setShotType('APPR');
      else if(kl==='l') setShotType('LAYUP');
      else if(kl==='c') setShotType('CHIP');
      else if(kl==='u') setShotType('PUTT');
      else if(kl==='v') setShotType('PROV');
      else if(kl==='b') setShotType('FOR_BIRDIE');
      else if(kl==='p') setShotType('FOR_PAR');
      else if(kl==='o') setShotType('FOR_BOGEY');
      else{const n=parseInt(k);if(n>=1&&n<=9){const p=(S.players||[])[n-1];if(p)switchToPlayer(p.id);}}
    }
  });
  window.addEventListener('resize',()=>render());
}
