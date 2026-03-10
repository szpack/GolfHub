// ============================================================
// newRoundPage.js — New Round page component
// Route: #/new-round
// Depends on: NewRoundService, ClubStore, D, Router
// ============================================================

const NewRoundPage = (function(){

  // ── Internal state ──
  var _selectedClubId  = null;
  var _selectedLayoutId = null;
  var _selectedTeeSetId = null;
  var _players = [];            // [{name, playerId}]
  var _teeTime = '';            // datetime-local value
  var _searchQuery = '';
  var _showAllClubs = false;    // whether to show full club list vs recent only
  var _composing = false;       // IME composition in progress
  var _showBuddyPicker = false;  // whether buddy picker is expanded
  var _buddyList = null;         // cached buddy list from API

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  function render(){
    var el = document.getElementById('page-new-round-content');
    if(!el){ console.error('[NewRoundPage] #page-new-round-content not found'); return; }
    if(!Shell.requireAuth('page-new-round-content')) return;
    try {

    var html = '';

    // ── Header ──
    html += '<div class="nr-header">';
    html += '<button class="cd-back-btn" onclick="NewRoundPage.goBack()">&larr; Back</button>';
    html += '<h2 class="cd-title">New Round</h2>';
    html += '</div>';

    // ── Course Section ──
    html += _renderCourseSection();

    // ── Players Section ──
    html += _renderPlayerSection();

    // ── Tee Time Section ──
    html += _renderTeeTimeSection();

    // ── Create Button ──
    html += _renderCreateButton();

    el.innerHTML = html;

    // Wire events after render
    _wireEvents();
    } catch(e){ console.error('[NewRoundPage] render error:', e); el.innerHTML = '<div style="padding:24px;color:red">Render error: ' + e.message + '</div>'; }
  }

  // ══════════════════════════════════════════
  // COURSE SECTION
  // ══════════════════════════════════════════

  function _renderCourseSection(){
    var html = '<div class="nr-section">';
    html += '<div class="nr-section-title">Course</div>';

    // Search
    html += '<input type="text" class="nr-search" id="nr-club-search" placeholder="Search clubs..." value="' + _esc(_searchQuery) + '">';

    // Club list
    var clubs;
    if(_searchQuery){
      clubs = ClubStore.search(_searchQuery);
    } else if(_showAllClubs){
      clubs = ClubStore.listActive();
    } else {
      // Show recent first; fall back to all if no recent
      clubs = NewRoundService.getRecentClubs(5);
      if(clubs.length === 0) clubs = ClubStore.listActive();
    }

    html += '<div class="nr-club-list">';
    if(clubs.length === 0){
      html += '<div class="nr-empty-hint">No clubs found</div>';
    }
    for(var i = 0; i < clubs.length; i++){
      var c = clubs[i];
      var selected = (_selectedClubId === c.id);
      var holes = ClubStore.totalHoles(c);
      var layouts = (c.layouts || []).length;
      html += '<div class="nr-club-item' + (selected ? ' nr-selected' : '') + '" onclick="NewRoundPage.selectClub(\'' + c.id + '\')">';
      html += '<div class="nr-club-info">';
      html += '<div class="nr-club-name">' + _esc(c.name || c.name_en || 'Untitled') + '</div>';
      html += '<div class="nr-club-meta">' + (c.city || '') + (holes ? ' · ' + holes + 'H' : '') + (layouts ? ' · ' + layouts + ' layout' + (layouts > 1 ? 's' : '') : '') + '</div>';
      html += '</div>';
      if(selected) html += '<span class="nr-check">&#10003;</span>';
      html += '</div>';
    }
    html += '</div>';

    // Show all button — when showing a subset (recent), offer to expand
    if(!_searchQuery && !_showAllClubs){
      var totalCount = ClubStore.listActive().length;
      if(totalCount > clubs.length){
        html += '<button class="nr-show-all-btn" onclick="NewRoundPage.showAllClubs()">Show all ' + totalCount + ' clubs</button>';
      }
    }

    // Layout selector (shown after club selection)
    if(_selectedClubId){
      html += _renderLayoutSelector();
    }

    // Tee set selector (shown after layout selection)
    if(_selectedClubId && _selectedLayoutId){
      html += _renderTeeSetSelector();
    }

    html += '</div>';
    return html;
  }

  function _renderLayoutSelector(){
    var club = ClubStore.get(_selectedClubId);
    if(!club) return '';
    var layouts = club.layouts || [];
    if(layouts.length === 0) return '<div class="nr-hint">No layouts configured for this club</div>';

    var html = '<div class="nr-sub-section">';
    html += '<div class="nr-sub-title">Routing</div>';
    html += '<div class="nr-layout-list">';
    for(var i = 0; i < layouts.length; i++){
      var lay = layouts[i];
      var sel = (_selectedLayoutId === lay.id);
      html += '<button class="nr-layout-btn' + (sel ? ' nr-selected' : '') + '" onclick="NewRoundPage.selectLayout(\'' + lay.id + '\')">';
      html += _esc(lay.name || 'Layout ' + (i + 1));
      html += ' <span class="nr-layout-holes">' + (lay.hole_count || '?') + 'H</span>';
      html += '</button>';
    }
    html += '</div></div>';
    return html;
  }

  function _renderTeeSetSelector(){
    var club = ClubStore.get(_selectedClubId);
    if(!club) return '';
    var tees = club.tee_sets || [];
    if(tees.length === 0) return '';

    var html = '<div class="nr-sub-section">';
    html += '<div class="nr-sub-title">Tee</div>';
    html += '<div class="nr-tee-list">';
    for(var i = 0; i < tees.length; i++){
      var ts = tees[i];
      var sel = (_selectedTeeSetId === ts.id);
      html += '<button class="nr-tee-btn' + (sel ? ' nr-selected' : '') + '" onclick="NewRoundPage.selectTeeSet(\'' + ts.id + '\')">';
      html += '<span class="nr-tee-dot" style="background:' + (ts.color || '#888') + '"></span>';
      html += _esc(ts.name || 'Tee');
      html += '</button>';
    }
    html += '</div></div>';
    return html;
  }

  // ══════════════════════════════════════════
  // PLAYER SECTION
  // ══════════════════════════════════════════

  function _renderPlayerSection(){
    var html = '<div class="nr-section">';
    html += '<div class="nr-section-title">Players</div>';

    // Recent player chips (quick-add)
    var recent = NewRoundService.getRecentPlayers(8);
    // Filter out already-added players
    var addedNames = {};
    for(var i = 0; i < _players.length; i++) addedNames[_players[i].name] = true;
    var available = recent.filter(function(r){ return !addedNames[r.name]; });

    if(available.length > 0){
      html += '<div class="nr-recent-chips">';
      for(var i = 0; i < available.length; i++){
        html += '<button class="nr-recent-chip" onclick="NewRoundPage.addPlayer(\'' + _esc(available[i].name) + '\',\'' + _esc(available[i].playerId || '') + '\')">';
        html += '+ ' + _esc(available[i].name);
        html += '</button>';
      }
      html += '</div>';
    }

    // Selected players list
    if(_players.length > 0){
      html += '<div class="nr-player-list">';
      for(var i = 0; i < _players.length; i++){
        var p = _players[i];
        html += '<div class="nr-player-row">';
        html += '<span class="nr-player-order">' + (i + 1) + '</span>';
        html += '<span class="nr-player-name">' + _esc(p.name) + '</span>';
        // Move up/down
        if(i > 0){
          html += '<button class="nr-player-move" onclick="NewRoundPage.movePlayer(' + i + ',-1)" title="Move up">&uarr;</button>';
        }
        if(i < _players.length - 1){
          html += '<button class="nr-player-move" onclick="NewRoundPage.movePlayer(' + i + ',1)" title="Move down">&darr;</button>';
        }
        html += '<button class="nr-player-remove" onclick="NewRoundPage.removePlayer(' + i + ')">&times;</button>';
        html += '</div>';
      }
      html += '</div>';
    }

    // From Buddies picker
    html += '<div class="nr-buddy-section">';
    html += '<button class="nr-buddy-toggle" onclick="NewRoundPage.toggleBuddyPicker()">' + (_showBuddyPicker ? '&#9660;' : '&#9654;') + ' From Buddies</button>';
    if(_showBuddyPicker){
      html += _renderBuddyPicker();
    }
    html += '</div>';

    // Add player input
    html += '<div class="nr-add-row">';
    html += '<input type="text" class="nr-add-input" id="nr-player-input" placeholder="Player name..." maxlength="24">';
    html += '<button class="nr-add-btn" onclick="NewRoundPage.addPlayerFromInput()">+ Add</button>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  // ── Buddy Picker ──

  function _renderBuddyPicker(){
    if(!_buddyList){
      return '<div class="nr-buddy-loading">Loading buddies...</div>';
    }
    if(_buddyList.length === 0){
      return '<div class="nr-buddy-empty">No buddies yet. <a href="#/buddies" style="color:#60a5fa">Add buddies</a></div>';
    }
    // Filter out already-added players
    var addedNames = {};
    for(var i = 0; i < _players.length; i++) addedNames[_players[i].name] = true;

    var html = '<div class="nr-buddy-chips">';
    var count = 0;
    for(var i = 0; i < _buddyList.length; i++){
      var b = _buddyList[i];
      if(addedNames[b.displayName]) continue;
      html += '<button class="nr-recent-chip nr-buddy-chip' + (b.isFavorite ? ' nr-buddy-fav' : '') + '" onclick="NewRoundPage.addBuddy(' + i + ')">';
      html += (b.isFavorite ? '&#9733; ' : '') + _esc(b.displayName);
      if(b.handicap != null) html += ' <span class="nr-buddy-hcp">(' + b.handicap.toFixed(1) + ')</span>';
      html += '</button>';
      count++;
    }
    if(count === 0){
      html += '<span class="nr-buddy-empty">All buddies already added</span>';
    }
    html += '</div>';
    return html;
  }

  async function toggleBuddyPicker(){
    _showBuddyPicker = !_showBuddyPicker;
    if(_showBuddyPicker && !_buddyList){
      // Fetch buddies from API
      render();
      try {
        if(typeof ApiClient !== 'undefined'){
          var res = await ApiClient.get('/api/v1/buddies?limit=50&sortBy=name');
          _buddyList = (res && res.buddies) ? res.buddies : [];
        } else {
          _buddyList = [];
        }
      } catch(e){
        console.error('[NewRoundPage] fetch buddies error', e);
        _buddyList = [];
      }
    }
    render();
  }

  function addBuddy(index){
    if(!_buddyList || !_buddyList[index]) return;
    var b = _buddyList[index];
    // Prevent duplicates
    for(var i = 0; i < _players.length; i++){
      if(_players[i].name === b.displayName) return;
    }
    _players.push({ name: b.displayName, playerId: b.linkedUserId || null, buddyId: b.id });
    render();
  }

  // ══════════════════════════════════════════
  // TEE TIME SECTION
  // ══════════════════════════════════════════

  function _renderTeeTimeSection(){
    // Default to current time (rounded to nearest 10 min)
    var defaultTime = _teeTime;
    if(!defaultTime){
      var now = new Date();
      now.setMinutes(Math.round(now.getMinutes() / 10) * 10, 0, 0);
      defaultTime = _toLocalDatetime(now);
    }

    var html = '<div class="nr-section">';
    html += '<div class="nr-section-title">Tee Time</div>';
    html += '<input type="datetime-local" class="nr-input" id="nr-tee-time" value="' + _esc(defaultTime) + '">';
    html += '</div>';
    return html;
  }

  // ══════════════════════════════════════════
  // CREATE BUTTON
  // ══════════════════════════════════════════

  function _renderCreateButton(){
    var canCreate = _selectedClubId && _selectedLayoutId && _players.length > 0;
    var html = '<div class="nr-footer">';
    html += '<button class="cs-btn cs-btn-primary nr-create-btn"' + (canCreate ? '' : ' disabled') + ' onclick="NewRoundPage.doCreate()">';
    html += 'CREATE ROUND';
    html += '</button>';

    // Validation hints
    if(!canCreate){
      html += '<div class="nr-hints">';
      if(!_selectedClubId) html += '<div class="nr-hint">Select a course</div>';
      else if(!_selectedLayoutId) html += '<div class="nr-hint">Select a routing</div>';
      if(_players.length === 0) html += '<div class="nr-hint">Add at least one player</div>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // ══════════════════════════════════════════
  // USER ACTIONS
  // ══════════════════════════════════════════

  function selectClub(clubId){
    if(_selectedClubId === clubId){
      // Deselect
      _selectedClubId = null;
      _selectedLayoutId = null;
      _selectedTeeSetId = null;
    } else {
      _selectedClubId = clubId;
      _selectedLayoutId = null;
      _selectedTeeSetId = null;
      // Auto-select default layout
      var club = ClubStore.get(clubId);
      if(club && club.layouts){
        for(var i = 0; i < club.layouts.length; i++){
          if(club.layouts[i].is_default){
            _selectedLayoutId = club.layouts[i].id;
            break;
          }
        }
        // If no default, select the only one
        if(!_selectedLayoutId && club.layouts.length === 1){
          _selectedLayoutId = club.layouts[0].id;
        }
      }
    }
    render();
  }

  function selectLayout(layoutId){
    _selectedLayoutId = (_selectedLayoutId === layoutId) ? null : layoutId;
    _selectedTeeSetId = null;
    render();
  }

  function selectTeeSet(teeId){
    _selectedTeeSetId = (_selectedTeeSetId === teeId) ? null : teeId;
    render();
  }

  function addPlayer(name, playerId){
    if(!name) return;
    // Prevent duplicates
    for(var i = 0; i < _players.length; i++){
      if(_players[i].name === name) return;
    }
    _players.push({ name: name, playerId: playerId || null });
    render();
  }

  function addPlayerFromInput(){
    var inp = document.getElementById('nr-player-input');
    if(!inp) return;
    var name = inp.value.trim();
    if(!name) return;
    addPlayer(name, null);
  }

  function removePlayer(index){
    _players.splice(index, 1);
    render();
  }

  function movePlayer(index, direction){
    var newIndex = index + direction;
    if(newIndex < 0 || newIndex >= _players.length) return;
    var tmp = _players[index];
    _players[index] = _players[newIndex];
    _players[newIndex] = tmp;
    render();
  }

  function searchClubs(query){
    _searchQuery = query;
    _showAllClubs = false;
    render();
  }

  function showAllClubs(){
    _showAllClubs = true;
    render();
  }

  function goBack(){
    Router.navigate('/');
  }

  // ══════════════════════════════════════════
  // CREATE
  // ══════════════════════════════════════════

  function doCreate(){
    if(!_selectedClubId || !_selectedLayoutId || _players.length === 0) return;

    // Read tee time from input
    var ttInput = document.getElementById('nr-tee-time');
    var teeTime = ttInput ? ttInput.value : '';

    var result = NewRoundService.createNewRound({
      clubId: _selectedClubId,
      layoutId: _selectedLayoutId,
      teeSetId: _selectedTeeSetId,
      players: _players,
      teeTime: teeTime
    });

    if(!result.success){
      alert(result.errors.join('\n'));
      return;
    }

    if(result.activate){
      // Today or no teeTime → activate and enter overlay
      NewRoundService.activateRound(result);
      _reset();
      Router.navigate('/round/' + result.round.id);
    } else {
      // Future teeTime → store as scheduled, go to rounds page
      NewRoundService.storeScheduledRound(result);
      _reset();
      Router.navigate('/rounds');
    }
  }

  // ══════════════════════════════════════════
  // INTERNAL HELPERS
  // ══════════════════════════════════════════

  function _reset(){
    _selectedClubId  = null;
    _selectedLayoutId = null;
    _selectedTeeSetId = null;
    _players = [];
    _teeTime = '';
    _searchQuery = '';
    _showAllClubs = false;
    _showBuddyPicker = false;
    _buddyList = null;
  }

  function _wireEvents(){
    // Club search — supports IME (Chinese/Japanese/Korean) input
    var searchInput = document.getElementById('nr-club-search');
    if(searchInput){
      searchInput.addEventListener('compositionstart', function(){ _composing = true; });
      searchInput.addEventListener('compositionend', function(){
        _composing = false;
        _searchQuery = this.value;
        _showAllClubs = false;
        var pos = this.selectionStart;
        render();
        var restored = document.getElementById('nr-club-search');
        if(restored){ restored.focus(); restored.setSelectionRange(pos, pos); }
      });
      searchInput.addEventListener('input', function(){
        if(_composing) return;  // skip during IME composition
        _searchQuery = this.value;
        _showAllClubs = false;
        var pos = this.selectionStart;
        render();
        var restored = document.getElementById('nr-club-search');
        if(restored){ restored.focus(); restored.setSelectionRange(pos, pos); }
      });
    }

    // Player input Enter key
    var playerInput = document.getElementById('nr-player-input');
    if(playerInput){
      playerInput.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          e.preventDefault();
          addPlayerFromInput();
        }
      });
      // Focus if no players yet
      if(_players.length === 0 && _selectedLayoutId){
        playerInput.focus();
      }
    }

    // Preserve tee time value on re-render
    var ttInput = document.getElementById('nr-tee-time');
    if(ttInput){
      ttInput.addEventListener('change', function(){
        _teeTime = this.value;
      });
    }
  }

  function _toLocalDatetime(date){
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    var hh = String(date.getHours()).padStart(2, '0');
    var mm = String(date.getMinutes()).padStart(2, '0');
    return y + '-' + m + '-' + d + 'T' + hh + ':' + mm;
  }

  function _esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ══════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════

  return {
    render: render,
    selectClub: selectClub,
    selectLayout: selectLayout,
    selectTeeSet: selectTeeSet,
    addPlayer: addPlayer,
    addPlayerFromInput: addPlayerFromInput,
    removePlayer: removePlayer,
    movePlayer: movePlayer,
    searchClubs: searchClubs,
    showAllClubs: showAllClubs,
    toggleBuddyPicker: toggleBuddyPicker,
    addBuddy: addBuddy,
    goBack: goBack,
    doCreate: doCreate
  };

})();
