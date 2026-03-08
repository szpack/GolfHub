// ============================================================
// roundManager.js — V3.1
// Round 状态管理：创建、洞切换、查询
// ============================================================
// 术语说明：
//   routing         — 运行时生成的路线对象（来自 CourseDatabase.buildRoutingFrom*）
//   routing.holeRefs — 洞 ID 序列（球场定义的顺序）
//   playSequence    — 本轮实际打球顺序（初始 = holeRefs 浅拷贝，未来可支持跳洞/补洞）
//   currentHoleRef  — 当前正在打的洞 ID
//   holeStates      — 每洞状态：pending / in_progress / completed / skipped
// ============================================================

const RoundManager = (function(){

  let _round = null;        // Current active round (null = manual mode)
  let _orderedHoles = null;  // Cached ordered hole data array

  /**
   * Create a new round from a club + runtime routing object.
   * routing must have: { id, name, holeCount, holeRefs, sourceType, meta }
   */
  function createRoundFromRouting(clubId, routing, selectedTee){
    const club = CourseDatabase.getClub(clubId);
    const holeRefs = routing.holeRefs.slice();
    const holeStates = {};
    holeRefs.forEach((ref, i)=>{
      holeStates[ref] = i === 0 ? 'in_progress' : 'pending';
    });

    _round = {
      roundId:            _genId(),
      clubId:             clubId,
      clubName:           club.name,
      routingId:          routing.id,
      routingName:        routing.name,
      routingSourceType:  routing.sourceType,
      routingMeta:        routing.meta || {},
      startHoleRef:       holeRefs[0],
      playSequence:       holeRefs,
      currentHoleRef:     holeRefs[0],
      holeStates:         holeStates,
      // Store the full routing for restore (so we don't need to re-derive it)
      _routing:           routing
    };

    _orderedHoles = CourseDatabase.getOrderedHolesFromRouting(routing, selectedTee);
    return _round;
  }

  /**
   * Restore a round from saved state (e.g. localStorage).
   * Rebuilds ordered holes from the saved routing or re-derives it.
   */
  function restoreRound(savedRound, selectedTee){
    if(!savedRound || !savedRound.clubId || !savedRound.routingId){
      _round = null;
      _orderedHoles = null;
      return null;
    }
    try {
      // Re-derive the routing object from saved metadata
      let routing = savedRound._routing;
      if(!routing || !Array.isArray(routing.holeRefs)){
        routing = _rebuildRouting(savedRound);
      }
      if(!routing){
        throw new Error('Cannot rebuild routing for: ' + savedRound.routingId);
      }
      _round = savedRound;
      _round._routing = routing;
      _orderedHoles = CourseDatabase.getOrderedHolesFromRouting(routing, selectedTee);
      return _round;
    } catch(e){
      console.warn('[RoundManager] restoreRound failed:', e.message);
      _round = null;
      _orderedHoles = null;
      return null;
    }
  }

  /** Rebuild routing from saved round metadata */
  function _rebuildRouting(saved){
    const clubId = saved.clubId;
    const meta = saved.routingMeta || {};
    const srcType = saved.routingSourceType;

    if(srcType === 'fixed_course' && meta.courseId){
      return CourseDatabase.buildRoutingFromCourse(clubId, meta.courseId);
    }
    if(srcType === 'composed_segments' && meta.frontSegmentId && meta.backSegmentId){
      return CourseDatabase.buildRoutingFromSegments(clubId, meta.frontSegmentId, meta.backSegmentId);
    }

    // Legacy fallback: if playSequence exists, use it directly
    if(Array.isArray(saved.playSequence) && saved.playSequence.length > 0){
      return {
        id: saved.routingId,
        name: saved.routingName || 'Restored',
        holeCount: saved.playSequence.length,
        holeRefs: saved.playSequence,
        sourceType: 'restored',
        meta: {}
      };
    }
    return null;
  }

  // ── Legacy compat: old createRound(clubId, routingId) ──
  function createRound(clubId, routingId){
    console.warn('[RoundManager] createRound(clubId, routingId) is deprecated. Use createRoundFromRouting().');
    // Attempt to figure out what the old code meant
    // If routingId looks like "clubId__courseId" → fixed_18
    // If routingId looks like "clubId__segA__segB" → composable_9
    const parts = routingId.split('__');
    let routing;
    if(parts.length === 3){
      routing = CourseDatabase.buildRoutingFromSegments(clubId, parts[1], parts[2]);
    } else if(parts.length === 2){
      routing = CourseDatabase.buildRoutingFromCourse(clubId, parts[1]);
    } else {
      throw new Error('Cannot parse legacy routingId: ' + routingId);
    }
    return createRoundFromRouting(clubId, routing);
  }

  /** Get current round (or null) */
  function getRound(){ return _round; }

  /** Get ordered holes for current round */
  function getOrderedHoles(){
    return _orderedHoles ? _orderedHoles.slice() : null;
  }

  /** Get current hole data */
  function getCurrentHole(){
    if(!_round || !_orderedHoles) return null;
    const idx = _round.playSequence.indexOf(_round.currentHoleRef);
    return idx >= 0 ? _orderedHoles[idx] : null;
  }

  /** Get current hole index (0-based) */
  function getCurrentIndex(){
    if(!_round) return 0;
    const idx = _round.playSequence.indexOf(_round.currentHoleRef);
    return idx >= 0 ? idx : 0;
  }

  /** Set current hole by holeId */
  function setCurrentHole(holeId){
    if(!_round) return;
    const idx = _round.playSequence.indexOf(holeId);
    if(idx < 0){ console.warn('[RoundManager] holeId not in playSequence:', holeId); return; }
    _round.currentHoleRef = holeId;
    if(_round.holeStates[holeId] === 'pending'){
      _round.holeStates[holeId] = 'in_progress';
    }
  }

  /** Next hole. Returns new index or -1. */
  function nextHole(){
    if(!_round) return -1;
    const idx = _round.playSequence.indexOf(_round.currentHoleRef);
    if(idx < 0 || idx >= _round.playSequence.length - 1) return -1;
    const ref = _round.playSequence[idx + 1];
    _round.currentHoleRef = ref;
    if(_round.holeStates[ref] === 'pending') _round.holeStates[ref] = 'in_progress';
    return idx + 1;
  }

  /** Previous hole. Returns new index or -1. */
  function prevHole(){
    if(!_round) return -1;
    const idx = _round.playSequence.indexOf(_round.currentHoleRef);
    if(idx <= 0) return -1;
    _round.currentHoleRef = _round.playSequence[idx - 1];
    return idx - 1;
  }

  function holeCount(){
    return _round ? _round.playSequence.length : 18;
  }

  function clearRound(){
    _round = null;
    _orderedHoles = null;
  }

  function hasScoreData(sHoles){
    return (sHoles||[]).some(h => h.delta !== null);
  }

  function _genId(){
    return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
  }

  return {
    createRoundFromRouting, createRound, // createRound = legacy compat
    restoreRound, clearRound,
    getRound, getOrderedHoles, getCurrentHole, getCurrentIndex,
    setCurrentHole, nextHole, prevHole, holeCount,
    hasScoreData
  };
})();
