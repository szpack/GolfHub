// ============================================================
// roundStore.js — Round persistence layer (Summary + Data)
//
// Single source of truth for all Round records.
// Summary = lightweight index; Data = full scorecard per round.
//
// localStorage layout:
//   golf_v6_store_meta          → { schemaVersion, migratedAt }
//   golf_v6_round_summaries     → { [roundId]: RoundSummary }
//   golf_v6_round_active        → roundId | null
//   golf_v6_rd_{roundId}        → RoundData
//
// Depends on: Round (round.js)
// ============================================================

const RoundStore = (function(){

  var LS_META      = 'golf_v6_store_meta';
  var LS_SUMMARIES = 'golf_v6_round_summaries';
  var LS_ACTIVE    = 'golf_v6_round_active';
  var LS_DATA_PFX  = 'golf_v6_rd_';
  var SCHEMA_VER   = '6.0';

  // Legacy key for migration
  var LS_OLD_ROUNDS = 'golf_v5_rounds';

  var _summaries = {};      // { roundId: RoundSummary }
  var _activeId = null;     // string | null
  var _dataCache = {};      // { roundId: RoundData } — lazy loaded

  // syncFromScorecard throttle state
  var _lastSyncTime = 0;
  var SYNC_THROTTLE_MS = 1000;

  // ── End Round constants ──
  var AUTO_FINISH_IDLE_MS  = 6 * 60 * 60 * 1000;  // 6 hours idle → auto-finish
  var GRACE_WINDOW_MS      = 24 * 60 * 60 * 1000;  // 24 hours reopen window

  /** Notify RoundIndex when a summary changes. Safe if RoundIndex not yet loaded. */
  function _notifyIndex(roundId){
    if(typeof RoundIndex === 'undefined') return;
    var s = _summaries[roundId];
    if(s) RoundIndex.indexRound(s);
    else  RoundIndex.removeRound(roundId);
  }

  // ══════════════════════════════════════════
  // SUMMARY STRUCTURE
  // ══════════════════════════════════════════

  function _defSummary(overrides){
    var now = new Date().toISOString();
    var s = {
      id:              null,
      version:         1,
      status:          'scheduled',
      isActive:        false,
      date:            now.slice(0, 10),
      teeTime:         null,

      courseId:         null,
      courseName:      '',
      routingName:     '',
      routeMode:       null,
      routeSummary:    '',

      playerIds:       [],
      playerNames:     [],
      playerCount:     0,

      holesPlanned:    18,
      holesCompleted:  0,

      startedAt:       null,
      finishedAt:      null,       // [COMPAT] kept for migration reads
      abandonedAt:     null,       // [COMPAT] kept for migration reads
      abandonReason:   '',

      // ── End Round lifecycle (v24) ──
      endedAt:         null,       // ISO — when round ended (finish or abandon)
      endedBy:         null,       // 'manual' | 'auto' | null
      lockState:       'open',     // 'open' | 'grace' | 'locked'
      reopenUntil:     null,       // ISO — grace window deadline
      reopenCount:     0,
      lastReopenedAt:  null,
      lastActivityAt:  null,       // ISO — last score/shot write
      deletedAt:       null,       // ISO — soft delete timestamp

      summaryStats:    null,
      createdAt:       now,
      updatedAt:       now
    };
    if(overrides){
      for(var k in overrides){
        if(overrides.hasOwnProperty(k) && overrides[k] !== undefined) s[k] = overrides[k];
      }
    }
    return s;
  }

  // ══════════════════════════════════════════
  // DATA STRUCTURE
  // ══════════════════════════════════════════

  function _defData(roundId){
    return {
      roundId:          roundId,
      schemaVersion:    SCHEMA_VER,

      courseSnapshot:    [],
      playersSnapshot:  [],

      // ⚠️ 过渡结构：沿用当前 player-centric scores/shots 格式。
      // 不代表 RoundData 终态。Phase C+ 可能重构为 hole-centric。
      scores:           {},
      shots:            {},

      plays:            [],
      derivedStats:     {},

      updatedAt:        new Date().toISOString()
    };
  }

  // ══════════════════════════════════════════
  // WRITE: putRound (create/full-update)
  // ══════════════════════════════════════════

  /**
   * Create or fully replace a Round in the store.
   * Builds both Summary and Data from a Round object + courseSnapshot.
   *
   * @param {Object} round - Round object from Round.createRound()
   * @param {Array}  [snapshot] - courseSnapshot array [{number,par,yards,holeId}]
   */
  function putRound(round, snapshot){
    if(!round || !round.id) return;

    var now = new Date().toISOString();

    // Build Summary
    var playerIds = [];
    var playerNames = [];
    (round.players || []).forEach(function(p){
      if(p.playerId) playerIds.push(p.playerId);
      playerNames.push(p.name || '');
    });

    var summary = _defSummary({
      id:              round.id,
      status:          Round.normalizeStatus(round.status) || 'scheduled',
      isActive:        _activeId === round.id,
      date:            round.date || now.slice(0, 10),
      teeTime:         round._teeTime || null,

      courseId:         round.courseId || null,
      courseName:      round._clubName || '',
      routingName:     round._routingName || '',
      routeMode:       round._routeMode || null,
      routeSummary:    round._routeSummary || '',

      playerIds:       playerIds,
      playerNames:     playerNames,
      playerCount:     (round.players || []).length,

      holesPlanned:    round.holeCount || 18,
      holesCompleted:  0,

      startedAt:       round.status === 'in_progress' ? now : null,
      finishedAt:      null,
      createdAt:       round.createdAt || now,
      updatedAt:       round.updatedAt || now
    });

    _summaries[round.id] = summary;
    _persistSummaries();
    _notifyIndex(round.id);

    // Build Data
    var data = _defData(round.id);
    data.courseSnapshot = snapshot ? snapshot.slice() : (round._courseSnapshot || []);
    data.playersSnapshot = (round.players || []).map(function(p){
      return {
        roundPlayerId: p.roundPlayerId,
        playerId:      p.playerId || null,
        buddyId:       p.buddyId || null,
        name:          p.name || '',
        color:         p.color || ''
      };
    });
    data.scores = round.scores ? JSON.parse(JSON.stringify(round.scores)) : {};
    data.shots  = round.shots  ? JSON.parse(JSON.stringify(round.shots))  : {};
    data.updatedAt = now;

    _dataCache[round.id] = data;
    _persistData(round.id);
  }

  // ══════════════════════════════════════════
  // WRITE: putSummary (partial update)
  // ══════════════════════════════════════════

  /**
   * Merge-update Summary fields for a round.
   * @param {string} roundId
   * @param {Object} patch - fields to merge
   */
  function putSummary(roundId, patch){
    var s = _summaries[roundId];
    if(!s) return;
    for(var k in patch){
      if(patch.hasOwnProperty(k) && k !== 'id') s[k] = patch[k];
    }
    s.updatedAt = new Date().toISOString();
    _persistSummaries();
    _notifyIndex(roundId);
  }

  // ══════════════════════════════════════════
  // WRITE: putData (partial update)
  // ══════════════════════════════════════════

  /**
   * Merge-update Data fields for a round.
   * @param {string} roundId
   * @param {Object} patch - fields to merge (scores, shots, derivedStats, etc.)
   */
  function putData(roundId, patch){
    var data = _loadData(roundId);
    if(!data) return;
    for(var k in patch){
      if(patch.hasOwnProperty(k) && k !== 'roundId') data[k] = patch[k];
    }
    data.updatedAt = new Date().toISOString();
    _dataCache[roundId] = data;
    _persistData(roundId);
  }

  // ══════════════════════════════════════════
  // SCORE WRITES (Phase C — authoritative)
  // ══════════════════════════════════════════

  // ── Dirty flags for deferred persistence ──
  var _dataDirty     = {};  // { roundId: true } — data needs localStorage persist
  var _progressDirty = {};  // { roundId: true } — holesCompleted needs recompute

  /** Default empty hole for score init */
  var _EMPTY_HOLE = { gross:null, putts:null, penalties:0, status:'not_started', notes:'', shots:[] };
  function _newHole(){ return { gross:null, putts:null, penalties:0, status:'not_started', notes:'', shots:[] }; }

  /**
   * Ensure scores[rpId].holes exists and has at least holeIdx+1 entries.
   * @returns {Object} the hole at holeIdx
   */
  function _ensureDataHole(data, roundId, rpId, holeIdx){
    if(!data.scores[rpId]){
      var hc = (_summaries[roundId] && _summaries[roundId].holesPlanned) || 18;
      data.scores[rpId] = { holes: [] };
      for(var i = 0; i < hc; i++) data.scores[rpId].holes.push(_newHole());
    }
    var holes = data.scores[rpId].holes;
    while(holes.length <= holeIdx) holes.push(_newHole());
    return holes[holeIdx];
  }

  /** Mark data dirty — defers localStorage persist to flush(). */
  function _markDataDirty(roundId){
    _dataDirty[roundId] = true;
    _progressDirty[roundId] = true;
  }

  // ── Score writes ──

  /**
   * Update a single hole's score fields (merge-patch).
   * Only touches the fields present in patch; other hole fields are preserved.
   * Does NOT persist immediately — call flush() from the save path.
   *
   * @param {string} roundId
   * @param {string} rpId       - roundPlayerId
   * @param {number} holeIdx    - 0-based hole index
   * @param {Object} patch      - { gross?, putts?, penalties?, status?, notes? }
   */
  function updateHoleScore(roundId, rpId, holeIdx, patch){
    var data = _loadData(roundId);
    if(!data) return;

    var hole = _ensureDataHole(data, roundId, rpId, holeIdx);

    // Merge patch — only overwrite fields present in patch
    for(var k in patch){
      if(patch.hasOwnProperty(k)) hole[k] = patch[k];
    }

    var now = new Date().toISOString();
    data.updatedAt = now;
    _dataCache[roundId] = data;
    _markDataDirty(roundId);

    // Track last activity for auto-finish
    var s = _summaries[roundId];
    if(s && s.lastActivityAt !== now){
      s.lastActivityAt = now;
      // Defer persist — will be written by flushProgress
    }
  }

  /**
   * Clear a single hole's score to empty state.
   * @param {string} roundId
   * @param {string} rpId
   * @param {number} holeIdx
   */
  function clearHoleScore(roundId, rpId, holeIdx){
    var data = _loadData(roundId);
    if(!data || !data.scores[rpId]) return;
    var holes = data.scores[rpId].holes;
    if(holeIdx < 0 || holeIdx >= holes.length) return;

    holes[holeIdx] = _newHole();

    var now = new Date().toISOString();
    data.updatedAt = now;
    _dataCache[roundId] = data;
    _markDataDirty(roundId);

    var s = _summaries[roundId];
    if(s && s.lastActivityAt !== now) s.lastActivityAt = now;
  }

  // ── Shot writes ──

  /**
   * Update a single shot's fields (merge-patch).
   * @param {string} roundId
   * @param {string} rpId
   * @param {number} holeIdx
   * @param {number} shotIdx
   * @param {Object} patch  - { type?, purpose?, result?, flags?, notes?, toPin?, lastTag? }
   */
  function updateShot(roundId, rpId, holeIdx, shotIdx, patch){
    var data = _loadData(roundId);
    if(!data) return;

    // Navigate to shots array: data.scores[rpId].holes[holeIdx].shots[shotIdx]
    var hole = _ensureDataHole(data, roundId, rpId, holeIdx);
    if(!Array.isArray(hole.shots)) hole.shots = [];
    if(shotIdx < 0 || shotIdx >= hole.shots.length) return;

    var shot = hole.shots[shotIdx];
    for(var k in patch){
      if(patch.hasOwnProperty(k)) shot[k] = patch[k];
    }

    var now = new Date().toISOString();
    data.updatedAt = now;
    _dataCache[roundId] = data;
    _markDataDirty(roundId);

    var s = _summaries[roundId];
    if(s && s.lastActivityAt !== now) s.lastActivityAt = now;
  }

  // ── Deferred persistence ──

  /**
   * Recompute holesCompleted in Summary (only if dirty).
   */
  function recomputeProgress(roundId){
    if(!_progressDirty[roundId]) return;
    delete _progressDirty[roundId];

    var data = _dataCache[roundId] || _loadData(roundId);
    var s = _summaries[roundId];
    if(!data || !s) return;

    var holesPlanned = s.holesPlanned || 18;
    var maxCompleted = 0;

    for(var rpId in data.scores){
      var holes = (data.scores[rpId] && data.scores[rpId].holes) || [];
      var completed = 0;
      for(var i = 0; i < Math.min(holes.length, holesPlanned); i++){
        if(holes[i] && holes[i].gross != null && holes[i].gross >= 1) completed++;
      }
      if(completed > maxCompleted) maxCompleted = completed;
    }

    if(s.holesCompleted !== maxCompleted){
      s.holesCompleted = maxCompleted;
      s.updatedAt = new Date().toISOString();
      _persistSummaries();
    }
  }

  /**
   * Flush all dirty data + progress to localStorage.
   * Called from D.save() path (350ms throttle via scheduleSave).
   */
  function flushProgress(){
    // 1. Persist dirty RoundData
    for(var rid in _dataDirty){
      if(_dataCache[rid]) _persistData(rid);
      delete _dataDirty[rid];
    }
    // 2. Recompute dirty progress
    for(var rid2 in _progressDirty){
      recomputeProgress(rid2);
    }
    // 3. Lazy lifecycle checks
    checkAutoFinish();
    checkGraceLock();
  }

  // ══════════════════════════════════════════
  // WRITE: remove
  // ══════════════════════════════════════════

  /**
   * Soft-delete a round (sets deletedAt, preserves data).
   * Use purge() for physical removal.
   */
  function remove(roundId){
    if(!roundId) return;
    var s = _summaries[roundId];
    if(!s) return;

    if(_activeId === roundId){
      _activeId = null;
      _persistActive();
    }

    s.deletedAt = new Date().toISOString();
    _persistSummaries();
    _notifyIndex(roundId);
  }

  /**
   * Physically delete a round from storage (irreversible).
   */
  function purge(roundId){
    if(!roundId) return;
    if(_activeId === roundId){
      _activeId = null;
      _persistActive();
    }
    delete _summaries[roundId];
    delete _dataCache[roundId];
    _persistSummaries();
    try { localStorage.removeItem(LS_DATA_PFX + roundId); } catch(e){}
    _notifyIndex(roundId);
  }

  // ══════════════════════════════════════════
  // READ
  // ══════════════════════════════════════════

  /** Get Summary by ID (or null). */
  function get(roundId){
    return _summaries[roundId] || null;
  }

  /** Get Data by ID (lazy-load from localStorage). */
  function getData(roundId){
    return _loadData(roundId);
  }

  /**
   * List all Summaries, with optional filtering and sorting.
   * @param {Object} [opts]
   * @param {string} [opts.sortBy]    - 'updatedAt'|'createdAt'|'date'|'teeTime' (default 'updatedAt')
   * @param {string} [opts.sortOrder] - 'asc'|'desc' (default 'desc')
   * @param {Array}  [opts.status]    - filter by status values, e.g. ['finished','abandoned']
   * @param {number} [opts.limit]
   * @returns {RoundSummary[]}
   */
  function list(opts){
    opts = opts || {};
    var sortBy    = opts.sortBy    || 'updatedAt';
    var sortOrder = opts.sortOrder || 'desc';
    var statusFilter = opts.status || null;
    var limit     = opts.limit     || 0;

    var arr = [];
    for(var id in _summaries){
      var s = _summaries[id];
      if(s.deletedAt) continue;  // skip soft-deleted
      if(statusFilter && statusFilter.indexOf(s.status) < 0) continue;
      arr.push(s);
    }

    arr.sort(function(a, b){
      var va = a[sortBy] || '';
      var vb = b[sortBy] || '';
      if(va < vb) return sortOrder === 'desc' ? 1 : -1;
      if(va > vb) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    if(limit > 0) arr = arr.slice(0, limit);
    return arr;
  }

  // ══════════════════════════════════════════
  // ACTIVE ROUND
  // ══════════════════════════════════════════

  function setActive(roundId){
    // Clear isActive on old
    if(_activeId && _summaries[_activeId]){
      _summaries[_activeId].isActive = false;
    }
    _activeId = roundId || null;
    // Set isActive on new
    if(_activeId && _summaries[_activeId]){
      _summaries[_activeId].isActive = true;
    }
    _persistActive();
    _persistSummaries();
  }

  function getActiveId(){
    return _activeId;
  }

  // ══════════════════════════════════════════
  // STATUS MACHINE
  // ══════════════════════════════════════════

  /** Legal transitions: { from: [to1, to2, ...] } */
  var _STATUS_TRANSITIONS = {
    'scheduled':   ['in_progress', 'abandoned'],
    'in_progress': ['finished', 'abandoned'],
    'finished':    ['in_progress'],   // reopen (grace window)
    'abandoned':   ['in_progress']    // reopen (store level)
  };

  function _validateTransition(from, to){
    var allowed = _STATUS_TRANSITIONS[from];
    if(!allowed || allowed.indexOf(to) < 0){
      console.warn('[RoundStore] illegal transition:', from, '→', to);
      return false;
    }
    return true;
  }

  // ══════════════════════════════════════════
  // LIFECYCLE: startRound / finishRound / abandonRound
  // ══════════════════════════════════════════

  /**
   * Start a scheduled round: scheduled → in_progress.
   * Sets startedAt timestamp.
   * @param {string} roundId
   * @returns {boolean} success
   */
  function startRound(roundId){
    var s = _summaries[roundId];
    if(!s) return false;
    if(!_validateTransition(s.status, 'in_progress')) return false;

    var now = new Date().toISOString();
    putSummary(roundId, {
      status:    'in_progress',
      startedAt: now
    });
    return true;
  }

  /**
   * Finish an in-progress round: in_progress → finished.
   * Computes derivedStats, sets endedAt, opens grace window.
   * @param {string} roundId
   * @param {Object} [opts]
   * @param {string} [opts.endedBy] - 'manual' | 'auto' (default 'manual')
   * @returns {boolean} success
   */
  function finishRound(roundId, opts){
    var s = _summaries[roundId];
    if(!s) return false;
    if(!_validateTransition(s.status, 'finished')) return false;

    opts = opts || {};
    var now = new Date().toISOString();
    var stats = _computeDerivedStats(roundId);
    var reopenDeadline = new Date(Date.now() + GRACE_WINDOW_MS).toISOString();

    putSummary(roundId, {
      status:         'finished',
      finishedAt:     now,
      endedAt:        now,
      endedBy:        opts.endedBy || 'manual',
      lockState:      'grace',
      reopenUntil:    reopenDeadline,
      holesCompleted: stats ? stats.holesCompleted : (s.holesCompleted || 0),
      summaryStats:   _buildSummaryStats(stats)
    });

    if(stats){
      putData(roundId, { derivedStats: stats });
    }

    // Clear active if this was the active round
    if(_activeId === roundId){
      setActive(null);
    }
    return true;
  }

  /**
   * Abandon a round: in_progress|scheduled → abandoned.
   * Records abandon reason, sets lockState=locked immediately.
   * @param {string} roundId
   * @param {string} [reason] - abandon reason
   * @returns {boolean} success
   */
  function abandonRound(roundId, reason){
    var s = _summaries[roundId];
    if(!s) return false;
    if(!_validateTransition(s.status, 'abandoned')) return false;

    var now = new Date().toISOString();
    var stats = _computeDerivedStats(roundId);

    putSummary(roundId, {
      status:         'abandoned',
      abandonedAt:    now,
      abandonReason:  reason || '',
      endedAt:        now,
      endedBy:        'manual',
      lockState:      'locked',
      reopenUntil:    null,
      holesCompleted: stats ? stats.holesCompleted : (s.holesCompleted || 0),
      summaryStats:   _buildSummaryStats(stats)
    });

    if(stats){
      putData(roundId, { derivedStats: stats });
    }

    // Clear active if this was the active round
    if(_activeId === roundId){
      setActive(null);
    }
    return true;
  }

  // ══════════════════════════════════════════
  // LIFECYCLE: reopenRound / checkAutoFinish / checkGraceLock
  // ══════════════════════════════════════════

  /**
   * Reopen a finished round (grace window) or abandoned round.
   * finished + grace → in_progress (endedAt preserved, lockState → open)
   * abandoned (store-level) → in_progress
   * @param {string} roundId
   * @returns {boolean} success
   */
  function reopenRound(roundId){
    var s = _summaries[roundId];
    if(!s) return false;

    if(s.status === 'finished'){
      // Must be in grace window
      if(s.lockState === 'locked'){
        console.warn('[RoundStore] cannot reopen locked round:', roundId);
        return false;
      }
      if(!_validateTransition(s.status, 'in_progress')) return false;

      var now = new Date().toISOString();
      putSummary(roundId, {
        status:          'in_progress',
        lockState:       'open',
        reopenCount:     (s.reopenCount || 0) + 1,
        lastReopenedAt:  now
        // endedAt preserved — records when it was first ended
      });
      return true;
    }

    if(s.status === 'abandoned'){
      if(!_validateTransition(s.status, 'in_progress')) return false;

      var now2 = new Date().toISOString();
      putSummary(roundId, {
        status:          'in_progress',
        lockState:       'open',
        reopenCount:     (s.reopenCount || 0) + 1,
        lastReopenedAt:  now2
      });
      return true;
    }

    return false;
  }

  /**
   * Check all in_progress rounds for auto-finish condition.
   * Skips the currently active round.
   * Auto-finish if: idle > AUTO_FINISH_IDLE_MS AND holesCompleted >= holesPlanned.
   */
  function checkAutoFinish(){
    var now = Date.now();
    for(var id in _summaries){
      var s = _summaries[id];
      if(s.status !== 'in_progress') continue;
      if(s.deletedAt) continue;
      // Skip active round — user is still in session
      if(id === _activeId) continue;

      // Need enough holes played
      var hPlanned = s.holesPlanned || 18;
      var hDone = s.holesCompleted || 0;
      if(hDone < hPlanned) continue;

      // Check idle time
      var lastAct = s.lastActivityAt || s.updatedAt || s.createdAt;
      var idleMs = now - new Date(lastAct).getTime();
      if(idleMs >= AUTO_FINISH_IDLE_MS){
        console.log('[RoundStore] auto-finishing idle round:', id, 'idle:', Math.round(idleMs/60000), 'min');
        finishRound(id, { endedBy: 'auto' });
      }
    }
  }

  /**
   * Check all grace-window rounds and lock expired ones.
   */
  function checkGraceLock(){
    var now = new Date().toISOString();
    for(var id in _summaries){
      var s = _summaries[id];
      if(s.lockState !== 'grace') continue;
      if(s.deletedAt) continue;
      if(!s.reopenUntil) continue;

      if(now >= s.reopenUntil){
        console.log('[RoundStore] grace expired, locking:', id);
        putSummary(id, { lockState: 'locked', reopenUntil: null });
      }
    }
  }

  // ══════════════════════════════════════════
  // DERIVED STATS (minimal version)
  // ══════════════════════════════════════════

  /**
   * Compute derived statistics from RoundData (scores only, no shots).
   * Keys by playerId (falls back to roundPlayerId if no playerId).
   *
   * @param {string} roundId
   * @returns {Object|null} derivedStats (full version, stored in RoundData)
   */
  function _computeDerivedStats(roundId){
    var data = _loadData(roundId);
    var s = _summaries[roundId];
    if(!data || !s) return null;

    var snapshot = data.courseSnapshot || [];
    var scores = data.scores || {};
    var playersSnap = data.playersSnapshot || [];
    var holesPlanned = s.holesPlanned || 18;

    var maxCompleted = 0;
    var playerStats = {};

    for(var pi = 0; pi < playersSnap.length; pi++){
      var pSnap = playersSnap[pi];
      var rpId = pSnap.roundPlayerId;
      if(!rpId) continue;
      var pScores = scores[rpId];
      if(!pScores) continue;

      // Key by playerId for cross-round player history; fall back to rpId
      var statKey = pSnap.playerId || rpId;

      var holes = pScores.holes || [];
      var totalGross = 0, toPar = 0;
      var birdieOrBetter = 0, pars = 0, bogeys = 0, doublePlus = 0;
      var totalPutts = 0, completed = 0;

      for(var hi = 0; hi < Math.min(holes.length, holesPlanned); hi++){
        var h = holes[hi];
        if(!h || h.gross == null || h.gross < 1) continue;

        var par = (snapshot[hi] && snapshot[hi].par != null) ? snapshot[hi].par : 4;
        var delta = h.gross - par;

        totalGross += h.gross;
        toPar += delta;
        completed++;

        if(delta <= -1)      birdieOrBetter++;
        else if(delta === 0) pars++;
        else if(delta === 1) bogeys++;
        else                 doublePlus++;

        if(h.putts != null && h.putts >= 0) totalPutts += h.putts;
      }

      if(completed > maxCompleted) maxCompleted = completed;

      playerStats[statKey] = {
        roundPlayerId:  rpId,
        name:           pSnap.name || '',
        totalGross:     totalGross,
        toPar:          toPar,
        birdieOrBetter: birdieOrBetter,
        pars:           pars,
        bogeys:         bogeys,
        doublePlus:     doublePlus,
        totalPutts:     totalPutts,
        holesCompleted: completed
      };
    }

    return {
      holesCompleted: maxCompleted,
      holesPlanned:   holesPlanned,
      players:        playerStats
    };
  }

  /**
   * Build lightweight summaryStats from full derivedStats.
   * Stored in RoundSummary — enough for list rendering without loading RoundData.
   *
   * @param {Object} derivedStats - full stats from _computeDerivedStats
   * @returns {Object} summaryStats { holesCompleted, holesPlanned, players: { [key]: { name, totalGross, toPar } } }
   */
  function _buildSummaryStats(derivedStats){
    if(!derivedStats) return null;
    var players = {};
    for(var key in derivedStats.players){
      var p = derivedStats.players[key];
      players[key] = {
        name:       p.name || '',
        totalGross: p.totalGross,
        toPar:      p.toPar
      };
    }
    return {
      holesCompleted: derivedStats.holesCompleted,
      holesPlanned:   derivedStats.holesPlanned,
      players:        players
    };
  }

  // ══════════════════════════════════════════
  // BRIDGE: syncFromScorecard (Phase A transition)
  // ══════════════════════════════════════════

  /**
   * Sync current D.sc() scores/shots into the active Round's Data.
   * Throttled: at most once per SYNC_THROTTLE_MS.
   * Phase C will make this obsolete.
   */
  function syncFromScorecard(){
    if(!_activeId) return;
    var now = Date.now();
    if(now - _lastSyncTime < SYNC_THROTTLE_MS) return;
    _lastSyncTime = now;

    if(typeof D === 'undefined') return;
    var sc = D.sc();
    if(!sc) return;

    // Extract scores (clone to avoid reference sharing)
    var scores = {};
    var shots = {};
    for(var rpId in (sc.scores || {})){
      var srcHoles = (sc.scores[rpId] && sc.scores[rpId].holes) || [];
      scores[rpId] = {
        holes: srcHoles.map(function(h){
          if(!h) return { gross:null, putts:null, penalties:0, status:'not_started' };
          return {
            gross:     h.gross != null ? h.gross : null,
            putts:     h.putts != null ? h.putts : null,
            penalties: h.penalties || 0,
            status:    h.status || 'not_started'
          };
        })
      };
      // Extract shots from within holes (D.sc format nests shots in holes)
      shots[rpId] = srcHoles.map(function(h){
        if(!h || !Array.isArray(h.shots)) return [];
        return h.shots.map(function(s){
          return {
            type:    s.type || null,
            purpose: s.purpose || null,
            result:  s.result || null,
            flags:   Array.isArray(s.flags) ? s.flags.slice() : [],
            notes:   s.notes || '',
            lastTag: s.lastTag || null,
            toPin:   s.toPin != null ? s.toPin : null
          };
        });
      });
    }

    // Compute holesCompleted (any player's first-player completed count)
    var holesCompleted = 0;
    var players = sc.players || [];
    if(players.length > 0){
      var firstRpId = players[0].roundPlayerId || players[0].id;
      var firstHoles = scores[firstRpId] ? scores[firstRpId].holes : [];
      for(var i = 0; i < firstHoles.length; i++){
        if(firstHoles[i] && firstHoles[i].gross != null && firstHoles[i].gross >= 1){
          holesCompleted++;
        }
      }
    }

    // Update Data
    putData(_activeId, {
      scores: scores,
      shots:  shots
    });

    // Update Summary progress
    putSummary(_activeId, {
      holesCompleted: holesCompleted
    });
  }

  // ══════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════

  function _persistSummaries(){
    try {
      localStorage.setItem(LS_SUMMARIES, JSON.stringify(_summaries));
    } catch(e){ console.warn('[RoundStore] persist summaries failed:', e); }
  }

  function _persistActive(){
    try {
      if(_activeId){
        localStorage.setItem(LS_ACTIVE, _activeId);
      } else {
        localStorage.removeItem(LS_ACTIVE);
      }
    } catch(e){}
  }

  function _persistData(roundId){
    var data = _dataCache[roundId];
    if(!data) return;
    try {
      localStorage.setItem(LS_DATA_PFX + roundId, JSON.stringify(data));
    } catch(e){ console.warn('[RoundStore] persist data failed:', roundId, e); }
  }

  function _persistMeta(){
    try {
      localStorage.setItem(LS_META, JSON.stringify({
        schemaVersion: SCHEMA_VER,
        migratedAt: new Date().toISOString()
      }));
    } catch(e){}
  }

  // ══════════════════════════════════════════
  // LOAD
  // ══════════════════════════════════════════

  /** Load summaries + activeId from localStorage. Data is lazy-loaded. */
  function load(){
    // Check if v6 store exists
    var meta = null;
    try {
      var rawMeta = localStorage.getItem(LS_META);
      if(rawMeta) meta = JSON.parse(rawMeta);
    } catch(e){}

    if(meta && meta.schemaVersion){
      // Load v6
      _loadV6();
    } else {
      // Try migrate from v5
      _migrateFromV5();
    }

    console.log('[RoundStore] loaded', Object.keys(_summaries).length, 'rounds, active:', _activeId);
  }

  function _loadV6(){
    // Summaries
    try {
      var raw = localStorage.getItem(LS_SUMMARIES);
      if(raw){
        var parsed = JSON.parse(raw);
        if(parsed && typeof parsed === 'object'){
          _summaries = parsed;
        }
      }
    } catch(e){
      console.warn('[RoundStore] summaries load error:', e);
      _summaries = {};
    }

    // Active
    try {
      _activeId = localStorage.getItem(LS_ACTIVE) || null;
    } catch(e){
      _activeId = null;
    }

    // Ensure isActive consistency
    for(var id in _summaries){
      _summaries[id].isActive = (id === _activeId);
    }
  }

  /** Lazy-load a single RoundData from localStorage. */
  function _loadData(roundId){
    if(!roundId) return null;
    if(_dataCache[roundId]) return _dataCache[roundId];

    try {
      var raw = localStorage.getItem(LS_DATA_PFX + roundId);
      if(raw){
        var data = JSON.parse(raw);
        _dataCache[roundId] = data;
        return data;
      }
    } catch(e){
      console.warn('[RoundStore] data load error:', roundId, e);
    }
    return null;
  }

  // ══════════════════════════════════════════
  // MIGRATION: golf_v5_rounds → v6
  // ══════════════════════════════════════════

  function _migrateFromV5(){
    _summaries = {};
    _activeId = null;

    try {
      var raw = localStorage.getItem(LS_OLD_ROUNDS);
      if(!raw){ _persistMeta(); return; }

      var old = JSON.parse(raw);
      if(!old || !old.rounds){  _persistMeta(); return; }

      var count = 0;
      for(var rid in old.rounds){
        var r = old.rounds[rid];
        if(!r) continue;

        // Normalize round via Round module if available
        if(typeof Round !== 'undefined' && Round.normalizeRound){
          r = Round.normalizeRound(r);
        }

        // Build Summary from old Round object
        var playerIds = [];
        var playerNames = [];
        (r.players || []).forEach(function(p){
          if(p.playerId) playerIds.push(p.playerId);
          playerNames.push(p.name || '');
        });

        var status = 'in_progress';
        if(typeof Round !== 'undefined' && Round.normalizeStatus){
          status = Round.normalizeStatus(r.status) || 'in_progress';
        }

        var holesCompleted = 0;
        if(r.players && r.players.length > 0 && r.scores){
          var firstRp = r.players[0].roundPlayerId;
          var firstH = r.scores[firstRp] ? (r.scores[firstRp].holes || []) : [];
          for(var i = 0; i < firstH.length; i++){
            if(firstH[i] && firstH[i].gross != null) holesCompleted++;
          }
        }

        var summary = _defSummary({
          id:              rid,
          status:          status,
          isActive:        (rid === old.activeRoundId),
          date:            r.date || (r.createdAt || '').slice(0, 10),
          teeTime:         r._teeTime || null,
          courseId:         r.courseId || null,
          courseName:      r._clubName || (r.event && r.event.name) || '',
          routingName:     r._routingName || '',
          routeMode:       r._routeMode || null,
          routeSummary:    r._routeSummary || '',
          playerIds:       playerIds,
          playerNames:     playerNames,
          playerCount:     (r.players || []).length,
          holesPlanned:    r.holeCount || 18,
          holesCompleted:  holesCompleted,
          createdAt:       r.createdAt || new Date().toISOString(),
          updatedAt:       r.updatedAt || new Date().toISOString()
        });

        _summaries[rid] = summary;

        // Build Data
        var data = _defData(rid);
        data.courseSnapshot = r._courseSnapshot || [];
        data.playersSnapshot = (r.players || []).map(function(p){
          return {
            roundPlayerId: p.roundPlayerId,
            playerId:      p.playerId || null,
            buddyId:       p.buddyId || null,
            name:          p.name || '',
            color:         p.color || ''
          };
        });
        data.scores = r.scores ? JSON.parse(JSON.stringify(r.scores)) : {};
        data.shots  = r.shots  ? JSON.parse(JSON.stringify(r.shots))  : {};

        _dataCache[rid] = data;
        _persistData(rid);
        count++;
      }

      if(old.activeRoundId){
        _activeId = old.activeRoundId;
      }

      _persistSummaries();
      _persistActive();
      _persistMeta();

      console.log('[RoundStore] migrated', count, 'rounds from v5');
    } catch(e){
      console.warn('[RoundStore] v5 migration error:', e);
      _persistMeta();
    }
  }

  // ══════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════

  load();

  return {
    // Write
    putRound:            putRound,
    putSummary:          putSummary,
    putData:             putData,
    remove:              remove,
    purge:               purge,

    // Read
    get:                 get,
    getData:             getData,
    list:                list,

    // Active
    setActive:           setActive,
    getActiveId:         getActiveId,

    // Score writes (Phase C — authoritative)
    updateHoleScore:     updateHoleScore,
    clearHoleScore:      clearHoleScore,
    updateShot:          updateShot,
    recomputeProgress:   recomputeProgress,
    flushProgress:       flushProgress,

    // Lifecycle
    startRound:          startRound,
    finishRound:         finishRound,
    abandonRound:        abandonRound,
    reopenRound:         reopenRound,
    checkAutoFinish:     checkAutoFinish,
    checkGraceLock:      checkGraceLock,

    // Bridge (Phase A transition)
    syncFromScorecard:   syncFromScorecard,

    // Init
    load:                load
  };

})();
