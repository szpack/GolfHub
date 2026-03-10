// ============================================================
// roundsPage.js — My Rounds Page
// Query-based rendering via RoundIndex + RoundStore (no full scan).
// Depends on: RoundIndex, RoundStore, RoundHelper, data.js, round.js
// ============================================================

const RoundsPage = (function(){

  var H = null;
  function _h(){ if(!H) H = RoundHelper; return H; }

  // ── Filter state ──
  var _statusFilter = null;   // null = all, or string
  var _courseFilter  = null;   // null = all, or courseId string
  var _searchTerm   = '';

  // ── Delete confirm state ──
  var _confirmingId = null;
  var _confirmTimer = null;

  // ── Status tabs ──
  var STATUS_TABS = [
    { key: null,           label: 'All' },
    { key: 'in_progress',  label: 'Playing' },
    { key: 'scheduled',    label: 'Scheduled' },
    { key: 'finished',     label: 'Finished' },
    { key: 'abandoned',    label: 'Abandoned' }
  ];

  // ══════════════════════════════════════════
  // DATA FETCH (index-based, no full scan)
  // ══════════════════════════════════════════

  /**
   * Query round IDs via RoundIndex, then resolve Summaries from RoundStore.
   * @returns {RoundSummary[]}
   */
  function _queryRounds(){
    if(typeof RoundIndex === 'undefined' || typeof RoundStore === 'undefined') return [];

    var opts = {
      sortBy:    'updatedAt',
      sortOrder: 'desc'
    };

    if(_statusFilter){
      opts.status = _statusFilter;
    }
    if(_courseFilter){
      opts.courseId = _courseFilter;
    }

    var ids = RoundIndex.query(opts);

    // Resolve IDs → Summaries
    var results = [];
    var activeId = RoundStore.getActiveId();
    for(var i = 0; i < ids.length; i++){
      var s = RoundStore.get(ids[i]);
      if(!s) continue;

      // Enrich active round with live data
      if(s.id === activeId){
        s = _enrichActive(s);
      }
      results.push(s);
    }

    return results;
  }

  /** Enrich active round summary with live D.sc() progress. */
  function _enrichActive(summary){
    if(typeof D === 'undefined') return summary;
    var sc = D.sc();
    var players = sc.players || [];
    if(players.length > 0){
      var hc = sc.course ? (sc.course.holeCount || 18) : 18;
      summary.playedCount = D.playedCount(D.rpid(players[0]), 0, hc - 1);
      summary.playerNames = players.map(function(p){ return D.playerDisplayName(p); });
      summary.playerCount = players.length;
    }
    if(sc.course && sc.course.courseName && !summary.courseName){
      summary.courseName = sc.course.courseName;
    }
    summary.isActive = true;
    return summary;
  }

  /** Build unique course list from index for the filter dropdown. */
  function _getCourseOptions(){
    if(typeof RoundIndex === 'undefined') return [];
    // Query all rounds to get unique courseIds
    var allIds = RoundIndex.query({});
    var seen = {};
    var options = [];
    for(var i = 0; i < allIds.length; i++){
      var s = RoundStore.get(allIds[i]);
      if(!s || !s.courseId || seen[s.courseId]) continue;
      seen[s.courseId] = true;
      options.push({ id: s.courseId, name: s.courseName || s.courseId });
    }
    options.sort(function(a, b){ return a.name.localeCompare(b.name); });
    return options;
  }

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  function render(){
    var el = document.getElementById('page-rounds-content');
    if(!el) return;
    if(!Shell.requireAuth('page-rounds-content')) return;

    var all = _queryRounds();
    var html = '';

    // ── Header ──
    html += '<div class="sh-page-header">';
    html += '<h1 class="sh-page-title">' + T('roundsTitle') + '</h1>';
    html += '<div class="sh-header-right">';
    html += '<button class="sh-btn-primary" onclick="Shell.showNewRound()">' + T('newRoundBtn2') + '</button>';
    html += '</div>';
    html += '</div>';

    // ── Filters ──
    html += _renderFilters(all.length);

    // ── Apply text search ──
    var filtered = _searchTerm ? _textFilter(all, _searchTerm) : all;

    if(filtered.length === 0){
      if(all.length === 0 && !_statusFilter && !_courseFilter){
        html += '<div class="sh-empty-state">';
        html += '<div class="sh-empty-icon">&#9971;</div>';
        html += '<div class="sh-empty-text">' + T('noRoundsYet') + '</div>';
        html += '<button class="sh-btn-primary" onclick="Shell.showNewRound()">' + T('createFirstRound') + '</button>';
        html += '</div>';
      } else {
        html += '<div class="sh-empty">' + T('noMatchingRounds') + '</div>';
      }
      el.innerHTML = html;
      return;
    }

    // ── Cards ──
    html += '<div class="sh-round-list">';
    for(var i = 0; i < filtered.length; i++){
      html += _renderCard(filtered[i]);
    }
    html += '</div>';

    el.innerHTML = html;

    // Restore search focus
    var inp = document.getElementById('rounds-search');
    if(inp && _searchTerm){
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  }

  // ══════════════════════════════════════════
  // FILTERS BAR
  // ══════════════════════════════════════════

  function _renderFilters(totalCount){
    var html = '<div class="mr-filters">';

    // Status tabs
    html += '<div class="mr-status-tabs">';
    for(var i = 0; i < STATUS_TABS.length; i++){
      var tab = STATUS_TABS[i];
      var active = (_statusFilter === tab.key) ? ' mr-tab-active' : '';
      var onclick = 'RoundsPage.setStatusFilter(' + (tab.key ? '\'' + tab.key + '\'' : 'null') + ')';
      html += '<button class="mr-tab' + active + '" onclick="' + onclick + '">' + tab.label + '</button>';
    }
    html += '</div>';

    // Second row: course filter + search
    html += '<div class="mr-filter-row">';

    // Course dropdown
    var courses = _getCourseOptions();
    if(courses.length > 1){
      html += '<select class="mr-select" onchange="RoundsPage.setCourseFilter(this.value)">';
      html += '<option value=""' + (!_courseFilter ? ' selected' : '') + '>All Courses</option>';
      for(var ci = 0; ci < courses.length; ci++){
        var sel = (_courseFilter === courses[ci].id) ? ' selected' : '';
        html += '<option value="' + _esc(courses[ci].id) + '"' + sel + '>' + _esc(courses[ci].name) + '</option>';
      }
      html += '</select>';
    }

    // Search input
    if(totalCount > 3){
      html += '<input type="text" class="sh-search-input mr-search" id="rounds-search" placeholder="' + T('searchPh') + '" value="' + _esc(_searchTerm) + '" oninput="RoundsPage.onSearch(this.value)">';
    }

    html += '</div>';
    html += '</div>';
    return html;
  }

  // ══════════════════════════════════════════
  // CARD
  // ══════════════════════════════════════════

  function _renderCard(r){
    var activeId = (typeof RoundStore !== 'undefined') ? RoundStore.getActiveId() : null;
    var isActive = (r.id === activeId);
    var cls = 'sh-card sh-card-round' + (isActive ? ' sh-card-active' : '');
    var html = '<div class="' + cls + '">';

    // Head: status + date
    html += '<div class="sh-card-head">';
    html += '<span class="sh-card-status sh-status-' + r.status + '">' + _h().statusLabel(r.status) + '</span>';
    html += '<span class="sh-card-date">' + (r.date || '') + '</span>';
    html += '</div>';

    // Title (course name)
    html += '<div class="sh-card-title">' + _h().esc(r.courseName || 'Untitled Round') + '</div>';

    // Meta: players · holes · progress
    html += '<div class="sh-card-meta">' + _h().formatMeta(r) + '</div>';

    // Player names
    if(r.playerNames && r.playerNames.length > 0){
      html += '<div class="sh-card-players">' + _h().formatPlayerNames(r.playerNames) + '</div>';
    }

    // SummaryStats (finished/abandoned — lightweight, no RoundData load)
    if(r.summaryStats && r.summaryStats.players){
      var statsLines = [];
      for(var key in r.summaryStats.players){
        var p = r.summaryStats.players[key];
        var line = (p.name ? _esc(p.name) + ': ' : '') + _h().formatSummaryStats(p);
        statsLines.push(line);
      }
      if(statsLines.length > 0){
        html += '<div class="sh-card-stats">';
        statsLines.forEach(function(l){ html += '<div class="sh-stat-line">' + l + '</div>'; });
        html += '</div>';
      }
    }

    // Abandon reason
    if(r.status === 'abandoned' && r.abandonReason){
      html += '<div class="sh-abandon-reason">' + _esc(r.abandonReason) + '</div>';
    }

    // Grace countdown badge
    if(r.lockState === 'grace' && r.reopenUntil){
      var graceLeft = _graceCountdown(r.reopenUntil);
      if(graceLeft){
        html += '<div class="sh-grace-badge">' + T('graceLbl') + ' ' + graceLeft + '</div>';
      }
    }

    // Lock indicator
    if(r.lockState === 'locked'){
      html += '<div class="sh-locked-badge">' + T('lockedLbl') + '</div>';
    }

    // Actions
    html += '<div class="sh-card-actions">';
    html += '<button class="sh-btn-sm" onclick="event.stopPropagation(); Router.navigate(\'/round/' + r.id + '\')">' + T('openBtn') + '</button>';

    // End Round / Reopen actions based on status + lockState
    if(r.status === 'in_progress' && !isActive){
      html += '<button class="sh-btn-sm sh-btn-warn" onclick="event.stopPropagation(); RoundsPage.endRound(\'' + r.id + '\')">' + T('endRoundBtn') + '</button>';
    }
    if(r.status === 'in_progress' && isActive){
      html += '<button class="sh-btn-sm sh-btn-warn" onclick="event.stopPropagation(); RoundsPage.endRound(\'' + r.id + '\')">' + T('endRoundBtn') + '</button>';
    }
    if((r.status === 'finished' && r.lockState === 'grace') || r.status === 'abandoned'){
      html += '<button class="sh-btn-sm sh-btn-reopen" onclick="event.stopPropagation(); RoundsPage.reopenRound(\'' + r.id + '\')">' + T('reopenBtn') + '</button>';
    }

    html += '<button class="sh-btn-sm" onclick="event.stopPropagation(); RoundsPage.duplicateRound(\'' + r.id + '\', ' + isActive + ')">' + T('duplicateBtn') + '</button>';

    if(!isActive){
      if(_confirmingId === r.id){
        html += '<button class="sh-btn-sm sh-btn-confirm-del" onclick="event.stopPropagation(); RoundsPage.confirmDelete(\'' + r.id + '\')">' + T('confirmBtn') + '</button>';
        html += '<button class="sh-btn-sm" onclick="event.stopPropagation(); RoundsPage.cancelDelete()">' + T('cancelBtn') + '</button>';
      } else {
        html += '<button class="sh-btn-sm sh-btn-danger" onclick="event.stopPropagation(); RoundsPage.startDelete(\'' + r.id + '\')">' + T('deleteBtn') + '</button>';
      }
    }
    html += '</div>';

    html += '</div>';
    return html;
  }

  // ══════════════════════════════════════════
  // FILTER HANDLERS
  // ══════════════════════════════════════════

  function setStatusFilter(status){
    _statusFilter = status || null;
    _cancelConfirm();
    render();
  }

  function setCourseFilter(courseId){
    _courseFilter = courseId || null;
    _cancelConfirm();
    render();
  }

  function onSearch(val){
    _searchTerm = (val || '').trim();
    _cancelConfirm();
    render();
  }

  function _textFilter(list, term){
    if(!term) return list;
    var lc = term.toLowerCase();
    return list.filter(function(r){
      if((r.courseName || '').toLowerCase().indexOf(lc) >= 0) return true;
      if((r.date || '').indexOf(lc) >= 0) return true;
      if(r.playerNames){
        for(var i = 0; i < r.playerNames.length; i++){
          if(r.playerNames[i].toLowerCase().indexOf(lc) >= 0) return true;
        }
      }
      return false;
    });
  }

  // ══════════════════════════════════════════
  // DELETE
  // ══════════════════════════════════════════

  function startDelete(id){
    _cancelConfirm();
    _confirmingId = id;
    render();
    _confirmTimer = setTimeout(function(){
      _confirmingId = null;
      _confirmTimer = null;
      render();
    }, 3000);
  }

  function confirmDelete(id){
    _cancelConfirm();
    if(typeof RoundStore !== 'undefined'){
      RoundStore.remove(id);
    }
    render();
  }

  function cancelDelete(){
    _cancelConfirm();
    render();
  }

  function _cancelConfirm(){
    _confirmingId = null;
    if(_confirmTimer){ clearTimeout(_confirmTimer); _confirmTimer = null; }
  }

  // ══════════════════════════════════════════
  // DUPLICATE
  // ══════════════════════════════════════════

  function duplicateRound(id, isActive){
    var round;
    if(isActive){
      if(typeof Round !== 'undefined') round = Round.fromScorecard(D.sc());
    } else {
      round = D.getRound(id);
    }
    if(!round) return;
    var clone = Round.cloneRound(round, { clearScores: true });
    if(D.putRound(clone)) render();
  }

  // ══════════════════════════════════════════
  // END / REOPEN
  // ══════════════════════════════════════════

  function endRound(id){
    if(typeof RoundStore === 'undefined') return;
    if(!confirm(T('endRoundConfirm'))) return;
    RoundStore.finishRound(id, { endedBy: 'manual' });
    render();
  }

  function reopenRound(id){
    if(typeof RoundStore === 'undefined') return;
    RoundStore.reopenRound(id);
    render();
  }

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════

  function _graceCountdown(reopenUntil){
    if(!reopenUntil) return null;
    var remaining = new Date(reopenUntil).getTime() - Date.now();
    if(remaining <= 0) return null;
    var hours = Math.floor(remaining / 3600000);
    var mins = Math.floor((remaining % 3600000) / 60000);
    if(hours > 0) return hours + 'h ' + mins + 'm';
    return mins + 'm';
  }

  function _esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  return {
    render:          render,
    setStatusFilter: setStatusFilter,
    setCourseFilter: setCourseFilter,
    onSearch:        onSearch,
    startDelete:     startDelete,
    confirmDelete:   confirmDelete,
    cancelDelete:    cancelDelete,
    duplicateRound:  duplicateRound,
    endRound:        endRound,
    reopenRound:     reopenRound
  };
})();
