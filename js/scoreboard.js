// ============================================================
// scoreboard.js
// 计分卡逻辑：洞成绩、总杆统计、OUT/IN/TOT、当前洞状态
// ============================================================

// ── DELTA COLOR SYSTEM ──
function deltaColorHex(d){
  if(d===null||d===undefined) return '#888';
  if(d<=-2) return '#7c3aed';
  if(d===-1) return '#C0392B';
  if(d===0)  return '#1a5bb5';
  if(d===1)  return '#2e7d32';
  if(d===2)  return '#9e9e9e';
  if(d===3)  return '#555555';
  return '#111111';
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
  const colW=54, labelW=Math.round(colW*1.3), totalW=Math.round(colW*1.5);
  const is18=(e-s)===18;
  const subW=is18?totalW*2:0; // OUT + IN each same width as TOT
  return(labelW+count*colW+subW+totalW)*scale;
}
function getSCHeight(scale){
  // v5.2.1: scoreRowH +12%
  const hdrH=43, parRowH=48, scoreRowH=93, rowGap=7;
  return(hdrH+parRowH+scoreRowH+rowGap*2)*scale;
}

// ── SCORECARD OVERLAY DRAW — v4.5 ──
function drawScorecardOverlay(ctx,X,Y,scale){
  const[start,end]=getSCRange(), count=end-start;
  if(count<=0) return;
  // In hole view: only fill scores for holes before currentHole; hide on hole 1
  const scoreEnd = S.scorecardSummary===null ? S.currentHole : end;
  if(S.scorecardSummary===null && scoreEnd===0) return;
  const is18=count===18;
  // v5.3: columns — for 18H: label | 1-9 | OUT | 10-18 | IN | TOT
  const COL=54, LAB=Math.round(COL*1.3), TOT=Math.round(COL*1.5);
  const colW=COL*scale, labelW=LAB*scale, totalW=TOT*scale;
  const subW=totalW; // OUT and IN same width as TOT
  const hdrH=43*scale, parRowH=48*scale, scoreRowH=93*scale, rowGap=7*scale;
  const W=labelW+(count*COL+(is18?TOT*2:0))*scale+totalW;
  const H=hdrH+parRowH+scoreRowH+rowGap*2;

  const BASE=Math.round(19*scale);
  const lblFontSz=BASE;
  const parValFontSz=Math.round(BASE*1.2);
  const scoreBadgeFontSz=Math.round(BASE*1.1);
  const totFontSz=Math.round(BASE*1.55);
  const subFontSz=Math.round(BASE*1.3); // OUT/IN slightly smaller than TOT

  // Helper: x-center of a column given its left edge + width
  const cx=(lx,w)=>lx+w/2;

  // Build column x-positions for hole cells
  // For 18H: cols 0-8 then OUT then cols 9-17 then IN then TOT
  function holeX(i){ // i = 0..count-1
    if(!is18) return labelW+i*colW;
    if(i<9) return labelW+i*colW;
    return labelW+9*colW+subW+(i-9)*colW; // after OUT col
  }
  const outX=is18?labelW+9*colW:null; // left edge of OUT col
  const inX=is18?labelW+9*colW+subW+9*colW:null; // left edge of IN col
  const totX=W-totalW; // left edge of TOT col

  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.35)'; ctx.shadowBlur=10*scale; ctx.shadowOffsetY=3*scale;
  rrect(ctx,X,Y,W,H,8*scale);
  ctx.fillStyle='#F2F2F2'; ctx.fill();
  ctx.shadowColor='transparent';
  rrect(ctx,X,Y,W,H,8*scale); ctx.clip();

  // ── Helper to draw subtle separator line ──
  function vline(lx,y0,y1){
    ctx.save();
    ctx.strokeStyle='rgba(180,190,180,0.4)'; ctx.lineWidth=0.6;
    ctx.beginPath(); ctx.moveTo(X+lx,Y+y0); ctx.lineTo(X+lx,Y+y1); ctx.stroke();
    ctx.restore();
  }
  function subVline(lx,y0,y1){
    ctx.save();
    ctx.strokeStyle='rgba(27,94,59,0.25)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(X+lx,Y+y0); ctx.lineTo(X+lx,Y+y1); ctx.stroke();
    ctx.restore();
  }

  // ── HOLE header row ──
  ctx.fillStyle='#1B5E3B'; ctx.fillRect(X,Y,W,hdrH);
  ctx.textAlign='center'; ctx.textBaseline='middle';

  // HOLE label
  // HOLE label or player name
  if(S.showPlayerName){
    const pn=(typeof currentPlayerDisplayName==='function'?currentPlayerDisplayName():(S.playerName||'PLAYER')).toUpperCase();
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.font=`700 ${Math.round(lblFontSz*0.75)}px ${SF}`;
    let dn=pn;
    while(ctx.measureText(dn).width>labelW*0.88&&dn.length>1) dn=dn.slice(0,-1);
    if(dn!==pn) dn=dn.slice(0,-1)+'…';
    ctx.fillText(dn,X+labelW/2,Y+hdrH/2);
  } else {
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.font=`600 ${lblFontSz}px ${SF}`;
    ctx.fillText('HOLE',X+labelW/2,Y+hdrH/2);
  }

  // Hole numbers
  for(let i=0;i<count;i++){
    const hi=start+i, lx=holeX(i);
    ctx.fillStyle='rgba(255,255,255,.85)';
    ctx.font=`600 ${lblFontSz}px ${SF}`;
    ctx.fillText(String(hi+1),X+lx+colW/2,Y+hdrH/2);
  }

  // OUT / IN headers (18H only) — slightly darker bg strip
  if(is18){
    ctx.fillStyle='rgba(0,0,0,0.18)';
    ctx.fillRect(X+outX,Y,subW,hdrH);
    ctx.fillRect(X+inX,Y,subW,hdrH);
    ctx.fillStyle='rgba(255,255,255,.95)';
    ctx.font=`700 ${Math.round(subFontSz*0.75)}px ${SF}`;
    ctx.fillText('OUT',X+outX+subW/2,Y+hdrH/2);
    ctx.fillText('IN', X+inX +subW/2,Y+hdrH/2);
  }

  // TOT header
  ctx.fillStyle='rgba(255,255,255,.95)';
  ctx.font=`700 ${Math.round(totFontSz*0.7)}px ${SF}`;
  ctx.fillText('TOT',X+totX+totalW/2,Y+hdrH/2);

  // ── PAR row ──
  const parY=Y+hdrH+rowGap;
  ctx.fillStyle='#EAF0EA'; ctx.fillRect(X,parY,W,parRowH);
  for(let i=0;i<=count;i++) vline(holeX(i<count?i:count-1)+(i<count?0:colW),hdrH+rowGap,hdrH+rowGap+parRowH);
  if(is18){ subVline(outX,hdrH+rowGap,H); subVline(inX,hdrH+rowGap,H); }
  vline(totX,hdrH+rowGap,H);

  ctx.fillStyle='rgba(0,0,0,0.45)';
  ctx.font=`500 ${lblFontSz}px ${SF}`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('PAR',X+labelW/2,parY+parRowH/2);

  let parOut=0,parIn=0;
  for(let i=0;i<count;i++){
    const h=S.holes[start+i], lx=holeX(i);
    if(is18){ if(i<9) parOut+=h.par; else parIn+=h.par; }
    ctx.fillStyle='#2a5e2a';
    ctx.font=`500 ${parValFontSz}px ${SF}`;
    ctx.fillText(String(h.par),X+lx+colW/2,parY+parRowH/2);
  }
  if(is18){
    ctx.fillStyle='#1B5E3B';
    ctx.font=`700 ${subFontSz}px ${SF}`;
    ctx.fillText(String(parOut),X+outX+subW/2,parY+parRowH/2);
    ctx.fillText(String(parIn), X+inX +subW/2,parY+parRowH/2);
  }
  const parTot=(is18?parOut+parIn:S.holes.slice(start,end).reduce((a,h)=>a+h.par,0));
  ctx.fillStyle='#1B5E3B';
  ctx.font=`700 ${totFontSz}px ${SF}`;
  ctx.fillText(String(parTot),X+totX+totalW/2,parY+parRowH/2);

  // ── SCORE row ──
  const scY=parY+parRowH+rowGap;
  ctx.fillStyle='#FFFFFF'; ctx.fillRect(X,scY,W,scoreRowH);
  for(let i=0;i<=count;i++) vline(holeX(i<count?i:count-1)+(i<count?0:colW),hdrH+rowGap+parRowH+rowGap,H);
  ctx.strokeStyle='rgba(180,190,180,0.5)'; ctx.lineWidth=0.6;
  ctx.beginPath(); ctx.moveTo(X,scY); ctx.lineTo(X+W,scY); ctx.stroke();

  ctx.fillStyle='rgba(0,0,0,0.45)';
  ctx.font=`700 ${lblFontSz}px ${SF}`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('SCORE',X+labelW/2,scY+scoreRowH/2);

  // OUT/IN score backgrounds
  if(is18){
    ctx.fillStyle='rgba(27,94,59,0.06)';
    ctx.fillRect(X+outX,scY,subW,scoreRowH);
    ctx.fillRect(X+inX, scY,subW,scoreRowH);
  }

  const bH=Math.round(scoreRowH*0.56), bW=Math.round(colW*0.80);
  let scoreOut=0,scoreIn=0,filledOut=0,filledIn=0;

  for(let i=0;i<count;i++){
    const h=S.holes[start+i], lx=holeX(i), cellCx=X+lx+colW/2;
    const delta=(start+i)<scoreEnd ? h.delta : null; // only filled for holes before currentHole
    if(is18){
      if(i<9){ scoreOut+=(delta??0); if(delta!==null)filledOut++; }
      else   { scoreIn +=(delta??0); if(delta!==null)filledIn++; }
    }
    if(delta===null){
      ctx.fillStyle='rgba(0,0,0,0.18)';
      ctx.font=`400 ${Math.round(BASE*0.9)}px ${SF}`;
      ctx.fillText('—',cellCx,scY+scoreRowH/2);
    } else {
      rrect(ctx,cellCx-bW/2,scY+scoreRowH/2-bH/2,bW,bH,4*scale);
      ctx.fillStyle=deltaColorHex(delta); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.font=`800 ${scoreBadgeFontSz}px ${SF}`;
      const txt=S.displayMode==='topar'?fmtDeltaDisplay(delta):String(h.par+delta);
      ctx.fillText(txt,cellCx,scY+scoreRowH/2);
    }
  }

  // OUT / IN sub-totals
  if(is18){
    const subBH=Math.round(scoreRowH*0.52), subBW=Math.round(subW*0.72);
    function drawSubTot(lx,delta,parSub){
      const scx=X+lx+subW/2;
      const txt=S.displayMode==='topar'?fmtDeltaDisplay(delta):String(parSub+delta);
      rrect(ctx,scx-subBW/2,scY+scoreRowH/2-subBH/2,subBW,subBH,4*scale);
      ctx.fillStyle='#fff'; ctx.fill();
      ctx.fillStyle='#111';
      ctx.font=`800 ${Math.round(subFontSz*0.95)}px ${SF}`;
      ctx.fillText(txt,scx,scY+scoreRowH/2);
    }
    ctx.textAlign='center'; ctx.textBaseline='middle';
    drawSubTot(outX,scoreOut,parOut);
    drawSubTot(inX, scoreIn, parIn);
  }

  // TOT: always Gross, always includes ALL holes in range (unplayed = par via delta??0)
  const tg=S.holes.slice(start,end).reduce((a,h)=>a+h.par+(h.delta??0),0);
  ctx.fillStyle='#111';
  ctx.font=`700 ${totFontSz}px ${SF}`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(String(tg),X+totX+totalW/2,scY+scoreRowH/2);

  // Outer border
  ctx.strokeStyle='rgba(27,94,59,0.25)'; ctx.lineWidth=1;
  rrect(ctx,X,Y,W,H,8*scale); ctx.stroke();

  ctx.restore();
}
