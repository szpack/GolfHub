// ============================================================
// app.js
// 应用初始化、数据管理、全局状态、Canvas渲染、导出
// ============================================================

// ============================================================
// FONT / CANVAS CONSTANTS
// ============================================================
const SF = `ui-sans-serif,-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Helvetica,Arial,sans-serif`;
const SHOT_W=490, SHOT_H=132, ROW1=46, ROW2=42, ROW3=44, COL_W=148, RPAD=12;

// ============================================================
// I18N
// ============================================================
const STRINGS = {
  en:{
    holeHero:h=>`HOLE ${h}`, parLabel:p=>`PAR ${p}`,
    hintMain:'Click to upload background / Drop image here',
    hintSub:'Preview only — not included in export',
    distLabel:'To Pin', distUnit:'yds',
    totalLabel:'TOTAL DISP',
    finalScore:'FINAL SCORE (DELTA)',
    setScore:'SET SCORE',
    shotSection:'SHOT', optionsTitle:'DISPLAY OPTIONS',
    shotOverlay:'Shot Overlay', scorecardOverlay:'Scorecard',
    front9:'Front 9', back9:'Back 9', h18:'18 Holes',
    topar:'To Par', gross:'Gross',
    sdTitle:'⚙️ Settings', sdBg:'Background Image', sdBgOp:'BG Opacity',
    sdClearBg:'🗑 Clear Background (restore default)',
    sdSc:'Scorecard Overlay', sdResetSc:'↺ Reset Scorecard Position',
    sdSz:'Safe Zone', sdSzLbl:'Show safe zone guides', sdSzSize:'Zone size',
    sdPar:'Course Par',
    settingsLbl:' Settings',
    nrTitle:'🏌️ New Round', nrClearScores:"Clear this round's scores",
    nrResetPars:'Reset course Par to 4 (all holes)',
    nrCancel:'Cancel', nrConfirm:'Confirm',
    pickerTitle:'Final Score', pickerCancel:'Cancel',
    exportTitle:'EXPORT',
    exportBtn:'Create Overlay PNG',
    bgBtn:'Upload Background', opaLbl:'Opacity',
    nextHoleShort:'NEXT',
    parLbl:'Par',
    // canvas strings — ALL UPPERCASE
    toeOff:'TEE SHOT', approach:'APPROACH', layup:'LAYUP', chip:'CHIP', putt:'PUTT',
    forBirdie:'FOR BIRDIE', forPar:'FOR PAR', forBogey:'FOR BOGEY',
    forDouble:'FOR DOUBLE', forTriple:'FOR TRIPLE+',
    // shot type button labels — abbreviated
    typeTee:'TEE', typeAppr:'APPR', typeLayup:'LAYUP', typeChip:'CHIP', typePutt:'PUTT', typeProv:'P',
    typeFB:'FOR BIRDIE', typeFP:'FOR PAR', typeFBo:'FOR BOGEY',
    provisional:'PROVISIONAL',
    pickerRows:d=>{
      if(d==='clear') return 'CLEAR';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  ALBATROSS';
      if(d===-2) return '-2  EAGLE';
      if(d===-1) return '-1  BIRDIE';
      if(d===0)  return '0  PAR';
      if(d===1)  return '+1  BOGEY';
      if(d===2)  return '+2  DOUBLE';
      if(d===3)  return '+3  TRIPLE';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`Gross: ${g}  (Par ${p}  ${d>=0?'+':''}${d})`,
    toPinLabel:'TO PIN', ydsLabel:'YDS',
    albatross:'ALBATROSS', eagle:'EAGLE', birdie:'BIRDIE', par:'PAR',
    bogey:'BOGEY', double:'DOUBLE', triple:'TRIPLE+',
  },
  zh:{
    holeHero:h=>`第 ${h} 洞`, parLabel:p=>`标准杆 ${p}`,
    hintMain:'点击上传背景图 / 拖拽图片到此处',
    hintSub:'仅用于预览，不参与导出',
    distLabel:'距旗杆', distUnit:'码',
    totalLabel:'总杆显示',
    finalScore:'本洞成绩 (DELTA)',
    setScore:'设置成绩',
    shotSection:'击球', optionsTitle:'显示选项',
    shotOverlay:'Shot Overlay', scorecardOverlay:'计分卡',
    front9:'前9洞', back9:'后9洞', h18:'全18洞',
    topar:'To Par', gross:'Gross',
    sdTitle:'⚙️ 设置', sdBg:'背景图', sdBgOp:'背景透明度',
    sdClearBg:'🗑 清除背景（恢复默认）',
    sdSc:'计分卡信息版', sdResetSc:'↺ 复位计分卡位置',
    sdSz:'安全区', sdSzLbl:'显示安全区虚线', sdSzSize:'区域大小',
    sdPar:'球场标准杆',
    settingsLbl:' 设置',
    nrTitle:'🏌️ 清空本轮', nrClearScores:'清空本轮成绩',
    nrResetPars:'重置全部球场标准杆（恢复 Par 4）',
    nrCancel:'取消', nrConfirm:'确认',
    pickerTitle:'本洞成绩', pickerCancel:'取消',
    exportTitle:'导出',
    exportBtn:'生成角标PNG',
    bgBtn:'上传背景', opaLbl:'透明度',
    nextHoleShort:'下一洞',
    parLbl:'标准杆',
    toeOff:'开球', approach:'攻果岭', layup:'过度', chip:'切杆', putt:'推杆',
    forBirdie:'抓鸟推', forPar:'保帕推', forBogey:'保柏忌推',
    forDouble:'保双推', forTriple:'保三+推',
    typeTee:'开球', typeAppr:'攻果岭', typeLayup:'过度', typeChip:'切杆', typePutt:'推杆', typeProv:'P',
    typeFB:'抓鸟推', typeFP:'保帕推', typeFBo:'保柏忌推',
    provisional:'暂定球',
    pickerRows:d=>{
      if(d==='clear') return '清除';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  信天翁';
      if(d===-2) return '-2  老鹰';
      if(d===-1) return '-1  小鸟';
      if(d===0)  return '0  标准杆';
      if(d===1)  return '+1  柏忌';
      if(d===2)  return '+2  双柏忌';
      if(d===3)  return '+3  三柏忌';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`总杆: ${g}（标准杆 ${p}  ${d>=0?'+':''}${d}）`,
    toPinLabel:'距旗杆', ydsLabel:'码',
    albatross:'信天翁', eagle:'老鹰', birdie:'小鸟', par:'标准杆',
    bogey:'柏忌', double:'双柏忌', triple:'三柏忌+',
  },
  ja:{
    holeHero:h=>`ホール ${h}`, parLabel:p=>`パー ${p}`,
    hintMain:'クリックして背景画像をアップロード / 画像をここにドロップ',
    hintSub:'プレビュー専用 — エクスポートには含まれません',
    distLabel:'ピンまで', distUnit:'ヤード',
    totalLabel:'合計表示',
    finalScore:'ホールスコア (DELTA)',
    setScore:'スコア設定',
    shotSection:'ショット', optionsTitle:'表示オプション',
    shotOverlay:'Shot Overlay', scorecardOverlay:'スコアカード',
    front9:'前半 9H', back9:'後半 9H', h18:'18ホール',
    topar:'To Par', gross:'Gross',
    sdTitle:'⚙️ 設定', sdBg:'背景画像', sdBgOp:'背景の不透明度',
    sdClearBg:'🗑 背景をクリア（デフォルトに戻す）',
    sdSc:'スコアカード', sdResetSc:'↺ スコアカード位置をリセット',
    sdSz:'セーフゾーン', sdSzLbl:'セーフゾーンガイドを表示', sdSzSize:'ゾーンサイズ',
    sdPar:'コースパー',
    settingsLbl:' 設定',
    nrTitle:'🏌️ 新ラウンド', nrClearScores:'このラウンドのスコアをクリア',
    nrResetPars:'コースパーを4にリセット（全ホール）',
    nrCancel:'キャンセル', nrConfirm:'確認',
    pickerTitle:'ホールスコア', pickerCancel:'キャンセル',
    exportTitle:'エクスポート',
    exportBtn:'オーバーレイ PNG 作成',
    bgBtn:'背景をアップロード', opaLbl:'不透明度',
    nextHoleShort:'次のホール',
    parLbl:'パー',
    toeOff:'ティーショット', approach:'アプローチ', layup:'レイアップ', chip:'チップ', putt:'パット',
    forBirdie:'バーディーパット', forPar:'パーパット', forBogey:'ボギーパット',
    forDouble:'ダブルパット', forTriple:'トリプル+パット',
    typeTee:'TEE', typeAppr:'APPR', typeLayup:'LAYUP', typeChip:'CHIP', typePutt:'PUTT', typeProv:'P',
    typeFB:'バーディー', typeFP:'パー', typeFBo:'ボギー',
    provisional:'プロビジョナル',
    pickerRows:d=>{
      if(d==='clear') return 'クリア';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  アルバトロス';
      if(d===-2) return '-2  イーグル';
      if(d===-1) return '-1  バーディー';
      if(d===0)  return '0  パー';
      if(d===1)  return '+1  ボギー';
      if(d===2)  return '+2  ダブルボギー';
      if(d===3)  return '+3  トリプルボギー';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`グロス: ${g}（パー ${p}  ${d>=0?'+':''}${d}）`,
    toPinLabel:'ピンまで', ydsLabel:'ヤード',
    albatross:'アルバトロス', eagle:'イーグル', birdie:'バーディー', par:'パー',
    bogey:'ボギー', double:'ダブルボギー', triple:'トリプル+',
  },
  ko:{
    holeHero:h=>`${h}번 홀`, parLabel:p=>`파 ${p}`,
    hintMain:'클릭하여 배경 이미지 업로드 / 여기에 이미지를 드롭',
    hintSub:'미리보기 전용 — 내보내기에 포함되지 않음',
    distLabel:'핀까지', distUnit:'야드',
    totalLabel:'합계 표시',
    finalScore:'홀 스코어 (DELTA)',
    setScore:'스코어 설정',
    shotSection:'샷', optionsTitle:'표시 옵션',
    shotOverlay:'Shot Overlay', scorecardOverlay:'스코어카드',
    front9:'전반 9홀', back9:'후반 9홀', h18:'18홀',
    topar:'To Par', gross:'Gross',
    sdTitle:'⚙️ 설정', sdBg:'배경 이미지', sdBgOp:'배경 투명도',
    sdClearBg:'🗑 배경 지우기（기본값으로 복원）',
    sdSc:'스코어카드', sdResetSc:'↺ 스코어카드 위치 초기화',
    sdSz:'안전 영역', sdSzLbl:'안전 영역 가이드 표시', sdSzSize:'영역 크기',
    sdPar:'코스 파',
    settingsLbl:' 설정',
    nrTitle:'🏌️ 새 라운드', nrClearScores:'이 라운드 스코어 초기화',
    nrResetPars:'코스 파를 4로 리셋（전 홀）',
    nrCancel:'취소', nrConfirm:'확인',
    pickerTitle:'홀 스코어', pickerCancel:'취소',
    exportTitle:'내보내기',
    exportBtn:'오버레이 PNG 생성',
    bgBtn:'배경 업로드', opaLbl:'투명도',
    nextHoleShort:'다음 홀',
    parLbl:'파',
    toeOff:'티샷', approach:'어프로치', layup:'레이업', chip:'칩샷', putt:'퍼트',
    forBirdie:'버디 퍼트', forPar:'파 퍼트', forBogey:'보기 퍼트',
    forDouble:'더블 퍼트', forTriple:'트리플+ 퍼트',
    typeTee:'TEE', typeAppr:'APPR', typeLayup:'LAYUP', typeChip:'CHIP', typePutt:'PUTT', typeProv:'P',
    typeFB:'버디', typeFP:'파', typeFBo:'보기',
    provisional:'잠정구',
    pickerRows:d=>{
      if(d==='clear') return '지우기';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  알바트로스';
      if(d===-2) return '-2  이글';
      if(d===-1) return '-1  버디';
      if(d===0)  return '0  파';
      if(d===1)  return '+1  보기';
      if(d===2)  return '+2  더블보기';
      if(d===3)  return '+3  트리플보기';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`그로스: ${g}（파 ${p}  ${d>=0?'+':''}${d}）`,
    toPinLabel:'핀까지', ydsLabel:'야드',
    albatross:'알바트로스', eagle:'이글', birdie:'버디', par:'파',
    bogey:'보기', double:'더블보기', triple:'트리플+',
  },
  es:{
    holeHero:h=>`HOYO ${h}`, parLabel:p=>`PAR ${p}`,
    hintMain:'Clic para subir fondo / Soltar imagen aquí',
    hintSub:'Solo vista previa — no se incluye en la exportación',
    distLabel:'Al hoyo', distUnit:'yds',
    totalLabel:'MOSTRAR TOTAL',
    finalScore:'PUNTUACIÓN FINAL (DELTA)',
    setScore:'ESTABLECER PUNT.',
    shotSection:'GOLPE', optionsTitle:'OPCIONES DE PANTALLA',
    shotOverlay:'Shot Overlay', scorecardOverlay:'Tarjeta',
    front9:'9 delant.', back9:'9 traseros', h18:'18 hoyos',
    topar:'A par', gross:'Brutos',
    sdTitle:'⚙️ Ajustes', sdBg:'Imagen de fondo', sdBgOp:'Opacidad del fondo',
    sdClearBg:'🗑 Borrar fondo (restaurar por defecto)',
    sdSc:'Tarjeta de puntuación', sdResetSc:'↺ Restablecer posición',
    sdSz:'Zona segura', sdSzLbl:'Mostrar guías de zona segura', sdSzSize:'Tamaño de zona',
    sdPar:'Par del campo',
    settingsLbl:' Ajustes',
    nrTitle:'🏌️ Nueva ronda', nrClearScores:'Borrar puntuaciones de esta ronda',
    nrResetPars:'Restablecer par del campo a 4 (todos los hoyos)',
    nrCancel:'Cancelar', nrConfirm:'Confirmar',
    pickerTitle:'Puntuación final', pickerCancel:'Cancelar',
    exportTitle:'EXPORTAR',
    exportBtn:'Crear PNG del overlay',
    bgBtn:'Subir fondo', opaLbl:'Opacidad',
    nextHoleShort:'SIGUIENTE',
    parLbl:'Par',
    toeOff:'SALIDA', approach:'APROXIMACIÓN', layup:'LAYUP', chip:'CHIP', putt:'PUTT',
    forBirdie:'P/ BIRDIE', forPar:'P/ PAR', forBogey:'P/ BOGEY',
    forDouble:'P/ DOBLE', forTriple:'P/ TRIPLE+',
    typeTee:'SALIDA', typeAppr:'APROX', typeLayup:'LAYUP', typeChip:'CHIP', typePutt:'PUTT', typeProv:'P',
    typeFB:'P/BIRDIE', typeFP:'P/PAR', typeFBo:'P/BOGEY',
    provisional:'PROVISIONAL',
    pickerRows:d=>{
      if(d==='clear') return 'BORRAR';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  ALBATROS';
      if(d===-2) return '-2  ÁGUILA';
      if(d===-1) return '-1  BIRDIE';
      if(d===0)  return '0  PAR';
      if(d===1)  return '+1  BOGEY';
      if(d===2)  return '+2  DOBLE';
      if(d===3)  return '+3  TRIPLE';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`Brutos: ${g}  (Par ${p}  ${d>=0?'+':''}${d})`,
    toPinLabel:'AL HOYO', ydsLabel:'YDS',
    albatross:'ALBATROS', eagle:'ÁGUILA', birdie:'BIRDIE', par:'PAR',
    bogey:'BOGEY', double:'DOBLE', triple:'TRIPLE+',
  }
};

let LANG = 'en';
function T(key,...args){
  const s=STRINGS[LANG], v=s[key];
  if(typeof v==='function') return v(...args);
  return v??key;
}

function setLang(l){
  LANG=l; S.lang=l;
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===l));
  applyLang(); render(); scheduleSave();
  if(typeof updateNarrowLangBtn==='function') updateNarrowLangBtn();
}

function applyLang(){
  const g=id=>document.getElementById(id);
  const logoEl=document.getElementById('logo-text');
  if(logoEl) logoEl.innerHTML=LANG==='zh'?'⛳ 高尔夫<span>角标助手</span>':'⛳ GOLF <span>OVERLAY</span>';
  g('hint-main').textContent=T('hintMain');
  g('hint-sub').textContent=T('hintSub');
  g('dist-lbl').textContent=T('distLabel')+':';
  g('dist-unit').textContent=T('distUnit');
  g('total-lbl').textContent=T('totalLabel');
  g('delta-section-title').textContent=T('finalScore');
  g('shot-section-title').innerHTML=T('shotSection')+' <span id="type-mode-badge" class="auto-badge">AUTO</span>';
  if(g('options-title')) g('options-title').textContent=T('optionsTitle');
  g('lbl-shot').textContent=T('shotOverlay');
  g('lbl-score').textContent=T('scorecardOverlay');
  g('lbl-front9').textContent=T('front9');
  g('lbl-back9').textContent=T('back9');
  g('lbl-18h').textContent=T('h18');
  g('mode-tp').textContent=T('topar');
  g('mode-gr').textContent=T('gross');
  g('sd-title').textContent=T('sdTitle');
  g('sd-bg-title').textContent=T('sdBg');
  g('sd-opacity-lbl').textContent=T('sdBgOp');
  g('sd-clear-bg').textContent=T('sdClearBg');
  g('sd-sc-title').textContent=T('sdSc');
  g('sd-reset-sc').textContent=T('sdResetSc');
  g('sd-sz-title').textContent=T('sdSz');
  g('sd-sz-lbl').textContent=T('sdSzLbl');
  g('sd-par-title').textContent=T('sdPar');
  g('nr-title').textContent=T('nrTitle');
  g('nr-clear-scores').textContent=T('nrClearScores');
  g('nr-reset-pars').textContent=T('nrResetPars');
  g('nr-cancel').textContent=T('nrCancel');
  g('nr-confirm').textContent=T('nrConfirm');
  g('picker-title').textContent=T('pickerTitle');
  g('picker-cancel').textContent=T('pickerCancel');
  g('export-title').textContent=T('exportTitle');
  const _expBtnTxt=g('export-btn-txt'); if(_expBtnTxt) _expBtnTxt.textContent=T('exportBtn');
  g('lbl-opa').textContent=T('opaLbl');
  g('settings-lbl').textContent=T('settingsLbl');
  const nhil=g('nhi-lbl'); if(nhil) nhil.textContent=T('nextHoleShort');
  // export section labels (elements may not exist if removed from HTML)
  const expLblS=g('exp-lbl-single'); if(expLblS) expLblS.textContent=LANG==='zh'?'单张':'Single';
  const expLblB=g('exp-lbl-batch'); if(expLblB) expLblB.textContent=LANG==='zh'?'批量':'Batch';
  // Scorecard range labels (inline radios)
  g('lbl-front9').textContent=LANG==='zh'?'前9':LANG==='ja'?'前半':LANG==='ko'?'전반':'F9';
  g('lbl-back9').textContent=LANG==='zh'?'后9':LANG==='ja'?'後半':LANG==='ko'?'후반':'B9';
  g('lbl-18h').textContent='18H';
  const lbHS=g('lbl-exp-hole-seq'); if(lbHS) lbHS.textContent=LANG==='zh'?'当前洞击球包':'Hole Shots ZIP';
  const lbSS=g('lbl-exp-sc-seq'); if(lbSS) lbSS.textContent=LANG==='zh'?'18洞计分卡包':'18 SC ZIP';
  // player UI labels (B1)
  const pmTitle=g('pm-title'); if(pmTitle) pmTitle.textContent=LANG==='zh'?'球员管理':LANG==='ja'?'プレーヤー管理':LANG==='ko'?'플레이어 관리':'Players';
  const pmActiveTitle=g('pm-active-title'); if(pmActiveTitle) pmActiveTitle.textContent=LANG==='zh'?'已添加球员':LANG==='ja'?'追加済み':LANG==='ko'?'추가된 선수':'Active Players';
  const pmAddTitle=g('pm-add-title'); if(pmAddTitle) pmAddTitle.textContent=LANG==='zh'?'添加球员':LANG==='ja'?'追加':LANG==='ko'?'추가':'Add Player';
  const pmHistTitle=g('pm-hist-title'); if(pmHistTitle) pmHistTitle.textContent=LANG==='zh'?'历史球员':LANG==='ja'?'履歴':LANG==='ko'?'히스토리':'History';
  const pmAddInp=g('pm-add-input'); if(pmAddInp) pmAddInp.placeholder=LANG==='zh'?'球员姓名…':'Name…';
  const pmSearch=g('pm-hist-search'); if(pmSearch) pmSearch.placeholder=LANG==='zh'?'搜索球员…':'Search…';
  const btnPM=g('btn-player-mgr'); if(btnPM) btnPM.textContent=LANG==='zh'?'管理…':LANG==='ja'?'管理…':LANG==='ko'?'관리…':'Manage…';
  const pSecLbl=g('player-section-lbl'); if(pSecLbl) pSecLbl.textContent=LANG==='zh'?'球员':LANG==='ja'?'プレーヤー':LANG==='ko'?'플레이어':'Players';
  const showPNLbl=g('sd-show-pname-lbl'); if(showPNLbl) showPNLbl.textContent=LANG==='zh'?'显示球员名字':'Show Player Name';
  if(typeof buildPlayerArea==='function') buildPlayerArea();
  buildTypeButtons();
  buildDeltaBtn();
}

// ============================================================
// DATA MODEL
// ============================================================
const DEFAULT_BG = './bkimg.jpeg';
const LS_KEY = 'golf_v531';
const SESSION_ID = '__session__';

function defaultScorecardCenter(ratio){
  // Default: horizontally centered in canvas, 83% down
  return { x:0.5, y:0.83, centered:true };
}

function defState(){
  return{
    playerName:'PLAYER', courseName:'', currentHole:0, displayMode:'topar',
    ratio:'16:9', showShot:true, showScore:false, scoreRange:'18',
    scorecardSummary:null,
    showTotal:false, showDist:false,
    exportRes:2160, bgOpacity:1.0, overlayOpacity:1.0,
    safeZone:false, szSize:'10', lang:'en', theme:'classic',
    userBg:null,
    // multi-player
    players:[], currentPlayerId:null, playerHistory:[], byPlayer:{},
    showPlayerName:false,
    // x = 0.95 − SHOT_W/1920 = 0.695 (right edge at 5% safe zone), y = 0.05 (top safe zone)
    overlayPos:{
      '16:9':{x:0.695,y:0.05},
      '9:16':{x:0.695,y:0.05},
      '1:1': {x:0.695,y:0.05}
    },
    // centered horizontally; y = 0.95 − SC_height_fraction per ratio (bottom at 5% safe zone)
    scorecardPos:{
      '16:9':{x:0.5,y:0.76,centered:true},
      '9:16':{x:0.5,y:0.89,centered:true},
      '1:1': {x:0.5,y:0.84,centered:true}
    },
    holes:Array.from({length:18},()=>({par:4,holeLengthYds:null,delta:null,shots:[],shotIndex:0,manualTypes:{},toPins:{}}))
  };
}

let S = defState();

// ============================================================
// PLAYER MANAGEMENT
// ============================================================
function effectivePlayerId(){ return S.currentPlayerId||SESSION_ID; }

function ensurePlayerData(pid){
  if(!S.byPlayer) S.byPlayer={};
  if(!S.byPlayer[pid]){
    S.byPlayer[pid]={holes:Array.from({length:18},()=>({delta:null,shots:[],shotIndex:0,manualTypes:{},toPins:{}}))};
  }
}

function currentPlayerDisplayName(){
  if(S.currentPlayerId){
    const p=(S.players||[]).find(p=>p.id===S.currentPlayerId);
    if(p) return p.name;
  }
  return S.playerName||'PLAYER';
}

function resetAllShotIndex(hi){
  S.holes[hi].shotIndex=0;
  if(S.byPlayer){
    for(const pid in S.byPlayer){
      const ph=S.byPlayer[pid].holes;
      if(ph&&ph[hi]) ph[hi].shotIndex=0;
    }
  }
}

function saveCurrentPlayerData(){
  const pid=effectivePlayerId();
  ensurePlayerData(pid);
  S.byPlayer[pid].holes=S.holes.map(h=>({
    delta:h.delta,
    shots:JSON.parse(JSON.stringify(h.shots||[])),
    shotIndex:h.shotIndex||0,
    manualTypes:Object.assign({},h.manualTypes||{}),
    toPins:Object.assign({},h.toPins||{})
  }));
}

function loadPlayerData(pid){
  ensurePlayerData(pid);
  const ph=S.byPlayer[pid].holes;
  S.holes.forEach((h,i)=>{
    const p=ph[i]||{};
    h.delta=p.delta!==undefined?p.delta:null;
    h.shots=JSON.parse(JSON.stringify(p.shots||[]));
    h.shotIndex=p.shotIndex||0;
    h.manualTypes=Object.assign({},p.manualTypes||{});
    h.toPins=Object.assign({},p.toPins||{});
  });
}

function switchToPlayer(pid){
  if(pid===effectivePlayerId()) return;
  saveCurrentPlayerData();
  S.currentPlayerId=(pid===SESSION_ID)?null:pid;
  loadPlayerData(effectivePlayerId());
  if(typeof buildPlayerArea==='function') buildPlayerArea();
  render(); scheduleSave();
}

function addPlayer(name){
  name=(name||'').trim();
  if(!name) return false;
  if(!S.players) S.players=[];
  if(S.players.length>=150){ miniToast(LANG==='zh'?'最多150名球员':'Max 150 players',true); return false; }
  if(S.players.find(p=>p.name===name)){ miniToast(LANG==='zh'?'球员已存在':'Player exists',true); return false; }
  const id='p_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
  const isFirst=S.players.length===0;
  S.players.push({id,name});
  if(!S.playerHistory) S.playerHistory=[];
  S.playerHistory=[name,...S.playerHistory.filter(n=>n!==name)].slice(0,50);
  if(isFirst){
    // migrate current session data to this player
    ensurePlayerData(id);
    S.byPlayer[id].holes=S.holes.map(h=>({
      delta:h.delta,shots:JSON.parse(JSON.stringify(h.shots||[])),
      shotIndex:h.shotIndex||0,manualTypes:Object.assign({},h.manualTypes||{}),
      toPins:Object.assign({},h.toPins||{})
    }));
    if(S.byPlayer[SESSION_ID]) delete S.byPlayer[SESSION_ID];
    S.currentPlayerId=id;
    // S.holes already has the right data
  } else {
    ensurePlayerData(id);
  }
  scheduleSave();
  return true;
}

function removePlayer(id){
  if(!S.players) return;
  saveCurrentPlayerData();
  S.players=S.players.filter(p=>p.id!==id);
  if(S.byPlayer) delete S.byPlayer[id];
  if(S.currentPlayerId===id){
    S.currentPlayerId=S.players.length>0?S.players[0].id:null;
    loadPlayerData(effectivePlayerId());
  }
  if(typeof buildPlayerArea==='function') buildPlayerArea();
  render(); scheduleSave();
}

// ============================================================
// PERSISTENCE
// ============================================================
let saveTimer;
function scheduleSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(doSave,350); }
function doSave(){
  try{
    const forStorage={...S,userBg:null};
    localStorage.setItem(LS_KEY,JSON.stringify(forStorage));
    if(S.userBg){
      try{ localStorage.setItem(LS_KEY+'_bg',S.userBg); } catch(e){}
    } else {
      localStorage.removeItem(LS_KEY+'_bg');
    }
  } catch(e){ console.warn('save error',e); }
}

function loadSaved(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(!raw) return;
    const saved=JSON.parse(raw);
    S=Object.assign(defState(),saved);
    if(!S.overlayPos||typeof S.overlayPos['16:9']!=='object') S.overlayPos=defState().overlayPos;
    if(!S.scorecardPos||typeof S.scorecardPos['16:9']!=='object') S.scorecardPos=defState().scorecardPos;
    // Ensure centered flag exists
    ['16:9','9:16','1:1'].forEach(r=>{
      if(S.scorecardPos[r]===undefined) S.scorecardPos[r]=defState().scorecardPos[r];
    });
    S.holes=Array.from({length:18},(_,i)=>Object.assign(
      {par:4,holeLengthYds:null,delta:null,shots:[],shotIndex:0,manualTypes:{},toPins:{}},
      saved.holes?.[i]||{}
    ));
    // multi-player fields
    S.players=saved.players||[];
    S.currentPlayerId=saved.currentPlayerId||null;
    S.playerHistory=saved.playerHistory||[];
    S.byPlayer=saved.byPlayer||{};
    S.showPlayerName=!!saved.showPlayerName;
    // backward-compat: old saves had per-hole data in holes[], no byPlayer
    const pid=effectivePlayerId();
    if(!saved.byPlayer){
      ensurePlayerData(pid);
      S.byPlayer[pid].holes=S.holes.map(h=>({
        delta:h.delta,shots:JSON.parse(JSON.stringify(h.shots||[])),
        shotIndex:h.shotIndex||0,manualTypes:Object.assign({},h.manualTypes||{}),
        toPins:Object.assign({},h.toPins||{})
      }));
    }
    loadPlayerData(pid);
    LANG=S.lang||'en';
    const bgData=localStorage.getItem(LS_KEY+'_bg');
    S.userBg=bgData||null;
    if(S.overlayOpacity===undefined) S.overlayOpacity=1.0;
    if(S.bgOpacity===undefined||S.bgOpacity<0.01) S.bgOpacity=1.0;
    if(S.exportRes===undefined) S.exportRes=2160;
    if(!S.courseName) S.courseName='';
    if(!S.theme) S.theme='classic';
  } catch(e){ console.warn('loadSaved error',e); }
}

// ============================================================
// BACKGROUND MANAGEMENT
// ============================================================
function applyBg(){
  const img=document.getElementById('bg-img');
  const hint=document.getElementById('upload-hint');
  // Always set onerror BEFORE src to catch any load failure (including cached failures)
  img.onerror=()=>{ img.onerror=null; img.style.display='none'; hint.classList.remove('hidden'); };
  img.src=S.userBg||DEFAULT_BG;
  img.style.display='block';
  img.style.opacity=S.bgOpacity;
  hint.classList.add('hidden');
}
function setBgFile(file){
  if(!file||!file.type.startsWith('image/')) return;
  const reader=new FileReader();
  reader.onload=ev=>{ S.userBg=ev.target.result; applyBg(); scheduleSave(); };
  reader.readAsDataURL(file);
}
function clearBg(){ S.userBg=null; applyBg(); scheduleSave(); closeSettings(); }

// ============================================================
// MUTATIONS
// ============================================================
function setPar(v){ curHole().par=v; reconcileShots(curHole()); render(); scheduleSave(); }

function setDelta(d){
  const h=curHole();
  h.delta=d; h.manualTypes={};
  reconcileShots(h);
  const gross=getGross(h);
  if(gross&&gross>0) h.shotIndex=gross-1; else h.shotIndex=0;
  render(); scheduleSave();
}

function adjDelta(inc){
  const h=curHole();
  if(h.delta===null){
    h.delta=0;
    reconcileShots(h);
    const gross=getGross(h);
    if(gross&&gross>0) h.shotIndex=gross-1; else h.shotIndex=0;
  } else {
    const newD=h.delta+inc;
    if(newD<-6||newD>12) return;
    h.delta=newD; h.manualTypes={};
    reconcileShots(h);
    const gross=getGross(h);
    if(gross&&gross>0) h.shotIndex=gross-1; else h.shotIndex=0;
  }
  render(); scheduleSave();
}

function reconcileShots(h){
  const gross=getGross(h);
  if(gross===null){ h.shots=[]; h.shotIndex=0; return; }
  while(h.shots.length>gross) h.shots.pop();
  while(h.shots.length<gross) h.shots.push({type:null,toPin:null});
  if(h.shotIndex>=gross) h.shotIndex=gross-1;
  if(h.shotIndex<0) h.shotIndex=0;
  h.shots.forEach((s,i)=>{ if(!s.type) s.type=autoType(h,i); });
}

function clearHole(){
  const h=curHole();
  h.delta=null; h.shots=[]; h.shotIndex=0; h.manualTypes={}; h.toPins={};
  render(); scheduleSave();
}

function setMode(m){ S.displayMode=m; render(); scheduleSave(); }

function prevShot(){
  const h=curHole(), g=getGross(h);
  if(h.delta===null||!g) return;
  h.shotIndex=h.shotIndex<=0?g-1:h.shotIndex-1;
  render(); scheduleSave();
}
function nextShot(){
  const h=curHole(), g=getGross(h);
  if(h.delta===null||!g) return;
  h.shotIndex=h.shotIndex>=g-1?0:h.shotIndex+1;
  render(); scheduleSave();
}
function setShotType(type){
  const h=curHole();
  if(h.delta===null) return;
  if(!h.shots[h.shotIndex]) h.shots[h.shotIndex]={type:null};
  h.shots[h.shotIndex].type=type;
  h.manualTypes[h.shotIndex]=true;
  render(); scheduleSave();
}

function getShotToPin(h,idx){
  // TEE shot (idx=0): always use shared hole length — same distance for all players
  if(idx===0) return h.holeLengthYds??null;
  return h.toPins?.[idx]??null;
}
function setShotToPin(val){
  const h=curHole();
  if(h.shotIndex===0){
    // TEE Off: update shared hole length only (all players share this distance)
    h.holeLengthYds=val;
  } else {
    if(!h.toPins) h.toPins={};
    h.toPins[h.shotIndex]=val;
  }
  redrawOnly(); scheduleSave();
}

function resetAllPars(){ S.holes.forEach(h=>h.par=4); render(); scheduleSave(); closeSettings(); }

function gotoNextHole(){
  // v5.1: always go to sequentially next hole (not next empty)
  const next=(S.currentHole+1)%18;
  S.currentHole=next;
  S.scorecardSummary=null;
  resetAllShotIndex(next);
  render(); scheduleSave();
}
function gotoPrevHole(){
  const prev=(S.currentHole+17)%18;
  S.currentHole=prev;
  S.scorecardSummary=null;
  resetAllShotIndex(prev);
  render(); scheduleSave();
}

const RATIO_BG={'16:9':'./bkimg.jpeg','9:16':'./bkimg-9-16.jpg','1:1':'./bkimg-1-1.jpg'};

function setRatio(r){
  S.ratio=r;
  document.querySelectorAll('.ratio-btn').forEach(b=>b.classList.toggle('active',b.dataset.ratio===r));
  // Switch default background if user has not uploaded a custom one
  if(!S.userBg){
    const bgEl=document.getElementById('bg-img');
    if(bgEl){ bgEl.src=RATIO_BG[r]||DEFAULT_BG; bgEl.style.display='block'; }
  }
  render(); scheduleSave();
}

function setRes(btn){
  S.exportRes=parseInt(btn.dataset.res)||2160;
  document.querySelectorAll('.res-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  scheduleSave();
}

// v4.5: reset scorecard to default center position
function resetScorecardPos(){
  ['16:9','9:16','1:1'].forEach(r=>{
    S.scorecardPos[r]={x:0.5, y:0.83, centered:true};
  });
  redrawOnly(); scheduleSave();
  miniToast('Scorecard position reset');
  closeSettings();
}

// ============================================================
// THEME SYSTEM
// ============================================================
const THEMES = {
  classic: {
    shot: {
      // Card frame
      borderColor:        'rgba(184,150,46,0.55)',
      borderWidth:        1.5,          // × scale, min 1.5
      cornerRadius:       5,            // × scale
      // Background regions
      leftBg:             '#1B5E3B',
      midBandBg:          '#1B5E3B',
      rightBg:            '#F8F8F8',
      // Left column — hole number
      holeNumColor:       '#ffffff',
      holeNumWeight:      900,
      holeNumSize:        56,           // × scale
      // Left column — PAR label
      parLabelColor:      'rgba(255,255,255,0.6)',
      parLabelWeight:     700,
      parLabelSize:       20,
      // Left column — par value
      parValColor:        '#B8962E',
      parValWeight:       900,
      parValSize:         36,
      // Row1 — player name
      playerNameColor:    '#111111',
      playerNameWeight:   700,
      playerNameSize:     34,
      // Row1 — total badge
      totalBadgeWeight:   900,
      totalBadgeSize:     38,
      totalBadgeColorFn:  td => td<0?'#C0392B':td<=7?'#1a5bb5':td<=17?'#2e7d32':td<=27?'#888888':'#111111',
      totalBadgeTextColor:'#ffffff',
      // Row2 — progress squares
      sqCurBg:            '#ffffff',
      sqCurTextColor:     '#1B5E3B',
      sqPastBg:           'rgba(255,255,255,.25)',
      sqPastTextColor:    'rgba(255,255,255,.85)',
      sqFutureBg:         'rgba(255,255,255,.10)',
      sqFutureTextColor:  'rgba(255,255,255,.3)',
      sqRadius:           3,
      sqNumWeight:        700,
      sqNumSize:          15,
      // Dividers
      dividerColor:       'rgba(184,150,46,0.7)',
      dividerWidth:       1.2,
      row12DivColor:      'rgba(200,200,200,0.5)',
      row12DivWidth:      0.6,
      // Row3 — To Pin distance
      distValColor:       '#1e7a3e',
      distValWeight:      700,
      distValSize:        22,
      distUnitColor:      'rgba(20,100,50,0.9)',
      distUnitWeight:     600,
      distUnitSize:       13,
      // Row3 — shot type label
      shotTypeColor:      '#1a6e35',
      shotTypeWeight:     700,
      shotTypeSize:       24,
      // Row3 — result badge
      resultBadgeRadius:  3,
      resultBadgeWeight:  700,
      resultBadgeSize:    24,
      resultBadgeTextColor:'#ffffff',
    },
    sc: {
      // Card
      cardBg:             '#F2F2F2',
      cardRadius:         8,
      shadowColor:        'rgba(0,0,0,0.35)',
      shadowBlur:         10,
      shadowOffsetY:      3,
      // Separators
      vlineColor:         'rgba(180,190,180,0.4)',
      vlineWidth:         0.6,
      subVlineColor:      'rgba(27,94,59,0.25)',
      subVlineWidth:      1.5,
      // Header row
      hdrBg:              '#1B5E3B',
      holeLabelColor:     'rgba(255,255,255,0.6)',
      holeLabelWeight:    600,
      holeNumColor:       'rgba(255,255,255,.85)',
      holeNumWeight:      600,
      outInDimBg:         'rgba(0,0,0,0.18)',
      outInTextColor:     'rgba(255,255,255,.95)',
      outInWeight:        700,
      totHdrTextColor:    'rgba(255,255,255,.95)',
      totHdrWeight:       700,
      // PAR row
      parRowBg:           '#EAF0EA',
      parLabelColor:      'rgba(0,0,0,0.45)',
      parLabelWeight:     500,
      parValColor:        '#2a5e2a',
      parValWeight:       500,
      parSubColor:        '#1B5E3B',
      parSubWeight:       700,
      parTotColor:        '#1B5E3B',
      parTotWeight:       700,
      // SCORE row
      scoreRowBg:         '#FFFFFF',
      scoreRowDivColor:   'rgba(180,190,180,0.5)',
      scoreLabelColor:    'rgba(0,0,0,0.45)',
      scoreLabelWeight:   700,
      scoreSubBg:         'rgba(27,94,59,0.06)',
      // Score cell — empty
      emptyDashColor:     'rgba(0,0,0,0.18)',
      emptyDashWeight:    400,
      // Score cell — badge
      scoreBadgeRadius:   4,
      scoreBadgeTextColor:'#ffffff',
      scoreBadgeWeight:   800,
      // OUT/IN sub-total badge
      subTotBg:           '#ffffff',
      subTotTextColor:    '#111111',
      subTotWeight:       800,
      // TOT column
      totTextColor:       '#111111',
      totWeight:          700,
      // Delta score badge colors
      scoreColors: {
        eagle:  '#7c3aed',
        birdie: '#C0392B',
        par:    '#1a5bb5',
        bogey:  '#2e7d32',
        double: '#9e9e9e',
        triple: '#555555',
        over:   '#111111',
        empty:  '#888888',
      },
      // Player name badge
      nameBadgeBg:        '#ffffff',
      nameBadgeTextColor: '#111111',
      nameBadgeWeight:    700,
      nameBadgeSize:      34,
      nameBadgeRadius:    5,
    },
  },
};

THEMES.broadcast_gold = {
  name: 'Broadcast Gold',
  shot: {
    // Frame
    borderColor:        '#c9a44a',
    borderWidth:        3,
    cornerRadius:       18,
    goldFrame:          true,
    borderInnerColor:   'rgba(255,255,255,0.55)',
    borderInnerWidth:   1.5,
    // Background regions
    leftBg:             '#1a5a3a',
    midBandBg:          '#1a5a3a',
    rightBg:            '#f7f7f7',
    // Left col — hole number
    holeNumColor:       '#ffffff',
    holeNumWeight:      900,
    holeNumSize:        60,
    // Left col — PAR label
    parLabelColor:      'rgba(255,255,255,0.62)',
    parLabelWeight:     700,
    parLabelSize:       20,
    // Left col — par value (gold)
    parValColor:        '#d4af37',
    parValWeight:       900,
    parValSize:         42,
    // Row1 — player name
    playerNameColor:    '#111111',
    playerNameWeight:   700,
    playerNameSize:     34,
    // Row1 — total badge
    totalBadgeWeight:   900,
    totalBadgeSize:     38,
    totalBadgeColorFn:  td => td<0?'#C0392B':td<=7?'#1a5bb5':td<=17?'#2e7d32':td<=27?'#888888':'#111111',
    totalBadgeTextColor:'#ffffff',
    // Row2 — progress squares
    sqCurBg:            '#ffffff',
    sqCurTextColor:     '#1a5a3a',
    sqPastBg:           'rgba(255,255,255,0.55)',
    sqPastTextColor:    'rgba(255,255,255,0.90)',
    sqFutureBg:         'rgba(255,255,255,0.25)',
    sqFutureTextColor:  'rgba(255,255,255,0.40)',
    sqRadius:           8,
    sqNumWeight:        700,
    sqNumSize:          15,
    // Dividers
    dividerColor:       '#d4af37',
    dividerWidth:       1,
    row12DivColor:      'rgba(0,0,0,0.10)',
    row12DivWidth:      0.6,
    // Row3 — distance
    distValColor:       '#1a5a3a',
    distValWeight:      700,
    distValSize:        22,
    distUnitColor:      'rgba(26,90,58,0.80)',
    distUnitWeight:     600,
    distUnitSize:       13,
    // Row3 — shot type
    shotTypeColor:      '#1a5a3a',
    shotTypeWeight:     700,
    shotTypeSize:       24,
    // Row3 — result badge
    resultBadgeRadius:  8,
    resultBadgeWeight:  700,
    resultBadgeSize:    24,
    resultBadgeTextColor:'#ffffff',
  },
  sc: {
    // Card frame
    cardBg:             '#f7f7f7',
    cardRadius:         18,
    shadowColor:        'rgba(0,0,0,0.22)',
    shadowBlur:         18,
    shadowOffsetY:      8,
    goldFrame:          true,
    borderColor:        '#c9a44a',
    borderWidth:        3,
    borderInnerColor:   'rgba(255,255,255,0.55)',
    borderInnerWidth:   1.5,
    // Separators
    vlineColor:         'rgba(0,0,0,0.10)',
    vlineWidth:         0.6,
    subVlineColor:      'rgba(26,90,58,0.25)',
    subVlineWidth:      1.5,
    // Header
    hdrBg:              '#1f6a43',
    holeLabelColor:     'rgba(255,255,255,0.62)',
    holeLabelWeight:    600,
    holeNumColor:       'rgba(255,255,255,.90)',
    holeNumWeight:      600,
    outInDimBg:         'rgba(0,0,0,0.15)',
    outInTextColor:     'rgba(255,255,255,.95)',
    outInWeight:        700,
    totHdrTextColor:    'rgba(255,255,255,.95)',
    totHdrWeight:       700,
    // PAR row
    parRowBg:           '#e8f0e8',
    parLabelColor:      'rgba(0,0,0,0.45)',
    parLabelWeight:     500,
    parValColor:        '#2a5e2a',
    parValWeight:       500,
    parSubColor:        '#1a5a3a',
    parSubWeight:       700,
    parTotColor:        '#1a5a3a',
    parTotWeight:       700,
    // Score row
    scoreRowBg:         '#ffffff',
    scoreRowDivColor:   'rgba(0,0,0,0.10)',
    scoreLabelColor:    'rgba(0,0,0,0.45)',
    scoreLabelWeight:   700,
    scoreSubBg:         'rgba(26,90,58,0.06)',
    emptyDashColor:     'rgba(0,0,0,0.18)',
    emptyDashWeight:    400,
    scoreBadgeRadius:   6,
    scoreBadgeTextColor:'#ffffff',
    scoreBadgeWeight:   800,
    subTotBg:           '#ffffff',
    subTotTextColor:    '#111111',
    subTotWeight:       800,
    totTextColor:       '#111111',
    totWeight:          700,
    scoreColors: {
      eagle:'#7c3aed', birdie:'#C0392B', par:'#1a5bb5',
      bogey:'#2e7d32', double:'#9e9e9e', triple:'#555555', over:'#111111', empty:'#888888',
    },
    nameBadgeBg:        '#ffffff',
    nameBadgeTextColor: '#111111',
    nameBadgeWeight:    700,
    nameBadgeSize:      34,
    nameBadgeRadius:    8,
  },
};

THEMES.pgatour = {
  name: 'PGA Tour',
  shot: {
    // Frame — navy thin border, no goldFrame
    borderColor:        'rgba(10,42,102,0.35)',
    borderWidth:        1.5,
    cornerRadius:       16,
    // Background
    leftBg:             '#0a2a66',
    midBandBg:          '#0a2a66',
    rightBg:            '#ffffff',
    // Left col — hole number
    holeNumColor:       '#ffffff',
    holeNumWeight:      900,
    holeNumSize:        58,
    // Left col — PAR label
    parLabelColor:      'rgba(255,255,255,0.70)',
    parLabelWeight:     700,
    parLabelSize:       20,
    // Left col — par value (red accent)
    parValColor:        '#e2231a',
    parValWeight:       900,
    parValSize:         40,
    // Row1 — player name
    playerNameColor:    '#0b0f18',
    playerNameWeight:   700,
    playerNameSize:     34,
    // Row1 — total badge
    totalBadgeWeight:   900,
    totalBadgeSize:     38,
    totalBadgeColorFn:  td => td<0?'#C0392B':td<=7?'#1a5bb5':td<=17?'#2e7d32':td<=27?'#888888':'#111111',
    totalBadgeTextColor:'#ffffff',
    // Row2 — progress squares
    sqCurBg:            '#ffffff',
    sqCurTextColor:     '#0a2a66',
    sqPastBg:           'rgba(255,255,255,0.60)',
    sqPastTextColor:    'rgba(255,255,255,0.90)',
    sqFutureBg:         'rgba(255,255,255,0.25)',
    sqFutureTextColor:  'rgba(255,255,255,0.40)',
    sqRadius:           7,
    sqNumWeight:        700,
    sqNumSize:          15,
    // Dividers — red accent divider
    dividerColor:       '#e2231a',
    dividerWidth:       1,
    row12DivColor:      'rgba(10,42,102,0.14)',
    row12DivWidth:      0.6,
    // Row3 — distance
    distValColor:       '#0a2a66',
    distValWeight:      700,
    distValSize:        22,
    distUnitColor:      'rgba(11,15,24,0.55)',
    distUnitWeight:     600,
    distUnitSize:       13,
    // Row3 — shot type
    shotTypeColor:      '#0a2a66',
    shotTypeWeight:     700,
    shotTypeSize:       24,
    // Row3 — result badge
    resultBadgeRadius:  7,
    resultBadgeWeight:  700,
    resultBadgeSize:    24,
    resultBadgeTextColor:'#ffffff',
  },
  sc: {
    cardBg:             '#ffffff',
    cardRadius:         16,
    shadowColor:        'rgba(0,0,0,0.20)',
    shadowBlur:         16,
    shadowOffsetY:      7,
    // Separators
    vlineColor:         'rgba(10,42,102,0.14)',
    vlineWidth:         0.6,
    subVlineColor:      'rgba(10,42,102,0.22)',
    subVlineWidth:      1.5,
    // Header — dark navy
    hdrBg:              '#0a2a66',
    holeLabelColor:     'rgba(255,255,255,0.70)',
    holeLabelWeight:    600,
    holeNumColor:       'rgba(255,255,255,.90)',
    holeNumWeight:      600,
    outInDimBg:         'rgba(0,0,0,0.18)',
    outInTextColor:     'rgba(255,255,255,.95)',
    outInWeight:        700,
    totHdrTextColor:    'rgba(255,255,255,.95)',
    totHdrWeight:       700,
    // PAR row — slight blue tint
    parRowBg:           '#f0f2f5',
    parLabelColor:      'rgba(0,0,0,0.45)',
    parLabelWeight:     500,
    parValColor:        '#0a2a66',
    parValWeight:       500,
    parSubColor:        '#0a2a66',
    parSubWeight:       700,
    parTotColor:        '#0a2a66',
    parTotWeight:       700,
    // Score row
    scoreRowBg:         '#ffffff',
    scoreRowDivColor:   'rgba(10,42,102,0.14)',
    scoreLabelColor:    'rgba(0,0,0,0.45)',
    scoreLabelWeight:   700,
    scoreSubBg:         'rgba(10,42,102,0.04)',
    emptyDashColor:     'rgba(0,0,0,0.18)',
    emptyDashWeight:    400,
    scoreBadgeRadius:   5,
    scoreBadgeTextColor:'#ffffff',
    scoreBadgeWeight:   800,
    subTotBg:           '#ffffff',
    subTotTextColor:    '#0b0f18',
    subTotWeight:       800,
    totTextColor:       '#0b0f18',
    totWeight:          700,
    scoreColors: {
      eagle:'#2d4cff', birdie:'#e2231a', par:'#0a2a66',
      bogey:'#2e7d32', double:'#9e9e9e', triple:'#555555', over:'#111111', empty:'#888888',
    },
    nameBadgeBg:        '#ffffff',
    nameBadgeTextColor: '#0b0f18',
    nameBadgeWeight:    700,
    nameBadgeSize:      34,
    nameBadgeRadius:    5,
  },
};

THEMES.livgolf = {
  name: 'LIV Golf',
  shot: {
    // Frame — neon green glow border
    borderColor:        'rgba(57,255,20,0.55)',
    borderWidth:        2,
    cornerRadius:       18,
    glow:               true,
    glowColor:          '#39ff14',
    glowBlur:           12,
    // Background — near-black
    leftBg:             '#101010',
    midBandBg:          '#101010',
    rightBg:            '#0b0b0b',
    // Left col — hole number
    holeNumColor:       '#f2f2f2',
    holeNumWeight:      900,
    holeNumSize:        58,
    // Left col — PAR label
    parLabelColor:      'rgba(242,242,242,0.65)',
    parLabelWeight:     700,
    parLabelSize:       20,
    // Left col — par value (neon green)
    parValColor:        '#39ff14',
    parValWeight:       900,
    parValSize:         40,
    // Row1 — player name
    playerNameColor:    '#f2f2f2',
    playerNameWeight:   700,
    playerNameSize:     34,
    // Row1 — total badge
    totalBadgeWeight:   900,
    totalBadgeSize:     38,
    totalBadgeColorFn:  td => td<0?'#C0392B':td<=7?'#1a5bb5':td<=17?'#2e7d32':td<=27?'#888888':'#111111',
    totalBadgeTextColor:'#f2f2f2',
    // Row2 — progress squares
    sqCurBg:            '#39ff14',
    sqCurTextColor:     '#0b0b0b',
    sqPastBg:           'rgba(255,255,255,0.65)',
    sqPastTextColor:    'rgba(255,255,255,0.90)',
    sqFutureBg:         'rgba(255,255,255,0.18)',
    sqFutureTextColor:  'rgba(255,255,255,0.35)',
    sqRadius:           8,
    sqNumWeight:        700,
    sqNumSize:          15,
    // Dividers — neon green
    dividerColor:       '#39ff14',
    dividerWidth:       1,
    row12DivColor:      'rgba(255,255,255,0.10)',
    row12DivWidth:      0.6,
    // Row3 — distance (neon green)
    distValColor:       '#39ff14',
    distValWeight:      700,
    distValSize:        22,
    distUnitColor:      'rgba(242,242,242,0.60)',
    distUnitWeight:     600,
    distUnitSize:       13,
    // Row3 — shot type
    shotTypeColor:      'rgba(242,242,242,0.80)',
    shotTypeWeight:     700,
    shotTypeSize:       24,
    // Row3 — result badge
    resultBadgeRadius:  8,
    resultBadgeWeight:  700,
    resultBadgeSize:    24,
    resultBadgeTextColor:'#0b0b0b',
  },
  sc: {
    cardBg:             '#0b0b0b',
    cardRadius:         18,
    shadowColor:        'rgba(0,0,0,0.45)',
    shadowBlur:         24,
    shadowOffsetY:      10,
    glow:               true,
    glowColor:          '#39ff14',
    glowBlur:           12,
    borderColor:        'rgba(57,255,20,0.55)',
    borderWidth:        2,
    // Separators
    vlineColor:         'rgba(255,255,255,0.10)',
    vlineWidth:         0.6,
    subVlineColor:      'rgba(57,255,20,0.20)',
    subVlineWidth:      1.5,
    // Header — black
    hdrBg:              '#0b0b0b',
    holeLabelColor:     'rgba(242,242,242,0.65)',
    holeLabelWeight:    600,
    holeNumColor:       'rgba(242,242,242,0.90)',
    holeNumWeight:      600,
    outInDimBg:         'rgba(255,255,255,0.05)',
    outInTextColor:     'rgba(242,242,242,0.95)',
    outInWeight:        700,
    totHdrTextColor:    'rgba(242,242,242,0.95)',
    totHdrWeight:       700,
    // PAR row — dark
    parRowBg:           '#111111',
    parLabelColor:      'rgba(242,242,242,0.55)',
    parLabelWeight:     500,
    parValColor:        '#39ff14',
    parValWeight:       500,
    parSubColor:        '#39ff14',
    parSubWeight:       700,
    parTotColor:        '#39ff14',
    parTotWeight:       700,
    // Score row — dark
    scoreRowBg:         '#0d0d0d',
    scoreRowDivColor:   'rgba(255,255,255,0.08)',
    scoreLabelColor:    'rgba(242,242,242,0.55)',
    scoreLabelWeight:   700,
    scoreSubBg:         'rgba(57,255,20,0.05)',
    emptyDashColor:     'rgba(255,255,255,0.22)',
    emptyDashWeight:    400,
    scoreBadgeRadius:   6,
    scoreBadgeTextColor:'#0b0b0b',
    scoreBadgeWeight:   800,
    subTotBg:           '#1a1a1a',
    subTotTextColor:    '#f2f2f2',
    subTotWeight:       800,
    totTextColor:       '#39ff14',
    totWeight:          700,
    scoreColors: {
      eagle:'#7b2cff', birdie:'#39ff14', par:'#e0e0e0',
      bogey:'#ff4d4d', double:'#9e9e9e', triple:'#555555', over:'#333333', empty:'#444444',
    },
    nameBadgeBg:        '#1a1a1a',
    nameBadgeTextColor: '#39ff14',
    nameBadgeWeight:    700,
    nameBadgeSize:      34,
    nameBadgeRadius:    8,
  },
};

function getTheme(){ return THEMES[S.theme] || THEMES.classic; }

// ── Panel frame helper — draws border, shadow, bg fill, sets clip ──
// withBg: true for scorecard (fill whole card first), false for shot (caller draws bg sections)
// crVal:  corner radius in unscaled px (e.g. th.cornerRadius or th.cardRadius)
function drawPanelFrame(ctx, X, Y, W, H, scale, th, withBg, crVal){
  const r = Math.min((crVal||8)*scale, W/2, H/2);
  const goldFrame = !!th.goldFrame;

  if(withBg){
    ctx.shadowColor   = th.shadowColor    || 'rgba(0,0,0,0.35)';
    ctx.shadowBlur    = (th.shadowBlur    || 10) * scale;
    ctx.shadowOffsetY = (th.shadowOffsetY || 3)  * scale;
    rrect(ctx, X, Y, W, H, r);
    ctx.fillStyle = th.cardBg || '#fff';
    ctx.fill();
    ctx.shadowColor = 'transparent';
  }

  if(goldFrame){
    // Outer gold border
    rrect(ctx, X, Y, W, H, r);
    ctx.strokeStyle = th.borderColor;
    ctx.lineWidth   = Math.max(th.borderWidth, th.borderWidth * scale);
    ctx.stroke();
    // Inner highlight border (inset by half outer border width)
    const d = (th.borderWidth * scale) / 2;
    rrect(ctx, X+d, Y+d, W-2*d, H-2*d, Math.max(r-d, 0));
    ctx.strokeStyle = th.borderInnerColor || 'rgba(255,255,255,0.55)';
    ctx.lineWidth   = Math.max(1, (th.borderInnerWidth||1.5) * scale);
    ctx.stroke();
  } else if(th.borderColor){
    // Border — with optional neon glow
    if(th.glow){
      ctx.save();
      ctx.shadowColor   = th.glowColor || th.borderColor;
      ctx.shadowBlur    = (th.glowBlur || 12) * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    rrect(ctx, X, Y, W, H, r);
    ctx.strokeStyle = th.borderColor;
    ctx.lineWidth   = Math.max(th.borderWidth||1.5, (th.borderWidth||1.5) * scale);
    ctx.stroke();
    if(th.glow) ctx.restore(); // clear shadow immediately
  }

  // Clip to card shape
  rrect(ctx, X, Y, W, H, r);
  ctx.clip();

  if(goldFrame){
    // Top highlight streak
    ctx.fillStyle = th.borderInnerColor || 'rgba(255,255,255,0.55)';
    ctx.fillRect(X, Y, W, Math.max(1, 1.5*scale));
  }
}

function setTheme(t){
  S.theme = t;
  document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active', b.dataset.theme===t));
  render(); scheduleSave();
}

// ============================================================
// CANVAS ENGINE
// ============================================================
let cvEl, dpr=1, cvCssW=0, cvCssH=0;
let dragging=null, dragStart={};
const SNAP_CENTER_PX = 12; // snap-to-center threshold in px

function getCanvasCssDims(){
  const area=document.getElementById('preview');
  const aw=area.clientWidth||800, ah=area.clientHeight||450;
  let cw,ch;
  if(S.ratio==='16:9'){ch=ah;cw=ah*(16/9);if(cw>aw){cw=aw;ch=aw*(9/16);}}
  else if(S.ratio==='9:16'){cw=aw;ch=aw*(16/9);if(ch>ah){ch=ah;cw=ah*(9/16);}}
  else{const s=Math.min(aw,ah);cw=s;ch=s;}
  return{w:Math.floor(cw),h:Math.floor(ch)};
}

function initCanvas(){
  cvEl=document.getElementById('cv');
  dpr=window.devicePixelRatio||1;
  cvEl.addEventListener('mousedown',onDragStart);
  window.addEventListener('mousemove',onDragMove);
  window.addEventListener('mouseup',onDragEnd);
  cvEl.addEventListener('touchstart',onTouchStart,{passive:false});
  window.addEventListener('touchmove',onTouchMove,{passive:false});
  window.addEventListener('touchend',onDragEnd);
}

function evPt(e){
  if(e.touches&&e.touches.length) return{x:e.touches[0].clientX,y:e.touches[0].clientY};
  if(e.changedTouches&&e.changedTouches.length) return{x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};
  return{x:e.clientX,y:e.clientY};
}

function snapPos(px,py,ow,oh){
  const sz=0.10;
  const sx=cvCssW*sz,sy=cvCssH*sz,ex=cvCssW*(1-sz),ey=cvCssH*(1-sz);
  // edge snaps
  if(Math.abs(px-sx)<10) px=sx;
  if(Math.abs(px+ow-ex)<10) px=ex-ow;
  if(Math.abs(py-sy)<10) py=sy;
  if(Math.abs(py+oh-ey)<10) py=ey-oh;
  return{x:Math.max(0,Math.min(cvCssW-1,px)),y:Math.max(0,Math.min(cvCssH-1,py))};
}

// v4.5: center-snap for scorecard
function snapPosWithCenter(px,py,ow,oh){
  const sn=snapPos(px,py,ow,oh);
  // horizontal center snap
  const centerX=(cvCssW-ow)/2;
  if(Math.abs(sn.x-centerX)<SNAP_CENTER_PX){
    sn.x=centerX;
    return{...sn, centered:true};
  }
  return{...sn, centered:false};
}

// Resolve scorecard X accounting for 'centered' flag
function getSCDrawX(scale){
  const pos=S.scorecardPos[S.ratio];
  const w=getSCWidth(scale);
  if(pos.centered){
    return (cvCssW-w)/2;
  }
  return pos.x*cvCssW;
}

function onDragStart(e){
  const pt=evPt(e);
  const rect=cvEl.getBoundingClientRect();
  const mx=(pt.x-rect.left)/rect.width*cvCssW;
  const my=(pt.y-rect.top)/rect.height*cvCssH;
  const scale=cvCssW/1920;
  if(S.showShot&&curHole().delta!==null){
    const pos=S.overlayPos[S.ratio];
    const ox=pos.x*cvCssW, oy=pos.y*cvCssH;
    if(mx>=ox&&mx<=ox+SHOT_W*scale&&my>=oy&&my<=oy+SHOT_H*scale){
      dragging='overlay'; dragStart={mx,my,ox,oy}; e.preventDefault(); return;
    }
  }
  if(S.showScore){
    const scX=getSCDrawX(scale);
    const scY=S.scorecardPos[S.ratio].y*cvCssH;
    const sw=getSCWidth(scale),sh=getSCHeight(scale);
    if(mx>=scX&&mx<=scX+sw&&my>=scY&&my<=scY+sh){
      dragging='scorecard'; dragStart={mx,my,ox:scX,oy:scY}; e.preventDefault();
    }
  }
}
function onDragMove(e){
  if(!dragging) return; e.preventDefault();
  const pt=evPt(e);
  const rect=cvEl.getBoundingClientRect();
  const mx=(pt.x-rect.left)/rect.width*cvCssW;
  const my=(pt.y-rect.top)/rect.height*cvCssH;
  const dx=mx-dragStart.mx, dy=my-dragStart.my;
  const scale=cvCssW/1920;
  if(dragging==='overlay'){
    const sn=snapPos(dragStart.ox+dx,dragStart.oy+dy,SHOT_W*scale,SHOT_H*scale);
    S.overlayPos[S.ratio]={x:sn.x/cvCssW,y:sn.y/cvCssH};
  } else {
    const sw=getSCWidth(scale),sh=getSCHeight(scale);
    const sn=snapPosWithCenter(dragStart.ox+dx,dragStart.oy+dy,sw,sh);
    S.scorecardPos[S.ratio]={
      x:(sn.x+sw/2)/cvCssW, // store center-x for reference
      y:sn.y/cvCssH,
      centered:sn.centered||false,
      // also store absolute for non-centered
      absX:sn.x/cvCssW
    };
  }
  redrawOnly(); scheduleSave();
}
function onDragEnd(){ dragging=null; }
function onTouchStart(e){ if(e.touches.length===1) onDragStart(e); }
function onTouchMove(e){ if(e.touches.length===1) onDragMove(e); }

// ── RENDER ──
function render(){
  dpr=window.devicePixelRatio||1;
  const dims=getCanvasCssDims();
  cvCssW=dims.w; cvCssH=dims.h;
  cvEl.width=Math.round(dims.w*dpr);
  cvEl.height=Math.round(dims.h*dpr);
  cvEl.style.width=dims.w+'px';
  cvEl.style.height=dims.h+'px';
  const area=document.getElementById('preview');
  cvEl.style.left=((area.clientWidth-dims.w)/2)+'px';
  cvEl.style.top=((area.clientHeight-dims.h)/2)+'px';
  redrawOnly();
  buildHoleNav();
  buildDeltaBtn();
  buildTypeButtons();
  updateRightPanel();
  updateMobUI();
}

function redrawOnly(){
  const ctx=cvEl.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,cvCssW,cvCssH);
  ctx.save();
  ctx.globalAlpha=S.overlayOpacity??1;
  drawOverlays(ctx,cvCssW,cvCssH,false);
  ctx.restore();
}

function drawOverlays(ctx,w,h,forExport){
  if(S.safeZone) drawSafeZone(ctx,w,h);
  const baseScale=w/1920;
  const is916=S.ratio==='9:16';
  if(S.showShot&&curHole().delta!==null){
    const shotScale=baseScale*(is916?1.6:1);
    const pos=S.overlayPos[S.ratio];
    drawShotOverlay(ctx,pos.x*w,pos.y*h,shotScale);
  }
  if(S.showScore){
    const scScale=baseScale*(is916?1.35:1);
    const scW=getSCWidth(scScale);
    let scX;
    const pos=S.scorecardPos[S.ratio];
    if(pos.centered){
      scX=(w-scW)/2;
    } else if(pos.absX!==undefined){
      scX=pos.absX*w;
    } else {
      scX=pos.x*w-scW/2;
    }
    drawScorecardOverlay(ctx,scX,pos.y*h,scScale);
  }
}

function drawSafeZone(ctx,w,h){
  ctx.save(); ctx.setLineDash([6,5]); ctx.lineWidth=1;
  if(S.szSize==='5'||S.szSize==='both'){const p=0.05;ctx.strokeStyle='rgba(255,220,0,.35)';ctx.strokeRect(w*p,h*p,w*(1-2*p),h*(1-2*p));}
  if(S.szSize==='10'||S.szSize==='both'){const p=0.10;ctx.strokeStyle='rgba(255,160,0,.4)';ctx.strokeRect(w*p,h*p,w*(1-2*p),h*(1-2*p));}
  ctx.restore();
}

// ── SHOT OVERLAY — v4.5 ──
function drawShotOverlay(ctx,X,Y,scale){
  const th=getTheme().shot;
  const h=curHole();
  const W=SHOT_W*scale, H=SHOT_H*scale;
  const r1=ROW1*scale, r2=ROW2*scale, r3=ROW3*scale;
  const colW=COL_W*scale, rpad=RPAD*scale;

  ctx.save();
  drawPanelFrame(ctx, X, Y, W, H, scale, th, false, th.cornerRadius);

  // BG
  ctx.fillStyle=th.leftBg;   ctx.fillRect(X,Y,colW,H);
  ctx.fillStyle=th.rightBg;  ctx.fillRect(X+colW,Y,W-colW,H);
  ctx.fillStyle=th.midBandBg; ctx.fillRect(X+colW,Y+r1,W-colW,r2);

  // ── LEFT: hole number ──
  ctx.fillStyle=th.holeNumColor;
  ctx.font=`${th.holeNumWeight} ${Math.round(th.holeNumSize*scale)}px ${SF}`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(String(S.currentHole+1),X+colW/2,Y+H*0.31);

  ctx.fillStyle=th.parLabelColor;
  ctx.font=`${th.parLabelWeight} ${Math.round(th.parLabelSize*scale)}px ${SF}`;
  ctx.fillText('PAR',X+colW/2,Y+H*0.57);

  ctx.fillStyle=th.parValColor;
  ctx.font=`${th.parValWeight} ${Math.round(th.parValSize*scale)}px ${SF}`;
  ctx.fillText(String(h.par),X+colW/2,Y+H*0.80);

  // ── ROW1: player name + total badge ──
  const rx=X+colW+rpad, rW=W-colW-2*rpad;

  // Pre-compute result mode for context-aware total (result=include current, in-play=exclude current)
  const _si=h.shotIndex, _gross=getGross(h);
  const _isLast=_gross!==null&&_si===_gross-1;
  const _isForMode=_isLast&&!!h.manualTypes[_si]&&(h.shots[_si]?.type||'').startsWith('FOR_');
  const _isResultMode=_isLast&&!_isForMode;
  const _ci=S.currentHole;
  const _totalHoles=S.holes.slice(0,_isResultMode?_ci+1:_ci).filter(x=>x.delta!==null);
  const _ctxTd=_totalHoles.reduce((a,x)=>a+x.delta,0);
  const _ctxTg=_totalHoles.reduce((a,x)=>a+x.par+x.delta,0);
  const _showTotal=S.showTotal&&_totalHoles.length>0;

  let nameMaxW=rW;
  if(_showTotal){
    const bTxt=S.displayMode==='topar'?fmtDeltaDisplay(_ctxTd):String(_ctxTg);
    ctx.font=`${th.totalBadgeWeight} ${Math.round(th.totalBadgeSize*scale)}px ${SF}`;
    const btw=ctx.measureText(bTxt).width;
    const reservedBadgeW=Math.max(80*scale,btw+24*scale);
    nameMaxW=rW-reservedBadgeW+rpad;
  }

  const nameFontSz=Math.round(th.playerNameSize*scale);
  ctx.fillStyle=th.playerNameColor;
  ctx.font=`${th.playerNameWeight} ${nameFontSz}px ${SF}`;
  ctx.textAlign='left'; ctx.textBaseline='middle';
  let name=currentPlayerDisplayName().toUpperCase();
  const origName=name;
  while(ctx.measureText(name).width>nameMaxW&&name.length>1) name=name.slice(0,-1);
  if(name!==origName) name=name.slice(0,-1)+'…';
  ctx.fillText(name,rx,Y+r1/2);

  // Total badge — context-aware: in-play=prev holes, result=include current hole
  if(_showTotal){
    const bColor=th.totalBadgeColorFn(_ctxTd);
    const bTxt=S.displayMode==='topar'?fmtDeltaDisplay(_ctxTd):String(_ctxTg);
    const badgeMinW=80*scale;
    ctx.font=`${th.totalBadgeWeight} ${Math.round(th.totalBadgeSize*scale)}px ${SF}`;
    const btw=ctx.measureText(bTxt).width;
    const bW=Math.max(badgeMinW,btw+24*scale);
    const bx=X+W-bW, by=Y, bh=r1;
    ctx.fillStyle=bColor; ctx.fillRect(bx,by,bW,bh);
    ctx.fillStyle=th.totalBadgeTextColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(bTxt,bx+bW/2,by+bh/2);
  }

  // ── ROW2: progress squares ──
  const gross=getGross(h), si=h.shotIndex;
  const sqSz=24*scale, sqGap=5*scale;
  const totalSqW=gross*(sqSz+sqGap)-sqGap;
  const sqStartX=X+W-rpad-totalSqW;
  const sqCY=Y+r1+r2/2;

  for(let i=0;i<gross;i++){
    const bx=sqStartX+i*(sqSz+sqGap), by=sqCY-sqSz/2;
    const isCur=i===si, isPast=i<si;
    if(isCur){
      rrect(ctx,bx,by,sqSz,sqSz,th.sqRadius*scale);
      ctx.fillStyle=th.sqCurBg; ctx.fill();
      ctx.fillStyle=th.sqCurTextColor;
    } else if(isPast){
      rrect(ctx,bx,by,sqSz,sqSz,th.sqRadius*scale);
      ctx.fillStyle=th.sqPastBg; ctx.fill();
      ctx.fillStyle=th.sqPastTextColor;
    } else {
      rrect(ctx,bx,by,sqSz,sqSz,th.sqRadius*scale);
      ctx.fillStyle=th.sqFutureBg; ctx.fill();
      ctx.fillStyle=th.sqFutureTextColor;
    }
    ctx.font=`${th.sqNumWeight} ${Math.round(th.sqNumSize*scale)}px ${SF}`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(i+1),bx+sqSz/2,sqCY);
  }

  // DIVIDER (gold)
  const divY=Y+r1+r2;
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle=th.dividerColor;
  ctx.lineWidth=Math.max(1,th.dividerWidth*scale);
  ctx.beginPath(); ctx.moveTo(X+colW,divY); ctx.lineTo(X+W,divY); ctx.stroke();
  ctx.restore();

  // ── ROW3: three-column ──
  const r3y=divY, r3h=r3;
  const midX=X+colW+rW/2;
  const shotFontSz=Math.round(th.shotTypeSize*scale);
  const toPinFontSz=Math.round(th.distValSize*scale);
  const resultFontSz=Math.round(th.resultBadgeSize*scale);

  const isLast=si===gross-1;
  const curType=h.shots[si]?.type||'';
  const isManualLastShot=isLast && !!h.manualTypes[si];
  const isForMode=isLast && isManualLastShot && curType.startsWith('FOR_');
  const isResultMode=isLast && !isForMode;

  // LEFT: To Pin distance
  const shotToPin=getShotToPin(h,si);
  if(!isResultMode && shotToPin!==null){
    const distVal=String(shotToPin);
    const unit=T('ydsLabel');
    ctx.fillStyle=th.distValColor;
    ctx.font=`${th.distValWeight} ${toPinFontSz}px ${SF}`;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(distVal,rx,r3y+r3h/2);
    const dw=ctx.measureText(distVal).width;
    ctx.fillStyle=th.distUnitColor;
    ctx.font=`${th.distUnitWeight} ${Math.round(th.distUnitSize*scale)}px ${SF}`;
    ctx.fillText(unit,rx+dw+3*scale,r3y+r3h/2);
  }

  // CENTER: shot type label
  let centerTxt='';
  if(isForMode || !isLast) centerTxt=shotTypeLabel(curType);
  if(centerTxt){
    ctx.font=`${th.shotTypeWeight} ${shotFontSz}px ${SF}`;
    ctx.fillStyle=th.shotTypeColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(centerTxt,midX,r3y+r3h/2);
  }

  // RIGHT: result badge
  if(isResultMode){
    const resultTxt=deltaLabel(h.delta);
    ctx.font=`${th.resultBadgeWeight} ${resultFontSz}px ${SF}`;
    const rtw=ctx.measureText(resultTxt).width;
    const rbW=Math.max(rtw+20*scale,64*scale), rbH=32*scale;
    const rbx=X+W-rpad-rbW, rby=r3y+(r3h-rbH)/2;
    rrect(ctx,rbx,rby,rbW,rbH,th.resultBadgeRadius*scale);
    ctx.fillStyle=deltaColorHex(h.delta); ctx.fill();
    ctx.fillStyle=th.resultBadgeTextColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(resultTxt,rbx+rbW/2,rby+rbH/2);
  }

  // Row1/Row2 divider
  ctx.strokeStyle=th.row12DivColor;
  ctx.lineWidth=Math.max(.5,th.row12DivWidth*scale);
  ctx.beginPath(); ctx.moveTo(X+colW,Y+r1); ctx.lineTo(X+W,Y+r1); ctx.stroke();

  ctx.restore();
}

function rrect(ctx,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

// ============================================================
// EXPORT — helpers
// ============================================================
function expGetDims(){
  const res=S.exportRes||2160;
  let w,h;
  if(S.ratio==='16:9'){w=Math.round(res*16/9);h=res;}
  else if(S.ratio==='9:16'){w=Math.round(res*9/16);h=res;}
  else{w=res;h=res;}
  return{w,h};
}
function expSanitize(s){ return (s||'').replace(/[^\w\u4e00-\u9fa5\u3040-\u30ff\uAC00-\uD7A3]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')||'_'; }
// Capitalize first letter of each underscore-separated word, lowercase the rest
function expTitleCase(s){ return s.split('_').map(w=>w?w[0].toUpperCase()+w.slice(1).toLowerCase():'').join('_'); }
function expResLabel(){ const r=S.exportRes||2160; return r>=2160?'4K':r>=1440?'1440P':'1080P'; }
function expCourse(){ return expTitleCase(expSanitize(S.courseName)||'Course'); }
function expPlayer(){ if(S.currentPlayerId){const p=(S.players||[]).find(p=>p.id===S.currentPlayerId);if(p)return expTitleCase(expSanitize(p.name));} return 'Session'; }
function expShotType(st){ return expTitleCase(st||'Shot'); }
function expShotFile(hole,shotNum,st){ return `${expCourse()}_${expPlayer()}_H${String(hole).padStart(2,'0')}_S${String(shotNum).padStart(2,'0')}_${expShotType(st)}_${expResLabel()}.png`; }
function expFinalFile(hole,res){ return `${expCourse()}_${expPlayer()}_H${String(hole).padStart(2,'0')}_ZFinal_${res}_${expResLabel()}.png`; }
function expSCFile(k,range){ return `${expCourse()}_${expPlayer()}_SC_${String(k).padStart(2,'0')}_${range}_${expResLabel()}.png`; }

function expCanvasToBlob(canvas){ return new Promise(r=>canvas.toBlob(r,'image/png')); }
function expSleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function expMakeShotCanvas(w,h){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d'); ctx.globalAlpha=S.overlayOpacity??1;
  const is916=S.ratio==='9:16';
  const scale=(w/1920)*(is916?1.6:1), pos=S.overlayPos[S.ratio];
  drawShotOverlay(ctx,pos.x*w,pos.y*h,scale);
  return c;
}
function expMakeSCCanvas(w,h){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d'); ctx.globalAlpha=S.overlayOpacity??1;
  const is916=S.ratio==='9:16';
  const scale=(w/1920)*(is916?1.35:1), scW=getSCWidth(scale), pos=S.scorecardPos[S.ratio];
  let scX; if(pos.centered)scX=(w-scW)/2; else if(pos.absX!==undefined)scX=pos.absX*w; else scX=pos.x*w-scW/2;
  drawScorecardOverlay(ctx,scX,pos.y*h,scale);
  return c;
}

function expGetForType(delta){
  if(delta<=-1) return 'FOR_BIRDIE';
  if(delta===0) return 'FOR_PAR';
  if(delta===1) return 'FOR_BOGEY';
  if(delta===2) return 'FOR_DOUBLE';
  return 'FOR_TRIPLE';
}

function expDownloadBlob(blob,fname){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=fname;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),4000);
}

function showExpStatus(ok,errMsg){
  const el=document.getElementById('exp-status');
  el.className=''; el.textContent=ok?'✓':'!';
  el.classList.add(ok?'ok':'err');
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.className='',ok?1000:2000);
}

function expShowProgress(txt,frac){
  const wrap=document.getElementById('exp-progress-wrap');
  const bar=document.getElementById('exp-progress-bar');
  const label=document.getElementById('exp-progress-txt');
  if(!wrap) return;
  wrap.style.display='block';
  if(bar) bar.style.width=Math.round((frac||0)*100)+'%';
  if(label) label.textContent=txt||'';
}
function expHideProgress(){
  const wrap=document.getElementById('exp-progress-wrap');
  if(wrap) wrap.style.display='none';
}

// ── Single: Shot Overlay only ──
function doExportShotOnly(){
  const h=curHole();
  if(h.delta===null){ miniToast('Set score first',true); return; }
  const{w,h:H}=expGetDims();
  const canvas=expMakeShotCanvas(w,H);
  const st=(h.shots[h.shotIndex]?.type||'SHOT').toUpperCase();
  const fname=expShotFile(S.currentHole+1,h.shotIndex+1,st);
  expCanvasToBlob(canvas).then(blob=>{ expDownloadBlob(blob,fname); showExpStatus(true); }).catch(()=>showExpStatus(false));
}

// ── Single: Scorecard only ──
function doExportScorecardOnly(){
  const{w,h}=expGetDims();
  const canvas=expMakeSCCanvas(w,h);
  const fname=expSCFile(S.currentHole+1,`1-${Math.max(0,S.currentHole)}`);
  expCanvasToBlob(canvas).then(blob=>{ expDownloadBlob(blob,fname); showExpStatus(true); }).catch(()=>showExpStatus(false));
}

// ── Batch: current hole shot sequence → ZIP ──
async function doExportHoleSequence(){
  const h=curHole();
  if(h.delta===null){ miniToast('Set score first',true); return; }
  const gross=getGross(h);
  if(!gross||gross<=0){ miniToast('Invalid score',true); return; }
  if(typeof JSZip==='undefined'){ miniToast('JSZip not loaded',true); return; }

  const{w,h:H}=expGetDims();
  const zip=new JSZip();
  const holeNum=S.currentHole+1;
  // save state
  const savedIdx=h.shotIndex, savedMT=JSON.parse(JSON.stringify(h.manualTypes||{})), savedShots=JSON.parse(JSON.stringify(h.shots||[]));

  try{
    // shot frames: indices 0..gross-1
    for(let i=0;i<gross;i++){
      h.shotIndex=i;
      if(i===gross-1){
        // last shot: show FOR_X mode
        const ft=expGetForType(h.delta);
        if(!h.shots[i]) h.shots[i]={type:null};
        h.shots[i].type=ft; h.manualTypes[i]=true;
      }
      expShowProgress(`Shot ${i+1}/${gross+1}`,i/(gross+1));
      const canvas=expMakeShotCanvas(w,H);
      const st=(h.shots[i]?.type||'SHOT').replace(/ /g,'_').toUpperCase();
      const fname=expShotFile(holeNum,i+1,st);
      const blob=await expCanvasToBlob(canvas);
      zip.file(fname,blob);
      await expSleep(10);
    }
    // FINAL frame
    h.shotIndex=gross-1;
    delete h.manualTypes[gross-1]; // exit FOR mode → result mode
    expShowProgress(`Final ${gross+1}/${gross+1}`,gross/(gross+1));
    const fcanvas=expMakeShotCanvas(w,H);
    const resultStr=deltaLabel(h.delta).replace(/\s+/g,'_').toUpperCase();
    const ffname=expFinalFile(holeNum,resultStr);
    const fblob=await expCanvasToBlob(fcanvas);
    zip.file(ffname,fblob);

    expShowProgress('Packaging ZIP…',0.97);
    const zblob=await zip.generateAsync({type:'blob'});
    expDownloadBlob(zblob,`${expCourse()}_${expPlayer()}_H${String(holeNum).padStart(2,'0')}_shots.zip`);
    expShowProgress('Done ✓',1);
    setTimeout(expHideProgress,2500);
  } catch(err){
    miniToast('Export error: '+err.message,true);
    expHideProgress();
  } finally{
    // restore
    h.shotIndex=savedIdx; h.manualTypes=savedMT; h.shots=savedShots;
    redrawOnly();
  }
}

// ── Batch: scorecard sequence (hole 1-18) → ZIP ──
async function doExportScorecardSequence(){
  if(typeof JSZip==='undefined'){ miniToast('JSZip not loaded',true); return; }
  const{w,h}=expGetDims();
  const zip=new JSZip();
  const savedHole=S.currentHole, savedSummary=S.scorecardSummary;
  S.scorecardSummary=null;

  try{
    for(let k=1;k<=18;k++){
      S.currentHole=k; // scorecard shows holes 0..k-1 (before hole k)
      expShowProgress(`Scorecard ${k}/18`,k/18);
      const canvas=expMakeSCCanvas(w,h);
      const rangeStr=k<=1?'0':`1-${k-1}`;
      const fname=expSCFile(k,rangeStr);
      const blob=await expCanvasToBlob(canvas);
      zip.file(fname,blob);
      await expSleep(10);
    }
    // TOT view (all 18)
    S.scorecardSummary='tot';
    expShowProgress('SC TOT…',0.97);
    const totCanvas=expMakeSCCanvas(w,h);
    const totFname=`${expCourse()}_${expPlayer()}_SC_TOT_1-18_${expModeLabel()}_${expResLabel()}.png`;
    const totBlob=await expCanvasToBlob(totCanvas);
    zip.file(totFname,totBlob);

    expShowProgress('Packaging ZIP…',0.99);
    const zblob=await zip.generateAsync({type:'blob'});
    expDownloadBlob(zblob,`${expCourse()}_${expPlayer()}_SC_sequence.zip`);
    expShowProgress('Done ✓',1);
    setTimeout(expHideProgress,2500);
  } catch(err){
    miniToast('Export error: '+err.message,true);
    expHideProgress();
  } finally{
    S.currentHole=savedHole; S.scorecardSummary=savedSummary;
    redrawOnly();
  }
}

// ============================================================
// MOBILE RECORD MODE
// ============================================================
const MOB_LIE_TYPES = [
  {type:'FW',label:'FW'},{type:'ROUGH',label:'Rough'},
  {type:'BUNKER',label:'Bunker'},{type:'TREES',label:'Trees'},
  {type:'WATER',label:'Water'},{type:'OB',label:'OB'},
  {type:'DROP',label:'Drop'},{type:'GREEN',label:'Green'},
];

function isMobile(){ return screen.width <= 480 || document.documentElement.classList.contains('narrow'); }

function mobAddStroke(){
  const h = curHole();
  if(h.delta === null){
    h.delta = 1 - h.par;
  } else {
    if(h.delta + 1 > 12) return;
    h.delta = h.delta + 1;
  }
  h.manualTypes = {};
  reconcileShots(h);
  const g = getGross(h);
  if(g && g > 0) h.shotIndex = g - 1;
  render(); scheduleSave();
}

function mobUndoStroke(){
  const h = curHole();
  if(h.delta === null) return;
  const g = getGross(h);
  if(g <= 1){
    clearHole();
  } else {
    h.delta = h.delta - 1;
    h.manualTypes = {};
    reconcileShots(h);
    const ng = getGross(h);
    if(ng && ng > 0) h.shotIndex = ng - 1;
    render(); scheduleSave();
  }
}

function mobFinishHole(){ gotoNextHole(); }

function mobCyclePar(){
  const h = curHole();
  const next = h.par === 3 ? 4 : h.par === 4 ? 5 : 3;
  setPar(next);
}

function mobAdjDist(delta){
  const inp = document.getElementById('mob-dist-inp');
  let val = parseInt(inp.value) || 0;
  val = Math.max(0, Math.min(999, val + delta));
  inp.value = val;
  setShotToPin(val);
  updateMobUI();
}

function mobToggleResult(){
  document.getElementById('mob-result-sec').classList.toggle('expanded');
}

function mobResetHole(){
  clearHole(); closeMobMore();
}

function openMobMore(){
  document.getElementById('mob-more-bg').classList.add('show');
  document.getElementById('mob-more-menu').classList.add('show');
}
function closeMobMore(){
  document.getElementById('mob-more-bg').classList.remove('show');
  document.getElementById('mob-more-menu').classList.remove('show');
}

function mobDoExport(){
  closeMobMore();
  const h = curHole();
  if(h.delta === null){ miniToast('Set score first', true); return; }
  doExportShotOnly();
}

// ── Mobile Preview ──
let mobPvCv, mobPvDragging=null, mobPvDragStart={};

function openMobPreview(){
  closeMobMore();
  const pv = document.getElementById('mob-preview');
  pv.classList.add('show');
  const bgEl = document.getElementById('mob-pv-bg');
  bgEl.src = S.userBg || DEFAULT_BG;
  bgEl.style.display = 'block';
  bgEl.style.opacity = S.bgOpacity;
  mobPvCv = document.getElementById('mob-pv-cv');
  setTimeout(mobPvRender, 50);
  mobPvCv.addEventListener('touchstart', mobPvTouchStart, {passive:false});
  window.addEventListener('touchmove', mobPvTouchMove, {passive:false});
  window.addEventListener('touchend', mobPvTouchEnd);
}

function closeMobPreview(){
  document.getElementById('mob-preview').classList.remove('show');
  if(mobPvCv){
    mobPvCv.removeEventListener('touchstart', mobPvTouchStart);
    window.removeEventListener('touchmove', mobPvTouchMove);
    window.removeEventListener('touchend', mobPvTouchEnd);
  }
}

function mobPvRender(){
  if(!mobPvCv) return;
  const area = document.getElementById('mob-pv-area');
  const aw = area.clientWidth, ah = area.clientHeight;
  let cw, ch;
  if(S.ratio==='16:9'){ch=ah;cw=ah*(16/9);if(cw>aw){cw=aw;ch=aw*(9/16);}}
  else if(S.ratio==='9:16'){cw=aw;ch=aw*(16/9);if(ch>ah){ch=ah;cw=ah*(9/16);}}
  else{const s=Math.min(aw,ah);cw=s;ch=s;}
  cw=Math.floor(cw); ch=Math.floor(ch);
  const d = window.devicePixelRatio || 1;
  mobPvCv.width = Math.round(cw * d);
  mobPvCv.height = Math.round(ch * d);
  mobPvCv.style.width = cw + 'px';
  mobPvCv.style.height = ch + 'px';
  mobPvCv.style.left = ((aw - cw) / 2) + 'px';
  mobPvCv.style.top = ((ah - ch) / 2) + 'px';
  const ctx = mobPvCv.getContext('2d');
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.globalAlpha = S.overlayOpacity ?? 1;
  const savedW = cvCssW, savedH = cvCssH;
  cvCssW = cw; cvCssH = ch;
  drawOverlays(ctx, cw, ch, false);
  cvCssW = savedW; cvCssH = savedH;
  ctx.restore();
}

function mobPvTouchStart(e){
  if(e.touches.length !== 1) return;
  const t = e.touches[0];
  const rect = mobPvCv.getBoundingClientRect();
  const cw = parseInt(mobPvCv.style.width);
  const ch = parseInt(mobPvCv.style.height);
  const mx = (t.clientX - rect.left) / rect.width * cw;
  const my = (t.clientY - rect.top) / rect.height * ch;
  const scale = cw / 1920;
  if(S.showShot && curHole().delta !== null){
    const pos = S.overlayPos[S.ratio];
    const ox = pos.x * cw, oy = pos.y * ch;
    if(mx >= ox && mx <= ox + SHOT_W*scale && my >= oy && my <= oy + SHOT_H*scale){
      mobPvDragging = 'overlay'; mobPvDragStart = {mx, my, ox, oy, cw, ch};
      e.preventDefault(); return;
    }
  }
  if(S.showScore){
    const is916 = S.ratio==='9:16';
    const scScale = scale * (is916?1.35:1);
    const scW = getSCWidth(scScale);
    const pos = S.scorecardPos[S.ratio];
    const scX = pos.centered ? (cw-scW)/2 : (pos.absX!==undefined ? pos.absX*cw : pos.x*cw-scW/2);
    const scY = pos.y * ch;
    const scH = getSCHeight(scScale);
    if(mx >= scX && mx <= scX+scW && my >= scY && my <= scY+scH){
      mobPvDragging = 'scorecard'; mobPvDragStart = {mx, my, ox:scX, oy:scY, cw, ch};
      e.preventDefault();
    }
  }
}

function mobPvTouchMove(e){
  if(!mobPvDragging) return;
  e.preventDefault();
  const t = e.touches[0];
  const rect = mobPvCv.getBoundingClientRect();
  const {cw, ch} = mobPvDragStart;
  const mx = (t.clientX - rect.left) / rect.width * cw;
  const my = (t.clientY - rect.top) / rect.height * ch;
  const dx = mx - mobPvDragStart.mx, dy = my - mobPvDragStart.my;
  const scale = cw / 1920;
  if(mobPvDragging === 'overlay'){
    const nx = Math.max(0, Math.min(cw-1, mobPvDragStart.ox + dx));
    const ny = Math.max(0, Math.min(ch-1, mobPvDragStart.oy + dy));
    S.overlayPos[S.ratio] = {x: nx/cw, y: ny/ch};
  } else {
    const is916 = S.ratio==='9:16';
    const scScale = scale * (is916?1.35:1);
    const sw = getSCWidth(scScale);
    const nx = Math.max(0, Math.min(cw-1, mobPvDragStart.ox + dx));
    const ny = Math.max(0, Math.min(ch-1, mobPvDragStart.oy + dy));
    const centerX = (cw - sw) / 2;
    const centered = Math.abs(nx - centerX) < 12;
    S.scorecardPos[S.ratio] = {x:(nx+sw/2)/cw, y:ny/ch, centered, absX:nx/cw};
  }
  mobPvRender(); scheduleSave();
}

function mobPvTouchEnd(){ mobPvDragging = null; }

// ── Mobile UI Update ──
function updateMobUI(){
  if(!isMobile()) return;
  const h = curHole();
  const idx = S.currentHole;
  const gross = getGross(h);

  // Header
  document.getElementById('mob-hole-lbl').textContent = T('holeHero', idx+1);
  document.getElementById('mob-par-lbl').textContent = 'Par ' + h.par;
  const tp = getShotToPin(h, h.shotIndex);
  document.getElementById('mob-tp-val').textContent = tp !== null ? tp : '\u2014';
  document.getElementById('mob-tp-unit').textContent = T('distUnit').charAt(0);

  // Distance input
  const distInp = document.getElementById('mob-dist-inp');
  if(document.activeElement !== distInp){
    distInp.value = tp !== null ? tp : '';
  }

  // Lie capsules
  buildMobLieCapsules();

  // Result bar
  const strokesTxt = document.getElementById('mob-strokes-txt');
  const resultTxt = document.getElementById('mob-result-txt');
  if(h.delta !== null){
    strokesTxt.textContent = 'Strokes: ' + gross;
    resultTxt.textContent = deltaLabel(h.delta);
    resultTxt.style.background = deltaColorHex(h.delta);
  } else {
    strokesTxt.textContent = 'Strokes: \u2014';
    resultTxt.textContent = '\u2014';
    resultTxt.style.background = 'var(--s2)';
  }

  // Result edit
  document.getElementById('mob-result-gross').textContent = gross !== null ? gross : '\u2014';
  buildMobResultQuick();

  // Scorecard summary
  buildMobScSummary();

  // Hole nav
  buildMobHoleNav();
}

function buildMobLieCapsules(){
  const cont = document.getElementById('mob-lie-scroll');
  if(!cont) return;
  cont.innerHTML = '';
  const h = curHole();
  const curType = h.delta !== null ? (h.shots[h.shotIndex]?.type || '') : '';
  const allTypes = [
    ...ACTION_TYPES.map(t => ({type:t.type, label:T(t.labelKey)})),
    ...MOB_LIE_TYPES,
  ];
  allTypes.forEach(({type, label}) => {
    const btn = document.createElement('button');
    btn.className = 'mob-lie-btn' + (curType === type ? ' active' : '');
    btn.textContent = label;
    btn.onclick = () => {
      if(h.delta === null) mobAddStroke();
      setShotType(type);
      updateMobUI();
    };
    cont.appendChild(btn);
  });
}

function buildMobResultQuick(){
  const cont = document.getElementById('mob-result-quick');
  if(!cont) return;
  cont.innerHTML = '';
  const h = curHole();
  const quick = [
    {d:-3,l:'Albatross'},{d:-2,l:'Eagle'},{d:-1,l:'Birdie'},
    {d:0,l:'Par'},{d:1,l:'Bogey'},{d:2,l:'+2'},{d:3,l:'+3+'}
  ];
  quick.forEach(({d,l}) => {
    const btn = document.createElement('button');
    btn.className = 'mob-quick-btn' + (h.delta === d ? ' active' : '');
    btn.textContent = l;
    if(h.delta === d) btn.style.background = deltaColorHex(d);
    btn.onclick = () => { setDelta(d); };
    cont.appendChild(btn);
  });
}

function buildMobScSummary(){
  const cont = document.getElementById('mob-sc-row');
  if(!cont) return;
  cont.innerHTML = '';
  const f9p = S.holes.slice(0,9).reduce((a,h)=>a+h.par,0);
  const f9g = S.holes.slice(0,9).reduce((a,h)=>a+h.par+(h.delta??0),0);
  const b9p = S.holes.slice(9,18).reduce((a,h)=>a+h.par,0);
  const b9g = S.holes.slice(9,18).reduce((a,h)=>a+h.par+(h.delta??0),0);
  [{lbl:'F9',par:f9p,val:f9g},{lbl:'B9',par:b9p,val:b9g},{lbl:'TOT',par:f9p+b9p,val:f9g+b9g}].forEach(({lbl,par,val}) => {
    const span = document.createElement('span');
    span.className = 'mob-sc-item';
    span.innerHTML = `<span class="sc-lbl">${lbl}</span><span class="sc-val">${val}</span><span class="sc-par">/${par}</span>`;
    cont.appendChild(span);
  });
}

function buildMobHoleNav(){
  const cont = document.getElementById('mob-nav-scroll');
  if(!cont) return;
  cont.innerHTML = '';
  for(let i=0; i<18; i++){
    const h = S.holes[i];
    const btn = document.createElement('div');
    btn.className = 'mob-hole-btn ' + deltaCardClass(h.delta);
    if(i === S.currentHole) btn.classList.add('active');
    let sc = '\u2014';
    if(h.delta !== null) sc = S.displayMode === 'topar' ? fmtDeltaDisplay(h.delta) : String(h.par + h.delta);
    btn.innerHTML = `<div class="mh-num">${i+1}</div><div class="mh-par">P${h.par}</div><div class="mh-sc">${sc}</div>`;
    btn.onclick = () => {
      S.currentHole = i;
      S.scorecardSummary = null;
      resetAllShotIndex(i);
      render(); scheduleSave();
    };
    cont.appendChild(btn);
  }
  setTimeout(() => {
    const active = cont.querySelector('.active');
    if(active) active.scrollIntoView({inline:'center', behavior:'smooth'});
  }, 50);
}

// ── Mobile Swipe Gesture ──
function initMobSwipe(){
  const body = document.getElementById('mob-body');
  if(!body) return;
  let startX = 0, startY = 0, startTime = 0;
  body.addEventListener('touchstart', e => {
    if(e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }, {passive:true});
  body.addEventListener('touchend', e => {
    if(e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;
    if(dt > 400 || Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 60) return;
    if(dx < 0) gotoNextHole();
    else gotoPrevHole();
  }, {passive:true});
}

// ── Mobile Distance Input Wiring ──
function wireMobDist(){
  const inp = document.getElementById('mob-dist-inp');
  if(!inp) return;
  inp.oninput = e => {
    const val = e.target.value === '' ? null : parseInt(e.target.value);
    setShotToPin(isNaN(val) ? null : val);
    updateMobUI();
  };
  // scrollIntoView when keyboard opens
  inp.addEventListener('focus', () => {
    setTimeout(() => {
      const sec = document.getElementById('mob-dist-sec');
      if(sec) sec.scrollIntoView({behavior:'smooth', block:'center'});
    }, 300);
  });
  // Long-press support for distance +/- buttons
  const adjMap = {
    'mob-adj-m5': -5, 'mob-adj-m1': -1,
    'mob-adj-p1': 1,  'mob-adj-p5': 5
  };
  Object.entries(adjMap).forEach(([id, delta]) => {
    const btn = document.getElementById(id);
    if(!btn) return;
    let timer = null, interval = null;
    const fire = () => mobAdjDist(delta);
    const stopRepeat = () => { clearTimeout(timer); clearInterval(interval); timer=null; interval=null; };
    btn.addEventListener('click', fire);
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      fire();
      timer = setTimeout(() => { interval = setInterval(fire, 80); }, 400);
    }, {passive:false});
    btn.addEventListener('touchend', stopRepeat);
    btn.addEventListener('touchcancel', stopRepeat);
  });
}

// ── Mobile Keyboard Handling ──
function initMobKeyboard(){
  if(!window.visualViewport) return;
  window.visualViewport.addEventListener('resize', () => {
    const vvh = window.visualViewport.height;
    const wh = window.innerHeight;
    const bar = document.getElementById('mob-bar');
    if(!bar) return;
    if(vvh < wh * 0.75){
      bar.style.display = 'none';
    } else {
      bar.style.display = '';
    }
  });
}

// ============================================================
// NARROW SCREEN HELPERS (≤480px — iPhone adaptation)
// ============================================================
const LANG_ORDER = ['en','zh','ja','ko','es'];
const LANG_SHORT = {en:'EN',zh:'中',ja:'JP',ko:'KR',es:'ES'};

function cycleNarrowLang(){
  const cur = LANG_ORDER.indexOf(LANG);
  const next = LANG_ORDER[(cur + 1) % LANG_ORDER.length];
  setLang(next);
  updateNarrowLangBtn();
}

function updateNarrowLangBtn(){
  const btn = document.getElementById('btn-lang-narrow');
  if(btn) btn.textContent = LANG_SHORT[LANG] || 'EN';
}

function toggleNarrowOpts(){
  const ptool = document.getElementById('ptool');
  if(!ptool) return;
  ptool.classList.toggle('narrow-hidden');
  const btn = document.getElementById('btn-opts-toggle');
  if(btn) btn.textContent = ptool.classList.contains('narrow-hidden') ? 'Options…' : 'Options ▴';
}

function narrowAutoScrollNav(){
  if(!isMobile()) return;
  const cont = document.getElementById('nav-rows-col');
  if(!cont) return;
  const active = cont.querySelector('.hcard.active');
  if(active) setTimeout(() => active.scrollIntoView({inline:'center', behavior:'smooth'}), 60);
}

// ============================================================
// INIT
// ============================================================
function init(){
  loadSaved();
  initCanvas();
  wireAll();

  // Sync UI
  document.querySelectorAll('.ratio-btn').forEach(b=>b.classList.toggle('active',b.dataset.ratio===S.ratio));
  document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active',b.dataset.theme===(S.theme||'classic')));
  document.querySelectorAll('.res-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.res)===S.exportRes));
  const _ip=document.getElementById('inp-player'); if(_ip) _ip.value=S.playerName||'';
  document.getElementById('inp-course').value=S.courseName||'';
  document.getElementById('chk-shot').checked=S.showShot;
  document.getElementById('chk-score').checked=S.showScore;
  const chkPN=document.getElementById('chk-show-pname'); if(chkPN) chkPN.checked=!!S.showPlayerName;
  const chkPNnav=document.getElementById('chk-pname-nav'); if(chkPNnav) chkPNnav.checked=!!S.showPlayerName;
  document.getElementById('chk-total').checked=S.showTotal;
  const _scRangeSec=document.getElementById('score-range-sec'); if(_scRangeSec){ _scRangeSec.style.display=''; _scRangeSec.classList.toggle('show',!!S.showScore); }
  document.querySelectorAll('[name=scr]').forEach(r=>r.checked=r.value===S.scoreRange);
  document.getElementById('bg-opacity').value=Math.round((S.bgOpacity??1)*100);
  document.getElementById('bg-opacity-val').textContent=Math.round((S.bgOpacity??1)*100)+'%';
  document.getElementById('overlay-opacity').value=Math.round((S.overlayOpacity??1)*100);
  document.getElementById('overlay-opacity-val').textContent=Math.round((S.overlayOpacity??1)*100)+'%';
  document.getElementById('chk-sz').checked=!!S.safeZone;
  document.getElementById('sz-size').value=S.szSize||'10';

  LANG=S.lang||'en';
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===LANG));

  applyLang();
  applyBg();
  if(typeof buildPlayerArea==='function') buildPlayerArea();
  render();

  // Mobile init
  initMobSwipe();
  wireMobDist();
  initMobKeyboard();
  updateMobUI();

  // Narrow screen init
  updateNarrowLangBtn();
  if(isMobile()){
    const ptool = document.getElementById('ptool');
    if(ptool) ptool.classList.add('narrow-hidden');
  }
}

window.addEventListener('DOMContentLoaded',init);
