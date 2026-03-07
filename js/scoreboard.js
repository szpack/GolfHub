// ============================================================
// scoreboard.js
// 计分卡逻辑：洞成绩、总杆统计、OUT/IN/TOT、当前洞状态
// ============================================================

// ── DELTA COLOR SYSTEM ──
function deltaColorHex(d){
  // Reads from active theme so colors can be customised per-theme
  const sc=(typeof getTheme==='function'?getTheme().sc.scoreColors:null)||{
    empty:'#888888',eagle:'#7c3aed',birdie:'#C0392B',par:'#1a5bb5',
    bogey:'#2e7d32',double:'#9e9e9e',triple:'#555555',over:'#111111',
  };
  if(d===null||d===undefined) return sc.empty;
  if(d<=-2) return sc.eagle;
  if(d===-1) return sc.birdie;
  if(d===0)  return sc.par;
  if(d===1)  return sc.bogey;
  if(d===2)  return sc.double;
  if(d===3)  return sc.triple;
  return sc.over;
}
function deltaCardClass(d){
  if(d===null) return 'hc-empty';
  if(d<=-2) return 'hc-purple';
  if(d===-1) return 'hc-red';
  if(d===0)  return 'hc-blue';
  if(d===1)  return 'hc-green';
  if(d===2)  return 'hc-lg';
  if(d===3)  return 'hc-g2';
  return 'hc-g3';
}
function pickerClass(d){
  if(d<=-2) return 'pi-purple';
  if(d===-1) return 'pi-red';
  if(d===0)  return 'pi-blue';
  if(d===1)  return 'pi-green';
  if(d===2)  return 'pi-lg';
  if(d===3)  return 'pi-dg';
  return 'pi-bk';
}
// v4.5: total badge color based on sumDelta (全场累计Delta)
function totalBadgeColor(){
  const td = totalDelta();
  if(td < 0)          return '#C0392B'; // red
  if(td <= 7)         return '#1a5bb5'; // blue
  if(td <= 17)        return '#2e7d32'; // green
  if(td <= 27)        return '#888888'; // gray
  return '#111111';                     // black
}

// ── HOLE / SCORE HELPERS ──
function curHole(){ return S.holes[S.currentHole]; }
function getGross(h){ return h.delta===null?null:h.par+h.delta; }
function totalDelta(){ return S.holes.reduce((a,h)=>a+(h.delta??0),0); }
function totalGross(){ return S.holes.reduce((a,h)=>a+h.par+(h.delta??0),0); }
// v4.5: Even=0, never E
function fmtDeltaDisplay(d){ return d===0?'0':d>0?'+'+d:String(d); }

function deltaLabel(d){
  if(d===null) return '—';
  const map={'-3':T('albatross'),'-2':T('eagle'),'-1':T('birdie'),'0':T('par'),'1':T('bogey'),'2':T('double'),'3':T('triple')};
  return (map[String(d)]||(d>0?'+'+d:String(d))).toUpperCase();
}

// ── SHOT TEMPLATE ENGINE ──
// Build expected shot types based on par and gross using real golf patterns.
// TEE → [LAYUP] → [APPR] → [CHIP...] → PUTT [→ PUTT]
function buildShotTemplate(par, gross){
  if(!gross || gross<1) return [];
  if(gross===1) return ['TEE'];
  const tmpl=new Array(gross).fill(null);
  tmpl[0]='TEE';
  tmpl[gross-1]='PUTT';
  // Two-putt assumption for par or worse (gross >= par)
  if(gross>=3 && gross>=par) tmpl[gross-2]='PUTT';
  // Par 5+: LAYUP (shot 2) then APPR (shot 3)
  if(par>=5 && gross>=4){
    if(tmpl[1]===null) tmpl[1]='LAYUP';
    if(tmpl[2]===null) tmpl[2]='APPR';
  }
  // Par 4+: APPR after TEE
  else if(par>=4 && gross>=3){
    if(tmpl[1]===null) tmpl[1]='APPR';
  }
  // Fill remaining gaps with CHIP
  for(let i=0;i<gross;i++) if(tmpl[i]===null) tmpl[i]='CHIP';
  return tmpl;
}

function inferShot(par, delta, gross, shotNo, allShots){
  const out={autoShotType:null, autoResult:null};
  if(!gross || gross<1 || shotNo<1 || shotNo>gross) return out;
  // Template-based shot type
  const tmpl=buildShotTemplate(par, gross);
  out.autoShotType=tmpl[shotNo-1]||'CHIP';
  // Result tag on penultimate shot
  if(shotNo===gross-1 && gross>=2){
    if(delta===-1)      out.autoResult='FOR_BIRDIE';
    else if(delta===0)  out.autoResult='FOR_PAR';
    else if(delta===1)  out.autoResult='FOR_BOGEY';
    else if(delta===2)  out.autoResult='FOR_DOUBLE';
    else if(delta===3)  out.autoResult='FOR_TRIPLE';
  }
  return out;
}

// Hole-level putt count for 3PUTT summary (not per-shot override)
function getHolePuttCount(h){
  const gross=getGross(h);
  if(!gross || gross<1) return 0;
  const tmpl=buildShotTemplate(h.par, gross);
  let count=0;
  for(let i=gross-1;i>=0;i--){
    const s=h.shots[i]||{};
    const effType=s.manualShotType||tmpl[i]||'CHIP';
    if(effType==='PUTT') count++; else break;
  }
  return count;
}

// Get effective values for a shot (manual overrides auto)
function getEffectiveShot(h, idx){
  const s=h.shots[idx]||{};
  const shotType=s.manualShotType||null;
  const result=s.manualResult||null;
  const customStatus=s.manualCustomStatus||null;
  let displayPrimary='type';
  if(s.manualCustomStatus) displayPrimary='flag';
  else if(s.manualResult) displayPrimary='result';
  else if(s.manualShotType) displayPrimary='type';
  return {
    shotType, result, customStatus,
    autoShotType: null,
    autoResult:   null,
    isManualType:   !!s.manualShotType,
    isManualResult: !!s.manualResult,
    isManualStatus: !!s.manualCustomStatus,
    displayPrimary,
  };
}

// Display label: flags > result > shotType
function shotDisplayLabel(h, idx){
  const eff=getEffectiveShot(h, idx);
  if(eff.customStatus) return shotTypeLabel(eff.customStatus);
  if(eff.result) return shotTypeLabel(eff.result);
  if(eff.shotType) return shotTypeLabel(eff.shotType);
  return '';
}

// ── SCORECARD GEOMETRY ──
function getSCRange(){
  // summary view (triggered by clicking F/B/T stat cards)
  if(S.scorecardSummary==='out') return [0,9];
  if(S.scorecardSummary==='in')  return [9,18];
  if(S.scorecardSummary==='tot') return [0,18];
  // hole view — use scoreRange setting from radio buttons
  if(S.scoreRange==='front9') return [0,9];
  if(S.scoreRange==='back9')  return [9,18];
  return [0,18];
}
function getSCWidth(scale){
  // v5.3: add OUT+IN sub-total columns for 18H mode
  const[s,e]=getSCRange(); const count=e-s;
  const colW=54, labelW=Math.round(colW*1.3)+10, totalW=Math.round(colW*1.5);
  const is18=(e-s)===18;
  const subW=is18?totalW*2:0; // OUT + IN each same width as TOT
  return(labelW+count*colW+subW+totalW)*scale;
}
function getSCHeight(scale){
  // v5.2.1: scoreRowH +12%
  const hdrH=43, parRowH=48, scoreRowH=93, rowGap=7;
  const nameRowH=40;
  return(nameRowH+hdrH+parRowH+scoreRowH+rowGap*2)*scale;
}

// ── SCORECARD OVERLAY DRAW — v4.5 ──
function drawScorecardOverlay(ctx,X,Y,scale){
  const th=getTheme().sc;
  const[start,end]=getSCRange(), count=end-start;
  if(count<=0) return;
  // In hole view: fill scores for holes 1..currentHole (inclusive)
  const scoreEnd = S.scorecardSummary===null ? S.currentHole+1 : end;
  const is18=count===18;
  // v5.3: columns — for 18H: label | 1-9 | OUT | 10-18 | IN | TOT
  const COL=54, LAB=Math.round(COL*1.3)+10, TOT=Math.round(COL*1.5);
  const colW=COL*scale, labelW=LAB*scale, totalW=TOT*scale;
  const subW=totalW; // OUT and IN same width as TOT
  const nameRowH=40*scale;
  const hdrH=43*scale, parRowH=48*scale, scoreRowH=93*scale, rowGap=7*scale;
  const W=labelW+(count*COL+(is18?TOT*2:0))*scale+totalW;
  const H=nameRowH+hdrH+parRowH+scoreRowH+rowGap*2;

  const BASE=Math.round(19*scale);
  const lblFontSz=BASE;
  const parValFontSz=Math.round(BASE*1.2);
  const scoreBadgeFontSz=Math.round(BASE*1.1);
  const totFontSz=Math.round(BASE*1.55);
  const subFontSz=Math.round(BASE*1.3);

  function holeX(i){
    if(!is18) return labelW+i*colW;
    if(i<9) return labelW+i*colW;
    return labelW+9*colW+subW+(i-9)*colW;
  }
  const outX=is18?labelW+9*colW:null;
  const inX=is18?labelW+9*colW+subW+9*colW:null;
  const totX=W-totalW;

  ctx.save();
  drawPanelFrame(ctx, X, Y, W, H, scale, th, true, th.cardRadius);

  function vline(lx,y0,y1){
    ctx.save();
    ctx.strokeStyle=th.vlineColor; ctx.lineWidth=th.vlineWidth;
    ctx.beginPath(); ctx.moveTo(X+lx,Y+y0); ctx.lineTo(X+lx,Y+y1); ctx.stroke();
    ctx.restore();
  }
  function subVline(lx,y0,y1){
    ctx.save();
    ctx.strokeStyle=th.subVlineColor; ctx.lineWidth=th.subVlineWidth;
    ctx.beginPath(); ctx.moveTo(X+lx,Y+y0); ctx.lineTo(X+lx,Y+y1); ctx.stroke();
    ctx.restore();
  }

  // ── Name row: player badge (optional) + course name (always) ──
  const _padX=8*scale;
  if(S.showPlayerName){
    const pn=(typeof currentPlayerDisplayName==='function'?currentPlayerDisplayName():(S.playerName||'PLAYER')).toUpperCase();
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.font=`${th.nameBadgeWeight} ${Math.round(th.nameBadgeSize*scale)}px ${SF}`;
    let dn=pn;
    while(ctx.measureText(dn).width>W*0.6&&dn.length>1) dn=dn.slice(0,-1);
    if(dn!==pn) dn=dn.slice(0,-1)+'…';
    const nameX=X+_padX*1.5;
    const nameW=ctx.measureText(dn).width;
    const badgeH=nameRowH*0.78;
    rrect(ctx,nameX-_padX,Y+(nameRowH-badgeH)/2,nameW+_padX*2,badgeH,th.nameBadgeRadius*scale);
    ctx.fillStyle=th.nameBadgeBg; ctx.fill();
    ctx.fillStyle=th.nameBadgeTextColor;
    ctx.fillText(dn,nameX,Y+nameRowH/2);
  }
  // ── HOLE header row ──
  const hdrY=Y+nameRowH;
  ctx.fillStyle=th.hdrBg; ctx.fillRect(X,hdrY,W,hdrH);
  ctx.textAlign='center'; ctx.textBaseline='middle';

  ctx.fillStyle=th.holeLabelColor;
  ctx.font=`${th.holeLabelWeight} ${lblFontSz}px ${SF}`;
  ctx.fillText('HOLE',X+labelW/2,hdrY+hdrH/2);

  for(let i=0;i<count;i++){
    const hi=start+i, lx=holeX(i);
    ctx.fillStyle=th.holeNumColor;
    ctx.font=`${th.holeNumWeight} ${lblFontSz}px ${SF}`;
    ctx.fillText(String(hi+1),X+lx+colW/2,hdrY+hdrH/2);
  }

  if(is18){
    ctx.fillStyle=th.outInDimBg;
    ctx.fillRect(X+outX,hdrY,subW,hdrH);
    ctx.fillRect(X+inX,hdrY,subW,hdrH);
    ctx.fillStyle=th.outInTextColor;
    ctx.font=`${th.outInWeight} ${Math.round(subFontSz*0.75)}px ${SF}`;
    ctx.fillText('OUT',X+outX+subW/2,hdrY+hdrH/2);
    ctx.fillText('IN', X+inX +subW/2,hdrY+hdrH/2);
  }

  ctx.fillStyle=th.totHdrTextColor;
  ctx.font=`${th.totHdrWeight} ${Math.round(totFontSz*0.7)}px ${SF}`;
  ctx.fillText('TOT',X+totX+totalW/2,hdrY+hdrH/2);

  // ── PAR row ──
  const parY=hdrY+hdrH+rowGap;
  ctx.fillStyle=th.parRowBg; ctx.fillRect(X,parY,W,parRowH);
  const rowsTop=nameRowH+hdrH+rowGap;
  for(let i=0;i<=count;i++) vline(holeX(i<count?i:count-1)+(i<count?0:colW),rowsTop,rowsTop+parRowH);
  if(is18){ subVline(outX,rowsTop,H); subVline(inX,rowsTop,H); }
  vline(totX,rowsTop,H);

  ctx.fillStyle=th.parLabelColor;
  ctx.font=`${th.parLabelWeight} ${lblFontSz}px ${SF}`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('PAR',X+labelW/2,parY+parRowH/2);

  let parOut=0,parIn=0;
  for(let i=0;i<count;i++){
    const h=S.holes[start+i], lx=holeX(i);
    if(is18){ if(i<9) parOut+=h.par; else parIn+=h.par; }
    ctx.fillStyle=th.parValColor;
    ctx.font=`${th.parValWeight} ${parValFontSz}px ${SF}`;
    ctx.fillText(String(h.par),X+lx+colW/2,parY+parRowH/2);
  }
  if(is18){
    ctx.fillStyle=th.parSubColor;
    ctx.font=`${th.parSubWeight} ${subFontSz}px ${SF}`;
    ctx.fillText(String(parOut),X+outX+subW/2,parY+parRowH/2);
    ctx.fillText(String(parIn), X+inX +subW/2,parY+parRowH/2);
  }
  const parTot=(is18?parOut+parIn:S.holes.slice(start,end).reduce((a,h)=>a+h.par,0));
  ctx.fillStyle=th.parTotColor;
  ctx.font=`${th.parTotWeight} ${totFontSz}px ${SF}`;
  ctx.fillText(String(parTot),X+totX+totalW/2,parY+parRowH/2);

  // ── SCORE row ──
  const scY=parY+parRowH+rowGap;
  ctx.fillStyle=th.scoreRowBg; ctx.fillRect(X,scY,W,scoreRowH);
  for(let i=0;i<=count;i++) vline(holeX(i<count?i:count-1)+(i<count?0:colW),nameRowH+hdrH+rowGap+parRowH+rowGap,H);
  ctx.strokeStyle=th.scoreRowDivColor; ctx.lineWidth=0.6;
  ctx.beginPath(); ctx.moveTo(X,scY); ctx.lineTo(X+W,scY); ctx.stroke();

  ctx.fillStyle=th.scoreLabelColor;
  ctx.font=`${th.scoreLabelWeight} ${lblFontSz}px ${SF}`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('SCORE',X+labelW/2,scY+scoreRowH/2);

  if(is18){
    ctx.fillStyle=th.scoreSubBg;
    ctx.fillRect(X+outX,scY,subW,scoreRowH);
    ctx.fillRect(X+inX, scY,subW,scoreRowH);
  }

  const bH=Math.round(scoreRowH*0.56), bW=Math.round(colW*0.80);
  let scoreOut=0,scoreIn=0;

  for(let i=0;i<count;i++){
    const h=S.holes[start+i], lx=holeX(i), cellCx=X+lx+colW/2;
    const delta=(start+i)<scoreEnd ? h.delta : null;
    if(is18){
      if(i<9) scoreOut+=(delta??0);
      else    scoreIn +=(delta??0);
    }
    if(delta===null){
      ctx.fillStyle=th.emptyDashColor;
      ctx.font=`${th.emptyDashWeight} ${Math.round(BASE*0.9)}px ${SF}`;
      ctx.fillText('—',cellCx,scY+scoreRowH/2);
    } else {
      rrect(ctx,cellCx-bW/2,scY+scoreRowH/2-bH/2,bW,bH,th.scoreBadgeRadius*scale);
      ctx.fillStyle=deltaColorHex(delta); ctx.fill();
      ctx.fillStyle=th.scoreBadgeTextColor;
      ctx.font=`${th.scoreBadgeWeight} ${scoreBadgeFontSz}px ${SF}`;
      const txt=S.displayMode==='topar'?fmtDeltaDisplay(delta):String(h.par+delta);
      ctx.fillText(txt,cellCx,scY+scoreRowH/2);
    }
  }

  if(is18){
    const subBH=Math.round(scoreRowH*0.52), subBW=Math.round(subW*0.72);
    function drawSubTot(lx,delta,parSub){
      const scx=X+lx+subW/2;
      const txt=S.displayMode==='topar'?fmtDeltaDisplay(delta):String(parSub+delta);
      rrect(ctx,scx-subBW/2,scY+scoreRowH/2-subBH/2,subBW,subBH,th.scoreBadgeRadius*scale);
      ctx.fillStyle=th.subTotBg; ctx.fill();
      ctx.fillStyle=th.subTotTextColor;
      ctx.font=`${th.subTotWeight} ${Math.round(subFontSz*0.95)}px ${SF}`;
      ctx.fillText(txt,scx,scY+scoreRowH/2);
    }
    ctx.textAlign='center'; ctx.textBaseline='middle';
    drawSubTot(outX,scoreOut,parOut);
    drawSubTot(inX, scoreIn, parIn);
  }

  // TOT: always Gross
  const tg=S.holes.slice(start,end).reduce((a,h)=>a+h.par+(h.delta??0),0);
  ctx.fillStyle=th.totTextColor;
  ctx.font=`${th.totWeight} ${totFontSz}px ${SF}`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(String(tg),X+totX+totalW/2,scY+scoreRowH/2);

  // Outer border
  ctx.strokeStyle='rgba(27,94,59,0.25)'; ctx.lineWidth=1;
  rrect(ctx,X,Y,W,H,8*scale); ctx.stroke();

  ctx.restore();
}
