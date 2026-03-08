// ============================================================
// roundBuilder.js — Convert ImportedMatch to App Round
// Depends on: data.js (D API)
// ============================================================
//
// This module takes a normalized ImportedMatch and writes it
// into the app's v4.0 data model via D API.
//
// Key rules:
//   1. courseSnapshot is generated from import, no main DB dependency
//   2. totals are ALWAYS recalculated from holes, never from import
//   3. shots[] are left EMPTY — GolfLive has no per-shot data
//   4. source + importAudit stored on D.sc() for traceability
//   5. gross/status consistency is maintained
// ============================================================

const RoundBuilder = (function(){

  var PARSER_VERSION = '1.0.0';

  /**
   * Build a new round from ImportedMatch and apply it to the app.
   * Replaces current round entirely.
   *
   * @param {ImportedMatch} match
   * @returns {{ warnings: string[], playerCount: number, holeCount: number }}
   */
  function buildAndApply(match){
    var sc = D.sc();
    var ws = D.ws();

    // ── 1. Clear existing round state ──
    if(typeof RoundManager !== 'undefined') RoundManager.clearRound();

    // ── 2. Write course snapshot ──
    sc.course.clubId = null;
    sc.course.clubName = '';
    sc.course.courseName = match.event.courseName || match.event.title || '';
    sc.course.routingId = null;
    sc.course.routingName = '';
    sc.course.routingSourceType = null;
    sc.course.routingMeta = {};
    sc.course.selectedTee = 'blue';
    sc.course.holeCount = match.course.holeCount;
    sc.course.holeSnapshot = match.course.pars.map(function(par, i){
      return {
        number: i + 1,
        par: par,
        yards: null,
        holeId: null
      };
    });

    // ── 3. Write players ──
    sc.players = match.players.map(function(p, i){
      var rpId = D.genRoundPlayerId('imp', i);
      p._id = rpId; // stash for score mapping
      var overrides = {};
      if(p.groupNo != null) overrides.groupId = 'g' + p.groupNo;
      var player = D.defPlayer(rpId, p.name, overrides);
      return player;
    });

    // ── 4. Write scores ──
    // Write directly to sc.scores to avoid D.setPlayerGross creating fake shots
    sc.scores = {};
    var hc = match.course.holeCount;
    var pars = match.course.pars;

    match.players.forEach(function(p){
      var holes = [];
      for(var i = 0; i < hc; i++){
        var gross = p.grossByHole ? p.grossByHole[i] : null;
        if(gross === undefined) gross = null;
        holes.push({
          gross: gross,
          net: null,
          putts: null,
          penalties: 0,
          notes: '',
          status: gross !== null ? 'completed' : 'not_started',
          shots: [] // explicitly empty — GolfLive has no shot data
        });
      }
      sc.scores[p._id] = { holes: holes, totals: {} };
    });

    // ── 5. Write source (round provenance) ──
    sc.source = {
      kind: 'import',
      provider: match.source,
      fileName: match.sourceMeta.fileName,
      importedAt: match.sourceMeta.importedAt
    };

    // ── 6. Write meta (merge, don't overwrite) ──
    sc.meta = Object.assign({}, sc.meta || {}, {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: match.event.title || '',
      roundLabel: match.event.roundLabel || ''
    });

    // ── 7. Write import audit (technical trace) ──
    sc.importAudit = {
      detectedFormat: match.sourceMeta.detectedFormat,
      sheetName: match.sourceMeta.sheetName || '',
      parserVersion: PARSER_VERSION,
      warnings: match.validation.warnings.slice(),
      rowAudits: match.players
        .filter(function(p){ return p._issues && p._issues.length > 0; })
        .map(function(p){
          return { playerName: p.name, issues: p._issues.slice() };
        })
    };

    // ── 8. Reset workspace ──
    ws.currentHole = 0;
    ws.currentPlayerId = sc.players.length > 0 ? D.rpid(sc.players[0]) : null;
    ws.shotIndex = -1;
    ws.scorecardSummary = null;

    // ── 9. Recalculate totals (from holes, not from import) ──
    _recalcAllTotals(sc, pars);

    return {
      warnings: match.validation.warnings,
      playerCount: sc.players.length,
      holeCount: hc
    };
  }

  /**
   * Recalculate totals for all players from their holes data.
   * Totals are derived cache only — never independent truth.
   */
  function _recalcAllTotals(sc, pars){
    var hc = sc.course.holeCount;
    for(var pid in sc.scores){
      var holes = sc.scores[pid].holes;
      var totalGross = 0, totalDelta = 0, playedCount = 0;
      var outGross = 0, outDelta = 0, outPlayed = 0;
      var inGross = 0, inDelta = 0, inPlayed = 0;
      var half = Math.min(9, hc);

      for(var i = 0; i < hc; i++){
        var g = holes[i] ? holes[i].gross : null;
        if(g !== null){
          var par = pars[i] || 4;
          var d = g - par;
          totalGross += g;
          totalDelta += d;
          playedCount++;
          if(i < half){ outGross += g; outDelta += d; outPlayed++; }
          else { inGross += g; inDelta += d; inPlayed++; }
        }
      }

      sc.scores[pid].totals = {
        gross: playedCount > 0 ? totalGross : null,
        delta: playedCount > 0 ? totalDelta : null,
        played: playedCount,
        outGross: outPlayed > 0 ? outGross : null,
        outDelta: outPlayed > 0 ? outDelta : null,
        outPlayed: outPlayed,
        inGross: inPlayed > 0 ? inGross : null,
        inDelta: inPlayed > 0 ? inDelta : null,
        inPlayed: inPlayed
      };
    }
  }

  return {
    buildAndApply: buildAndApply
  };

})();
