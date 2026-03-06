// ============================================================
// ui.js
// 界面操作：操作按钮、UI更新、当前洞高亮、信息板刷新
// ============================================================

// ── SHOT LABEL HELPERS ──
function shotTypeLabel(t){
  const map={TEE:T('toeOff'),APPR:T('approach'),LAYUP:T('layup'),CHIP:T('chip'),PUTT:T('putt'),PROV:T('provisional'),PENALTY:T('typePenalty'),FOR_BIRDIE:T('forBirdie'),FOR_PAR:T('forPar'),FOR_BOGEY:T('forBogey'),FOR_DOUBLE:T('forDouble'),FOR_TRIPLE:T('forTriple'),
    FW:'FAIRWAY',ROUGH:'ROUGH',BUNKER:'BUNKER',TREES:'TREES',WATER:'WATER',OB:'OB',DROP:'DROP',GREEN:'GREEN'};
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
function getPlayerHoleDelta(pid,holeIdx){
  if(pid===effectivePlayerId()) return S.holes[holeIdx].delta;
  const pd=S.byPlayer[pid];
  if(pd&&pd.holes&&pd.holes[holeIdx]) return pd.holes[holeIdx].delta;
  return null;
}
function setPlayerHoleDelta(pid,holeIdx,delta){
  if(pid===effectivePlayerId()){
    S.holes[holeIdx].delta=delta;
    S.holes[holeIdx].manualTypes={};
    reconcileShots(S.holes[holeIdx]);
    const g=getGross(S.holes[holeIdx]);
    if(g&&g>0) S.holes[holeIdx].shotIndex=g-1;
  } else {
    const pd=S.byPlayer[pid];
    if(pd&&pd.holes&&pd.holes[holeIdx]){
      pd.holes[holeIdx].delta=delta;
      pd.holes[holeIdx].manualTypes={};
      const par=S.holes[holeIdx].par;
      const g=delta!==null?par+delta:null;
      if(g&&g>0){
        pd.holes[holeIdx].shots=Array.from({length:g},(_,i)=>pd.holes[holeIdx].shots?.[i]||{type:null});
        pd.holes[holeIdx].shotIndex=g-1;
      } else {
        pd.holes[holeIdx].shots=[];
        pd.holes[holeIdx].shotIndex=0;
      }
    }
  }
  render(); scheduleSave();
}
function adjPlayerDelta(pid,inc,holeOverride){
  const hi=(holeOverride!==undefined)?holeOverride:S.currentHole;
  let d=getPlayerHoleDelta(pid,hi);
  if(d===null) d=0; else d=d+inc;
  if(d<-2) d=-2; if(d>12) d=12;
  setPlayerHoleDelta(pid,hi,d);
}
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
  const hi=S.currentHole;
  players.forEach(p=>{
    const row=document.createElement('div');
    const isCur=p.id===S.currentPlayerId;
    row.className='player-row'+(isCur?' pr-active':'');
    // name
    const nm=document.createElement('div');
    nm.className='pr-name'+(isCur?' active':'');
    nm.textContent=p.name;
    nm.title=p.name;
    nm.onclick=()=>switchToPlayer(p.id);
    row.appendChild(nm);
    // delta wrap (− [delta] +)
    const wrap=document.createElement('div');
    wrap.className='pr-delta-wrap';
    const mBtn=document.createElement('button');
    mBtn.className='pr-adj';
    mBtn.textContent='−';
    mBtn.onclick=()=>adjPlayerDelta(p.id,-1);
    wrap.appendChild(mBtn);
    const d=getPlayerHoleDelta(p.id,hi);
    const dBtn=document.createElement('button');
    dBtn.className='pr-delta-btn';
    if(d!==null){
      const bg=deltaColorHex(d);
      dBtn.style.background=bg; dBtn.style.color='#fff';
      dBtn.textContent=fmtDeltaDisplay(d);
    } else {
      dBtn.style.background='transparent'; dBtn.style.color='var(--text-muted)';
      dBtn.style.border='1px dashed var(--panel-border)';
      dBtn.textContent='—';
    }
    dBtn.onclick=(e)=>{
      if(!isCur) switchToPlayer(p.id);
      openPicker(e);
    };
    wrap.appendChild(dBtn);
    const pBtn=document.createElement('button');
    pBtn.className='pr-adj';
    pBtn.textContent='+';
    pBtn.onclick=()=>adjPlayerDelta(p.id,+1);
    wrap.appendChild(pBtn);
    row.appendChild(wrap);
    grid.appendChild(row);
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

// ── HOLE NAV — PGA-style scorecard grid ──
function buildHoleNav(){
  const grid=document.getElementById('sc-grid');
  if(!grid) return;
  grid.innerHTML='';

  const ci=S.currentHole;
  // Helpers
  const sumPar=(a,b)=>S.holes.slice(a,b).reduce((s,h)=>s+h.par,0);
  const sumGross=(pid,a,b)=>{
    let s=0;
    for(let i=a;i<b;i++){
      const d=getPlayerHoleDelta(pid,i);
      if(d!==null) s+=S.holes[i].par+d;
    }
    return s;
  };
  const sumDelta=(pid,a,b)=>{
    let s=0;
    for(let i=a;i<b;i++){
      const d=getPlayerHoleDelta(pid,i);
      if(d!==null) s+=d;
    }
    return s;
  };
  const countPlayed=(pid,a,b)=>{
    let c=0;
    for(let i=a;i<b;i++) if(getPlayerHoleDelta(pid,i)!==null) c++;
    return c;
  };

  const f9P=sumPar(0,9), b9P=sumPar(9,18);

  // Cell factory — col: hole index (0-17) for column hover/active
  function cell(txt,cls,onclick,col){
    const d=document.createElement('div');
    d.className='sg-cell'+(cls?' '+cls:'');
    d.textContent=txt;
    if(onclick) d.onclick=onclick;
    if(col!==undefined){
      d.dataset.col=col;
      if(col===ci) d.classList.add('sg-col-active');
    }
    return d;
  }

  // Click handler for hole cells
  function holeClick(i){
    return ()=>{
      if(S.currentHole!==i){
        const prev=S.holes[S.currentHole];
        const pg=getGross(prev);
        if(pg&&pg>0) delete prev.manualTypes[pg-1];
      }
      S.currentHole=i;
      S.scorecardSummary=null;
      resetAllShotIndex(i);
      render(); scheduleSave();
    };
  }

  // ── Row 1: PAR — click opens score drawer ──
  grid.appendChild(cell('PAR','sg-hdr sg-label sg-par-label',()=>openScoreDrawer(ci)));
  for(let i=0;i<9;i++) grid.appendChild(cell(String(S.holes[i].par),'sg-hdr sg-par-val',()=>openScoreDrawer(i),i));
  grid.appendChild(cell(String(f9P),'sg-hdr sg-sub'));
  for(let i=9;i<18;i++) grid.appendChild(cell(String(S.holes[i].par),'sg-hdr sg-par-val',()=>openScoreDrawer(i),i));
  grid.appendChild(cell(String(b9P),'sg-hdr sg-sub'));
  grid.appendChild(cell(String(f9P+b9P),'sg-hdr sg-sub'));

  // ── Row 2: HOLE header — click opens score drawer ──
  grid.appendChild(cell('HOLE','sg-hdr sg-label',()=>openScoreDrawer(ci)));
  for(let i=0;i<9;i++) grid.appendChild(cell(String(i+1),'sg-hdr'+(i===ci?' sg-active':''),()=>openScoreDrawer(i),i));
  grid.appendChild(cell('OUT','sg-hdr sg-sub',()=>{ S.scorecardSummary='out'; render(); scheduleSave(); }));
  for(let i=9;i<18;i++) grid.appendChild(cell(String(i+1),'sg-hdr'+(i===ci?' sg-active':''),()=>openScoreDrawer(i),i));
  grid.appendChild(cell('IN','sg-hdr sg-sub',()=>{ S.scorecardSummary='in'; render(); scheduleSave(); }));
  grid.appendChild(cell('TOT','sg-hdr sg-sub',()=>{ S.scorecardSummary='tot'; render(); scheduleSave(); }));

  // ── Player score rows ──
  const players=(S.players&&S.players.length>0)?S.players:null;

  function pgaScoreCell(delta,txt,holeIdx,pid){
    const d=document.createElement('div');
    d.className='sg-cell sg-score-cell';
    d.dataset.col=holeIdx;
    d.dataset.pid=pid;
    // highlight: current hole + current player = selected cell
    const isSel=(holeIdx===ci&&pid===effectivePlayerId());
    if(holeIdx===ci) d.classList.add('sg-col-active');
    if(isSel) d.classList.add('sg-cell-selected');
    // click: switch hole + player (no drawer)
    const clickFn=()=>{
      if(S.currentHole!==holeIdx){
        S.currentHole=holeIdx;
        S.scorecardSummary=null;
        resetAllShotIndex(holeIdx);
      }
      if(pid!==effectivePlayerId()) switchToPlayer(pid);
      else { render(); scheduleSave(); }
      trackRecentPlayer(pid);
    };
    if(delta===null){
      d.classList.add('sg-empty');
      d.textContent='·';
      d.onclick=clickFn;
      return d;
    }
    const span=document.createElement('span');
    span.className='sg-score';
    span.textContent=txt;
    if(delta<=-2) span.classList.add('sg-eagle');
    else if(delta===-1) span.classList.add('sg-birdie');
    else if(delta===0) span.classList.add('sg-par-score');
    else if(delta===1) span.classList.add('sg-bogey');
    else if(delta===2) span.classList.add('sg-dbl-bogey');
    else if(delta>=3) span.classList.add('sg-triple');
    d.appendChild(span);
    d.onclick=clickFn;
    return d;
  }

  function subCell(pid,a,b,isSummary){
    const played=countPlayed(pid,a,b);
    const d=document.createElement('div');
    d.className='sg-cell sg-sub';
    if(played>0){
      d.textContent=S.displayMode==='topar'?fmtDeltaDisplay(sumDelta(pid,a,b)):String(sumGross(pid,a,b));
    } else { d.textContent='·'; }
    if(isSummary) d.onclick=()=>{ S.scorecardSummary=isSummary; render(); scheduleSave(); };
    return d;
  }

  function addPlayerRow(pid,name,isCurrent){
    // Label
    const lbl=cell(name,'sg-label sg-player'+(isCurrent?' sg-player-active':''));
    lbl.onclick=()=>switchToPlayer(pid);
    grid.appendChild(lbl);

    // Front 9
    for(let i=0;i<9;i++){
      const delta=getPlayerHoleDelta(pid,i);
      const txt=delta!==null?(S.displayMode==='topar'?fmtDeltaDisplay(delta):String(S.holes[i].par+delta)):'';
      grid.appendChild(pgaScoreCell(delta,txt,i,pid));
    }
    grid.appendChild(subCell(pid,0,9,'out'));

    // Back 9
    for(let i=9;i<18;i++){
      const delta=getPlayerHoleDelta(pid,i);
      const txt=delta!==null?(S.displayMode==='topar'?fmtDeltaDisplay(delta):String(S.holes[i].par+delta)):'';
      grid.appendChild(pgaScoreCell(delta,txt,i,pid));
    }
    grid.appendChild(subCell(pid,9,18,'in'));

    // Total
    const totalPlayed=countPlayed(pid,0,18);
    const tot=document.createElement('div');
    tot.className='sg-cell sg-sub';
    if(totalPlayed>0){
      tot.textContent=String(sumGross(pid,0,18));
    } else { tot.textContent='·'; }
    tot.style.fontWeight='700';
    tot.onclick=()=>{ S.scorecardSummary='tot'; render(); scheduleSave(); };
    grid.appendChild(tot);
  }

  if(players){
    players.forEach(p=>addPlayerRow(p.id,p.name,p.id===S.currentPlayerId));
  } else {
    // Session mode — single unnamed row
    const epid=effectivePlayerId();
    addPlayerRow(epid,'—',true);
  }

  // (column-wide hover removed — individual cell :hover via CSS)

  if(typeof narrowAutoScrollNav==='function') narrowAutoScrollNav();
}

// ── DELTA BUTTON ──
function buildDeltaBtn(){ buildPlayerArea(); }

// ── TYPE BUTTONS ──
const SHOT_KEYS={TEE:'T',APPR:'A',LAYUP:'L',CHIP:'C',PUTT:'U',PROV:'V',FOR_BIRDIE:'B',FOR_PAR:'P',FOR_BOGEY:'O'};
const TYPE_ROW1=[
  {type:'TEE',   labelKey:'typeTee'},
  {type:'APPR',  labelKey:'typeAppr'},
  {type:'LAYUP', labelKey:'typeLayup'},
  {type:'CHIP',  labelKey:'typeChip'},
];
const TYPE_ROW2=[
  {type:'FOR_BIRDIE', labelKey:'typeFB'},
  {type:'FOR_PAR',    labelKey:'typeFP'},
  {type:'FOR_BOGEY',  labelKey:'typeFBo'},
];
const TYPE_ROW3=[
  {type:'PENALTY', labelKey:'typePenalty'},
  {type:'PROV',  labelKey:'typeProv'},
];

function buildTypeButtons(){
  const h=curHole();
  const hasDelta=h.delta!==null;
  const gross=getGross(h);
  const si=h.shotIndex;
  const isLast=hasDelta && gross && si===gross-1;
  const curType=hasDelta?(h.shots[si]?.type||''):'';

  const rows=[[TYPE_ROW1,'type-row1'],[TYPE_ROW2,'type-row2'],[TYPE_ROW3,'type-row3']];
  rows.forEach(([types,id])=>{
    const row=document.getElementById(id); if(!row) return; row.innerHTML='';
    types.forEach(({type,labelKey})=>{
      const btn=document.createElement('button');
      btn.className='tbtn'+(curType===type?' active':'');
      btn.dataset.type=type;
      btn.textContent=T(labelKey).toUpperCase();
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
  const h=curHole(), gross=getGross(h), si=h.shotIndex;
  const noScore=(h.delta===null);
  const count=noScore?h.par:Math.max(gross, h.par);
  for(let i=0;i<count;i++){
    const btn=document.createElement('button');
    if(noScore){
      btn.className='snum-btn unused';
      btn.disabled=true;
    } else {
      const isUnused=i>=gross;
      const isCur=!isUnused&&i===si, isPast=!isUnused&&i<si;
      btn.className='snum-btn '+(isUnused?'unused':isCur?'cur':isPast?'past':'future');
      if(!isUnused) btn.onclick=(()=>{ const idx=i; return ()=>{ curHole().shotIndex=idx; render(); scheduleSave(); focusToPin(); }; })();
      else btn.disabled=true;
    }
    btn.textContent=String(i+1);
    cont.appendChild(btn);
  }
}

// ── FOCUS: Par cycle on click ──
function cycleParFocus(){
  const h=curHole();
  const next=h.par===3?4:h.par===4?5:3;
  setPar(next);
}

// ── FOCUS: Player buttons (fixed 4 slots, no reorder on click) ──
// S.focusSlots[] persists 4 player ids. If current player isn't listed,
// remove first slot and append current player at end.
function ensureFocusSlots(){
  if(!S.focusSlots) S.focusSlots=[];
  const players=S.players||[];
  // purge stale ids
  S.focusSlots=S.focusSlots.filter(id=>players.some(p=>p.id===id));
  // fill up to 4 from players list
  players.forEach(p=>{ if(S.focusSlots.length<4&&!S.focusSlots.includes(p.id)) S.focusSlots.push(p.id); });
  // if current player is valid but not in slots, bump first, add at end
  const curPid=S.currentPlayerId;
  if(curPid&&players.some(p=>p.id===curPid)&&!S.focusSlots.includes(curPid)){
    if(S.focusSlots.length>=4) S.focusSlots.shift();
    S.focusSlots.push(curPid);
  }
}
function buildFocusPlayerBtns(){
  const cont=document.getElementById('rp-player-btns');
  if(!cont) return;
  cont.innerHTML='';
  const players=S.players||[];
  if(players.length===0) return;
  ensureFocusSlots();
  S.focusSlots.forEach(id=>{
    const p=players.find(x=>x.id===id);
    if(!p) return;
    const btn=document.createElement('button');
    btn.className='rp-plyr-btn'+(p.id===S.currentPlayerId?' active':'');
    btn.textContent=p.name;
    btn.title=p.name;
    btn.onclick=()=>switchToPlayer(p.id);
    cont.appendChild(btn);
  });
}

// ── SCORE QUICK BUTTONS (delta) ──
const SCORE_OPTIONS=[
  {delta:-1,label:'Birdie'},
  {delta:0, label:'Par'},
  {delta:1, label:'Bogey'},
  {delta:2, label:'Double'},
  {delta:3, label:'Triple+'},
];
function buildScoreBtns(){
  const cont=document.getElementById('rp-score-btns');
  if(!cont) return;
  cont.innerHTML='';
  const h=curHole();
  SCORE_OPTIONS.forEach(({delta,label})=>{
    const btn=document.createElement('button');
    btn.className='rp-score-btn';
    if(h.delta===delta){
      btn.classList.add('active');
      btn.style.background=deltaColorHex(delta);
    }
    btn.textContent=label;
    btn.onclick=()=>setDelta(delta);
    cont.appendChild(btn);
  });
}

// ── RIGHT PANEL REFRESH ──
function updateRightPanel(){
  const h=curHole(), idx=S.currentHole, gross=getGross(h);
  // Course name
  const courseEl=document.getElementById('rp-course-name');
  if(courseEl) courseEl.textContent=S.courseName||'';
  // HOLE + Par
  const holeLbl=document.getElementById('rp-hole-lbl');
  const holeNum=document.getElementById('rp-hole-num');
  if(holeLbl) holeLbl.textContent='HOLE';
  if(holeNum) holeNum.textContent=String(idx+1);
  const parVal=document.getElementById('rp-par-val');
  if(parVal) parVal.textContent=String(h.par);
  // Players
  buildFocusPlayerBtns();
  // Score buttons
  buildScoreBtns();
  // Shot progress + nav
  buildShotButtons();
  // To Pin
  const shotToPin=getShotToPin(h,h.shotIndex);
  const distInput=document.getElementById('inp-dist');
  if(distInput){ distInput.value=shotToPin!==null?shotToPin:''; distInput.placeholder=''; }
  // Type buttons
  buildTypeButtons();
  // Course display
  if(typeof updateCourseDisplay==='function') updateCourseDisplay();
  // Compat
  const chkTotal=document.getElementById('chk-total');
  if(chkTotal) chkTotal.checked=S.showTotal;
  const modeTp=document.getElementById('mode-tp');
  const modeGr=document.getElementById('mode-gr');
  if(modeTp) modeTp.classList.toggle('active',S.displayMode==='topar');
  if(modeGr) modeGr.classList.toggle('active',S.displayMode==='gross');
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
  const pW=200, pH=280;
  let left, top;
  if(e&&typeof e.clientX==='number'){
    left=e.clientX-pW/2;
    top=e.clientY+8;
  } else {
    left=window.innerWidth/2-pW/2;
    top=window.innerHeight/2-pH/2;
  }
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
  // If closed from drawer picker without selection: null → par(0)
  if(_drawerPickerPid!==null){
    const cur=getPlayerHoleDelta(_drawerPickerPid,_drawerPickerHole);
    if(cur===null){
      setPlayerHoleDelta(_drawerPickerPid,_drawerPickerHole,0);
      if(_scoreDrawerHole>=0){
        buildScoreDrawerBody(_scoreDrawerHole);
        buildHoleNav(); buildPlayerArea();
      }
    }
    _drawerPickerPid=null; _drawerPickerHole=-1; _drawerPickerOrigDelta=null;
  }
}

// ── SCORE DRAWER (scorecard grid click) ──
var _scoreDrawerHole=-1;
function openScoreDrawer(holeIdx){
  _scoreDrawerHole=holeIdx;
  const title=document.getElementById('score-drawer-title');
  title.textContent='HOLE '+(holeIdx+1)+' · Par '+S.holes[holeIdx].par;
  buildScoreDrawerBody(holeIdx);
  document.getElementById('score-drawer').classList.add('open');
  document.getElementById('score-drawer-bg').classList.add('show');
}
function closeScoreDrawer(){
  document.getElementById('score-drawer').classList.remove('open');
  document.getElementById('score-drawer-bg').classList.remove('show');
  _scoreDrawerHole=-1;
}
// Drawer-specific picker: opens picker for a specific player+hole
var _drawerPickerPid=null, _drawerPickerHole=-1, _drawerPickerOrigDelta=null;
function openDrawerPicker(pid,holeIdx,e){
  _drawerPickerPid=pid;
  _drawerPickerHole=holeIdx;
  _drawerPickerOrigDelta=getPlayerHoleDelta(pid,holeIdx);
  const cont=document.getElementById('picker-scroll'); cont.innerHTML='';
  for(let d=-2;d<=8;d++){
    const item=document.createElement('div');
    item.className='picker-item';
    item.textContent=T('pickerRows',d);
    const cur=getPlayerHoleDelta(pid,holeIdx);
    if(cur===d) item.classList.add(pickerClass(d));
    item.onclick=()=>{
      setPlayerHoleDelta(pid,holeIdx,d);
      closePicker();
      buildScoreDrawerBody(holeIdx);
      buildHoleNav(); buildPlayerArea();
    };
    cont.appendChild(item);
  }
  // scroll to current delta or par(0)
  setTimeout(()=>{
    const target=(_drawerPickerOrigDelta!==null)?_drawerPickerOrigDelta:0;
    const idx=target+2;
    const items=cont.querySelectorAll('.picker-item');
    if(items[idx]) items[idx].scrollIntoView({block:'center',behavior:'instant'});
  },40);
  // position picker
  const pop=document.getElementById('picker-popover');
  const bd=document.getElementById('picker-backdrop');
  const pW=200,pH=280;
  let left,top;
  if(e&&typeof e.clientX==='number'){
    left=e.clientX-pW/2; top=e.clientY+8;
  } else {
    left=window.innerWidth/2-pW/2; top=window.innerHeight/2-pH/2;
  }
  if(left+pW>window.innerWidth) left=window.innerWidth-pW-8;
  if(left<4) left=4;
  if(top+pH>window.innerHeight) top=Math.max(4,top-pH-16);
  pop.style.left=left+'px';
  pop.style.top=top+'px';
  pop.classList.add('show');
  bd.classList.add('show');
}
function buildScoreDrawerBody(holeIdx){
  const body=document.getElementById('score-drawer-body');
  body.innerHTML='';
  const players=(S.players&&S.players.length>0)?S.players:[{id:effectivePlayerId(),name:'Player'}];
  players.forEach(p=>{
    const row=document.createElement('div');
    row.className='sd-player-row';
    // name
    const nm=document.createElement('div');
    nm.className='sd-pr-name';
    nm.textContent=p.name;
    row.appendChild(nm);
    // controls
    const ctl=document.createElement('div');
    ctl.className='sd-pr-controls';
    // minus
    const mBtn=document.createElement('button');
    mBtn.className='sd-pr-adj';
    mBtn.textContent='−';
    mBtn.onclick=()=>{
      adjPlayerDelta(p.id,-1,holeIdx);
      buildScoreDrawerBody(holeIdx);
      buildHoleNav(); render();
    };
    ctl.appendChild(mBtn);
    // delta badge — clickable to open picker
    const d=getPlayerHoleDelta(p.id,holeIdx);
    const isDefault=(d===null);
    const displayDelta=isDefault?0:d;
    const badge=document.createElement('div');
    badge.className='sd-pr-delta';
    if(isDefault){
      badge.classList.add('sd-default');
      badge.textContent=fmtDeltaDisplay(0);
    } else {
      badge.style.background=deltaColorHex(d);
      badge.style.color='#fff';
      badge.textContent=fmtDeltaDisplay(d);
    }
    badge.onclick=(ev)=>openDrawerPicker(p.id,holeIdx,ev);
    ctl.appendChild(badge);
    // plus
    const pBtn=document.createElement('button');
    pBtn.className='sd-pr-adj';
    pBtn.textContent='+';
    pBtn.onclick=()=>{
      adjPlayerDelta(p.id,+1,holeIdx);
      buildScoreDrawerBody(holeIdx);
      buildHoleNav(); render();
    };
    ctl.appendChild(pBtn);
    row.appendChild(ctl);
    body.appendChild(row);
  });
  // update footer button labels
  const clrBtn=document.querySelector('.sd-foot-clear');
  const canBtn=document.querySelector('.sd-foot-cancel');
  const okBtn=document.querySelector('.sd-foot-ok');
  if(clrBtn) clrBtn.textContent=LANG==='zh'?'清空':'Clear';
  if(canBtn) canBtn.textContent=LANG==='zh'?'取消':'Cancel';
  if(okBtn) okBtn.textContent=LANG==='zh'?'确定':'OK';
}
function scoreDrawerClear(){
  if(_scoreDrawerHole<0) return;
  const hi=_scoreDrawerHole;
  const players=(S.players&&S.players.length>0)?S.players:[{id:effectivePlayerId(),name:'Player'}];
  players.forEach(p=>{
    setPlayerHoleDelta(p.id,hi,null);
  });
  buildScoreDrawerBody(hi);
  buildHoleNav(); render();
}
function scoreDrawerConfirm(){
  if(_scoreDrawerHole<0){ closeScoreDrawer(); return; }
  const hi=_scoreDrawerHole;
  // For any player still at null (default), commit as par(0)
  const players=(S.players&&S.players.length>0)?S.players:[{id:effectivePlayerId(),name:'Player'}];
  players.forEach(p=>{
    if(getPlayerHoleDelta(p.id,hi)===null){
      setPlayerHoleDelta(p.id,hi,0);
    }
  });
  buildHoleNav(); render();
  closeScoreDrawer();
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
  // (custom status input removed)
  document.getElementById('chk-total').onchange=e=>{ S.showTotal=e.target.checked; redrawOnly(); scheduleSave(); };

  // Overlays
  document.getElementById('chk-shot').onchange=e=>{ S.showShot=e.target.checked; redrawOnly(); scheduleSave(); };
  document.getElementById('chk-score').onchange=e=>{
    S.showScore=e.target.checked;
    const sec=document.getElementById('score-range-sec');
    if(sec){ sec.style.display=''; sec.classList.toggle('show',e.target.checked); }
    redrawOnly(); scheduleSave();
  };
  // show player name in scorecard (settings drawer)
  const chkPN=document.getElementById('chk-show-pname');
  if(chkPN) chkPN.onchange=e=>{
    S.showPlayerName=e.target.checked;
    const nav=document.getElementById('chk-pname-nav'); if(nav) nav.checked=S.showPlayerName;
    redrawOnly(); scheduleSave();
  };
  // show player name in scorecard (nav bar shortcut)
  const chkPNnav=document.getElementById('chk-pname-nav');
  if(chkPNnav) chkPNnav.onchange=e=>{
    S.showPlayerName=e.target.checked;
    const sd=document.getElementById('chk-show-pname'); if(sd) sd.checked=S.showPlayerName;
    redrawOnly(); scheduleSave();
  };
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

  // (btn-next removed — shot navigation via shot number buttons)

  // Par — cycleParFocus handles par cycling via #rp-par-tap onclick

  // Modals
  document.getElementById('newround-modal').onclick=e=>{
    if(e.target===document.getElementById('newround-modal')) closeNewRound();
  };

  // Keyboard
  window.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
    const k=e.key;
    if(k==='ArrowRight'){gotoNextHole();e.preventDefault();}
    else if(k==='ArrowLeft'){gotoPrevHole();e.preventDefault();}
    else if(k==='ArrowUp'||k===','){prevShot();e.preventDefault();}
    else if(k==='ArrowDown'||k==='.'){nextShot();e.preventDefault();}
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
      // (number keys 1-9 removed)
    }
  });
  window.addEventListener('resize',()=>render());
}
