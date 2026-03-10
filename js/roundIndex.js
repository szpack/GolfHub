// ============================================================
// roundIndex.js — Round Query Index
//
// Maintains inverted indexes over RoundSummary fields for
// fast query without scanning all summaries.
//
// Index structure (memory + localStorage):
//   byPlayer:  { playerId: [roundId, ...] }
//   byCourse:  { courseId: [roundId, ...] }
//   byStatus:  { status: [roundId, ...] }
//   byDate:    [ { date: 'YYYY-MM-DD', id: roundId }, ... ]  (sorted desc)
//   byUpdated: [ { ts: 'ISO', id: roundId }, ... ]           (sorted desc)
//
// localStorage key: golf_v6_round_index
//
// Depends on: RoundStore (roundStore.js)
// ============================================================

const RoundIndex = (function(){

  var LS_KEY = 'golf_v6_round_index';

  // ── In-memory indexes ──
  var _byPlayer  = {};  // { playerId: [roundId] }
  var _byCourse  = {};  // { courseId: [roundId] }
  var _byStatus  = {};  // { status: [roundId] }
  var _byDate    = [];  // [{ date, id }] sorted desc
  var _byUpdated = [];  // [{ ts, id }] sorted desc

  // ══════════════════════════════════════════
  // INDEX MAINTENANCE
  // ══════════════════════════════════════════

  /**
   * Add or update a round in all indexes based on its Summary.
   * Removes stale entries first, then inserts fresh.
   * @param {RoundSummary} summary
   */
  function indexRound(summary){
    if(!summary || !summary.id) return;
    var id = summary.id;

    // Remove stale entries first
    _removeFromAll(id);

    // byPlayer
    var pids = summary.playerIds || [];
    for(var i = 0; i < pids.length; i++){
      var pid = pids[i];
      if(!pid) continue;
      if(!_byPlayer[pid]) _byPlayer[pid] = [];
      _byPlayer[pid].push(id);
    }

    // byCourse
    var cid = summary.courseId;
    if(cid){
      if(!_byCourse[cid]) _byCourse[cid] = [];
      _byCourse[cid].push(id);
    }

    // byStatus
    var st = summary.status || 'scheduled';
    if(!_byStatus[st]) _byStatus[st] = [];
    _byStatus[st].push(id);

    // byDate (insert sorted desc)
    var dateVal = summary.date || '';
    _insertSorted(_byDate, { date: dateVal, id: id }, 'date');

    // byUpdated (insert sorted desc)
    var updVal = summary.updatedAt || '';
    _insertSorted(_byUpdated, { ts: updVal, id: id }, 'ts');

    _persist();
  }

  /**
   * Remove a round from all indexes.
   * @param {string} roundId
   */
  function removeRound(roundId){
    _removeFromAll(roundId);
    _persist();
  }

  // ── Internal removal ──

  function _removeFromAll(id){
    // byPlayer
    for(var pid in _byPlayer){
      _byPlayer[pid] = _byPlayer[pid].filter(function(r){ return r !== id; });
      if(_byPlayer[pid].length === 0) delete _byPlayer[pid];
    }
    // byCourse
    for(var cid in _byCourse){
      _byCourse[cid] = _byCourse[cid].filter(function(r){ return r !== id; });
      if(_byCourse[cid].length === 0) delete _byCourse[cid];
    }
    // byStatus
    for(var st in _byStatus){
      _byStatus[st] = _byStatus[st].filter(function(r){ return r !== id; });
      if(_byStatus[st].length === 0) delete _byStatus[st];
    }
    // byDate
    _byDate = _byDate.filter(function(e){ return e.id !== id; });
    // byUpdated
    _byUpdated = _byUpdated.filter(function(e){ return e.id !== id; });
  }

  /** Insert into a descending-sorted array by sortKey. */
  function _insertSorted(arr, entry, sortKey){
    var val = entry[sortKey] || '';
    // Find insertion point (desc order)
    var pos = 0;
    while(pos < arr.length && (arr[pos][sortKey] || '') >= val) pos++;
    arr.splice(pos, 0, entry);
  }

  // ══════════════════════════════════════════
  // QUERY
  // ══════════════════════════════════════════

  /**
   * Query rounds by multiple criteria.
   * All criteria are AND-combined. Returns roundIds.
   *
   * @param {Object} opts
   * @param {string}   [opts.playerId]  - filter by player
   * @param {string}   [opts.courseId]   - filter by course
   * @param {string|string[]} [opts.status] - filter by status (string or array)
   * @param {string}   [opts.dateFrom]  - inclusive YYYY-MM-DD
   * @param {string}   [opts.dateTo]    - inclusive YYYY-MM-DD
   * @param {string}   [opts.sortBy]    - 'date'|'updatedAt' (default 'date')
   * @param {string}   [opts.sortOrder] - 'asc'|'desc' (default 'desc')
   * @param {number}   [opts.limit]     - max results
   * @param {number}   [opts.offset]    - skip first N
   * @returns {string[]} roundIds in requested order
   */
  function query(opts){
    opts = opts || {};

    // Start with a candidate set
    var candidates = null; // null = all

    // Filter: playerId
    if(opts.playerId){
      candidates = _intersect(candidates, _byPlayer[opts.playerId] || []);
    }

    // Filter: courseId
    if(opts.courseId){
      candidates = _intersect(candidates, _byCourse[opts.courseId] || []);
    }

    // Filter: status (single string or array)
    if(opts.status){
      var statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
      var statusSet = [];
      for(var si = 0; si < statuses.length; si++){
        var ids = _byStatus[statuses[si]] || [];
        for(var j = 0; j < ids.length; j++){
          if(statusSet.indexOf(ids[j]) < 0) statusSet.push(ids[j]);
        }
      }
      candidates = _intersect(candidates, statusSet);
    }

    // Filter: dateFrom / dateTo
    if(opts.dateFrom || opts.dateTo){
      var dateFiltered = [];
      for(var di = 0; di < _byDate.length; di++){
        var e = _byDate[di];
        if(opts.dateFrom && e.date < opts.dateFrom) continue;
        if(opts.dateTo && e.date > opts.dateTo) continue;
        dateFiltered.push(e.id);
      }
      candidates = _intersect(candidates, dateFiltered);
    }

    // Filter: lockState (optional)
    if(opts.lockState){
      var lsArr = Array.isArray(opts.lockState) ? opts.lockState : [opts.lockState];
      var lsFiltered = [];
      // Must check summaries since lockState is not indexed
      for(var li = 0; li < _byDate.length; li++){
        var rid = _byDate[li].id;
        if(typeof RoundStore !== 'undefined'){
          var rs = RoundStore.get(rid);
          if(rs && lsArr.indexOf(rs.lockState || 'open') >= 0){
            lsFiltered.push(rid);
          }
        }
      }
      candidates = _intersect(candidates, lsFiltered);
    }

    // If no filter applied, use all ids from byDate
    if(candidates === null){
      candidates = _byDate.map(function(e){ return e.id; });
    }

    // Sort
    var sortBy = opts.sortBy || 'date';
    var sortOrder = opts.sortOrder || 'desc';
    var sorted = _sortCandidates(candidates, sortBy, sortOrder);

    // Offset + Limit
    var offset = opts.offset || 0;
    var limit = opts.limit || 0;
    if(offset > 0) sorted = sorted.slice(offset);
    if(limit > 0) sorted = sorted.slice(0, limit);

    return sorted;
  }

  /**
   * Intersect candidate set with a filter list.
   * @param {string[]|null} current - null means "all" (first filter)
   * @param {string[]} filterList
   * @returns {string[]}
   */
  function _intersect(current, filterList){
    if(current === null) return filterList.slice();
    var set = {};
    for(var i = 0; i < filterList.length; i++) set[filterList[i]] = true;
    return current.filter(function(id){ return set[id]; });
  }

  /**
   * Sort candidate roundIds by the requested field.
   * Uses the pre-sorted byDate / byUpdated arrays for ordering.
   */
  function _sortCandidates(candidates, sortBy, sortOrder){
    if(candidates.length <= 1) return candidates;

    // Build a lookup of index position for ordering
    var sourceArr = (sortBy === 'updatedAt') ? _byUpdated : _byDate;
    var posMap = {};
    for(var i = 0; i < sourceArr.length; i++){
      posMap[sourceArr[i].id] = i;
    }

    var sorted = candidates.slice();
    sorted.sort(function(a, b){
      var pa = (posMap[a] != null) ? posMap[a] : 999999;
      var pb = (posMap[b] != null) ? posMap[b] : 999999;
      return pa - pb; // sourceArr is already desc
    });

    if(sortOrder === 'asc') sorted.reverse();
    return sorted;
  }

  // ══════════════════════════════════════════
  // CONVENIENCE QUERIES
  // ══════════════════════════════════════════

  /** Rounds for a specific player (sorted by date desc). */
  function byPlayer(playerId, limit){
    return query({ playerId: playerId, sortBy: 'date', limit: limit || 0 });
  }

  /** Rounds at a specific course (sorted by date desc). */
  function byCourse(courseId, limit){
    return query({ courseId: courseId, sortBy: 'date', limit: limit || 0 });
  }

  /** Rounds on a specific date or date range. */
  function byDateRange(dateFrom, dateTo){
    return query({ dateFrom: dateFrom, dateTo: dateTo, sortBy: 'date' });
  }

  /** Today's rounds. */
  function today(){
    var d = new Date();
    var ds = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    return query({ dateFrom: ds, dateTo: ds, sortBy: 'date' });
  }

  // ══════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════

  function _persist(){
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        byPlayer:  _byPlayer,
        byCourse:  _byCourse,
        byStatus:  _byStatus,
        byDate:    _byDate,
        byUpdated: _byUpdated
      }));
    } catch(e){ console.warn('[RoundIndex] persist error:', e); }
  }

  function _loadFromStorage(){
    try {
      var raw = localStorage.getItem(LS_KEY);
      if(!raw) return false;
      var obj = JSON.parse(raw);
      if(!obj || typeof obj !== 'object') return false;
      _byPlayer  = obj.byPlayer  || {};
      _byCourse  = obj.byCourse  || {};
      _byStatus  = obj.byStatus  || {};
      _byDate    = obj.byDate    || [];
      _byUpdated = obj.byUpdated || [];
      return true;
    } catch(e){
      console.warn('[RoundIndex] load error:', e);
      return false;
    }
  }

  // ══════════════════════════════════════════
  // REBUILD
  // ══════════════════════════════════════════

  /**
   * Rebuild all indexes from RoundStore summaries.
   * Called on first run or if index is corrupted.
   */
  function rebuild(){
    _byPlayer  = {};
    _byCourse  = {};
    _byStatus  = {};
    _byDate    = [];
    _byUpdated = [];

    if(typeof RoundStore === 'undefined') return;

    var all = RoundStore.list({ sortBy: 'date', sortOrder: 'desc' });
    for(var i = 0; i < all.length; i++){
      var s = all[i];
      var id = s.id;

      // byPlayer
      var pids = s.playerIds || [];
      for(var pi = 0; pi < pids.length; pi++){
        var pid = pids[pi];
        if(!pid) continue;
        if(!_byPlayer[pid]) _byPlayer[pid] = [];
        _byPlayer[pid].push(id);
      }

      // byCourse
      if(s.courseId){
        if(!_byCourse[s.courseId]) _byCourse[s.courseId] = [];
        _byCourse[s.courseId].push(id);
      }

      // byStatus
      var st = s.status || 'scheduled';
      if(!_byStatus[st]) _byStatus[st] = [];
      _byStatus[st].push(id);

      // byDate (already sorted desc from RoundStore.list)
      _byDate.push({ date: s.date || '', id: id });

      // byUpdated
      _byUpdated.push({ ts: s.updatedAt || '', id: id });
    }

    // byUpdated needs its own sort (list was sorted by date)
    _byUpdated.sort(function(a, b){
      if(a.ts > b.ts) return -1;
      if(a.ts < b.ts) return 1;
      return 0;
    });

    _persist();
    console.log('[RoundIndex] rebuilt from', all.length, 'summaries');
  }

  // ══════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════

  function init(){
    if(!_loadFromStorage()){
      rebuild();
    } else {
      // Validate: check count matches RoundStore
      if(typeof RoundStore !== 'undefined'){
        var storeCount = RoundStore.list().length;
        if(storeCount !== _byDate.length){
          console.log('[RoundIndex] count mismatch (index:', _byDate.length, 'store:', storeCount, '), rebuilding');
          rebuild();
        }
      }
    }
  }

  init();

  return {
    // Maintenance (called by RoundStore)
    indexRound:   indexRound,
    removeRound:  removeRound,
    rebuild:      rebuild,

    // Query
    query:        query,
    byPlayer:     byPlayer,
    byCourse:     byCourse,
    byDateRange:  byDateRange,
    today:        today
  };

})();
