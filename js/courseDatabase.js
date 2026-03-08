// ============================================================
// courseDatabase.js — V3.1
// 球场数据管理层：加载、查询、验证、运行时 routing 生成
// 支持两种球会模式：
//   fixed_18     — 固定18洞球场，用户选 course
//   composable_9 — 可组合9洞单元，用户选前9+后9 segment
// ============================================================

const CourseDatabase = (function(){
  let _db = null;
  let _loaded = false;
  let _loadPromise = null;

  // Flat lookup maps
  let _clubMap = {};    // clubId → club object
  let _holeMap = {};    // holeId → { hole, source, club }
  //   source = course object (fixed_18) or segment object (composable_9)

  // ── Internal: build lookup maps on load ──
  function _buildMaps(db){
    _clubMap = {};
    _holeMap = {};
    const seenHoleIds = new Set();

    (db.clubs||[]).forEach(club=>{
      _clubMap[club.id] = club;
      const mode = _getMode(club);

      if(mode === 'composable_9'){
        (club.segments||[]).forEach(seg=>{
          _autoFillHoles(club, seg);
          (seg.holes||[]).forEach(hole=>{
            if(seenHoleIds.has(hole.id)){
              console.warn('[CourseDatabase] duplicate hole.id:', hole.id);
            }
            seenHoleIds.add(hole.id);
            _holeMap[hole.id] = { hole, source: seg, club };
          });
        });
      } else {
        // fixed_18 or legacy
        (club.courses||[]).forEach(course=>{
          _autoFillHoles(club, course);
          (course.holes||[]).forEach(hole=>{
            if(seenHoleIds.has(hole.id)){
              console.warn('[CourseDatabase] duplicate hole.id:', hole.id);
            }
            seenHoleIds.add(hole.id);
            _holeMap[hole.id] = { hole, source: course, club };
          });
        });
        // Legacy V3.0 compat: if club has routings[], index them too
        // (not used in V3.1 but keeps old data working)
      }
    });
  }

  /**
   * Auto-fill holes[] when it is empty.
   * Generates placeholder hole objects with default par 4.
   * Hole id format: "${clubId}-${sourceId}-${number}"
   */
  function _autoFillHoles(club, source){
    if(!Array.isArray(source.holes)) source.holes = [];
    if(source.holes.length > 0) return; // already populated

    const count = source.holeCount || 18;
    for(let i = 1; i <= count; i++){
      source.holes.push({
        id:     club.id + '-' + source.id + '-' + i,
        number: i,
        par:    null,
        yard:   null,
        isPlaceholder: true
      });
    }
  }

  /** Determine routing mode for a club */
  function _getMode(club){
    if(club.routingMode) return club.routingMode;
    // Legacy compat: if club has segments[], treat as composable_9
    if(Array.isArray(club.segments) && club.segments.length > 0) return 'composable_9';
    // Default: fixed_18
    return 'fixed_18';
  }

  // ════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════

  function load(url){
    if(_loadPromise) return _loadPromise;
    const src = url || './data/courses.json';
    _loadPromise = fetch(src)
      .then(res=>{
        if(!res.ok) throw new Error('CourseDatabase: fetch failed (' + res.status + ') ' + src);
        return res.json();
      })
      .then(data=>{
        if(!data || !Array.isArray(data.clubs)){
          throw new Error('CourseDatabase: invalid format — missing clubs[]');
        }
        _db = data;
        _buildMaps(data);
        _loaded = true;
        console.log('[CourseDatabase] V' + (data.version||'?') + ' loaded', data.clubs.length, 'clubs,', Object.keys(_holeMap).length, 'holes');
        return data;
      })
      .catch(err=>{
        _loadPromise = null;
        console.error('[CourseDatabase]', err.message);
        throw err;
      });
    return _loadPromise;
  }

  function ensureLoaded(){
    if(!_loaded) throw new Error('CourseDatabase not loaded — call load() first');
  }
  function isLoaded(){ return _loaded; }

  /** All clubs */
  function getClubs(){
    ensureLoaded();
    return _db.clubs.slice();
  }

  /** Single club by id */
  function getClub(clubId){
    ensureLoaded();
    const c = _clubMap[clubId];
    if(!c) throw new Error('CourseDatabase: club not found: ' + clubId);
    return c;
  }

  /** Get routing mode for a club */
  function getRoutingMode(clubId){
    return _getMode(getClub(clubId));
  }

  // ── fixed_18 helpers ──

  /** Courses for a fixed_18 club */
  function getFixedCourses(clubId){
    const club = getClub(clubId);
    if(_getMode(club) !== 'fixed_18') return [];
    return (club.courses || []).slice();
  }

  /** Build runtime routing from a fixed_18 course */
  function buildRoutingFromCourse(clubId, courseId){
    const club = getClub(clubId);
    const course = (club.courses||[]).find(c => c.id === courseId);
    if(!course) throw new Error('CourseDatabase: course not found: ' + clubId + '/' + courseId);
    _autoFillHoles(club, course); // ensure holes exist
    const holeRefs = course.holes.map(h => h.id);
    return {
      id:         clubId + '__' + courseId,
      name:       course.name,
      holeCount:  holeRefs.length,
      holeRefs:   holeRefs,
      sourceType: 'fixed_course',
      meta:       { clubId, courseId }
    };
  }

  // ── composable_9 helpers ──

  /** Segments for a composable_9 club */
  function getSegments(clubId){
    const club = getClub(clubId);
    if(_getMode(club) !== 'composable_9') return [];
    return (club.segments || []).slice();
  }

  /** Validate a segment pair against compositionRules */
  function validateSegmentPair(clubId, frontId, backId){
    const club = getClub(clubId);
    const rules = club.compositionRules || {};
    const segments = club.segments || [];
    const errors = [];

    // Check segments exist
    if(!segments.find(s => s.id === frontId)) errors.push('Front segment not found: ' + frontId);
    if(!segments.find(s => s.id === backId)) errors.push('Back segment not found: ' + backId);
    if(errors.length) return { valid: false, errors };

    // allowRepeat
    if(!rules.allowRepeat && frontId === backId){
      errors.push('Same segment not allowed for front and back');
    }

    // allowedSegmentCounts
    if(Array.isArray(rules.allowedSegmentCounts) && !rules.allowedSegmentCounts.includes(2)){
      errors.push('2-segment combination not allowed');
    }

    // allowedPairs (optional restriction)
    if(Array.isArray(rules.allowedPairs)){
      const pairKey = frontId + '+' + backId;
      const found = rules.allowedPairs.some(p =>
        (p[0] === frontId && p[1] === backId) ||
        (!rules.orderMatters && p[0] === backId && p[1] === frontId)
      );
      if(!found) errors.push('Pair ' + pairKey + ' not in allowedPairs');
    }

    return { valid: errors.length === 0, errors };
  }

  /** Build runtime routing from two segments */
  function buildRoutingFromSegments(clubId, frontId, backId){
    const club = getClub(clubId);
    const frontSeg = (club.segments||[]).find(s => s.id === frontId);
    const backSeg  = (club.segments||[]).find(s => s.id === backId);
    if(!frontSeg) throw new Error('CourseDatabase: segment not found: ' + clubId + '/' + frontId);
    if(!backSeg)  throw new Error('CourseDatabase: segment not found: ' + clubId + '/' + backId);
    _autoFillHoles(club, frontSeg);
    _autoFillHoles(club, backSeg);
    const holeRefs = frontSeg.holes.map(h => h.id).concat(backSeg.holes.map(h => h.id));
    return {
      id:         clubId + '__' + frontId + '__' + backId,
      name:       frontSeg.name + '+' + backSeg.name,
      holeCount:  holeRefs.length,
      holeRefs:   holeRefs,
      sourceType: 'composed_segments',
      meta:       { clubId, frontSegmentId: frontId, backSegmentId: backId }
    };
  }

  // ── Hole access ──

  /** Get hole by global unique id */
  function getHole(holeId){
    ensureLoaded();
    const entry = _holeMap[holeId];
    if(!entry) throw new Error('CourseDatabase: hole not found: ' + holeId);
    return entry.hole;
  }

  /** Get the source (course or segment) that owns a hole */
  function getHoleSource(holeId){
    ensureLoaded();
    const entry = _holeMap[holeId];
    if(!entry) throw new Error('CourseDatabase: hole not found: ' + holeId);
    return entry.source;
  }

  /**
   * Build ordered hole data from a routing object (runtime-generated).
   * Returns array of { holeId, displayNumber, par, yard, sourceId, sourceName }
   * @param {string} [selectedTee] — tee box key (e.g. 'blue') to resolve teeYards
   */
  function getOrderedHolesFromRouting(routing, selectedTee){
    if(!routing || !Array.isArray(routing.holeRefs)) return [];
    return routing.holeRefs.map((holeId, i)=>{
      const entry = _holeMap[holeId];
      if(!entry){
        // Hole not found in DB — return placeholder so restore doesn't crash
        return {
          holeId: holeId, displayNumber: i + 1,
          par: null, yard: null, isPlaceholder: true,
          sourceId: 'unknown', sourceName: 'Unknown'
        };
      }
      const h = entry.hole;
      const src = entry.source;
      // Resolve yard: teeYards[selectedTee] > h.yard > null
      let yard = h.yard || null;
      if(h.teeYards && selectedTee && h.teeYards[selectedTee] != null){
        yard = h.teeYards[selectedTee];
      }
      return {
        holeId:        holeId,
        displayNumber: i + 1,
        par:           h.par,
        yard:          yard,
        isPlaceholder: !!h.isPlaceholder,
        sourceId:      src.id,
        sourceName:    src.name
      };
    });
  }

  /**
   * Get available tee box keys for a course or segment set.
   * Scans holes for teeYards keys. Returns sorted array e.g. ['blue','gold','red','white']
   */
  function getAvailableTees(clubId, courseId){
    const club = getClub(clubId);
    let holes = [];
    const course = (club.courses||[]).find(c => c.id === courseId);
    if(course) holes = course.holes || [];
    if(!holes.length){
      const seg = (club.segments||[]).find(s => s.id === courseId);
      if(seg) holes = seg.holes || [];
    }
    const teeSet = new Set();
    holes.forEach(h=>{
      if(h.teeYards){
        Object.keys(h.teeYards).forEach(k=> teeSet.add(k));
      }
    });
    return Array.from(teeSet);
  }

  /**
   * Get available tees for an entire club (scan all courses/segments).
   */
  function getAvailableTeesForClub(clubId){
    const club = getClub(clubId);
    const teeSet = new Set();
    const sources = (club.courses || []).concat(club.segments || []);
    sources.forEach(src=>{
      (src.holes||[]).forEach(h=>{
        if(h.teeYards) Object.keys(h.teeYards).forEach(k=> teeSet.add(k));
      });
    });
    return Array.from(teeSet);
  }

  // ── Legacy compat ──
  // These exist so old code that calls getRouting/getRoutings/buildOrderedHoles
  // won't crash if somehow invoked. They now return empty/throw.

  function getRoutings(clubId){ return []; }
  function getRouting(clubId, routingId){
    throw new Error('CourseDatabase.getRouting() removed in V3.1 — routings are now runtime-generated');
  }
  function buildOrderedHoles(clubId, routingId){
    throw new Error('CourseDatabase.buildOrderedHoles() removed in V3.1 — use getOrderedHolesFromRouting(routing)');
  }
  function getCourse(clubId, courseId){
    const club = getClub(clubId);
    return (club.courses||[]).find(c => c.id === courseId) || null;
  }

  return {
    load, isLoaded,
    getClubs, getClub, getRoutingMode,
    getFixedCourses, getSegments,
    buildRoutingFromCourse, buildRoutingFromSegments,
    validateSegmentPair,
    getHole, getHoleSource, getOrderedHolesFromRouting,
    getAvailableTees, getAvailableTeesForClub,
    // Legacy (kept for backward compat, may warn/throw)
    getRoutings, getRouting, buildOrderedHoles, getCourse
  };
})();
