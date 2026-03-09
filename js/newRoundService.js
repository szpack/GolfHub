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
    if(!teeTime) return { status: 'playing', activate: true };

    var teeDate = new Date(teeTime);
    var now = new Date();
    var todayStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    var teeStr = teeDate.getFullYear() + '-' +
      String(teeDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(teeDate.getDate()).padStart(2, '0');

    if(teeStr === todayStr){
      return { status: 'playing', activate: true };
    }
    return { status: 'planned', activate: false };
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
  // CREATE ROUND
  // ══════════════════════════════════════════

  /**
   * Create a new round from user selections.
   *
   * @param {Object} input
   * @param {string} input.clubId
   * @param {string} input.layoutId
   * @param {string} [input.teeSetId]
   * @param {Array}  input.players - [{name, playerId?}]
   * @param {string} [input.teeTime] - ISO datetime
   * @param {string} [input.title]
   * @returns {{ round: Object, snapshot: Array, activate: boolean, title: string } | null}
   */
  function createNewRound(input){
    // 1. Build course snapshot
    var cs = buildCourseSnapshot(input.clubId, input.layoutId, input.teeSetId);
    if(!cs || cs.holeCount === 0) return null;

    // 2. Resolve status
    var res = resolveStatus(input.teeTime);

    // 3. Build player inputs
    var playerInputs = [];
    for(var i = 0; i < (input.players || []).length; i++){
      var p = input.players[i];
      playerInputs.push({
        name: p.name,
        playerId: p.playerId || null
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

    // ── Course fields ──
    sc.course.clubId            = round.courseId;
    sc.course.routingId         = round.routingId;
    sc.course.clubName          = result.courseName;
    sc.course.routingName       = result.routingName;
    sc.course.routingSourceType = 'club_layout';
    sc.course.routingMeta       = {};
    sc.course.courseName        = result.title;
    sc.course.holeCount         = count;
    sc.course.holeSnapshot      = snapshot.slice();

    // ── Meta ──
    sc.meta.roundId   = round.id;
    sc.meta.createdAt = round.createdAt;
    sc.meta.updatedAt = round.updatedAt;
    sc.meta.clubId    = round.courseId;

    // ── Players ──
    sc.players = [];
    sc.scores  = {};
    for(var i = 0; i < round.players.length; i++){
      var rp = round.players[i];
      sc.players.push(D.defPlayer(
        rp.roundPlayerId,
        rp.name,
        { playerId: rp.playerId, colorKey: rp.color || null }
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
    // Use D.putRound for non-active rounds
    // putRound refuses to overwrite activeRoundId, which is correct here
    D.putRound(round);
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
      // Remove existing entry with same name
      history = history.filter(function(h){ return h.name !== p.name; });
      // Add to front
      history.unshift({ name: p.name, playerId: p.playerId || null });
    }
    // Keep max 20
    if(history.length > 20) history = history.slice(0, 20);
    ws.playerHistory = history;
  }

  /**
   * Get recent player names from history.
   * @param {number} [limit=8]
   * @returns {Array<{name, playerId}>}
   */
  function getRecentPlayers(limit){
    var ws = D.ws();
    var history = ws.playerHistory || [];
    return history.slice(0, limit || 8);
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
  // PUBLIC API
  // ══════════════════════════════════════════

  return {
    buildCourseSnapshot: buildCourseSnapshot,
    resolveStatus: resolveStatus,
    createNewRound: createNewRound,
    activateRound: activateRound,
    storeScheduledRound: storeScheduledRound,
    getRecentPlayers: getRecentPlayers,
    getRecentClubs: getRecentClubs
  };

})();
