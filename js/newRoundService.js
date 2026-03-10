// ============================================================
// newRoundService.js — New Round creation service (pure logic)
// Depends on: D (data.js), Round (round.js), ClubStore (clubStore.js)
// ============================================================

const NewRoundService = (function(){

  // ══════════════════════════════════════════
  // COURSE SNAPSHOT
  // ══════════════════════════════════════════

  /**
   * Build courseSnapshot from a club's layout.
   * Resolves layout.segments → nines → holes in segment order.
   *
   * @param {string} clubId
   * @param {string} layoutId
   * @param {string} [teeSetId] - for yardage lookup
   * @returns {{ snapshot: Array, holeCount: number, courseName: string, routingName: string }}
   */
  function buildCourseSnapshot(clubId, layoutId, teeSetId){
    var club = ClubStore.get(clubId);
    if(!club) return null;

    var layout = null;
    for(var i = 0; i < (club.layouts || []).length; i++){
      if(club.layouts[i].id === layoutId){ layout = club.layouts[i]; break; }
    }
    if(!layout) return null;

    // Build nine lookup
    var nineMap = {};
    for(var i = 0; i < (club.nines || []).length; i++){
      nineMap[club.nines[i].id] = club.nines[i];
    }

    // Resolve segments → holes
    var snapshot = [];
    var segments = (layout.segments || []).slice().sort(function(a,b){ return (a.order||0) - (b.order||0); });

    for(var s = 0; s < segments.length; s++){
      var nine = nineMap[segments[s].nine_id];
      if(!nine) continue;
      var holes = nine.holes || [];
      for(var h = 0; h < holes.length; h++){
        var hole = holes[h];
        var yards = null;
        if(teeSetId && hole.tees && hole.tees[teeSetId]){
          yards = hole.tees[teeSetId].yards || null;
        }
        snapshot.push({
          number: snapshot.length + 1,
          par: hole.par || 4,
          yards: yards,
          holeId: nine.id + '_h' + (h + 1),
          hcpIndex: hole.hcp || null
        });
      }
    }

    return {
      snapshot: snapshot,
      holeCount: snapshot.length,
      courseName: club.name || club.name_en || 'Untitled',
      routingName: layout.name || 'Default'
    };
  }

  // ══════════════════════════════════════════
  // STATUS RESOLUTION
  // ══════════════════════════════════════════

  /**
   * Resolve initial round status from teeTime.
   * @param {string} teeTime - ISO datetime or empty
   * @returns {{ status: string, activate: boolean }}
   */
  function resolveStatus(teeTime){
    if(!teeTime) return { status: 'in_progress', activate: true };

    var teeDate = new Date(teeTime);
    var now = new Date();
    var todayStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    var teeStr = teeDate.getFullYear() + '-' +
      String(teeDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(teeDate.getDate()).padStart(2, '0');

    if(teeStr === todayStr){
      return { status: 'in_progress', activate: true };
    }
    return { status: 'scheduled', activate: false };
  }

  // ══════════════════════════════════════════
  // AUTO TITLE
  // ══════════════════════════════════════════

  function _autoTitle(courseName, routingName, teeTime){
    var dateStr = '';
    if(teeTime){
      var d = new Date(teeTime);
      dateStr = (d.getMonth() + 1) + '月' + d.getDate() + '日';
    } else {
      var d = new Date();
      dateStr = (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }
    var name = courseName || '';
    if(routingName && routingName !== 'Default') name += ' ' + routingName;
    return name + ' · ' + dateStr;
  }

  // ══════════════════════════════════════════
  // VALIDATION
  // ══════════════════════════════════════════

  /**
   * Validate createNewRound input before creating the round.
   *
   * @param {NewRoundInput} input
   * @returns {string[]} array of error messages (empty = valid)
   */
  function validateInput(input){
    var errors = [];
    if(!input) { errors.push('Input is required'); return errors; }

    // clubId must exist in ClubStore
    if(!input.clubId){
      errors.push('Club is required');
    } else if(!ClubStore.get(input.clubId)){
      errors.push('Club not found: ' + input.clubId);
    }

    // layoutId must exist within the club
    if(!input.layoutId){
      errors.push('Layout is required');
    } else if(input.clubId){
      var club = ClubStore.get(input.clubId);
      if(club){
        var layoutFound = false;
        for(var i = 0; i < (club.layouts || []).length; i++){
          if(club.layouts[i].id === input.layoutId){ layoutFound = true; break; }
        }
        if(!layoutFound) errors.push('Layout not found: ' + input.layoutId);
      }
    }

    // At least one player required
    if(!input.players || !Array.isArray(input.players) || input.players.length === 0){
      errors.push('At least one player is required');
    } else {
      // Each player must have a non-empty name
      for(var i = 0; i < input.players.length; i++){
        if(!input.players[i] || !input.players[i].name || !input.players[i].name.trim()){
          errors.push('Player ' + (i + 1) + ' has no name');
        }
      }
    }

    return errors;
  }

  // ══════════════════════════════════════════
  // CREATE ROUND
  // ══════════════════════════════════════════

  /**
   * Create a new round from user selections.
   * Returns validation errors if input is invalid, or the created round result.
   *
   * @param {NewRoundInput} input
   * @returns {NewRoundResult}
   */
  function createNewRound(input){
    // 0. Validate input
    var errors = validateInput(input);
    if(errors.length > 0){
      return { success: false, errors: errors };
    }

    // 1. Build course snapshot
    var cs = buildCourseSnapshot(input.clubId, input.layoutId, input.teeSetId);
    if(!cs || cs.holeCount === 0){
      return { success: false, errors: ['Course snapshot is empty — check layout segments'] };
    }

    // 2. Resolve status
    var res = resolveStatus(input.teeTime);

    // 3. Build player inputs
    var playerInputs = [];
    for(var i = 0; i < (input.players || []).length; i++){
      var p = input.players[i];
      playerInputs.push({
        name: p.name,
        playerId: p.playerId || null,
        buddyId: p.buddyId || null
      });
    }

    // 4. Auto title
    var title = input.title || _autoTitle(cs.courseName, cs.routingName, input.teeTime);

    // 5. Create Round object via Round.createRound()
    var round = Round.createRound({
      courseId: input.clubId,
      routingId: input.layoutId,
      holeCount: cs.holeCount,
      status: res.status,
      players: playerInputs,
      _courseSnapshot: cs.snapshot,
      notes: ''
    });

    // Attach extra metadata
    round._title = title;
    round._teeTime = input.teeTime || null;
    round._teeSetId = input.teeSetId || null;
    round._clubName = cs.courseName;
    round._routingName = cs.routingName;

    return {
      success: true,
      round: round,
      snapshot: cs.snapshot,
      courseName: cs.courseName,
      routingName: cs.routingName,
      holeCount: cs.holeCount,
      activate: res.activate,
      title: title
    };
  }

  // ══════════════════════════════════════════
  // ACTIVATE ROUND (write to D.sc, enter overlay)
  // ══════════════════════════════════════════

  /**
   * Activate a round: write to D.sc(), set as active, navigate to overlay.
   * Follows the pattern of CoursePicker._applyRoundToState().
   */
  function activateRound(result){
    var round = result.round;
    var snapshot = result.snapshot;
    var sc = D.sc();
    var ws = D.ws();
    var count = result.holeCount;

    // ── Write to RoundStore (source of truth) ──
    if(typeof RoundStore !== 'undefined'){
      RoundStore.putRound(round, snapshot);
      RoundStore.setActive(round.id);
    }

    // ── Sync to D.sc() (runtime projection / compat layer) ──
    sc.course.clubId            = round.courseId;
    sc.course.routingId         = round.routingId;
    sc.course.clubName          = result.courseName;
    sc.course.routingName       = result.routingName;
    sc.course.routingSourceType = 'club_layout';
    sc.course.routingMeta       = {};
    sc.course.courseName        = result.title;
    sc.course.holeCount         = count;
    sc.course.holeSnapshot      = snapshot.slice();

    sc.meta.roundId   = round.id;
    sc.meta.createdAt = round.createdAt;
    sc.meta.updatedAt = round.updatedAt;
    sc.meta.clubId    = round.courseId;

    sc.players = [];
    sc.scores  = {};
    for(var i = 0; i < round.players.length; i++){
      var rp = round.players[i];
      sc.players.push(D.defPlayer(
        rp.roundPlayerId,
        rp.name,
        { playerId: rp.playerId, buddyId: rp.buddyId || null, colorKey: rp.color || null }
      ));
      sc.scores[rp.roundPlayerId] = {
        holes: Array.from({length: count}, function(){ return D.defPlayerHole(); }),
        totals: {}
      };
    }

    // ── Reset workspace ──
    ws.currentHole      = 0;
    ws.currentPlayerId  = sc.players.length > 0 ? D.rpid(sc.players[0]) : null;
    ws.shotIndex        = -1;
    ws.scorecardSummary = null;

    // ── Rebuild S and save ──
    if(typeof S !== 'undefined') D.syncS(S);
    if(typeof updateScoreRangeLabels === 'function') updateScoreRangeLabels();
    D.save();

    // ── Update player history ──
    _updatePlayerHistory(round.players);

    console.log('[NewRoundService] Round activated: ' + round.id + ' (' + count + ' holes, ' + round.players.length + ' players)');
  }

  // ══════════════════════════════════════════
  // STORE SCHEDULED ROUND
  // ══════════════════════════════════════════

  function storeScheduledRound(result){
    var round = result.round;
    if(typeof RoundStore !== 'undefined'){
      RoundStore.putRound(round, result.snapshot);
    }
    console.log('[NewRoundService] Scheduled round stored: ' + round.id);
  }

  // ══════════════════════════════════════════
  // PLAYER HISTORY
  // ══════════════════════════════════════════

  function _updatePlayerHistory(players){
    var ws = D.ws();
    var history = ws.playerHistory || [];
    for(var i = 0; i < players.length; i++){
      var p = players[i];
      // Remove existing entry with same name (handle both string and object formats)
      history = history.filter(function(h){
        var hName = (typeof h === 'string') ? h : (h && h.name || '');
        return hName !== p.name;
      });
      // Add to front as object
      history.unshift({ name: p.name, playerId: p.playerId || null });
    }
    // Keep max 20
    if(history.length > 20) history = history.slice(0, 20);
    ws.playerHistory = history;
  }

  /**
   * Get recent player names from history.
   * Normalizes mixed formats: strings (from app.js) and objects (from newRoundService).
   * @param {number} [limit=8]
   * @returns {Array<{name, playerId}>}
   */
  function getRecentPlayers(limit){
    var ws = D.ws();
    var history = ws.playerHistory || [];
    var result = [];
    for(var i = 0; i < history.length && result.length < (limit || 8); i++){
      var h = history[i];
      if(typeof h === 'string'){
        // Legacy format from app.js addPlayer()
        if(h.trim()) result.push({ name: h.trim(), playerId: null });
      } else if(h && h.name){
        // Object format from _updatePlayerHistory()
        result.push({ name: h.name, playerId: h.playerId || null });
      }
    }
    return result;
  }

  // ══════════════════════════════════════════
  // RECENT CLUBS
  // ══════════════════════════════════════════

  /**
   * Get recently used clubs from round history.
   * @param {number} [limit=5]
   * @returns {Array<ClubObject>}
   */
  function getRecentClubs(limit){
    limit = limit || 5;
    var ids = D.listRoundIds();
    var seen = {};
    var clubs = [];

    // Check active round first
    var activeRound = D.getActiveRound();
    if(activeRound && activeRound.courseId){
      var c = ClubStore.get(activeRound.courseId);
      if(c && !seen[c.id]){
        seen[c.id] = true;
        clubs.push(c);
      }
    }

    // Then stored rounds (sorted by date desc)
    var rounds = [];
    for(var i = 0; i < ids.length; i++){
      var r = D.getRound(ids[i]);
      if(r) rounds.push(r);
    }
    rounds.sort(function(a, b){
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    for(var i = 0; i < rounds.length && clubs.length < limit; i++){
      var cid = rounds[i].courseId;
      if(!cid || seen[cid]) continue;
      var c = ClubStore.get(cid);
      if(c){
        seen[cid] = true;
        clubs.push(c);
      }
    }

    return clubs;
  }

  // ══════════════════════════════════════════
  // DRAFT → PAYLOAD ADAPTER (P5 翻译层)
  // ══════════════════════════════════════════
  //
  // RoundDraft（产品语义）→ Create Adapter → 旧 Round Payload（持久化语义）
  //
  // Two paths:
  //   A. single-layout: selectedLayoutId exists → use existing buildCourseSnapshot
  //   B. dual-nine:     frontNineId + backNineId → build holes directly from nines

  /**
   * Build hole snapshot directly from two nines, without requiring a layout.
   * Front nine holes come first, back nine holes second.
   * Hole numbers are renumbered 1..N sequentially.
   *
   * @param {Object} frontNine - nine object { id, name, holes: [...] }
   * @param {Object} backNine  - nine object { id, name, holes: [...] }
   * @param {string} [teeSetId] - for yardage lookup
   * @returns {Array} hole snapshot array
   */
  function buildHolesFromDualNine(frontNine, backNine, teeSetId){
    var snapshot = [];

    function appendNine(nine){
      if(!nine || !nine.holes) return;
      var holes = nine.holes;
      for(var h = 0; h < holes.length; h++){
        var hole = holes[h];
        var yards = null;
        if(teeSetId && hole.tees && hole.tees[teeSetId]){
          yards = hole.tees[teeSetId].yards || null;
        }
        snapshot.push({
          number: snapshot.length + 1,
          par: hole.par || 4,
          yards: yards,
          holeId: nine.id + '_h' + (h + 1),
          hcpIndex: hole.hcp || null
        });
      }
    }

    appendNine(frontNine);
    appendNine(backNine);
    return snapshot;
  }

  /**
   * Build a course snapshot result from draft route info.
   * Handles both single-layout and dual-nine modes.
   *
   * @param {Object} draft - roundDraft object
   * @returns {{ snapshot, holeCount, courseName, routingName, routeMode, routeSummary,
   *             frontNineId, backNineId, selectedLayoutId } | null}
   */
  function buildCourseSnapshotFromDraft(draft){
    if(!draft || !draft.clubId) return null;
    var club = ClubStore.get(draft.clubId);
    if(!club) return null;

    var clubName = club.name || club.name_en || 'Untitled';
    var snapshot, routingName, routeSummary;

    if(draft.routeMode === 'single-layout' && draft.selectedLayoutId){
      // ── Path A: existing layout ──
      var cs = buildCourseSnapshot(draft.clubId, draft.selectedLayoutId, draft.teeSetId || null);
      if(!cs || cs.holeCount === 0) return null;
      routingName = cs.routingName;
      routeSummary = cs.routingName;
      snapshot = cs.snapshot;
    } else if(draft.routeMode === 'dual-nine' && draft.frontNineId && draft.backNineId){
      // ── Path B: compose from two nines ──
      var nineMap = {};
      for(var i = 0; i < (club.nines || []).length; i++){
        nineMap[club.nines[i].id] = club.nines[i];
      }
      var frontNine = nineMap[draft.frontNineId];
      var backNine  = nineMap[draft.backNineId];
      if(!frontNine || !backNine) return null;
      if(!frontNine.holes || frontNine.holes.length === 0) return null;
      if(!backNine.holes  || backNine.holes.length === 0)  return null;

      snapshot = buildHolesFromDualNine(frontNine, backNine, draft.teeSetId || null);
      if(snapshot.length === 0) return null;

      var fn = draft.frontNineName || frontNine.name || frontNine.display_name || 'Front';
      var bn = draft.backNineName  || backNine.name  || backNine.display_name  || 'Back';
      routingName  = fn + ' + ' + bn;
      routeSummary = fn + ' + ' + bn;
    } else {
      return null;
    }

    return {
      snapshot: snapshot,
      holeCount: snapshot.length,
      courseName: clubName,
      routingName: routingName,
      routeMode: draft.routeMode,
      routeSummary: routeSummary,
      frontNineId: draft.frontNineId || null,
      backNineId: draft.backNineId || null,
      selectedLayoutId: draft.selectedLayoutId || null
    };
  }

  /**
   * Normalize a roundDraft into a validated create-ready payload.
   * This is the single translation point from product semantics to persistence semantics.
   *
   * @param {Object} draft - roundDraft from NewRoundPage
   * @returns {{ success:true, payload } | { success:false, errors:string[] }}
   */
  /** Safe T() wrapper — T() is defined in app.js which loads after this file */
  function _t(key, arg){
    if(typeof T === 'function') return arg !== undefined ? T(key, arg) : T(key);
    return key;
  }

  function normalizeDraftForCreate(draft){
    var errors = [];

    if(!draft) { return { success:false, errors:[_t('nrErrClubRequired')] }; }
    if(!draft.clubId) errors.push(_t('nrErrClubRequired'));

    // Verify club exists in store
    if(draft.clubId && !ClubStore.get(draft.clubId)){
      errors.push(_t('nrErrClubNotFound'));
    }

    // Route validation
    if(draft.routeMode === 'dual-nine'){
      if(!draft.frontNineId) errors.push(_t('nrErrFront9Required'));
      if(!draft.backNineId)  errors.push(_t('nrErrBack9Required'));
    } else if(draft.routeMode === 'single-layout'){
      if(!draft.selectedLayoutId) errors.push(_t('nrErrLayoutRequired'));
    } else {
      errors.push(_t('nrErrRouteRequired'));
    }

    // Players
    if(!draft.players || draft.players.length === 0){
      errors.push(_t('nrErrPlayerRequired'));
    } else {
      for(var i = 0; i < draft.players.length; i++){
        if(!draft.players[i].name || !draft.players[i].name.trim()){
          errors.push(_t('nrErrPlayerNoName', i + 1));
        }
      }
    }

    if(errors.length > 0) return { success:false, errors:errors };

    // Build course snapshot via adapter
    var cs = buildCourseSnapshotFromDraft(draft);
    if(!cs || cs.holeCount === 0){
      return { success:false, errors:[_t('nrErrSnapshotEmpty')] };
    }

    // Build player inputs
    var playerInputs = [];
    for(var i = 0; i < draft.players.length; i++){
      var p = draft.players[i];
      playerInputs.push({
        name: p.name.trim(),
        playerId: p.playerId || null,
        buddyId: p.buddyId || null
      });
    }

    return {
      success: true,
      payload: {
        clubId: draft.clubId,
        courseSnapshot: cs,
        players: playerInputs,
        teeTime: draft.teeTime || null,
        visibility: draft.visibility || 'friends',
        title: null // auto-generate
      }
    };
  }

  /**
   * Create a new round directly from a roundDraft.
   * This is the main entry point for P5 — replaces the old createNewRound(input) path
   * for the new 4-card picker flow.
   *
   * @param {Object} draft - roundDraft from NewRoundPage
   * @returns {NewRoundResult}
   */
  function createFromDraft(draft){
    // 1. Normalize & validate
    var norm = normalizeDraftForCreate(draft);
    if(!norm.success){
      return { success:false, errors:norm.errors };
    }

    var pay = norm.payload;
    var cs  = pay.courseSnapshot;

    // 2. Resolve status
    var res = resolveStatus(pay.teeTime);

    // 3. Auto title
    var title = pay.title || _autoTitle(cs.courseName, cs.routingName, pay.teeTime);

    // 4. Determine routingId for backward-compat storage
    //    For single-layout: use the actual layoutId
    //    For dual-nine: try to find a matching layout, or use a synthetic descriptor
    var routingId;
    if(cs.routeMode === 'single-layout' && cs.selectedLayoutId){
      routingId = cs.selectedLayoutId;
    } else if(cs.routeMode === 'dual-nine'){
      // Try to find a matching layout (best effort, not required)
      var matchingLayout = _findMatchingLayout(pay.clubId, cs.frontNineId, cs.backNineId);
      routingId = matchingLayout || ('dn:' + cs.frontNineId + '+' + cs.backNineId);
    } else {
      routingId = null;
    }

    // 5. Create Round object
    var round = Round.createRound({
      courseId: pay.clubId,
      routingId: routingId,
      holeCount: cs.holeCount,
      status: res.status,
      players: pay.players,
      _courseSnapshot: cs.snapshot,
      notes: ''
    });

    // 6. Attach extended metadata (prefixed with _ = non-schema, instance-level)
    round._title        = title;
    round._teeTime      = pay.teeTime;
    round._teeSetId     = draft.teeSetId || null;
    round._clubName     = cs.courseName;
    round._routingName  = cs.routingName;
    round._routeMode    = cs.routeMode;
    round._routeSummary = cs.routeSummary;
    round._frontNineId  = cs.frontNineId;
    round._backNineId   = cs.backNineId;
    round._visibility   = pay.visibility;

    return {
      success: true,
      round: round,
      snapshot: cs.snapshot,
      courseName: cs.courseName,
      routingName: cs.routingName,
      routeSummary: cs.routeSummary,
      routeMode: cs.routeMode,
      holeCount: cs.holeCount,
      activate: res.activate,
      title: title
    };
  }

  /**
   * Find a matching layout by frontNineId + backNineId (best effort).
   * @private
   */
  function _findMatchingLayout(clubId, frontNineId, backNineId){
    var club = ClubStore.get(clubId);
    if(!club) return null;
    var layouts = club.layouts || [];
    for(var i = 0; i < layouts.length; i++){
      var segs = layouts[i].segments || [];
      if(segs.length === 2 && segs[0].nine_id === frontNineId && segs[1].nine_id === backNineId){
        return layouts[i].id;
      }
    }
    return null;
  }

  // ══════════════════════════════════════════
  // ACTIVATE ROUND — enhanced with route metadata
  // ══════════════════════════════════════════

  /**
   * activateRound: enhanced to store route metadata in sc.course.
   * Overwrites the original activateRound above.
   */
  var _origActivateRound = activateRound;
  function activateRoundV2(result){
    // Call original activation logic
    _origActivateRound(result);

    // Enhance sc.course with route metadata from the new create flow
    var sc = D.sc();
    if(result.routeMode){
      sc.course.routeMode    = result.routeMode;
      sc.course.routeSummary = result.routeSummary || '';
    }
    if(result.round._frontNineId) sc.course.frontNineId = result.round._frontNineId;
    if(result.round._backNineId)  sc.course.backNineId  = result.round._backNineId;

    // Persist visibility on scorecard for active rounds
    if(result.round._visibility){
      sc.course.visibility = result.round._visibility;
    }

    // Persist tee time on scorecard
    if(result.round._teeTime){
      sc.meta.teeTime = result.round._teeTime;
    }

    // Update recent club routing history
    _updateRecentClubRouting(result);

    D.save();
  }

  // ══════════════════════════════════════════
  // RECENT CLUBS — enhanced with routing info
  // ══════════════════════════════════════════

  function _updateRecentClubRouting(result){
    var ws = D.ws();
    var history = ws.recentClubRouting || {};
    if(result.round && result.round.courseId){
      history[result.round.courseId] = {
        routeMode: result.routeMode || null,
        routeSummary: result.routeSummary || '',
        routingName: result.routingName || '',
        updatedAt: new Date().toISOString()
      };
    }
    ws.recentClubRouting = history;
  }

  /**
   * Get routing summary for a recently used club.
   * @param {string} clubId
   * @returns {{ routeSummary, routingName, updatedAt } | null}
   */
  function getRecentClubRouting(clubId){
    var ws = D.ws();
    var history = ws.recentClubRouting || {};
    return history[clubId] || null;
  }

  // ══════════════════════════════════════════
  // SELF-TEST — call NewRoundService._selfTest() in browser console
  // ══════════════════════════════════════════

  function _selfTest(){
    var pass=0, fail=0, results=[];

    function ok(name, cond, detail){
      if(cond){ pass++; results.push('  OK  ' + name); }
      else    { fail++; results.push('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
    }

    // ── Mock ClubStore data ──
    var _origGet = ClubStore.get;
    var mockClub = {
      id: 'test_club_1',
      name: 'Test Golf Club',
      name_en: 'Test Golf Club',
      city: 'TestCity',
      nines: [
        {
          id: 'nine_front',
          name: 'Front',
          holes: [
            { par:4, hcp:1, tees:{ tee_blue:{ yards:380 } } },
            { par:3, hcp:5, tees:{ tee_blue:{ yards:165 } } },
            { par:5, hcp:3, tees:{ tee_blue:{ yards:520 } } },
            { par:4, hcp:7, tees:{ tee_blue:{ yards:350 } } },
            { par:4, hcp:9, tees:{ tee_blue:{ yards:370 } } },
            { par:3, hcp:13, tees:{ tee_blue:{ yards:175 } } },
            { par:4, hcp:11, tees:{ tee_blue:{ yards:410 } } },
            { par:5, hcp:15, tees:{ tee_blue:{ yards:540 } } },
            { par:4, hcp:17, tees:{ tee_blue:{ yards:390 } } }
          ]
        },
        {
          id: 'nine_back',
          name: 'Back',
          holes: [
            { par:4, hcp:2, tees:{ tee_blue:{ yards:400 } } },
            { par:4, hcp:4, tees:{ tee_blue:{ yards:360 } } },
            { par:3, hcp:14, tees:{ tee_blue:{ yards:190 } } },
            { par:5, hcp:6, tees:{ tee_blue:{ yards:530 } } },
            { par:4, hcp:8, tees:{ tee_blue:{ yards:385 } } },
            { par:4, hcp:10, tees:{ tee_blue:{ yards:395 } } },
            { par:3, hcp:16, tees:{ tee_blue:{ yards:155 } } },
            { par:5, hcp:12, tees:{ tee_blue:{ yards:510 } } },
            { par:4, hcp:18, tees:{ tee_blue:{ yards:375 } } }
          ]
        }
      ],
      layouts: [
        {
          id: 'layout_full',
          name: 'Full 18',
          is_default: true,
          hole_count: 18,
          segments: [
            { nine_id:'nine_front', order:1 },
            { nine_id:'nine_back',  order:2 }
          ]
        }
      ],
      tee_sets: [
        { id:'tee_blue', name:'Blue', color:'#0000ff' }
      ]
    };
    ClubStore.get = function(id){ return id === 'test_club_1' ? mockClub : _origGet(id); };

    // ════════════════════════════════════════
    // Test 1: Immediate round (teeTime = today)
    // ════════════════════════════════════════
    var todayISO = new Date().toISOString().slice(0,10) + 'T08:00';
    var r1 = createNewRound({
      clubId: 'test_club_1',
      layoutId: 'layout_full',
      teeSetId: 'tee_blue',
      players: [{ name:'Alice' }, { name:'Bob', playerId:'pid_bob' }],
      teeTime: todayISO
    });

    ok('T1: success=true',        r1.success === true,     'got ' + r1.success);
    ok('T1: no errors',           !r1.errors);
    ok('T1: activate=true',      r1.activate === true,    'got ' + r1.activate);
    ok('T1: status=playing',     r1.round.status === 'playing', 'got ' + r1.round.status);
    ok('T1: holeCount=18',       r1.holeCount === 18,     'got ' + r1.holeCount);
    ok('T1: courseName',         r1.courseName === 'Test Golf Club');
    ok('T1: routingName',        r1.routingName === 'Full 18');
    ok('T1: title contains date', r1.title.indexOf('月') >= 0 && r1.title.indexOf('Test Golf Club') >= 0);

    // ════════════════════════════════════════
    // Test 2: Scheduled round (future teeTime)
    // ════════════════════════════════════════
    var futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    var futureISO = futureDate.toISOString().slice(0,10) + 'T09:30';
    var r2 = createNewRound({
      clubId: 'test_club_1',
      layoutId: 'layout_full',
      teeSetId: 'tee_blue',
      players: [{ name:'Charlie' }],
      teeTime: futureISO
    });

    ok('T2: success=true',        r2.success === true);
    ok('T2: activate=false',     r2.activate === false,   'got ' + r2.activate);
    ok('T2: status=planned',     r2.round.status === 'planned', 'got ' + r2.round.status);
    ok('T2: different roundId',  r2.round.id !== r1.round.id);
    ok('T2: _teeTime stored',    r2.round._teeTime === futureISO);

    // ════════════════════════════════════════
    // Test 3: Player snapshot creation
    // ════════════════════════════════════════
    var round = r1.round;
    ok('T3: 2 players',           round.players.length === 2);

    var p0 = round.players[0];
    ok('T3: p0 name=Alice',       p0.name === 'Alice');
    ok('T3: p0 has roundPlayerId', !!p0.roundPlayerId && /^rp_/.test(p0.roundPlayerId));
    ok('T3: p0 playerId=null',    p0.playerId === null);
    ok('T3: p0 order=0',          p0.order === 0,         'got ' + p0.order);

    var p1 = round.players[1];
    ok('T3: p1 name=Bob',         p1.name === 'Bob');
    ok('T3: p1 playerId kept',    p1.playerId === 'pid_bob');
    ok('T3: p1 order=1',          p1.order === 1,         'got ' + p1.order);
    ok('T3: unique rpIds',        p0.roundPlayerId !== p1.roundPlayerId);

    // Verify player fields match Round schema
    var requiredFields = ['roundPlayerId','playerId','name','order','team','color'];
    var allPresent = requiredFields.every(function(f){ return f in p0; });
    ok('T3: schema fields present', allPresent, 'missing: ' + requiredFields.filter(function(f){ return !(f in p0); }).join(','));

    // ════════════════════════════════════════
    // Test 4: Hole initialization for all players
    // ════════════════════════════════════════
    ok('T4: scores has p0 key',   !!round.scores[p0.roundPlayerId]);
    ok('T4: scores has p1 key',   !!round.scores[p1.roundPlayerId]);

    var p0Holes = round.scores[p0.roundPlayerId].holes;
    var p1Holes = round.scores[p1.roundPlayerId].holes;
    ok('T4: p0 has 18 holes',     p0Holes.length === 18,  'got ' + p0Holes.length);
    ok('T4: p1 has 18 holes',     p1Holes.length === 18,  'got ' + p1Holes.length);

    // All holes should be empty
    var allEmpty = p0Holes.every(function(h){ return h.gross === null && h.status === 'empty'; });
    ok('T4: p0 all holes empty',  allEmpty);
    var allEmpty1 = p1Holes.every(function(h){ return h.gross === null && h.status === 'empty'; });
    ok('T4: p1 all holes empty',  allEmpty1);

    // Shots initialized
    ok('T4: shots has p0 key',    !!round.shots[p0.roundPlayerId]);
    ok('T4: p0 shots 18 holes',   round.shots[p0.roundPlayerId].length === 18);
    var allShotsEmpty = round.shots[p0.roundPlayerId].every(function(s){ return Array.isArray(s) && s.length === 0; });
    ok('T4: p0 all shots empty',  allShotsEmpty);

    // ════════════════════════════════════════
    // Test 5: courseSnapshot in round
    // ════════════════════════════════════════
    var snap = r1.snapshot;
    ok('T5: snapshot length=18',   snap.length === 18,     'got ' + snap.length);
    ok('T5: hole1 par=4',          snap[0].par === 4,      'got ' + snap[0].par);
    ok('T5: hole2 par=3',          snap[1].par === 3,      'got ' + snap[1].par);
    ok('T5: hole3 par=5',          snap[2].par === 5,      'got ' + snap[2].par);
    ok('T5: hole1 yards=380',      snap[0].yards === 380,  'got ' + snap[0].yards);
    ok('T5: hole1 hcpIndex=1',     snap[0].hcpIndex === 1, 'got ' + snap[0].hcpIndex);
    ok('T5: hole1 holeId',         snap[0].holeId === 'nine_front_h1');
    ok('T5: hole10 from back nine', snap[9].holeId === 'nine_back_h1');
    ok('T5: hole numbers sequential', snap.every(function(h, i){ return h.number === i + 1; }));

    // _courseSnapshot stored on round
    ok('T5: round._courseSnapshot', !!round._courseSnapshot && round._courseSnapshot.length === 18);

    // ════════════════════════════════════════
    // Test 6: Round object schema completeness
    // ════════════════════════════════════════
    var schemaKeys = ['id','status','date','courseId','routingId','holeCount',
                      'players','scores','shots','game','event','notes',
                      'createdAt','updatedAt','_courseSnapshot'];
    var missingKeys = schemaKeys.filter(function(k){ return !(k in round); });
    ok('T6: all schema keys',      missingKeys.length === 0, 'missing: ' + missingKeys.join(','));
    ok('T6: id format rnd_YYYYMMDD_*', /^rnd_\d{8}_/.test(round.id), 'got ' + round.id);
    ok('T6: courseId = clubId',     round.courseId === 'test_club_1');
    ok('T6: routingId = layoutId',  round.routingId === 'layout_full');
    ok('T6: createdAt is ISO',      /^\d{4}-\d{2}-\d{2}T/.test(round.createdAt));
    ok('T6: game object',           round.game && round.game.type === null);
    ok('T6: event object',          round.event && typeof round.event.name === 'string');

    // ════════════════════════════════════════
    // Test 7: Edge — no teeTime → immediate
    // ════════════════════════════════════════
    var r3 = createNewRound({
      clubId: 'test_club_1',
      layoutId: 'layout_full',
      players: [{ name:'Dave' }]
    });
    ok('T7: no teeTime → activate', r3.activate === true);
    ok('T7: status=playing',         r3.round.status === 'playing');
    ok('T7: no teeSetId → yards null', r3.snapshot[0].yards === null);

    // Rapid-fire uniqueness check
    var ids = {};
    var dup = false;
    for(var ui = 0; ui < 100; ui++){
      var rid = r3.round.id;  // same round
      // Create many rounds to test uniqueness
      var rx = createNewRound({
        clubId: 'test_club_1', layoutId: 'layout_full',
        players: [{ name:'UniqueTest' }]
      });
      if(ids[rx.round.id]){ dup = true; break; }
      ids[rx.round.id] = true;
    }
    ok('T7: 100 rapid IDs unique', !dup);

    // ════════════════════════════════════════
    // Test 8: Validation — invalid inputs return errors
    // ════════════════════════════════════════
    var r4 = createNewRound({
      clubId: 'nonexistent',
      layoutId: 'layout_full',
      players: [{ name:'Eve' }]
    });
    ok('T8: bad clubId → success=false', r4.success === false);
    ok('T8: bad clubId → has errors',  r4.errors.length > 0);
    ok('T8: bad clubId msg',           r4.errors[0].indexOf('Club not found') >= 0, r4.errors[0]);

    var r5 = createNewRound({
      clubId: 'test_club_1',
      layoutId: 'bad_layout',
      players: [{ name:'Eve' }]
    });
    ok('T8: bad layoutId → success=false', r5.success === false);
    ok('T8: bad layoutId → has errors',    r5.errors.length > 0);
    ok('T8: bad layoutId msg',             r5.errors[0].indexOf('Layout not found') >= 0, r5.errors[0]);

    // ════════════════════════════════════════
    // Test 9: Validation — missing fields
    // ════════════════════════════════════════
    var v1 = validateInput({});
    ok('T9: empty input → errors',   v1.length >= 2, 'got ' + v1.length);
    ok('T9: has club error',          v1.some(function(e){ return e.indexOf('Club') >= 0; }));
    ok('T9: has player error',        v1.some(function(e){ return e.indexOf('player') >= 0; }));

    var v2 = validateInput({
      clubId: 'test_club_1',
      layoutId: 'layout_full',
      players: [{ name:'' }, { name:'  ' }]
    });
    ok('T9: blank names → errors',   v2.length === 2, 'got ' + v2.length + ': ' + v2.join('; '));

    var v3 = validateInput({
      clubId: 'test_club_1',
      layoutId: 'layout_full',
      players: [{ name:'Alice' }]
    });
    ok('T9: valid input → no errors', v3.length === 0, 'got ' + v3.join('; '));

    var v4 = validateInput(null);
    ok('T9: null input → error',     v4.length > 0);

    // ════════════════════════════════════════
    // Test 10: buildHolesFromDualNine — P5 hole merge
    // ════════════════════════════════════════
    var frontNine = mockClub.nines[0];
    var backNine  = mockClub.nines[1];
    var dualSnap = buildHolesFromDualNine(frontNine, backNine, 'tee_blue');

    ok('T10: dual snap 18 holes',    dualSnap.length === 18, 'got ' + dualSnap.length);
    ok('T10: hole 1 from front',     dualSnap[0].holeId === 'nine_front_h1');
    ok('T10: hole 10 from back',     dualSnap[9].holeId === 'nine_back_h1');
    ok('T10: sequential numbers',    dualSnap.every(function(h, i){ return h.number === i + 1; }));
    ok('T10: hole 1 par=4',          dualSnap[0].par === 4);
    ok('T10: hole 2 par=3',          dualSnap[1].par === 3);
    ok('T10: hole 1 yards=380',      dualSnap[0].yards === 380);
    ok('T10: hole 10 yards=400',     dualSnap[9].yards === 400);
    ok('T10: hcpIndex preserved',    dualSnap[0].hcpIndex === 1 && dualSnap[9].hcpIndex === 2);

    // No teeSetId → yards null
    var dualNoTee = buildHolesFromDualNine(frontNine, backNine, null);
    ok('T10: no tee → yards null',   dualNoTee[0].yards === null);

    // Defensive: null nine
    var defSnap = buildHolesFromDualNine(null, backNine, null);
    ok('T10: null front → 9 holes',  defSnap.length === 9, 'got ' + defSnap.length);

    // ════════════════════════════════════════
    // Test 11: createFromDraft — single-layout path
    // ════════════════════════════════════════
    var draftSL = {
      clubId: 'test_club_1',
      routeMode: 'single-layout',
      selectedLayoutId: 'layout_full',
      teeSetId: 'tee_blue',
      players: [
        { type:'self', name:'Self', playerId:'pid_self', sortOrder:0 },
        { type:'member', name:'Bob', playerId:'pid_bob', sortOrder:1 }
      ],
      teeTime: todayISO,
      visibility: 'private'
    };

    var rSL = createFromDraft(draftSL);
    ok('T11: SL success',             rSL.success === true, rSL.errors && rSL.errors.join('; '));
    ok('T11: SL holeCount=18',        rSL.holeCount === 18);
    ok('T11: SL routeMode',           rSL.routeMode === 'single-layout');
    ok('T11: SL routingId=layoutId',  rSL.round.routingId === 'layout_full');
    ok('T11: SL activate=true',       rSL.activate === true);
    ok('T11: SL 2 players',           rSL.round.players.length === 2);
    ok('T11: SL visibility',          rSL.round._visibility === 'private');
    ok('T11: SL courseName',          rSL.courseName === 'Test Golf Club');
    ok('T11: SL snapshot yards',      rSL.snapshot[0].yards === 380);
    ok('T11: SL title',               rSL.title && rSL.title.indexOf('Test Golf Club') >= 0);

    // ════════════════════════════════════════
    // Test 12: createFromDraft — dual-nine path
    // ════════════════════════════════════════
    var draftDN = {
      clubId: 'test_club_1',
      routeMode: 'dual-nine',
      frontNineId: 'nine_front',
      frontNineName: 'Front',
      backNineId: 'nine_back',
      backNineName: 'Back',
      teeSetId: 'tee_blue',
      players: [
        { type:'self', name:'Self', playerId:null, sortOrder:0 },
        { type:'guest', name:'Guest1', playerId:null, sortOrder:1 }
      ],
      teeTime: todayISO,
      visibility: 'friends'
    };

    var rDN = createFromDraft(draftDN);
    ok('T12: DN success',             rDN.success === true, rDN.errors && rDN.errors.join('; '));
    ok('T12: DN holeCount=18',        rDN.holeCount === 18);
    ok('T12: DN routeMode',           rDN.routeMode === 'dual-nine');
    ok('T12: DN routeSummary',        rDN.routeSummary === 'Front + Back');
    ok('T12: DN 2 players',           rDN.round.players.length === 2);
    ok('T12: DN guest included',      rDN.round.players[1].name === 'Guest1');
    ok('T12: DN visibility',          rDN.round._visibility === 'friends');
    ok('T12: DN _routeMode',          rDN.round._routeMode === 'dual-nine');
    ok('T12: DN _frontNineId',        rDN.round._frontNineId === 'nine_front');
    ok('T12: DN _backNineId',         rDN.round._backNineId === 'nine_back');
    // Matching layout should be found (layout_full has front+back segments)
    ok('T12: DN routingId=layout',    rDN.round.routingId === 'layout_full');

    // ════════════════════════════════════════
    // Test 13: createFromDraft — dual-nine without matching layout
    // ════════════════════════════════════════
    // Add a third nine so front+third won't match any layout
    var _origNines = mockClub.nines;
    mockClub.nines = _origNines.concat([{
      id: 'nine_third',
      name: 'Third',
      holes: [
        { par:4, hcp:1, tees:{ tee_blue:{ yards:360 } } },
        { par:3, hcp:3, tees:{ tee_blue:{ yards:140 } } }
      ]
    }]);

    var draftDN2 = {
      clubId: 'test_club_1',
      routeMode: 'dual-nine',
      frontNineId: 'nine_front',
      frontNineName: 'Front',
      backNineId: 'nine_third',
      backNineName: 'Third',
      players: [{ type:'self', name:'Me', sortOrder:0 }],
      teeTime: todayISO,
      visibility: 'public'
    };

    var rDN2 = createFromDraft(draftDN2);
    ok('T13: DN2 success',            rDN2.success === true, rDN2.errors && rDN2.errors.join('; '));
    ok('T13: DN2 holeCount=11',       rDN2.holeCount === 11, 'got ' + rDN2.holeCount);
    ok('T13: DN2 synthetic routingId', rDN2.round.routingId.indexOf('dn:') === 0);
    ok('T13: DN2 visibility=public',  rDN2.round._visibility === 'public');

    mockClub.nines = _origNines; // restore

    // ════════════════════════════════════════
    // Test 14: createFromDraft — scheduled round (future teeTime)
    // ════════════════════════════════════════
    var draftFuture = {
      clubId: 'test_club_1',
      routeMode: 'single-layout',
      selectedLayoutId: 'layout_full',
      players: [{ type:'self', name:'Me', sortOrder:0 }],
      teeTime: futureISO,
      visibility: 'friends'
    };

    var rFuture = createFromDraft(draftFuture);
    ok('T14: future success',         rFuture.success === true);
    ok('T14: activate=false',         rFuture.activate === false);
    ok('T14: status=planned',         rFuture.round.status === 'planned');
    ok('T14: teeTime stored',         rFuture.round._teeTime === futureISO);

    // ════════════════════════════════════════
    // Test 15: normalizeDraftForCreate — validation errors
    // ════════════════════════════════════════
    var vNoDraft = normalizeDraftForCreate(null);
    ok('T15: null draft → fail',      vNoDraft.success === false);

    var vNoClub = normalizeDraftForCreate({ routeMode:'single-layout', selectedLayoutId:'x', players:[{name:'A'}] });
    ok('T15: no clubId → fail',       vNoClub.success === false && vNoClub.errors.length > 0);

    var vBadClub = normalizeDraftForCreate({ clubId:'nonexistent', routeMode:'single-layout', selectedLayoutId:'x', players:[{name:'A'}] });
    ok('T15: bad clubId → fail',      vBadClub.success === false);

    var vDNNoFront = normalizeDraftForCreate({ clubId:'test_club_1', routeMode:'dual-nine', backNineId:'nine_back', players:[{name:'A'}] });
    ok('T15: DN no front → fail',     vDNNoFront.success === false);

    var vNoPlayers = normalizeDraftForCreate({ clubId:'test_club_1', routeMode:'single-layout', selectedLayoutId:'layout_full', players:[] });
    ok('T15: no players → fail',      vNoPlayers.success === false);

    var vBlankName = normalizeDraftForCreate({ clubId:'test_club_1', routeMode:'single-layout', selectedLayoutId:'layout_full', players:[{name:''}] });
    ok('T15: blank name → fail',      vBlankName.success === false);

    var vNoRoute = normalizeDraftForCreate({ clubId:'test_club_1', players:[{name:'A'}] });
    ok('T15: no routeMode → fail',    vNoRoute.success === false);

    // ════════════════════════════════════════
    // Test 16: resolveStatus — edge cases
    // ════════════════════════════════════════
    var rsNow = resolveStatus(null);
    ok('T16: null teeTime → active',  rsNow.status === 'playing' && rsNow.activate === true);

    var rsToday = resolveStatus(todayISO);
    ok('T16: today → active',         rsToday.status === 'playing' && rsToday.activate === true);

    var rsFuture = resolveStatus(futureISO);
    ok('T16: future → planned',       rsFuture.status === 'planned' && rsFuture.activate === false);

    // ── Restore mock ──
    ClubStore.get = _origGet;

    // ── Summary ──
    console.log('');
    console.log('══════════════════════════════════════════');
    console.log('  NewRoundService._selfTest():  ' + pass + ' passed,  ' + fail + ' failed');
    console.log('══════════════════════════════════════════');
    results.forEach(function(line){ console.log(line); });
    console.log('');
    return { pass:pass, fail:fail, total:pass+fail };
  }

  // ══════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════

  return {
    // Legacy API (layout-driven)
    buildCourseSnapshot: buildCourseSnapshot,
    resolveStatus: resolveStatus,
    validateInput: validateInput,
    createNewRound: createNewRound,
    // P5 adapter API (draft-driven)
    buildHolesFromDualNine: buildHolesFromDualNine,
    buildCourseSnapshotFromDraft: buildCourseSnapshotFromDraft,
    normalizeDraftForCreate: normalizeDraftForCreate,
    createFromDraft: createFromDraft,
    // Shared
    activateRound: activateRoundV2,
    storeScheduledRound: storeScheduledRound,
    getRecentPlayers: getRecentPlayers,
    getRecentClubs: getRecentClubs,
    getRecentClubRouting: getRecentClubRouting,
    _selfTest: _selfTest
  };

})();
