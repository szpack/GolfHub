// ============================================================
// data.js — v4.0 Data Access Layer (Player Schema v4.1)
// Unified data model: scorecardData (business) + workspaceState (UI)
// No dependencies — load before all other JS files
// ============================================================

const D = (function(){

  // ── Constants ──
  const LS_SC   = 'golf_v4_scorecard';
  const LS_WS   = 'golf_v4_workspace';
  const LS_OLD  = 'golf_v531';
  const LS_BG   = 'golf_v531_bg';
  const LS_ROUNDS = 'golf_v5_rounds';
  const SESSION = '__session__';

  // ── Player status enum ──
  const PLAYER_STATUS = ['active','withdrawn','inactive','guest','deleted'];

  // ── Color key → hex mapping (default, overridden by theme) ──
  var DEFAULT_PLAYER_COLORS = {
    blue:'#1a5bb5', red:'#C0392B', green:'#2e7d32', orange:'#e67e22',
    purple:'#7c3aed', teal:'#00897b', pink:'#e91e63', gold:'#f9a825'
  };

  // ── Hex → colorKey reverse map for migration ──
  var HEX_TO_KEY = {};
  (function(){
    for(var k in DEFAULT_PLAYER_COLORS){
      HEX_TO_KEY[DEFAULT_PLAYER_COLORS[k].toLowerCase()] = k;
    }
  })();

  let _sc = null;   // scorecardData
  let _ws = null;   // workspaceState
  let _rounds = null; // Round persistence store (golf_v5_rounds)

  // ══════════════════════════════════════════
  // DEFAULT FACTORIES
  // ══════════════════════════════════════════

  /** Course hole snapshot — immutable per-round copy of course DB hole */
  function defCourseHole(i){
    return { number:(i||0)+1, par:4, yards:null, holeId:null };
  }

  /**
   * Player hole score — business data per player per hole.
   *
   * status ↔ gross 约束规则:
   *   not_started  → gross MUST be null (尚未开始打该洞)
   *   in_progress  → gross >= 1 (正在打，杆数为当前已知值，可能还会变)
   *   completed    → gross >= 1 (该洞已完成，杆数为最终值)
   *   picked_up    → gross MAY be null or >= 1 (捡球弃洞，gross 可记录捡球前杆数或留空)
   *
   * 所有 mutation API (setPlayerGross, adjPlayerGross, clearPlayerHole)
   * 会自动维护 status，外部也可通过 setHoleStatus() 手动覆盖。
   */
  function defPlayerHole(){
    return {
      gross:null,       // actual strokes (primary data), null = not played
      net:null,         // net strokes after handicap (null = not computed)
      putts:null,       // putt count (null = not tracked)
      penalties:0,      // penalty count
      notes:'',         // hole-level notes
      status:'not_started', // not_started | in_progress | completed | picked_up
      shots:[]          // per-shot detail array, length may differ from gross (incomplete record OK)
    };
  }

  /** Single shot detail */
  function defShot(shotNumber){
    return {
      shotNumber:shotNumber||null, // 1-based shot ordinal within the hole
      type:null,        // TEE | APPR | LAYUP | CHIP | PUTT
      purpose:null,     // FOR_BIRDIE | FOR_PAR | FOR_BOGEY | FOR_DOUBLE | FOR_TRIPLE
      result:null,      // GREEN | FAIRWAY | BUNKER | LIGHT_ROUGH | HEAVY_ROUGH | WATER | TREES
      flags:[],         // [PENALTY, PROV, ...] — array, supports multiple flags
      notes:'',         // per-shot notes
      lastTag:null,     // which category was last set (for canvas display)
      toPin:null        // distance to pin in yards
    };
  }

  /**
   * Generate a roundPlayerId.
   * @param {string} [prefix] - 'rp' (app default) | 'imp' (import) | 'p' (legacy compat)
   * @param {number} [index]  - optional index for batch generation (e.g. import)
   * @returns {string}
   */
  function genRoundPlayerId(prefix, index){
    prefix = prefix || 'rp';
    var ts = Date.now();
    var rand = Math.random().toString(36).slice(2, 5);
    return index != null
      ? prefix + '_' + ts + '_' + index + '_' + rand
      : prefix + '_' + ts + '_' + rand;
  }

  /**
   * RoundPlayer — 本局参赛实体快照。
   *
   * 这是 round player instance，不是长期 profile。
   * roundPlayerId 是局内唯一标识，scores / shots / focusSlots 均以此为 key。
   * playerId 是可选的长期身份 ID，可为 null（匿名球员/旧数据）。
   *
   * 排序规则: players[] 数组索引是唯一排序真相。
   *   不再使用 order 字段参与运行时排序逻辑。
   *
   * @param {string} roundPlayerId - 必填，局内唯一
   * @param {string} name - 必填，原始姓名
   * @param {Object} [overrides] - 可选覆盖字段
   * @returns {RoundPlayer}
   */
  function defPlayer(roundPlayerId, name, overrides){
    var base = {
      roundPlayerId: roundPlayerId,
      playerId:      null,          // 可空，长期身份 ID（跨局复用）
      name:          name || '',    // 原始姓名
      displayName:   null,          // 可空，本局显示名（优先于 name）
      shortName:     null,          // 可空，缩写名
      status:        'active',      // active | withdrawn | inactive | guest | deleted
      teamId:        null,          // 可空，队伍 ID
      side:          null,          // 可空，阵营标识
      groupId:       null,          // 可空，发球分组 ID
      colorKey:      null,          // 可空，语义色键
      hcpSnapshot:   null,          // 可空，差点快照 { handicapIndex, courseHandicap, playingHandicap }
      avatar:        null,          // 可空，头像
      role:          null,          // 可空，角色
      isGuest:       false,         // 是否访客
      notes:         ''             // 备注
    };
    if(overrides){
      for(var k in overrides){
        if(overrides[k] !== undefined) base[k] = overrides[k];
      }
    }
    return base;
  }

  /** Team definition — optional grouping structure */
  function defTeam(teamId, name){
    return { teamId:teamId, name:name||'', side:null, colorKey:null, notes:'' };
  }

  /** Tee group definition — optional grouping structure */
  function defGroup(groupId, label){
    return { groupId:groupId, label:label||'', teeTime:null, notes:'' };
  }

  // ── Player display helpers ──

  /**
   * Get the display name for a player (priority: displayName > name).
   * @param {RoundPlayer} p
   * @returns {string}
   */
  function playerDisplayName(p){
    if(!p) return 'Player';
    return (p.displayName || p.name || '').trim() || 'Player';
  }

  /**
   * Get the short name for a player (priority: shortName > first char of displayName/name).
   * @param {RoundPlayer} p
   * @returns {string}
   */
  function playerShortName(p){
    if(!p) return '?';
    if(p.shortName) return p.shortName;
    var full = p.displayName || p.name || '';
    return full.charAt(0) || '?';
  }

  /**
   * Get the UI color hex for a player via colorKey → theme mapping.
   * @param {RoundPlayer} p
   * @returns {string} hex color
   */
  function playerUIColor(p){
    if(!p || !p.colorKey) return '#888888';
    var theme = (typeof getTheme === 'function') ? getTheme() : null;
    var map = (theme && theme.playerColors) || DEFAULT_PLAYER_COLORS;
    return map[p.colorKey] || '#888888';
  }

  // ── Player migration helpers ──

  /**
   * Migrate legacy 'team' field to separate teamId / side / groupId.
   * @param {string} oldTeam
   * @returns {{ teamId:string|null, side:string|null, groupId:string|null }}
   */
  function migrateTeamField(oldTeam){
    if(!oldTeam) return { teamId:null, side:null, groupId:null };
    var s = String(oldTeam).trim();
    if(!s) return { teamId:null, side:null, groupId:null };
    // 纯数字 → 发球分组
    if(/^\d+$/.test(s)){
      return { teamId:null, side:null, groupId:'g' + s };
    }
    // 常见阵营标识 → side
    var sides = ['red','blue','a','b','home','away'];
    if(sides.indexOf(s.toLowerCase()) >= 0){
      return { teamId:null, side:s.toLowerCase(), groupId:null };
    }
    // 其他 → teamId
    return { teamId:s, side:null, groupId:null };
  }

  /**
   * Migrate legacy hex color to colorKey.
   * @param {string} oldColor - hex string like '#1a5bb5'
   * @returns {string|null} colorKey or null
   */
  function migrateColor(oldColor){
    if(!oldColor) return null;
    var key = HEX_TO_KEY[oldColor.toLowerCase()];
    return key || null;
  }

  /**
   * Normalize a player object from any source (load, import, paste).
   * Fills missing fields with defaults, fixes types, handles old→new migration.
   * @param {Object} raw - raw player data (may be old or new format)
   * @param {number} index - array position (for ID generation fallback)
   * @returns {RoundPlayer}
   */
  function normalizePlayer(raw, index){
    if(!raw) return defPlayer(genRoundPlayerId('rp', index), '');

    // ── ID 兼容: roundPlayerId / id ──
    var rpId = raw.roundPlayerId || raw.id || genRoundPlayerId('rp', index);

    // ── 差点兼容: flat fields → hcpSnapshot ──
    var hcp = raw.hcpSnapshot || null;
    if(!hcp && (raw.handicapIndex != null || raw.courseHandicap != null)){
      hcp = {
        handicapIndex:   raw.handicapIndex != null ? raw.handicapIndex : null,
        courseHandicap:   raw.courseHandicap != null ? raw.courseHandicap : null,
        playingHandicap: null
      };
    }

    // ── team 字段兼容: old team → teamId / side / groupId ──
    var teamId = raw.teamId || null;
    var side = raw.side || null;
    var groupId = raw.groupId || null;
    if(!teamId && !side && !groupId && raw.team){
      var migrated = migrateTeamField(raw.team);
      teamId = migrated.teamId;
      side = migrated.side;
      groupId = migrated.groupId;
    }

    // ── color 兼容: hex → colorKey ──
    var colorKey = raw.colorKey || null;
    if(!colorKey && raw.color){
      colorKey = migrateColor(raw.color);
    }

    // ── status 校验 ──
    var status = (raw.status && PLAYER_STATUS.indexOf(raw.status) >= 0) ? raw.status : 'active';

    // ── displayName / shortName: 空字符串 normalize 为 null ──
    var displayName = raw.displayName || raw.nickname || null;
    if(displayName === '') displayName = null;
    var shortName = raw.shortName || null;
    if(shortName === '') shortName = null;

    return defPlayer(rpId, raw.name || '', {
      playerId:    raw.playerId || null,
      displayName: displayName,
      shortName:   shortName,
      status:      status,
      teamId:      teamId,
      side:        side,
      groupId:     groupId,
      colorKey:    colorKey,
      hcpSnapshot: hcp,
      avatar:      raw.avatar || null,
      role:        raw.role || null,
      isGuest:     !!raw.isGuest,
      notes:       raw.notes || ''
    });
  }

  /**
   * Validate a raw player object and return warnings.
   * Does not throw — always returns result with warnings array.
   * @param {Object} raw
   * @param {number} index
   * @returns {{ warnings: string[] }}
   */
  function validatePlayer(raw, index){
    var warnings = [];
    if(!raw){
      warnings.push('Player[' + index + ']: null/undefined, will use defaults');
      return { warnings:warnings };
    }
    if(!raw.roundPlayerId && !raw.id){
      warnings.push('Player[' + index + ']: missing roundPlayerId, auto-generated');
    }
    if(!raw.name || !(raw.name||'').trim()){
      warnings.push('Player[' + index + ']: name is empty');
    }
    if(raw.status && PLAYER_STATUS.indexOf(raw.status) < 0){
      warnings.push('Player[' + index + ']: invalid status "' + raw.status + '", reset to active');
    }
    return { warnings:warnings };
  }

  /** Full scorecard data — business data only, exportable */
  function defScorecard(){
    return {
      version:'4.0',
      playerSchemaVersion:'4.1',
      course:{
        // Course snapshot for this round — frozen copy from courseDB at round creation.
        // Changes to the course database do NOT retroactively affect this snapshot.
        clubId:null,
        clubName:'',
        courseName:'',
        routingId:null,
        routingName:'',
        routingSourceType:null,  // 'fixed_course' | 'composed_segments' | null
        routingMeta:{},
        selectedTee:'blue',
        holeCount:18,
        // holeSnapshot[]: par/yards frozen at round creation, immutable during the round
        holeSnapshot:Array.from({length:18},(_,i)=>defCourseHole(i))
      },
      players:[],
      // teams[]: optional team definitions for team-based play
      teams:[],
      // groups[]: optional tee group definitions
      groups:[],
      // scores[roundPlayerId] = { holes: [...], totals: {} }
      // ⚠️ totals 是派生缓存容器（如 totalPutts, GIR% 等），不是独立业务真相。
      //    totals 必须始终可由 holes[] 重新计算得出，不可存储 holes 无法派生的数据。
      //    持久化时一并保存以避免重复计算，但 load 后可随时从 holes 重建。
      scores:{},
      meta:{
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      }
    };
  }

  /**
   * Workspace state — UI only, not part of scorecard export.
   *
   * 持久化说明:
   *   save() 时 userBg 字段被设为 null 写入 LS_WS（不含 base64 本体）。
   *   背景图 base64 独立存于 LS_BG ('golf_v531_bg')。
   *   load() 后从 LS_BG 读回赋给 _ws.userBg，仅作为运行时内存引用。
   *   即：userBg 在 workspace JSON 中始终为 null，运行时由 load() 填充。
   */
  function defWorkspace(){
    return {
      currentHole:0,
      currentPlayerId:null,
      shotIndex:-1,             // global shot nav index (-1 = overview)
      scorecardSummary:null,    // 'out' | 'in' | 'tot' | null
      displayMode:'topar',
      ratio:'16:9',
      exportRes:2160,
      bgOpacity:1.0,
      overlayOpacity:1.0,
      showShot:true,
      showScore:true,
      showTotal:true,
      showDist:false,
      showPlayerName:true,
      safeZone:false,
      szSize:'10',
      scoreRange:'18',
      lang:'en',
      theme:'classic',
      uiTheme:'auto',
      overlayPos:{
        '16:9':{x:0.695,y:0.05},
        '9:16':{x:0.542,y:0.05},
        '1:1': {x:0.695,y:0.05}
      },
      scorecardPos:{
        '16:9':{x:0.5,y:0.76,centered:true},
        '9:16':{x:0.5,y:0.89,centered:true},
        '1:1': {x:0.5,y:0.84,centered:true}
      },
      userBg:null,              // ⚠️ 运行时引用，不落持久化 — 见上方说明
      playerHistory:[],
      recentPlayerIds:[],
      focusSlots:[],
      playerName:'PLAYER'
    };
  }

  // ══════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════

  function defRoundsStore(){
    return { version:'5.0', activeRoundId:null, rounds:{} };
  }

  function init(){
    _sc = defScorecard();
    _ws = defWorkspace();
    _rounds = defRoundsStore();
  }

  // ══════════════════════════════════════════
  // CORE ACCESSORS
  // ══════════════════════════════════════════

  function sc(){ return _sc; }
  function ws(){ return _ws; }
  function pid(){ return _ws.currentPlayerId || SESSION; }

  /**
   * Resolve roundPlayerId from a player object.
   * Handles both old (p.id) and new (p.roundPlayerId) formats.
   * @param {Object} p
   * @returns {string}
   */
  function rpid(p){ return p ? (p.roundPlayerId || p.id) : null; }

  // ══════════════════════════════════════════
  // COURSE HOLE ACCESS
  // ══════════════════════════════════════════

  function getCourseHole(i){
    return (_sc.course.holeSnapshot && _sc.course.holeSnapshot[i]) || defCourseHole(i);
  }
  function setCourseHolePar(i, par){
    if(_sc.course.holeSnapshot[i]) _sc.course.holeSnapshot[i].par = par;
    _touch();
  }
  function setCourseHoleYards(i, yards){
    if(_sc.course.holeSnapshot[i]) _sc.course.holeSnapshot[i].yards = yards;
    _touch();
  }
  function holeCount(){ return _sc.course.holeCount || 18; }

  /** Resize course holes array (e.g. when switching to a 9-hole course) */
  function setHoleCount(n){
    _sc.course.holeCount = n;
    while(_sc.course.holeSnapshot.length < n) _sc.course.holeSnapshot.push(defCourseHole(_sc.course.holeSnapshot.length));
    if(_sc.course.holeSnapshot.length > n) _sc.course.holeSnapshot.length = n;
    // Resize all player score arrays
    for(var pid in _sc.scores){
      var ph = _sc.scores[pid].holes;
      while(ph.length < n) ph.push(defPlayerHole());
      if(ph.length > n) ph.length = n;
    }
    _touch();
  }

  // ══════════════════════════════════════════
  // PLAYER SCORES — ensure / access
  // ══════════════════════════════════════════

  function ensureScores(playerId){
    if(!_sc.scores) _sc.scores = {};
    var hc = holeCount();
    if(!_sc.scores[playerId]){
      _sc.scores[playerId] = { holes:Array.from({length:hc},()=>defPlayerHole()), totals:{} };
    } else {
      if(!_sc.scores[playerId].totals) _sc.scores[playerId].totals = {};
      var ph = _sc.scores[playerId].holes;
      while(ph.length < hc) ph.push(defPlayerHole());
      if(ph.length > hc) ph.length = hc;
    }
  }

  function getPlayerHole(playerId, hi){
    ensureScores(playerId);
    return _sc.scores[playerId].holes[hi];
  }

  function getPlayerGross(playerId, hi){
    var h = getPlayerHole(playerId, hi);
    return h ? h.gross : null;
  }

  function getPlayerDelta(playerId, hi){
    var g = getPlayerGross(playerId, hi);
    if(g === null) return null;
    var par = getCourseHole(hi).par || 0;
    return g - par;
  }

  function getPlayerShots(playerId, hi){
    var h = getPlayerHole(playerId, hi);
    return h ? h.shots : [];
  }

  function getPlayerShot(playerId, hi, si){
    var h = getPlayerHole(playerId, hi);
    if(!h || !h.shots[si]) return defShot();
    var s = h.shots[si];
    // Ensure flags is always an array
    if(!Array.isArray(s.flags)) s.flags = s.flags ? [s.flags] : [];
    return s;
  }

  // ══════════════════════════════════════════
  // SCORE MUTATIONS
  // ══════════════════════════════════════════

  function setPlayerGross(playerId, hi, gross){
    ensureScores(playerId);
    var h = _sc.scores[playerId].holes[hi];
    h.gross = gross;
    _syncStatus(h);
    _reconcileShots(h);
    _touch();
  }

  function adjPlayerGross(playerId, hi, inc){
    ensureScores(playerId);
    var h = _sc.scores[playerId].holes[hi];
    var par = getCourseHole(hi).par || 4;
    if(h.gross === null){
      h.gross = par; // start at par
    }
    h.gross = h.gross + inc;
    if(h.gross < 1) h.gross = 1;
    // Limit range: par-6 to par+12
    var lo = Math.max(1, par - 6);
    var hi2 = par + 12;
    if(h.gross < lo) h.gross = lo;
    if(h.gross > hi2) h.gross = hi2;
    _syncStatus(h);
    _reconcileShots(h);
    _touch();
  }

  function clearPlayerHole(playerId, hi){
    ensureScores(playerId);
    var h = _sc.scores[playerId].holes[hi];
    h.gross = null;
    h.putts = null;
    h.penalties = 0;
    h.notes = '';
    h.status = 'not_started';
    h.shots = [];
    _touch();
  }

  // ── Shot mutations ──

  function setShotTag(playerId, hi, si, category, value){
    var h = getPlayerHole(playerId, hi);
    if(!h || !h.shots[si]) return;
    var s = h.shots[si];
    if(category === 'flags'){
      if(!Array.isArray(s.flags)) s.flags = [];
      var idx = s.flags.indexOf(value);
      if(idx >= 0){
        s.flags.splice(idx, 1); // toggle off
      } else {
        s.flags.push(value);    // toggle on
      }
      s.lastTag = s.flags.length > 0 ? 'flags' : null;
    } else {
      // Single-value categories: toggle same value off, or replace
      if(s[category] === value){
        s[category] = null;
        s.lastTag = null;
      } else {
        s[category] = value;
        s.lastTag = category;
      }
    }
    _touch();
  }

  function setShotToPin(playerId, hi, si, distance){
    var h = getPlayerHole(playerId, hi);
    if(!h || !h.shots[si]) return;
    h.shots[si].toPin = distance;
    _touch();
  }

  function setShotNotes(playerId, hi, si, text){
    var h = getPlayerHole(playerId, hi);
    if(!h || !h.shots[si]) return;
    h.shots[si].notes = text || '';
    _touch();
  }

  // ── Hole-level field mutations ──

  function setHolePutts(playerId, hi, putts){
    var h = getPlayerHole(playerId, hi);
    if(h) { h.putts = putts; _touch(); }
  }

  function setHolePenalties(playerId, hi, penalties){
    var h = getPlayerHole(playerId, hi);
    if(h) { h.penalties = penalties; _touch(); }
  }

  function setHoleStatus(playerId, hi, status){
    var h = getPlayerHole(playerId, hi);
    if(h) { h.status = status; _touch(); }
  }

  function setHoleNotes(playerId, hi, notes){
    var h = getPlayerHole(playerId, hi);
    if(h) { h.notes = notes || ''; _touch(); }
  }

  function setHoleNet(playerId, hi, net){
    var h = getPlayerHole(playerId, hi);
    if(h) { h.net = net; _touch(); }
  }

  // ── Internal shot reconciliation ──

  /**
   * Reconcile shots array after gross changes.
   * shots.length is NOT forced to equal gross — incomplete records are allowed.
   * Only extends (fills) up to gross if shots are fewer; never trims user data.
   * Status sync is handled by _syncStatus() — this function only manages shots[].
   */
  function _reconcileShots(h){
    var g = h.gross;
    if(g === null || g < 1) return; // no gross → leave shots as-is
    // Extend with defaults if fewer shots than gross (fill gaps)
    while(h.shots.length < g){
      var sn = h.shots.length + 1;
      h.shots.push(defShot(sn));
    }
    // Normalize all shots
    h.shots.forEach(function(s, idx){
      if(!Array.isArray(s.flags)) s.flags = s.flags ? [s.flags] : [];
      if(s.note !== undefined && s.notes === undefined){ s.notes = s.note || ''; delete s.note; }
      if(s.shotNumber == null) s.shotNumber = idx + 1;
    });
  }

  /**
   * Auto-sync status based on gross value.
   * Rules: gross null → not_started (unless picked_up); gross >= 1 → at least in_progress.
   * Does NOT downgrade 'completed' or 'picked_up' — those require explicit setHoleStatus().
   */
  function _syncStatus(h){
    if(h.gross === null || h.gross < 1){
      // gross cleared: revert to not_started unless picked_up
      if(h.status !== 'picked_up') h.status = 'not_started';
    } else {
      // gross set: promote not_started → in_progress
      if(h.status === 'not_started') h.status = 'in_progress';
    }
  }

  function _touch(){ _sc.meta.updatedAt = new Date().toISOString(); }

  // ══════════════════════════════════════════
  // DERIVED CALCULATIONS
  // ══════════════════════════════════════════

  function totalGross(playerId, start, end){
    start = start || 0;
    end = (end != null) ? end : holeCount();
    var sum = 0;
    for(var i = start; i < end; i++){
      var g = getPlayerGross(playerId, i);
      if(g !== null) sum += g;
    }
    return sum;
  }

  function totalDelta(playerId, start, end){
    start = start || 0;
    end = (end != null) ? end : holeCount();
    var sum = 0;
    for(var i = start; i < end; i++){
      var d = getPlayerDelta(playerId, i);
      if(d !== null) sum += d;
    }
    return sum;
  }

  /** Projected gross: played holes use actual, unplayed holes use par */
  function projectedGross(playerId){
    var sum = 0;
    for(var i = 0; i < holeCount(); i++){
      var g = getPlayerGross(playerId, i);
      sum += (g !== null) ? g : (getCourseHole(i).par || 4);
    }
    return sum;
  }

  function playedCount(playerId, start, end){
    start = start || 0;
    end = (end != null) ? end : holeCount();
    var c = 0;
    for(var i = start; i < end; i++){
      if(getPlayerGross(playerId, i) !== null) c++;
    }
    return c;
  }

  // ══════════════════════════════════════════
  // PLAYER MANAGEMENT
  // ══════════════════════════════════════════

  /**
   * Add a player to the current round.
   * @param {string} name
   * @param {Object} [overrides] - optional field overrides for defPlayer()
   * @returns {RoundPlayer} the new player object
   */
  function addPlayer(name, overrides){
    var rpId = genRoundPlayerId('rp');
    var p = defPlayer(rpId, name, overrides);
    _sc.players.push(p);
    ensureScores(rpId);
    _touch();
    return p;
  }

  /**
   * Remove a player by roundPlayerId.
   * @param {string} roundPlayerId
   */
  function removePlayer(roundPlayerId){
    _sc.players = _sc.players.filter(function(p){ return rpid(p) !== roundPlayerId; });
    delete _sc.scores[roundPlayerId];
    _touch();
  }

  /**
   * Find a player by roundPlayerId.
   * Also checks legacy 'id' field for backward compat.
   * @param {string} roundPlayerId
   * @returns {RoundPlayer|null}
   */
  function getPlayer(roundPlayerId){
    return _sc.players.find(function(p){ return rpid(p) === roundPlayerId; }) || null;
  }

  /**
   * Update player fields (except roundPlayerId which is immutable).
   * @param {string} roundPlayerId
   * @param {Object} patch - fields to update
   * @returns {RoundPlayer|null}
   */
  function updatePlayer(roundPlayerId, patch){
    var p = getPlayer(roundPlayerId);
    if(!p) return null;
    for(var k in patch){
      if(patch[k] !== undefined && k !== 'roundPlayerId'){
        p[k] = patch[k];
      }
    }
    // Normalize key fields after patch
    if(p.displayName === '') p.displayName = null;
    if(p.shortName === '') p.shortName = null;
    if(p.status && PLAYER_STATUS.indexOf(p.status) < 0) p.status = 'active';
    _touch();
    return p;
  }

  // ══════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════

  function save(){
    try {
      localStorage.setItem(LS_SC, JSON.stringify(_sc));
      var wsForStorage = Object.assign({}, _ws, {userBg:null});
      localStorage.setItem(LS_WS, JSON.stringify(wsForStorage));
      if(_ws.userBg){
        try { localStorage.setItem(LS_BG, _ws.userBg); } catch(e){}
      } else {
        localStorage.removeItem(LS_BG);
      }
    } catch(e){ console.warn('[D] save error', e); }
    // ── Round persistence (parallel layer, does not affect _sc/_ws) ──
    _saveRounds();
  }

  /**
   * Generate Round snapshot from current _sc and persist to golf_v5_rounds.
   * Graceful: if Round module unavailable, silently skip.
   */
  function _saveRounds(){
    if(typeof Round === 'undefined') return;
    try {
      if(!_rounds) _rounds = defRoundsStore();
      var roundObj = Round.fromScorecard(_sc);
      var rid = roundObj.id;
      // Stabilize roundId: write back to _sc.meta so next save reuses same ID
      if(!_sc.meta) _sc.meta = {};
      if(!_sc.meta.roundId) _sc.meta.roundId = rid;
      _rounds.activeRoundId = rid;
      _rounds.rounds[rid] = Round.exportRound(roundObj);
      localStorage.setItem(LS_ROUNDS, JSON.stringify(_rounds));
    } catch(e){ console.warn('[D] round save error', e); }
  }

  function load(){
    // Priority 1: try v4 format
    var rawSc = localStorage.getItem(LS_SC);
    if(rawSc){
      try {
        var parsedSc = JSON.parse(rawSc);
        var rawWs = localStorage.getItem(LS_WS);
        var parsedWs = rawWs ? Object.assign(defWorkspace(), JSON.parse(rawWs)) : defWorkspace();
        parsedWs.userBg = localStorage.getItem(LS_BG) || null;
        // Assign only after parsing succeeds
        _sc = parsedSc;
        _ws = parsedWs;
        try { _postLoad(); } catch(pe){ console.warn('[D] postLoad warning (data kept):', pe); }
        _loadRounds();
        console.log('[D] loaded v4 data');
        return 'v4';
      } catch(e){ console.warn('[D] v4 parse error, trying v531', e); }
    }
    // Priority 2: migrate from v531
    var rawOld = localStorage.getItem(LS_OLD);
    if(rawOld){
      try {
        var oldS = JSON.parse(rawOld);
        var result = migrateV531(oldS);
        _sc = result.scorecard;
        _ws = result.workspace;
        _ws.userBg = localStorage.getItem(LS_BG) || null;
        _postLoad();
        _loadRounds();
        console.log('[D] migrated from v531 to v4');
        // Save in v4 format immediately
        save();
        return 'migrated';
      } catch(e){ console.warn('[D] v531 migration error', e); }
    }
    // Priority 3: fresh start
    init();
    return 'fresh';
  }

  /**
   * Restore Round store from localStorage.
   * Does NOT affect _sc / _ws — parallel layer only.
   */
  function _loadRounds(){
    try {
      var raw = localStorage.getItem(LS_ROUNDS);
      if(raw){
        var parsed = JSON.parse(raw);
        if(parsed && parsed.version && parsed.rounds){
          _rounds = parsed;
          // Normalize rounds via Round module if available
          if(typeof Round !== 'undefined'){
            for(var rid in _rounds.rounds){
              _rounds.rounds[rid] = Round.normalizeRound(_rounds.rounds[rid]);
            }
          }
          console.log('[D] loaded rounds store, active:', _rounds.activeRoundId,
                      'count:', Object.keys(_rounds.rounds).length);
          return;
        }
      }
    } catch(e){ console.warn('[D] rounds load error', e); }
    _rounds = defRoundsStore();
  }

  function _postLoad(){
    // Structural integrity
    if(!_sc.version) _sc.version = '4.0';
    if(!_sc.course) _sc.course = defScorecard().course;
    if(!_sc.scores) _sc.scores = {};
    if(!_sc.players) _sc.players = [];
    if(!_sc.meta) _sc.meta = { createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };

    // ── Player Schema v4.1: ensure teams / groups arrays ──
    if(!_sc.playerSchemaVersion) _sc.playerSchemaVersion = '4.1';
    if(!Array.isArray(_sc.teams)) _sc.teams = [];
    if(!Array.isArray(_sc.groups)) _sc.groups = [];

    // Migrate: rename old course.holes → course.holeSnapshot
    if(_sc.course.holes && !_sc.course.holeSnapshot){
      _sc.course.holeSnapshot = _sc.course.holes;
      delete _sc.course.holes;
    }
    // Ensure course holeSnapshot array
    if(!Array.isArray(_sc.course.holeSnapshot)) _sc.course.holeSnapshot = [];
    var hc = _sc.course.holeCount || 18;
    while(_sc.course.holeSnapshot.length < hc) _sc.course.holeSnapshot.push(defCourseHole(_sc.course.holeSnapshot.length));

    // ── Player v4.1 migration: normalize all players ──
    // Also migrate scores keys if player.id was used instead of roundPlayerId
    var scoresKeyMigrations = {}; // oldKey → newKey
    _sc.players = _sc.players.map(function(raw, i){
      var oldId = raw.id || null;    // 兼容旧版本 id 字段
      var p = normalizePlayer(raw, i);
      // Track scores key migration: if old id differs from new roundPlayerId
      if(oldId && oldId !== p.roundPlayerId && _sc.scores[oldId] && !_sc.scores[p.roundPlayerId]){
        scoresKeyMigrations[oldId] = p.roundPlayerId;
      }
      return p;
    });
    // Apply scores key migrations
    for(var oldKey in scoresKeyMigrations){
      _sc.scores[scoresKeyMigrations[oldKey]] = _sc.scores[oldKey];
      delete _sc.scores[oldKey];
    }

    // Ensure player scores match hole count
    for(var pid in _sc.scores) ensureScores(pid);
    // Normalize all shots (flags array, notes, shotNumber)
    for(var pid2 in _sc.scores){
      _sc.scores[pid2].holes.forEach(function(h){
        (h.shots || []).forEach(function(s, idx){
          if(!Array.isArray(s.flags)) s.flags = s.flags ? [s.flags] : [];
          if(s.note !== undefined){ s.notes = s.notes || s.note || ''; delete s.note; }
          if(s.notes === undefined) s.notes = '';
          if(s.shotNumber == null) s.shotNumber = idx + 1;
        });
        // Ensure hole fields
        if(h.putts === undefined) h.putts = null;
        if(h.penalties === undefined) h.penalties = 0;
        if(h.notes === undefined) h.notes = '';
        if(h.net === undefined) h.net = null;
        if(!h.status) h.status = (h.gross !== null) ? 'completed' : 'not_started';
      });
    }
    // Workspace integrity
    if(!_ws.overlayPos || typeof _ws.overlayPos['16:9'] !== 'object')
      _ws.overlayPos = defWorkspace().overlayPos;
    if(!_ws.scorecardPos || typeof _ws.scorecardPos['16:9'] !== 'object')
      _ws.scorecardPos = defWorkspace().scorecardPos;
    ['16:9','9:16','1:1'].forEach(function(r){
      if(!_ws.scorecardPos[r]) _ws.scorecardPos[r] = defWorkspace().scorecardPos[r];
      else if(_ws.scorecardPos[r].y > 0.92) _ws.scorecardPos[r].y = 0.82;
    });
    // Ensure current player scores exist
    ensureScores(pid());
  }

  // ══════════════════════════════════════════
  // MIGRATION: v531 → v4
  // ══════════════════════════════════════════

  function migrateV531(oldS){
    var sc = defScorecard();
    var ws = defWorkspace();
    var hc = (oldS.holes && oldS.holes.length) || 18;

    // ── Course snapshot ──
    sc.course.holeCount = hc;
    sc.course.courseName = oldS.courseName || '';
    sc.course.selectedTee = oldS.selectedTee || 'blue';
    if(oldS.activeRound){
      sc.course.clubId = oldS.activeRound.clubId || null;
      sc.course.clubName = oldS.activeRound.clubName || '';
      sc.course.routingId = oldS.activeRound.routingId || null;
      sc.course.routingName = oldS.activeRound.routingName || '';
      sc.course.routingSourceType = oldS.activeRound.routingSourceType || null;
      sc.course.routingMeta = oldS.activeRound.routingMeta || {};
    }
    sc.course.holeSnapshot = Array.from({length:hc}, function(_,i){
      var oh = (oldS.holes && oldS.holes[i]) || {};
      return {
        number: i + 1,
        par: (oh.par != null) ? oh.par : 4,
        yards: oh.holeLengthYds || null,
        holeId: (oldS.activeRound && oldS.activeRound._routing &&
                 oldS.activeRound._routing.holeRefs &&
                 oldS.activeRound._routing.holeRefs[i]) || null
      };
    });

    // ── Players — migrate to v4.1 structure ──
    sc.players = (oldS.players || []).map(function(p, i){
      return normalizePlayer(p, i);
    });

    // ── Scores: delta → gross ──
    var activePid = oldS.currentPlayerId || SESSION;
    var byPlayer = oldS.byPlayer ? JSON.parse(JSON.stringify(oldS.byPlayer)) : {};

    // Capture active player's live data
    if(!byPlayer[activePid]){
      byPlayer[activePid] = {
        holes: (oldS.holes || []).map(function(h){
          return {
            delta: h.delta,
            shots: JSON.parse(JSON.stringify(h.shots || [])),
            shotIndex: h.shotIndex || 0,
            manualTypes: h.manualTypes || {},
            toPins: h.toPins || {}
          };
        })
      };
    }

    for(var playerId in byPlayer){
      var oldHoles = byPlayer[playerId].holes || [];
      sc.scores[playerId] = {
        holes: Array.from({length:hc}, function(_,i){
          var oh = oldHoles[i] || {};
          var par = sc.course.holeSnapshot[i].par;
          var gross = (oh.delta !== null && oh.delta !== undefined) ? par + oh.delta : null;

          // Migrate shots
          var oldShots = oh.shots || [];
          var shots = oldShots.map(function(s, si){
            var rawFlags = s.flags || s.manualCustomStatus || null;
            return {
              shotNumber: si + 1,
              type:    s.type    || s.manualShotType    || null,
              purpose: s.purpose || s.manualResult       || null,
              result:  s.result  || s.landing            || null,
              flags:   rawFlags ? [rawFlags] : [],
              notes:   s.note    || s.notes || '',
              lastTag: s.lastTag || null,
              toPin:   (si === 0) ? (sc.course.holeSnapshot[i].yards || null) : ((oh.toPins && oh.toPins[si]) || null)
            };
          });

          return {
            gross: gross,
            net: null,
            putts: null,
            penalties: 0,
            notes: '',
            status: (gross !== null) ? 'completed' : 'not_started',
            shots: shots
          };
        }),
        totals: {}
      };
    }

    // ── Workspace ──
    ws.currentHole       = oldS.currentHole || 0;
    ws.currentPlayerId   = oldS.currentPlayerId || null;
    ws.shotIndex         = (oldS.holes && oldS.holes[oldS.currentHole]) ? (oldS.holes[oldS.currentHole].shotIndex || -1) : -1;
    ws.scorecardSummary  = oldS.scorecardSummary || null;
    ws.displayMode       = oldS.displayMode || 'topar';
    ws.ratio             = oldS.ratio || '16:9';
    ws.exportRes         = oldS.exportRes || 2160;
    ws.bgOpacity         = (oldS.bgOpacity != null) ? oldS.bgOpacity : 1.0;
    ws.overlayOpacity    = (oldS.overlayOpacity != null) ? oldS.overlayOpacity : 1.0;
    ws.showShot          = (oldS.showShot != null) ? oldS.showShot : true;
    ws.showScore         = (oldS.showScore != null) ? oldS.showScore : true;
    ws.showTotal         = (oldS.showTotal != null) ? oldS.showTotal : true;
    ws.showDist          = (oldS.showDist != null) ? oldS.showDist : false;
    ws.showPlayerName    = (oldS.showPlayerName != null) ? oldS.showPlayerName : true;
    ws.safeZone          = (oldS.safeZone != null) ? oldS.safeZone : false;
    ws.szSize            = oldS.szSize || '10';
    ws.scoreRange        = oldS.scoreRange || '18';
    ws.lang              = oldS.lang || 'en';
    ws.theme             = oldS.theme || 'classic';
    ws.uiTheme           = oldS.uiTheme || 'auto';
    ws.overlayPos        = oldS.overlayPos || defWorkspace().overlayPos;
    ws.scorecardPos      = oldS.scorecardPos || defWorkspace().scorecardPos;
    ws.playerHistory     = oldS.playerHistory || [];
    ws.recentPlayerIds   = oldS.recentPlayerIds || [];
    ws.focusSlots        = oldS.focusSlots || [];
    ws.playerName        = oldS.playerName || 'PLAYER';

    return { scorecard:sc, workspace:ws };
  }

  // ══════════════════════════════════════════
  // LEGACY COMPATIBILITY: rebuild S object
  // ══════════════════════════════════════════
  // ⚠️ TRANSITIONAL — syncS / syncFromS 是 v4 数据层与遗留 S 全局对象之间的桥接层。
  //
  // 存在原因: 现有 canvas 渲染、UI 构建、导出等代码仍直接读写 S 对象。
  //           在全部迁移到 D API 之前，需要双向同步保持一致。
  //
  // 迁移路径:
  //   Phase 1 (当前) — 所有 mutation 走 D API，syncS 重建 S 供读取
  //   Phase 2 — 渲染/UI 代码逐步改为直接读 D.sc() / D.ws()
  //   Phase 3 — syncS / syncFromS 可安全删除，S 对象退役
  //
  // 目标: 完成 Phase 3 后移除本节全部代码。

  /**
   * [TRANSITIONAL] Rebuild the legacy S object from v4 data.
   * S.holes[] contains the CURRENT player's data with par from course snapshot.
   * Workspace properties are copied from _ws.
   * S.byPlayer is rebuilt for non-current player delta access.
   */
  function syncS(S){
    var playerId = pid();
    ensureScores(playerId);
    var hc = holeCount();

    // Rebuild S.holes for current player
    S.holes = Array.from({length:hc}, function(_,i){
      var ch = getCourseHole(i);
      var ph = _sc.scores[playerId].holes[i] || defPlayerHole();
      var delta = (ph.gross !== null) ? (ph.gross - (ch.par || 0)) : null;
      // Build legacy toPins map from shots
      var toPins = {};
      (ph.shots || []).forEach(function(s, si){
        if(s.toPin != null) toPins[si] = s.toPin;
      });
      return {
        par: ch.par,
        holeLengthYds: ch.yards,
        delta: delta,
        shots: ph.shots || [],       // direct reference — mutations go to v4 data
        shotIndex: (i === _ws.currentHole) ? _ws.shotIndex : -1,
        manualTypes: {},              // deprecated, kept for compat
        toPins: toPins,
        isPlaceholder: (ch.par == null)
      };
    });

    // Copy workspace state
    S.currentHole       = _ws.currentHole;
    S.displayMode       = _ws.displayMode;
    S.ratio             = _ws.ratio;
    S.exportRes         = _ws.exportRes;
    S.bgOpacity         = _ws.bgOpacity;
    S.overlayOpacity    = _ws.overlayOpacity;
    S.showShot          = _ws.showShot;
    S.showScore         = _ws.showScore;
    S.showTotal         = _ws.showTotal;
    S.showDist          = _ws.showDist;
    S.showPlayerName    = _ws.showPlayerName;
    S.safeZone          = _ws.safeZone;
    S.szSize            = _ws.szSize;
    S.scoreRange        = _ws.scoreRange;
    S.scorecardSummary  = _ws.scorecardSummary;
    S.lang              = _ws.lang;
    S.theme             = _ws.theme;
    S.uiTheme           = _ws.uiTheme;
    S.overlayPos        = _ws.overlayPos;
    S.scorecardPos      = _ws.scorecardPos;
    S.userBg            = _ws.userBg;
    S.playerHistory     = _ws.playerHistory;
    S.recentPlayerIds   = _ws.recentPlayerIds;
    S.focusSlots        = _ws.focusSlots;
    S.playerName        = _ws.playerName;
    S.selectedTee       = _sc.course.selectedTee;
    S.courseName        = _sc.course.courseName;

    // Player data
    S.players           = _sc.players;
    S.currentPlayerId   = _ws.currentPlayerId;

    // Teams / Groups
    S.teams             = _sc.teams || [];
    S.groups            = _sc.groups || [];

    // byPlayer compat: build delta-based view for all players
    S.byPlayer = {};
    for(var bpId in _sc.scores){
      S.byPlayer[bpId] = {
        holes: _sc.scores[bpId].holes.map(function(ph, i){
          var ch = getCourseHole(i);
          var delta = (ph.gross !== null) ? (ph.gross - (ch.par || 0)) : null;
          var toPins = {};
          (ph.shots || []).forEach(function(s, si){
            if(s.toPin != null) toPins[si] = s.toPin;
          });
          return {
            delta: delta,
            shots: ph.shots || [],
            shotIndex: -1,
            manualTypes: {},
            toPins: toPins
          };
        })
      };
    }

    // activeRound compat
    if(_sc.course.clubId){
      S.activeRound = {
        clubId:           _sc.course.clubId,
        clubName:         _sc.course.clubName,
        routingId:        _sc.course.routingId,
        routingName:      _sc.course.routingName,
        routingSourceType:_sc.course.routingSourceType,
        routingMeta:      _sc.course.routingMeta,
        _routing:         S._activeRouting || null
      };
    } else {
      S.activeRound = null;
    }
  }

  /**
   * [TRANSITIONAL] Sync workspace state from S back to D (for code that writes S directly).
   * Call before save() to capture any direct S mutations.
   * Target: remove once all UI code writes D.ws() directly instead of S.
   */
  function syncFromS(S){
    // Guard: if S has not been populated by syncS yet, skip entirely.
    // This prevents overwriting good _ws data with undefined values.
    if(!S || !S.holes) return;

    if(S.currentHole != null)     _ws.currentHole      = S.currentHole;
    if(S.currentPlayerId !== undefined) _ws.currentPlayerId = S.currentPlayerId;
    if(S.displayMode)             _ws.displayMode      = S.displayMode;
    if(S.ratio)                   _ws.ratio            = S.ratio;
    if(S.exportRes)               _ws.exportRes        = S.exportRes;
    if(S.bgOpacity != null)       _ws.bgOpacity        = S.bgOpacity;
    if(S.overlayOpacity != null)  _ws.overlayOpacity   = S.overlayOpacity;
    if(S.showShot != null)        _ws.showShot         = S.showShot;
    if(S.showScore != null)       _ws.showScore        = S.showScore;
    if(S.showTotal != null)       _ws.showTotal        = S.showTotal;
    if(S.showDist != null)        _ws.showDist         = S.showDist;
    if(S.showPlayerName != null)  _ws.showPlayerName   = S.showPlayerName;
    if(S.safeZone != null)        _ws.safeZone         = S.safeZone;
    if(S.szSize != null)          _ws.szSize           = S.szSize;
    if(S.scoreRange)              _ws.scoreRange       = S.scoreRange;
    // scorecardSummary can be null legitimately
    _ws.scorecardSummary = S.scorecardSummary || null;
    if(S.lang)                    _ws.lang             = S.lang;
    if(S.theme)                   _ws.theme            = S.theme;
    if(S.uiTheme)                 _ws.uiTheme          = S.uiTheme;
    if(S.overlayPos)              _ws.overlayPos       = S.overlayPos;
    if(S.scorecardPos)            _ws.scorecardPos     = S.scorecardPos;
    // userBg can be null legitimately (no background)
    _ws.userBg = S.userBg || null;
    if(S.playerHistory)           _ws.playerHistory    = S.playerHistory;
    if(S.recentPlayerIds)         _ws.recentPlayerIds  = S.recentPlayerIds;
    if(S.focusSlots)              _ws.focusSlots       = S.focusSlots;
    if(S.playerName)              _ws.playerName       = S.playerName;
    // shotIndex from current hole
    if(S.holes && S.holes[S.currentHole]){
      _ws.shotIndex = S.holes[S.currentHole].shotIndex;
    }
    // Course name
    if(S.courseName !== undefined)  _sc.course.courseName  = S.courseName || '';
    if(S.selectedTee !== undefined) _sc.course.selectedTee = S.selectedTee || 'blue';

    // ── Safety net: capture S.holes delta back to D.scores ──
    // In v4, all mutations should go through D API, but legacy code may still
    // write S.holes[].delta directly. This ensures those changes are not lost.
    var curPid = pid();
    ensureScores(curPid);
    var ph = _sc.scores[curPid].holes;
    for(var i = 0; i < S.holes.length && i < ph.length; i++){
      var sh = S.holes[i];
      if(sh.delta !== null && sh.delta !== undefined){
        var par = getCourseHole(i).par || 0;
        var expectedGross = par + sh.delta;
        if(ph[i].gross !== expectedGross){
          ph[i].gross = expectedGross;
          _syncStatus(ph[i]);
          _reconcileShots(ph[i]);
        }
      }
    }
  }

  // ══════════════════════════════════════════
  // EXPORT / IMPORT (scorecard only)
  // ══════════════════════════════════════════

  function exportScorecard(){ return JSON.stringify(_sc, null, 2); }
  function importScorecard(json){
    try { _sc = JSON.parse(json); _postLoad(); return true; }
    catch(e){ console.warn('[D] import error', e); return false; }
  }

  // ══════════════════════════════════════════
  // ROUND STORE ACCESSORS
  // ══════════════════════════════════════════

  /** Get the full rounds store (read-only intent). */
  function getRoundsStore(){ return _rounds || defRoundsStore(); }

  /** Get the active round ID (or null). */
  function getActiveRoundId(){
    return _rounds ? _rounds.activeRoundId : null;
  }

  /** Get the active Round object (or null). */
  function getActiveRound(){
    if(!_rounds || !_rounds.activeRoundId) return null;
    return _rounds.rounds[_rounds.activeRoundId] || null;
  }

  /** Get a specific round by ID (or null). */
  function getRound(id){
    if(!_rounds || !id) return null;
    return _rounds.rounds[id] || null;
  }

  /** List all round IDs. */
  function listRoundIds(){
    if(!_rounds) return [];
    return Object.keys(_rounds.rounds);
  }

  /**
   * Insert or overwrite a round in the store. Cannot overwrite the active round.
   * @param {Object} round - Round object (must have .id)
   * @returns {boolean} true if stored
   */
  function putRound(round){
    if(!_rounds || !round || !round.id) return false;
    if(round.id === _rounds.activeRoundId) return false; // safety
    _rounds.rounds[round.id] = round;
    try { localStorage.setItem(LS_ROUNDS, JSON.stringify(_rounds)); } catch(e){}
    return true;
  }

  /**
   * Delete a round by ID. Cannot delete the active round.
   * @returns {boolean} true if deleted
   */
  function deleteRound(id){
    if(!_rounds || !id) return false;
    if(id === _rounds.activeRoundId) return false; // safety
    if(!_rounds.rounds[id]) return false;
    delete _rounds.rounds[id];
    try { localStorage.setItem(LS_ROUNDS, JSON.stringify(_rounds)); } catch(e){}
    return true;
  }

  /**
   * Clear all rounds (active + stored) and reset scorecard/workspace.
   * Used to purge legacy data from before the account system.
   */
  function clearAllRounds(){
    _rounds = defRoundsStore();
    _sc = defScorecard();
    _ws = defWorkspace();
    try {
      localStorage.setItem(LS_ROUNDS, JSON.stringify(_rounds));
      localStorage.setItem(LS_SC, JSON.stringify(_sc));
      localStorage.setItem(LS_WS, JSON.stringify(_ws));
    } catch(e){}
  }

  // ══════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════

  return {
    // Init
    init:init,
    // Accessors
    sc:sc, ws:ws, pid:pid, rpid:rpid,
    // Course
    getCourseHole:getCourseHole, setCourseHolePar:setCourseHolePar,
    setCourseHoleYards:setCourseHoleYards, holeCount:holeCount, setHoleCount:setHoleCount,
    // Player scores
    ensureScores:ensureScores,
    getPlayerHole:getPlayerHole, getPlayerGross:getPlayerGross,
    getPlayerDelta:getPlayerDelta, getPlayerShots:getPlayerShots, getPlayerShot:getPlayerShot,
    // Score mutations
    setPlayerGross:setPlayerGross, adjPlayerGross:adjPlayerGross, clearPlayerHole:clearPlayerHole,
    setShotTag:setShotTag, setShotToPin:setShotToPin, setShotNotes:setShotNotes,
    // Hole-level mutations
    setHolePutts:setHolePutts, setHolePenalties:setHolePenalties,
    setHoleStatus:setHoleStatus, setHoleNotes:setHoleNotes, setHoleNet:setHoleNet,
    // Derived
    totalGross:totalGross, totalDelta:totalDelta,
    projectedGross:projectedGross, playedCount:playedCount,
    // Players
    addPlayer:addPlayer, removePlayer:removePlayer,
    getPlayer:getPlayer, updatePlayer:updatePlayer,
    // Player helpers
    genRoundPlayerId:genRoundPlayerId,
    playerDisplayName:playerDisplayName, playerShortName:playerShortName,
    playerUIColor:playerUIColor,
    normalizePlayer:normalizePlayer, validatePlayer:validatePlayer,
    migrateTeamField:migrateTeamField, migrateColor:migrateColor,
    // Persistence
    save:save, load:load,
    // Round store
    getRoundsStore:getRoundsStore, getActiveRoundId:getActiveRoundId,
    getActiveRound:getActiveRound, getRound:getRound,
    listRoundIds:listRoundIds, putRound:putRound, deleteRound:deleteRound, clearAllRounds:clearAllRounds,
    // Legacy compat
    syncS:syncS, syncFromS:syncFromS,
    migrateV531:migrateV531,
    // Factories
    defShot:defShot, defPlayerHole:defPlayerHole, defCourseHole:defCourseHole,
    defPlayer:defPlayer, defTeam:defTeam, defGroup:defGroup,
    defScorecard:defScorecard, defWorkspace:defWorkspace,
    // Export/Import
    exportScorecard:exportScorecard, importScorecard:importScorecard,
    // Constants
    SESSION:SESSION, PLAYER_STATUS:PLAYER_STATUS
  };

})();
