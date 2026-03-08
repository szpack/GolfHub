// ============================================================
// sessionIO.js — Round Session Import / Export
// Depends on: data.js (D API)
// ============================================================
//
// Data truth hierarchy:
//   - course.holeSnapshot[] — par/yards frozen at round creation
//   - players[] — array order IS the ordering truth
//   - scores[roundPlayerId].holes[] — gross is primary, delta = gross - par (derived)
//   - scores[roundPlayerId].holes[].shots[] — per-shot detail records
//
// Player schema v4.1:
//   - roundPlayerId is the primary key (replaces legacy 'id')
//   - Old 'id' field is still accepted on import for backward compat
//   - team/color fields migrated to teamId/side/groupId/colorKey
//
// NOT exported as truth:
//   - totals (derived cache)
//   - toPar / front/back sums (derived)
//   - ranking / statistics (derived)
//   - transient UI state (hover, tooltip, drawer open/close)
//
// ============================================================

const SessionIO = (function(){

  const SCHEMA_VERSION = '4.1';
  const KIND = 'round-session';
  const CURRENT_APP_VERSION = '14.0.0';

  // ══════════════════════════════════════════
  // SERIALIZE — build export payload
  // ══════════════════════════════════════════

  /**
   * Serialize current round state into a clean export object.
   * Only truth data is included; derived caches are stripped.
   */
  function serializeRoundState(){
    const sc = D.sc();
    const ws = D.ws();

    // Build players array — preserve array order (the single truth for ordering)
    const players = (sc.players || []).map(function(p, i){
      var rpId = D.rpid(p);
      return {
        roundPlayerId: rpId,
        playerId: p.playerId || null,
        name: p.name || '',
        displayName: p.displayName || null,
        shortName: p.shortName || null,
        status: p.status || 'active',
        teamId: p.teamId || null,
        side: p.side || null,
        groupId: p.groupId || null,
        colorKey: p.colorKey || null,
        hcpSnapshot: p.hcpSnapshot || null,
        avatar: p.avatar || null,
        role: p.role || null,
        isGuest: !!p.isGuest,
        notes: p.notes || '',
        // Legacy compat fields for older importers
        id: rpId,
        order: i
      };
    });

    // Build holes — per-player score data with shots
    const hc = D.holeCount();
    const holes = {};
    for(var pid in sc.scores){
      var playerHoles = (sc.scores[pid].holes || []).slice(0, hc);
      holes[pid] = playerHoles.map(function(h){
        return {
          gross: h.gross,          // PRIMARY truth
          net: h.net,
          putts: h.putts,
          penalties: h.penalties || 0,
          notes: h.notes || '',
          status: h.status || 'not_started',
          shots: (h.shots || []).map(function(s, si){
            return {
              shotNumber: s.shotNumber || (si + 1),
              type: s.type || null,
              purpose: s.purpose || null,
              result: s.result || null,
              flags: Array.isArray(s.flags) ? s.flags.slice() : [],
              notes: s.notes || '',
              lastTag: s.lastTag || null,
              toPin: s.toPin != null ? s.toPin : null
            };
          })
          // NOTE: no totals, no delta — these are derived
        };
      });
    }

    // Teams & groups
    var teams = (sc.teams || []).map(function(t){
      return { teamId: t.teamId, name: t.name, color: t.color || null, notes: t.notes || '' };
    });
    var groups = (sc.groups || []).map(function(g){
      return { groupId: g.groupId, name: g.name, teeTime: g.teeTime || null, notes: g.notes || '' };
    });

    // UI state — only persistent display preferences, not transient states
    const uiState = {
      currentHole: ws.currentHole || 0,
      currentPlayerId: ws.currentPlayerId || null,
      shotIndex: ws.shotIndex != null ? ws.shotIndex : -1,
      displayMode: ws.displayMode || 'topar',
      ratio: ws.ratio || '16:9',
      exportRes: ws.exportRes || 2160,
      overlayOpacity: ws.overlayOpacity != null ? ws.overlayOpacity : 1.0,
      showShot: ws.showShot != null ? ws.showShot : true,
      showScore: ws.showScore != null ? ws.showScore : true,
      showTotal: ws.showTotal != null ? ws.showTotal : true,
      showDist: ws.showDist != null ? ws.showDist : false,
      showPlayerName: ws.showPlayerName != null ? ws.showPlayerName : true,
      scoreRange: ws.scoreRange || '18',
      scorecardSummary: ws.scorecardSummary || null,
      theme: ws.theme || 'classic',
      overlayPos: ws.overlayPos || null,
      scorecardPos: ws.scorecardPos || null,
      focusSlots: ws.focusSlots || [],
      playerName: ws.playerName || 'PLAYER'
    };

    return {
      schemaVersion: SCHEMA_VERSION,
      kind: KIND,
      appVersion: CURRENT_APP_VERSION,
      exportedAt: new Date().toISOString(),
      playerSchemaVersion: sc.playerSchemaVersion || '4.1',
      meta: {
        roundId: sc.meta && sc.meta.roundId || null,
        createdAt: sc.meta && sc.meta.createdAt || null,
        updatedAt: sc.meta && sc.meta.updatedAt || new Date().toISOString()
      },
      round: {
        clubId: sc.course.clubId || null,
        clubName: sc.course.clubName || '',
        courseName: sc.course.courseName || '',
        routingId: sc.course.routingId || null,
        routingName: sc.course.routingName || '',
        routingSourceType: sc.course.routingSourceType || null,
        routingMeta: sc.course.routingMeta || {},
        selectedTee: sc.course.selectedTee || 'blue',
        holeCount: hc,
        holeSnapshot: (sc.course.holeSnapshot || []).slice(0, hc).map(function(h){
          return { number: h.number, par: h.par, yards: h.yards, holeId: h.holeId || null };
        })
      },
      players: players,
      teams: teams,
      groups: groups,
      holes: holes,
      uiState: uiState
    };
  }

  // ══════════════════════════════════════════
  // EXPORT — download JSON file
  // ══════════════════════════════════════════

  function exportRoundJSON(){
    var payload = serializeRoundState();
    var json = JSON.stringify(payload, null, 2);
    var blob = new Blob([json], {type: 'application/json;charset=utf-8'});
    var now = new Date();
    var ts = now.getFullYear()
      + String(now.getMonth()+1).padStart(2,'0')
      + String(now.getDate()).padStart(2,'0')
      + '_'
      + String(now.getHours()).padStart(2,'0')
      + String(now.getMinutes()).padStart(2,'0')
      + String(now.getSeconds()).padStart(2,'0');
    var fn = 'GolfOverlay_round_' + ts + '.json';
    _downloadBlob(blob, fn);
    if(typeof miniToast === 'function') miniToast('Round exported');
  }

  function _downloadBlob(blob, fname){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fname;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ══════════════════════════════════════════
  // VALIDATE — check payload structure
  // ══════════════════════════════════════════

  function validateRoundPayload(payload){
    if(!payload || typeof payload !== 'object'){
      throw new Error('Not a valid JSON object');
    }
    if(payload.kind !== KIND){
      throw new Error('Not a valid GolfOverlay round session file (kind mismatch)');
    }
    if(!payload.schemaVersion){
      throw new Error('Missing schema version');
    }
    if(!Array.isArray(payload.players)){
      throw new Error('Players data is missing or corrupted');
    }
    if(!payload.holes || typeof payload.holes !== 'object'){
      throw new Error('Holes data is missing');
    }
    if(!payload.round || typeof payload.round !== 'object'){
      throw new Error('Round data is missing');
    }
    // Validate each player has an ID (roundPlayerId or legacy id) and name
    payload.players.forEach(function(p, i){
      var pid = p.roundPlayerId || p.id;
      if(!pid || !p.name){
        throw new Error('Player #' + (i+1) + ' is missing id or name');
      }
    });
    // Validate holes structure
    for(var pid in payload.holes){
      if(!Array.isArray(payload.holes[pid])){
        throw new Error('Holes data for player ' + pid + ' is not an array');
      }
      payload.holes[pid].forEach(function(h, hi){
        if(h.shots && !Array.isArray(h.shots)){
          throw new Error('Shots data for hole ' + (hi+1) + ' is not an array');
        }
      });
    }
  }

  // ══════════════════════════════════════════
  // MIGRATE — version migration
  // ══════════════════════════════════════════

  function migrateRoundPayload(payload){
    var ver = payload.schemaVersion;
    // Current versions — pass through
    if(ver === '4.0' || ver === '4.1') return payload;
    // Future version — reject
    var verNum = parseFloat(ver);
    if(verNum > parseFloat(SCHEMA_VERSION)){
      throw new Error('Schema version ' + ver + ' is newer than supported (' + SCHEMA_VERSION + '). Please update the app.');
    }
    // Older versions — attempt migration (extensible)
    if(verNum < 4.0){
      throw new Error('Schema version ' + ver + ' is too old and cannot be migrated');
    }
    return payload;
  }

  // ══════════════════════════════════════════
  // NORMALIZE — fill defaults, clean structure
  // ══════════════════════════════════════════

  function normalizeRoundPayload(payload){
    // Normalize round
    var round = payload.round;
    round.holeCount = round.holeCount || 18;
    if(!Array.isArray(round.holeSnapshot)) round.holeSnapshot = [];
    while(round.holeSnapshot.length < round.holeCount){
      round.holeSnapshot.push({number: round.holeSnapshot.length + 1, par: 4, yards: null, holeId: null});
    }

    // Normalize players via D.normalizePlayer — handles v4.0→v4.1 migration
    payload.players = payload.players.map(function(p, i){
      return D.normalizePlayer(p, i);
    });

    // Normalize holes — ensure all players have correct hole count with defaults
    // Use roundPlayerId as key (normalizePlayer ensures it's set)
    var hc = round.holeCount;
    payload.players.forEach(function(p){
      var rpId = D.rpid(p);
      // Check both new key and legacy key
      var holesArr = payload.holes[rpId] || payload.holes[p.id] || [];
      // Re-key under roundPlayerId if needed
      if(!payload.holes[rpId] && payload.holes[p.id]){
        payload.holes[rpId] = payload.holes[p.id];
        if(rpId !== p.id) delete payload.holes[p.id];
      }
      if(!payload.holes[rpId]) payload.holes[rpId] = [];
      var arr = payload.holes[rpId];
      while(arr.length < hc){
        arr.push({gross: null, net: null, putts: null, penalties: 0, notes: '', status: 'not_started', shots: []});
      }
      arr.forEach(function(h){
        if(h.gross === undefined) h.gross = null;
        if(h.net === undefined) h.net = null;
        if(h.putts === undefined) h.putts = null;
        if(h.penalties === undefined) h.penalties = 0;
        if(h.notes === undefined) h.notes = '';
        if(!h.status) h.status = (h.gross !== null) ? 'completed' : 'not_started';
        if(!Array.isArray(h.shots)) h.shots = [];
        // Normalize each shot
        h.shots.forEach(function(s, si){
          if(s.shotNumber == null) s.shotNumber = si + 1;
          if(s.type === undefined) s.type = null;
          if(s.purpose === undefined) s.purpose = null;
          if(s.result === undefined) s.result = null;
          if(!Array.isArray(s.flags)) s.flags = s.flags ? [s.flags] : [];
          if(s.notes === undefined) s.notes = s.note || '';
          if(s.note !== undefined) delete s.note;
          if(s.lastTag === undefined) s.lastTag = null;
          if(s.toPin === undefined) s.toPin = null;
        });
      });
    });

    // Normalize teams & groups
    if(!Array.isArray(payload.teams)) payload.teams = [];
    if(!Array.isArray(payload.groups)) payload.groups = [];

    // Strip any stale player IDs from holes that aren't in players[]
    var validPids = {};
    payload.players.forEach(function(p){ validPids[D.rpid(p)] = true; });
    // Keep session ID holes too
    validPids[D.SESSION] = true;
    for(var pid in payload.holes){
      if(!validPids[pid]) delete payload.holes[pid];
    }

    // Normalize uiState
    if(!payload.uiState) payload.uiState = {};
    var ui = payload.uiState;
    if(ui.currentHole == null) ui.currentHole = 0;
    if(ui.currentHole >= hc) ui.currentHole = 0;
    if(ui.shotIndex == null) ui.shotIndex = -1;

    return payload;
  }

  // ══════════════════════════════════════════
  // REBUILD — sync status/gross, clear derived
  // ══════════════════════════════════════════

  /**
   * After writing imported data to D, rebuild all derived state.
   * This ensures status<->gross consistency and clears stale caches.
   */
  function rebuildDerivedState(){
    var sc = D.sc();
    // 1. Re-sync status <-> gross for every hole of every player
    //    and reconcile shots arrays
    for(var pid in sc.scores){
      var holes = sc.scores[pid].holes || [];
      holes.forEach(function(h){
        // Sync status based on gross
        if(h.gross === null || h.gross < 1){
          if(h.status !== 'picked_up') h.status = 'not_started';
        } else {
          if(h.status === 'not_started') h.status = 'in_progress';
        }
        // Ensure shots array extends to gross count
        if(h.gross !== null && h.gross >= 1){
          while(h.shots.length < h.gross){
            var sn = h.shots.length + 1;
            h.shots.push(D.defShot(sn));
          }
        }
        // Normalize shot fields
        (h.shots || []).forEach(function(s, idx){
          if(!Array.isArray(s.flags)) s.flags = s.flags ? [s.flags] : [];
          if(s.shotNumber == null) s.shotNumber = idx + 1;
        });
      });
      // 2. Clear totals cache — will be rebuilt on demand
      sc.scores[pid].totals = {};
    }
  }

  // ══════════════════════════════════════════
  // DESERIALIZE — write payload into D
  // ══════════════════════════════════════════

  function deserializeRoundState(payload){
    var sc = D.sc();
    var ws = D.ws();

    // ── Write course snapshot ──
    sc.version = payload.schemaVersion;
    sc.course.clubId = payload.round.clubId;
    sc.course.clubName = payload.round.clubName || '';
    sc.course.courseName = payload.round.courseName || '';
    sc.course.routingId = payload.round.routingId;
    sc.course.routingName = payload.round.routingName || '';
    sc.course.routingSourceType = payload.round.routingSourceType;
    sc.course.routingMeta = payload.round.routingMeta || {};
    sc.course.selectedTee = payload.round.selectedTee || 'blue';
    sc.course.holeCount = payload.round.holeCount || 18;
    sc.course.holeSnapshot = payload.round.holeSnapshot.map(function(h){
      return { number: h.number, par: h.par, yards: h.yards, holeId: h.holeId || null };
    });

    // ── Write players (already normalized) ──
    sc.players = payload.players.slice();
    sc.playerSchemaVersion = '4.1';

    // ── Write teams & groups ──
    sc.teams = (payload.teams || []).slice();
    sc.groups = (payload.groups || []).slice();

    // ── Write scores ──
    sc.scores = {};
    var hc = sc.course.holeCount;
    for(var pid in payload.holes){
      var importedHoles = payload.holes[pid];
      sc.scores[pid] = {
        holes: Array.from({length: hc}, function(_, i){
          var ih = importedHoles[i];
          if(!ih) return D.defPlayerHole();
          return {
            gross: ih.gross,
            net: ih.net || null,
            putts: ih.putts != null ? ih.putts : null,
            penalties: ih.penalties || 0,
            notes: ih.notes || '',
            status: ih.status || 'not_started',
            shots: (ih.shots || []).map(function(s, si){
              return {
                shotNumber: s.shotNumber || (si + 1),
                type: s.type || null,
                purpose: s.purpose || null,
                result: s.result || null,
                flags: Array.isArray(s.flags) ? s.flags.slice() : [],
                notes: s.notes || '',
                lastTag: s.lastTag || null,
                toPin: s.toPin != null ? s.toPin : null
              };
            })
          };
        }),
        totals: {}  // derived — always empty on import
      };
    }

    // ── Write meta ──
    sc.meta = {
      createdAt: (payload.meta && payload.meta.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if(payload.meta && payload.meta.roundId) sc.meta.roundId = payload.meta.roundId;

    // ── Write UI state ──
    var ui = payload.uiState || {};
    ws.currentHole = ui.currentHole || 0;
    ws.currentPlayerId = ui.currentPlayerId || null;
    ws.shotIndex = ui.shotIndex != null ? ui.shotIndex : -1;
    ws.displayMode = ui.displayMode || ws.displayMode;
    ws.ratio = ui.ratio || ws.ratio;
    ws.exportRes = ui.exportRes || ws.exportRes;
    ws.overlayOpacity = ui.overlayOpacity != null ? ui.overlayOpacity : ws.overlayOpacity;
    ws.showShot = ui.showShot != null ? ui.showShot : ws.showShot;
    ws.showScore = ui.showScore != null ? ui.showScore : ws.showScore;
    ws.showTotal = ui.showTotal != null ? ui.showTotal : ws.showTotal;
    ws.showDist = ui.showDist != null ? ui.showDist : ws.showDist;
    ws.showPlayerName = ui.showPlayerName != null ? ui.showPlayerName : ws.showPlayerName;
    ws.scoreRange = ui.scoreRange || ws.scoreRange;
    ws.scorecardSummary = ui.scorecardSummary || null;
    ws.theme = ui.theme || ws.theme;
    if(ui.overlayPos) ws.overlayPos = ui.overlayPos;
    if(ui.scorecardPos) ws.scorecardPos = ui.scorecardPos;
    ws.focusSlots = ui.focusSlots || [];
    ws.playerName = ui.playerName || ws.playerName;

    // ── Rebuild derived state ──
    rebuildDerivedState();
  }

  // ══════════════════════════════════════════
  // IMPORT — read file, validate, apply
  // ══════════════════════════════════════════

  function importRoundJSON(){
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = function(){
      var f = inp.files[0];
      if(!f) return;
      var reader = new FileReader();
      reader.onload = function(){
        try {
          _applyImport(reader.result);
        } catch(e){
          console.error('[SessionIO] import error', e);
          if(typeof miniToast === 'function') miniToast(e.message, true);
        }
      };
      reader.readAsText(f);
    };
    inp.click();
  }

  function _applyImport(text){
    // 1. Parse JSON
    var payload;
    try {
      payload = JSON.parse(text);
    } catch(e){
      throw new Error('File is not valid JSON');
    }

    // 2. Validate structure
    validateRoundPayload(payload);

    // 3. Version migration
    payload = migrateRoundPayload(payload);

    // 4. Normalize (fill defaults, clean structure, migrate player schema)
    payload = normalizeRoundPayload(payload);

    // 5. Deserialize into D (replaces current round)
    deserializeRoundState(payload);

    // 6. Sync legacy S object and refresh UI
    if(typeof S !== 'undefined'){
      D.syncS(S);
    }
    if(typeof buildHoleNav === 'function') buildHoleNav();
    if(typeof buildPlayerArea === 'function') buildPlayerArea();
    if(typeof buildFocusPlayerBtns === 'function') buildFocusPlayerBtns();
    if(typeof render === 'function') render();
    if(typeof scheduleSave === 'function') scheduleSave();

    // 7. Success message
    var nPlayers = payload.players.length;
    var nHoles = payload.round.holeCount;
    var nShots = 0;
    for(var pid in payload.holes){
      payload.holes[pid].forEach(function(h){
        nShots += (h.shots || []).length;
      });
    }
    var curHole = (payload.uiState && payload.uiState.currentHole != null)
      ? payload.uiState.currentHole + 1 : 1;
    var msg = nPlayers + ' players / ' + nHoles + ' holes / ' + nShots + ' shots imported. Hole ' + curHole;
    if(typeof miniToast === 'function') miniToast(msg);
  }

  // ══════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════

  return {
    exportRoundJSON: exportRoundJSON,
    importRoundJSON: importRoundJSON,
    serializeRoundState: serializeRoundState,
    deserializeRoundState: deserializeRoundState,
    validateRoundPayload: validateRoundPayload,
    migrateRoundPayload: migrateRoundPayload,
    normalizeRoundPayload: normalizeRoundPayload,
    rebuildDerivedState: rebuildDerivedState
  };

})();
