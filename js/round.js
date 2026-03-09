// ============================================================
// round.js — Round Data Model (Pure Functions)
//
// Round = 一次真实发生的球局实例。
// 核心容器：球场引用、球员快照、每洞成绩、可选击球记录。
//
// 设计原则:
//   1. Round 只保存本场球的事实数据（truth fields）
//   2. 所有 totals 从 holes 重算（derived fields）
//   3. UI 状态不进入 Round
//   4. 球场数据只保存引用（courseId + routingId）
//   5. API 尽量纯函数：input round → return new/mutated round
//
// 字段标注约定:
//   [TRUTH]   — 事实字段，Round 的独立数据真相
//   [DERIVED] — 派生字段，可从 truth 重算，不可作为唯一来源
//   [COMPAT]  — 兼容桥接字段，过渡期保留，后续移除
//
// Dependencies: none (pure functions)
// Bridge functions (fromScorecard/toScorecard) accept D.sc() as parameter,
// do NOT call D.sc() directly — no runtime coupling.
// ============================================================

const Round = (function(){

  // ══════════════════════════════════════════
  // CONSTANTS
  // ══════════════════════════════════════════

  /** [TRUTH] Round-level status */
  var ROUND_STATUS = ['planned','playing','finished'];

  /** [TRUTH] Hole-level score status (Round domain) */
  var HOLE_STATUS = ['empty','valid','par','pickup','dnf','x'];

  // ── Status mapping: Scorecard (D.sc) ↔ Round ──

  var SC_TO_ROUND = {
    'not_started': 'empty',
    'in_progress': 'valid',
    'completed':   'valid',
    'picked_up':   'pickup'
  };

  var ROUND_TO_SC = {
    'empty':  'not_started',
    'valid':  'completed',
    'par':    'completed',
    'pickup': 'picked_up',
    'dnf':    'picked_up',
    'x':      'picked_up'
  };

  // ══════════════════════════════════════════
  // INTERNAL HELPERS
  // ══════════════════════════════════════════

  function _genId(prefix){
    prefix = prefix || 'id';
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
  }

  /**
   * Generate a round ID with date-based format for readability and sort order.
   * Format: rnd_YYYYMMDD_<ts36><rand6>
   * Uniqueness: millisecond timestamp (base36) + 6 random chars = ~2.1B combinations per ms.
   * For single-user localStorage, collision is effectively impossible.
   */
  function _genRoundId(){
    var d = new Date();
    var ds = d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    var ts = Date.now().toString(36);
    var rand = Math.random().toString(36).slice(2, 8);
    return 'rnd_' + ds + '_' + ts + rand;
  }

  function _now(){ return new Date().toISOString(); }

  function _deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }

  /** Default hole score — minimal truth */
  function _defHole(){
    return { gross:null, status:'empty' };
  }

  /** Initialize scores entry for a player */
  function _ensureScores(round, rpId){
    if(!round.scores[rpId]){
      round.scores[rpId] = {
        holes: Array.from({length:round.holeCount}, _defHole)
      };
    }
    // Pad to holeCount
    var holes = round.scores[rpId].holes;
    while(holes.length < round.holeCount) holes.push(_defHole());
  }

  /** Initialize shots entry for a player */
  function _ensureShots(round, rpId){
    if(!round.shots[rpId]){
      round.shots[rpId] = Array.from({length:round.holeCount}, function(){ return []; });
    }
    while(round.shots[rpId].length < round.holeCount) round.shots[rpId].push([]);
  }

  function _touch(round){ round.updatedAt = _now(); }

  /**
   * Get par for a hole, trying multiple sources:
   *   1. courseHoles parameter (from course DB at call site)
   *   2. round._courseSnapshot [COMPAT]
   *   3. Default 4
   */
  function _holePar(round, courseHoles, i){
    if(courseHoles && courseHoles[i] && courseHoles[i].par != null) return courseHoles[i].par;
    if(round._courseSnapshot && round._courseSnapshot[i] && round._courseSnapshot[i].par != null)
      return round._courseSnapshot[i].par;
    return 4;
  }

  // ══════════════════════════════════════════
  // PLAYER FACTORY
  // ══════════════════════════════════════════

  /**
   * Build a Round player object — minimal snapshot for this round.
   * All fields are [TRUTH].
   */
  function _defPlayer(rpId, name, order, overrides){
    var p = {
      roundPlayerId: rpId,       // [TRUTH] 局内唯一主键
      playerId:      null,       // [TRUTH] nullable，长期身份 ID
      name:          name || '', // [TRUTH]
      order:         (order != null) ? order : 0, // [TRUTH]
      team:          '',         // [TRUTH]
      color:         ''          // [TRUTH]
    };
    if(overrides){
      for(var k in overrides){
        if(overrides[k] !== undefined) p[k] = overrides[k];
      }
    }
    return p;
  }

  // ══════════════════════════════════════════
  // 1. createRound(input)
  // ══════════════════════════════════════════

  /**
   * Create a new Round object.
   *
   * @param {Object} [input]
   * @param {string} [input.id]
   * @param {string} [input.courseId]
   * @param {string} [input.routingId]
   * @param {number} [input.holeCount=18]
   * @param {string} [input.date]          - YYYY-MM-DD
   * @param {string} [input.status]        - planned|playing|finished
   * @param {Array}  [input.players]       - player input objects
   * @param {string} [input.notes]
   * @param {Object} [input.event]         - { name, id }
   * @param {Array}  [input._courseSnapshot] - [COMPAT] hole par/yards data
   * @returns {Round}
   */
  function createRound(input){
    input = input || {};
    var hc = input.holeCount || 18;
    var now = _now();

    var round = {
      id:        input.id || _genRoundId(),                        // [TRUTH]
      status:    input.status || 'planned',                       // [TRUTH]
      date:      input.date || now.slice(0,10),                   // [TRUTH]

      courseId:   input.courseId || null,                          // [TRUTH] 球场引用
      routingId: input.routingId || null,                         // [TRUTH] 路线引用
      holeCount: hc,                                              // [TRUTH]

      players:   [],                                              // [TRUTH] 本场球员快照
      scores:    {},                                              // [TRUTH] 核心成绩
      shots:     {},                                              // [TRUTH] 可选击球记录

      game:      { type:null, options:{} },                       // [TRUTH] 玩法配置（未来）
      event:     { name:input.event&&input.event.name||'',
                   id:  input.event&&input.event.id||'' },        // [TRUTH] 赛事信息

      notes:     input.notes || '',                               // [TRUTH]
      createdAt: now,                                             // [TRUTH]
      updatedAt: now,                                             // [TRUTH]

      // ── [COMPAT] 球场洞快照 ──
      // 过渡期保留，供 toScorecard() 重建 D.sc().course.holeSnapshot。
      // 后续球场 DB 查询就位后移除。
      _courseSnapshot: input._courseSnapshot || null
    };

    // Initialize players
    if(Array.isArray(input.players)){
      input.players.forEach(function(p){ addRoundPlayer(round, p); });
    }

    return round;
  }

  // ══════════════════════════════════════════
  // 2. normalizeRound(raw)
  // ══════════════════════════════════════════

  /**
   * Normalize a raw Round object: fill defaults, fix types, pad arrays.
   * Used for: import, old-version migration, partial data repair.
   *
   * @param {Object} raw
   * @returns {Round}
   */
  function normalizeRound(raw){
    if(!raw || typeof raw !== 'object') return createRound({});

    var hc = raw.holeCount || 18;
    var now = _now();

    var round = {
      id:        raw.id || _genRoundId(),
      status:    (ROUND_STATUS.indexOf(raw.status) >= 0) ? raw.status : 'planned',
      date:      raw.date || now.slice(0,10),
      courseId:   raw.courseId || null,
      routingId: raw.routingId || null,
      holeCount: hc,
      players:   [],
      scores:    {},
      shots:     {},
      game:      raw.game || { type:null, options:{} },
      event:     raw.event || { name:'', id:'' },
      notes:     raw.notes || '',
      createdAt: raw.createdAt || now,
      updatedAt: raw.updatedAt || now,
      _courseSnapshot: raw._courseSnapshot || null
    };

    // Normalize players
    if(Array.isArray(raw.players)){
      raw.players.forEach(function(p, i){
        var rpId = (p && (p.roundPlayerId || p.id)) || _genId('rp');
        var np = _defPlayer(rpId, (p && p.name) || '', i, {
          playerId: (p && p.playerId) || null,
          team:     (p && (p.team || p.teamId)) || '',
          color:    (p && (p.color || p.colorKey)) || ''
        });
        round.players.push(np);
        _ensureScores(round, rpId);
        _ensureShots(round, rpId);
      });
    }

    // Normalize scores
    if(raw.scores && typeof raw.scores === 'object'){
      for(var rpId in raw.scores){
        _ensureScores(round, rpId);
        var srcHoles = (raw.scores[rpId] && raw.scores[rpId].holes) || [];
        for(var i = 0; i < Math.min(srcHoles.length, hc); i++){
          var sh = srcHoles[i];
          if(sh) round.scores[rpId].holes[i] = _normalizeHole(sh);
        }
      }
    }

    // Normalize shots
    if(raw.shots && typeof raw.shots === 'object'){
      for(var rpId2 in raw.shots){
        if(Array.isArray(raw.shots[rpId2])){
          _ensureShots(round, rpId2);
          raw.shots[rpId2].forEach(function(holeShots, i){
            if(i < hc && Array.isArray(holeShots)){
              round.shots[rpId2][i] = holeShots.map(_normalizeShot);
            }
          });
        }
      }
    }

    return round;
  }

  /** Normalize a single hole score entry */
  function _normalizeHole(h){
    if(!h) return _defHole();
    var gross = h.gross;
    // gross must be null or positive integer
    if(gross != null){
      gross = parseInt(gross, 10);
      if(isNaN(gross) || gross < 1) gross = null;
    }
    var status = h.status || 'empty';
    if(HOLE_STATUS.indexOf(status) < 0) status = 'empty';
    // Sync: gross null + status valid → empty; gross set + status empty → valid
    if(gross === null && status === 'valid') status = 'empty';
    if(gross !== null && status === 'empty') status = 'valid';
    return { gross:gross, status:status };
  }

  /** Normalize a single shot entry */
  function _normalizeShot(s){
    if(!s) return { type:null, purpose:null, result:null, flags:[], notes:'', lastTag:null, toPin:null };
    return {
      type:    s.type || null,
      purpose: s.purpose || null,
      result:  s.result || null,
      flags:   Array.isArray(s.flags) ? s.flags.slice() : [],
      notes:   s.notes || s.note || '',
      lastTag: s.lastTag || null,
      toPin:   s.toPin != null ? s.toPin : null
    };
  }

  // ══════════════════════════════════════════
  // 3. PLAYER MANAGEMENT
  // ══════════════════════════════════════════

  /**
   * Add a player to a round. Initializes scores and shots.
   * @param {Round} round
   * @param {Object} playerInput - { name, roundPlayerId?, playerId?, team?, color? }
   * @returns {RoundPlayer}
   */
  function addRoundPlayer(round, playerInput){
    var inp = playerInput || {};
    var rpId = inp.roundPlayerId || inp.id || _genId('rp');
    var order = (inp.order != null) ? inp.order : round.players.length;
    var p = _defPlayer(rpId, inp.name || '', order, {
      playerId: inp.playerId || null,
      team:     inp.team || inp.teamId || '',
      color:    inp.color || inp.colorKey || ''
    });
    round.players.push(p);
    _ensureScores(round, rpId);
    _ensureShots(round, rpId);
    _touch(round);
    return p;
  }

  /**
   * Remove a player from a round. Cleans up scores and shots.
   * @param {Round} round
   * @param {string} roundPlayerId
   */
  function removeRoundPlayer(round, roundPlayerId){
    round.players = round.players.filter(function(p){
      return p.roundPlayerId !== roundPlayerId;
    });
    delete round.scores[roundPlayerId];
    delete round.shots[roundPlayerId];
    _touch(round);
  }

  /**
   * Update player fields. roundPlayerId is immutable.
   * @param {Round} round
   * @param {string} roundPlayerId
   * @param {Object} patch
   * @returns {RoundPlayer|null}
   */
  function updateRoundPlayer(round, roundPlayerId, patch){
    var p = round.players.find(function(x){ return x.roundPlayerId === roundPlayerId; });
    if(!p) return null;
    for(var k in patch){
      if(k !== 'roundPlayerId' && patch[k] !== undefined){
        p[k] = patch[k];
      }
    }
    _touch(round);
    return p;
  }

  // ══════════════════════════════════════════
  // 4. setRoundPlayerHole
  // ══════════════════════════════════════════

  /**
   * Update a single hole's score.
   * Supports: gross, status, or both.
   * Enforces gross ↔ status consistency.
   *
   * Rules:
   *   - gross = null or positive int (0 is invalid in golf → null)
   *   - status must be in HOLE_STATUS
   *   - Setting gross without status: auto-sync (null→empty, >=1→valid)
   *   - Setting status=empty without gross: auto-clear gross
   *   - pickup/dnf/x allow gross to remain (records strokes before pickup)
   *
   * @param {Round} round
   * @param {string} roundPlayerId
   * @param {number} holeIndex - 0-based
   * @param {Object} patch - { gross?, status? }
   * @returns {Object|null} the updated hole, or null if invalid index
   */
  function setRoundPlayerHole(round, roundPlayerId, holeIndex, patch){
    _ensureScores(round, roundPlayerId);
    if(holeIndex < 0 || holeIndex >= round.holeCount) return null;

    var hole = round.scores[roundPlayerId].holes[holeIndex];
    var grossChanged = false;
    var statusChanged = false;

    // ── Apply gross ──
    if('gross' in patch){
      grossChanged = true;
      var g = patch.gross;
      if(g === null || g === undefined){
        hole.gross = null;
      } else {
        g = parseInt(g, 10);
        hole.gross = (!isNaN(g) && g >= 1) ? g : null;
      }
    }

    // ── Apply status ──
    if('status' in patch){
      if(HOLE_STATUS.indexOf(patch.status) >= 0){
        statusChanged = true;
        hole.status = patch.status;
      }
    }

    // ── gross ↔ status 联动校验 ──
    if(grossChanged && !statusChanged){
      // gross changed, status not explicitly set → auto-sync
      if(hole.gross === null){
        if(hole.status === 'valid') hole.status = 'empty';
      } else {
        if(hole.status === 'empty') hole.status = 'valid';
      }
    }
    if(statusChanged && !grossChanged){
      // status set to empty → clear gross
      if(hole.status === 'empty') hole.gross = null;
    }

    _touch(round);
    return hole;
  }

  // ══════════════════════════════════════════
  // 5. TOTALS CALCULATION
  //    [DERIVED] — all outputs are derived from holes[], never stored as truth
  // ══════════════════════════════════════════

  /**
   * Calculate totals for one player.
   *
   * @param {Round} round
   * @param {string} roundPlayerId
   * @param {Array}  [courseHoles] - hole data from course DB ({ par }[])
   *                                Falls back to round._courseSnapshot, then default par 4.
   * @returns {Object} [DERIVED] { total, front9, back9, toPar, played, front9Played, back9Played }
   */
  function calcRoundPlayerTotals(round, roundPlayerId, courseHoles){
    _ensureScores(round, roundPlayerId);
    var holes = round.scores[roundPlayerId].holes;
    var hc = round.holeCount;
    var mid = Math.ceil(hc / 2);

    var total=0, front9=0, back9=0, toPar=0, played=0;
    var front9Played=0, back9Played=0;

    for(var i = 0; i < hc; i++){
      var g = holes[i] ? holes[i].gross : null;
      if(g !== null && g >= 1){
        var par = _holePar(round, courseHoles, i);
        total += g;
        toPar += (g - par);
        played++;
        if(i < mid){ front9 += g; front9Played++; }
        else       { back9 += g; back9Played++; }
      }
    }

    return {
      total:total, front9:front9, back9:back9,
      toPar:toPar, played:played,
      front9Played:front9Played, back9Played:back9Played
    };
  }

  /**
   * Calculate totals for all players in a round.
   * @returns {Object} [DERIVED] { roundPlayerId: totals }
   */
  function calcRoundTotals(round, courseHoles){
    var result = {};
    round.players.forEach(function(p){
      result[p.roundPlayerId] = calcRoundPlayerTotals(round, p.roundPlayerId, courseHoles);
    });
    return result;
  }

  // ══════════════════════════════════════════
  // 6. cloneRound
  // ══════════════════════════════════════════

  /**
   * Clone a round for "play again" scenarios.
   *
   * @param {Round} round
   * @param {Object} [options]
   * @param {boolean} [options.clearScores]  - keep players, reset all holes to empty
   * @param {boolean} [options.clearPlayers] - remove all players (fresh round)
   * @param {string}  [options.status]       - override status (default: 'planned')
   * @param {string}  [options.date]         - override date
   * @returns {Round} new Round with new id and timestamps
   */
  function cloneRound(round, options){
    options = options || {};
    var clone = _deepClone(round);
    var now = _now();

    clone.id = _genRoundId();
    clone.status = options.status || 'planned';
    clone.date = options.date || now.slice(0,10);
    clone.createdAt = now;
    clone.updatedAt = now;

    if(options.clearPlayers){
      clone.players = [];
      clone.scores = {};
      clone.shots = {};
    } else if(options.clearScores){
      for(var rpId in clone.scores){
        clone.scores[rpId].holes = Array.from({length:clone.holeCount}, _defHole);
      }
      for(var rpId2 in clone.shots){
        clone.shots[rpId2] = Array.from({length:clone.holeCount}, function(){ return []; });
      }
    }

    return clone;
  }

  // ══════════════════════════════════════════
  // 7. EXPORT / IMPORT
  // ══════════════════════════════════════════

  /**
   * Export round as a JSON-friendly plain object.
   * Includes _courseSnapshot [COMPAT] for portability.
   */
  function exportRound(round){
    return _deepClone(round);
  }

  /**
   * Import raw data as a normalized Round.
   * Fills missing fields, fixes types, ensures structural integrity.
   */
  function importRound(raw){
    return normalizeRound(raw);
  }

  // ══════════════════════════════════════════
  // STATUS MAPPING
  // ══════════════════════════════════════════

  /** Map scorecard hole status → Round hole status */
  function mapStatusToRound(scStatus){
    return SC_TO_ROUND[scStatus] || 'empty';
  }

  /** Map Round hole status → scorecard hole status */
  function mapStatusToScorecard(roundStatus){
    return ROUND_TO_SC[roundStatus] || 'not_started';
  }

  /**
   * Smart status mapping: scorecard → Round, using gross for disambiguation.
   * completed + gross===par → 'par' (instead of generic 'valid')
   */
  function mapStatusToRoundSmart(scStatus, gross, par){
    if(scStatus === 'completed' && gross != null && par != null && gross === par){
      return 'par';
    }
    return SC_TO_ROUND[scStatus] || 'empty';
  }

  // ══════════════════════════════════════════
  // BRIDGE: D.sc() ↔ Round
  // Minimal field mapping — not a full rewrite of SessionIO.
  // Accepts sc as parameter, no runtime coupling to D global.
  // ══════════════════════════════════════════

  /**
   * Extract a Round object from D.sc() scorecard data.
   *
   * Field mapping:
   *   sc.course.clubId     → round.courseId
   *   sc.course.routingId  → round.routingId
   *   sc.course.holeCount  → round.holeCount
   *   sc.course.holeSnapshot → round._courseSnapshot [COMPAT]
   *   sc.players[]         → round.players[]  (minimal fields)
   *   sc.scores[rpId].holes[].gross/status → round.scores  (status mapped)
   *   sc.scores[rpId].holes[].shots[]      → round.shots   (separated out)
   *   sc.meta              → round timestamps
   *
   * @param {Object} sc - D.sc() scorecard data
   * @returns {Round}
   */
  function fromScorecard(sc){
    if(!sc) return createRound({});

    var course = sc.course || {};
    var hc = course.holeCount || 18;

    // ── Snapshot [COMPAT] ──
    var snapshot = null;
    if(Array.isArray(course.holeSnapshot) && course.holeSnapshot.length > 0){
      snapshot = course.holeSnapshot.map(function(h){
        return { number:h.number, par:h.par, yards:h.yards, holeId:h.holeId||null };
      });
    }

    // ── Players ──
    var players = (sc.players || []).map(function(p, i){
      var rpId = p.roundPlayerId || p.id;
      return _defPlayer(rpId, p.name || '', i, {
        playerId: p.playerId || null,
        team:     p.teamId || '',
        color:    p.colorKey || ''
      });
    });

    // ── Scores & Shots ──
    var scores = {};
    var shots = {};
    for(var rpId in (sc.scores || {})){
      var srcHoles = (sc.scores[rpId].holes || []);
      scores[rpId] = {
        holes: Array.from({length:hc}, function(_, i){
          var sh = srcHoles[i];
          if(!sh) return _defHole();
          var par = (snapshot && snapshot[i]) ? snapshot[i].par : 4;
          return {
            gross:  sh.gross,
            status: mapStatusToRoundSmart(sh.status || 'not_started', sh.gross, par)
          };
        })
      };
      // Separate shots out of holes
      shots[rpId] = Array.from({length:hc}, function(_, i){
        var sh = srcHoles[i];
        if(!sh || !Array.isArray(sh.shots)) return [];
        return sh.shots.map(_normalizeShot);
      });
    }

    return {
      id:        (sc.meta && sc.meta.roundId) || _genRoundId(),
      status:    'playing',
      date:      (sc.meta && sc.meta.createdAt) ? sc.meta.createdAt.slice(0,10) : _now().slice(0,10),
      courseId:   course.clubId || null,
      routingId: course.routingId || null,
      holeCount: hc,
      players:   players,
      scores:    scores,
      shots:     shots,
      game:      { type:null, options:{} },
      event:     { name:'', id:'' },
      notes:     '',
      createdAt: (sc.meta && sc.meta.createdAt) || _now(),
      updatedAt: (sc.meta && sc.meta.updatedAt) || _now(),
      _courseSnapshot: snapshot
    };
  }

  /**
   * Convert a Round object back to D.sc()-compatible scorecard fields.
   *
   * ── Minimal: patches course/players/scores/meta ──
   * ── Does NOT touch workspace (D.ws()), UI state, or S ──
   *
   * @param {Round} round
   * @param {Object} [existingSc] - existing D.sc() to patch (preserves fields we don't own)
   * @returns {Object} scorecard-shaped object
   */
  function toScorecard(round, existingSc){
    var sc = existingSc ? _deepClone(existingSc) : {};

    if(!sc.course) sc.course = {};
    if(!sc.meta) sc.meta = {};

    // ── Course reference ──
    sc.course.clubId    = round.courseId;
    sc.course.routingId = round.routingId;
    sc.course.holeCount = round.holeCount;

    // ── [COMPAT] Restore holeSnapshot ──
    if(round._courseSnapshot){
      sc.course.holeSnapshot = _deepClone(round._courseSnapshot);
    } else if(!sc.course.holeSnapshot || sc.course.holeSnapshot.length < round.holeCount){
      sc.course.holeSnapshot = Array.from({length:round.holeCount}, function(_, i){
        return { number:i+1, par:4, yards:null, holeId:null };
      });
    }

    // ── Players: Round → D player format (minimal) ──
    sc.players = round.players.map(function(rp){
      return {
        roundPlayerId: rp.roundPlayerId,
        playerId:      rp.playerId,
        name:          rp.name,
        status:        'active',
        teamId:        rp.team || null,
        colorKey:      rp.color || null
      };
    });

    // ── Scores: merge Round scores + shots → D format ──
    sc.scores = {};
    var hc = round.holeCount;
    for(var rpId in round.scores){
      var rHoles = round.scores[rpId].holes || [];
      var rShots = (round.shots && round.shots[rpId]) || [];
      sc.scores[rpId] = {
        holes: Array.from({length:hc}, function(_, i){
          var rh = rHoles[i] || _defHole();
          // Merge shots back into hole
          var shotArr = (rShots[i] || []).map(function(s, si){
            return {
              shotNumber: si+1,
              type:    s.type || null,
              purpose: s.purpose || null,
              result:  s.result || null,
              flags:   Array.isArray(s.flags) ? s.flags.slice() : [],
              notes:   s.notes || '',
              lastTag: s.lastTag || null,
              toPin:   s.toPin != null ? s.toPin : null
            };
          });
          return {
            gross:     rh.gross,
            net:       null,
            putts:     null,
            penalties: 0,
            notes:     '',
            status:    mapStatusToScorecard(rh.status),
            shots:     shotArr
          };
        }),
        totals: {} // [DERIVED] — always empty, rebuilt on demand
      };
    }

    // ── Meta ──
    sc.meta.roundId   = round.id;
    sc.meta.createdAt = round.createdAt;
    sc.meta.updatedAt = round.updatedAt;

    return sc;
  }

  // ══════════════════════════════════════════
  // SELF-TEST — call Round._selfTest() in browser console
  // ══════════════════════════════════════════

  function _selfTest(){
    var pass=0, fail=0, results=[];

    function ok(name, cond, detail){
      if(cond){ pass++; results.push('  OK  ' + name); }
      else    { fail++; results.push('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
    }

    // ── 1. createRound ──
    var r = createRound({ courseId:'club_1', routingId:'rt_1', holeCount:18 });
    ok('create: id',       r.id && /^rnd_\d{8}_/.test(r.id), 'got ' + r.id);
    ok('create: holeCount', r.holeCount === 18);
    ok('create: status',   r.status === 'planned');
    ok('create: courseId',  r.courseId === 'club_1');
    ok('create: empty scores', Object.keys(r.scores).length === 0);
    ok('create: createdAt', !!r.createdAt);

    // ── 2. addRoundPlayer ──
    var p1 = addRoundPlayer(r, { name:'Alice' });
    ok('addP: returned',   !!p1 && p1.name === 'Alice');
    ok('addP: rpId',        !!p1.roundPlayerId);
    ok('addP: scores init', !!r.scores[p1.roundPlayerId]);
    ok('addP: 18 holes',   r.scores[p1.roundPlayerId].holes.length === 18);
    ok('addP: shots init',  r.shots[p1.roundPlayerId].length === 18);
    ok('addP: all empty',  r.scores[p1.roundPlayerId].holes.every(function(h){
      return h.status === 'empty' && h.gross === null;
    }));

    var p2 = addRoundPlayer(r, { name:'Bob', playerId:'player_bob' });
    ok('addP: 2 players',   r.players.length === 2);
    ok('addP: playerId',    p2.playerId === 'player_bob');

    // ── 3. updateRoundPlayer ──
    var up = updateRoundPlayer(r, p1.roundPlayerId, { name:'Alice Wu', team:'A' });
    ok('updateP: name',   up.name === 'Alice Wu');
    ok('updateP: team',   up.team === 'A');
    ok('updateP: rpId',   up.roundPlayerId === p1.roundPlayerId);

    // ── 4. setRoundPlayerHole ──
    var h0 = setRoundPlayerHole(r, p1.roundPlayerId, 0, { gross:4 });
    ok('setH: gross',      h0.gross === 4);
    ok('setH: auto valid', h0.status === 'valid');

    var h1 = setRoundPlayerHole(r, p1.roundPlayerId, 1, { gross:null });
    ok('setH: null gross',  h1.gross === null);
    ok('setH: null→empty',  h1.status === 'empty');

    setRoundPlayerHole(r, p1.roundPlayerId, 2, { gross:5 });
    setRoundPlayerHole(r, p1.roundPlayerId, 2, { status:'pickup' });
    var h2 = r.scores[p1.roundPlayerId].holes[2];
    ok('setH: pickup+gross', h2.status === 'pickup' && h2.gross === 5);

    var h3 = setRoundPlayerHole(r, p1.roundPlayerId, 3, { gross:0 });
    ok('setH: gross 0→null', h3.gross === null);

    setRoundPlayerHole(r, p1.roundPlayerId, 4, { gross:4 });
    setRoundPlayerHole(r, p1.roundPlayerId, 4, { status:'empty' });
    ok('setH: empty clears', r.scores[p1.roundPlayerId].holes[4].gross === null);

    var hBad = setRoundPlayerHole(r, p1.roundPlayerId, 99, { gross:4 });
    ok('setH: bad index',   hBad === null);

    // ── 5. calcRoundPlayerTotals ──
    setRoundPlayerHole(r, p1.roundPlayerId, 0, { gross:4 });
    setRoundPlayerHole(r, p1.roundPlayerId, 1, { gross:5 });
    // hole 2 already has pickup/5
    setRoundPlayerHole(r, p1.roundPlayerId, 8, { gross:3 });
    setRoundPlayerHole(r, p1.roundPlayerId, 9, { gross:6 });

    var snap = Array.from({length:18}, function(){ return {par:4}; });
    snap[8].par = 3;
    r._courseSnapshot = snap;

    var t = calcRoundPlayerTotals(r, p1.roundPlayerId);
    // holes: 0=4, 1=5, 2=5(pickup), 8=3, 9=6 → total=23
    ok('totals: total',   t.total === 23,   'got ' + t.total);
    ok('totals: played',  t.played === 5,   'got ' + t.played);
    ok('totals: front9',  t.front9 === 17,  'got ' + t.front9);  // 4+5+5+3=17
    ok('totals: back9',   t.back9 === 6,    'got ' + t.back9);
    // toPar: (4-4)+(5-4)+(5-4)+(3-3)+(6-4) = 0+1+1+0+2 = 4
    ok('totals: toPar',   t.toPar === 4,    'got ' + t.toPar);

    var all = calcRoundTotals(r);
    ok('allTotals: Alice', !!all[p1.roundPlayerId]);
    ok('allTotals: Bob',   !!all[p2.roundPlayerId]);

    // ── 6. removeRoundPlayer ──
    removeRoundPlayer(r, p2.roundPlayerId);
    ok('removeP: count',   r.players.length === 1);
    ok('removeP: scores',  !r.scores[p2.roundPlayerId]);
    ok('removeP: shots',   !r.shots[p2.roundPlayerId]);

    // ── 7. cloneRound ──
    var c1 = cloneRound(r, { clearScores:true });
    ok('clone: new id',     c1.id !== r.id);
    ok('clone: same players', c1.players.length === r.players.length);
    ok('clone: scores clear', c1.scores[p1.roundPlayerId].holes.every(function(h){
      return h.gross === null;
    }));
    ok('clone: shots clear', c1.shots[p1.roundPlayerId].every(function(hs){
      return hs.length === 0;
    }));

    var c2 = cloneRound(r, { clearPlayers:true });
    ok('clone: no players',  c2.players.length === 0);
    ok('clone: no scores',   Object.keys(c2.scores).length === 0);

    // ── 8. normalizeRound ──
    var raw = { courseId:'c1', players:[{name:'Test'}], scores:{} };
    var norm = normalizeRound(raw);
    ok('normalize: courseId',  norm.courseId === 'c1');
    ok('normalize: player',   norm.players.length === 1);
    ok('normalize: id',        !!norm.id);
    ok('normalize: holeCount', norm.holeCount === 18);

    var norm2 = normalizeRound(null);
    ok('normalize null: ok',   !!norm2.id && norm2.holeCount === 18);

    // ── 9. Status mapping ──
    ok('statusMap: not_started→empty',   mapStatusToRound('not_started') === 'empty');
    ok('statusMap: completed→valid',     mapStatusToRound('completed') === 'valid');
    ok('statusMap: picked_up→pickup',    mapStatusToRound('picked_up') === 'pickup');
    ok('statusMap: empty→not_started',   mapStatusToScorecard('empty') === 'not_started');
    ok('statusMap: valid→completed',     mapStatusToScorecard('valid') === 'completed');
    ok('statusMap: dnf→picked_up',       mapStatusToScorecard('dnf') === 'picked_up');
    ok('statusMap: smart par',           mapStatusToRoundSmart('completed', 4, 4) === 'par');
    ok('statusMap: smart valid',         mapStatusToRoundSmart('completed', 5, 4) === 'valid');

    // ── 10. Bridge: fromScorecard → toScorecard roundtrip ──
    var fakeSc = {
      course:{
        clubId:'club_A', routingId:'rt_A', holeCount:18,
        clubName:'Test Club', courseName:'Main', routingName:'Full 18',
        selectedTee:'blue',
        holeSnapshot: Array.from({length:18}, function(_, i){
          return { number:i+1, par:(i===2?3:4), yards:350, holeId:'h'+i };
        })
      },
      players:[
        { roundPlayerId:'rp_1', name:'Pack', colorKey:'blue', playerId:'pid_1' }
      ],
      scores:{
        'rp_1':{
          holes: Array.from({length:18}, function(_, i){
            if(i===0) return { gross:4, status:'completed', shots:[{type:'TEE'}],
                               putts:2, penalties:0, notes:'nice', net:null };
            if(i===1) return { gross:5, status:'in_progress', shots:[],
                               putts:null, penalties:0, notes:'', net:null };
            return { gross:null, status:'not_started', shots:[],
                     putts:null, penalties:0, notes:'', net:null };
          }),
          totals:{}
        }
      },
      meta:{ roundId:'r_test', createdAt:'2026-03-09T10:00:00Z', updatedAt:'2026-03-09T11:00:00Z' }
    };

    var rFromSc = fromScorecard(fakeSc);
    ok('fromSc: id',           rFromSc.id === 'r_test');
    ok('fromSc: courseId',     rFromSc.courseId === 'club_A');
    ok('fromSc: 1 player',    rFromSc.players.length === 1);
    ok('fromSc: h0 gross=4',  rFromSc.scores['rp_1'].holes[0].gross === 4);
    ok('fromSc: h0 par',      rFromSc.scores['rp_1'].holes[0].status === 'par');  // completed + gross===par → par
    ok('fromSc: h1 valid',    rFromSc.scores['rp_1'].holes[1].status === 'valid');
    ok('fromSc: h2 empty',    rFromSc.scores['rp_1'].holes[2].status === 'empty');
    ok('fromSc: shots sep',   rFromSc.shots['rp_1'][0].length === 1);
    ok('fromSc: snapshot',    rFromSc._courseSnapshot.length === 18);

    var backSc = toScorecard(rFromSc);
    ok('toSc: clubId',        backSc.course.clubId === 'club_A');
    ok('toSc: holeSnapshot',  backSc.course.holeSnapshot.length === 18);
    ok('toSc: h0 gross',      backSc.scores['rp_1'].holes[0].gross === 4);
    ok('toSc: h0 status',     backSc.scores['rp_1'].holes[0].status === 'completed');
    ok('toSc: h2 status',     backSc.scores['rp_1'].holes[2].status === 'not_started');
    ok('toSc: meta roundId',  backSc.meta.roundId === 'r_test');
    ok('toSc: shots merged',  backSc.scores['rp_1'].holes[0].shots.length === 1);
    ok('toSc: totals empty',  Object.keys(backSc.scores['rp_1'].totals).length === 0);

    // Roundtrip: gross should survive
    ok('roundtrip: gross h0', backSc.scores['rp_1'].holes[0].gross === fakeSc.scores['rp_1'].holes[0].gross);
    ok('roundtrip: gross h1', backSc.scores['rp_1'].holes[1].gross === fakeSc.scores['rp_1'].holes[1].gross);
    ok('roundtrip: gross h5', backSc.scores['rp_1'].holes[5].gross === null);

    // ── Summary ──
    console.log('');
    console.log('══════════════════════════════════════════');
    console.log('  Round._selfTest():  ' + pass + ' passed,  ' + fail + ' failed');
    console.log('══════════════════════════════════════════');
    results.forEach(function(line){ console.log(line); });
    console.log('');
    return { pass:pass, fail:fail, total:pass+fail };
  }

  // ══════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════

  return {
    // 1. Create
    createRound:          createRound,
    // 2. Normalize
    normalizeRound:       normalizeRound,
    // 3. Player management
    addRoundPlayer:       addRoundPlayer,
    removeRoundPlayer:    removeRoundPlayer,
    updateRoundPlayer:    updateRoundPlayer,
    // 4. Score update
    setRoundPlayerHole:   setRoundPlayerHole,
    // 5. Totals (derived)
    calcRoundPlayerTotals:calcRoundPlayerTotals,
    calcRoundTotals:      calcRoundTotals,
    // 6. Clone
    cloneRound:           cloneRound,
    // 7. Export / Import
    exportRound:          exportRound,
    importRound:          importRound,
    // Status mapping
    mapStatusToRound:     mapStatusToRound,
    mapStatusToScorecard: mapStatusToScorecard,
    mapStatusToRoundSmart:mapStatusToRoundSmart,
    // Bridge: D.sc() ↔ Round
    fromScorecard:        fromScorecard,
    toScorecard:          toScorecard,
    // Constants
    ROUND_STATUS:         ROUND_STATUS,
    HOLE_STATUS:          HOLE_STATUS,
    // Testing
    _selfTest:            _selfTest
  };

})();
