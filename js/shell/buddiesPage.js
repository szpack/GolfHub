// ============================================================
// buddiesPage.js — Buddies (BuddyContact) list page
// Depends on: data.js, shell.js, ApiClient
// ============================================================

const BuddiesPage = (function(){

  var _buddies = [];
  var _total = 0;
  var _loading = false;
  var _filter = { search: '', isFavorite: null, sortBy: null, sortDir: null };
  var _page = 0;
  var _pageSize = 20;

  // ── Helpers ──

  function _esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _fmtDate(d){
    if(!d) return '—';
    var dt = new Date(d);
    return dt.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
  }

  // ── Data fetch ──

  async function _fetch(){
    if(typeof ApiClient === 'undefined') return;
    _loading = true;
    _renderBody();

    var params = new URLSearchParams();
    if(_filter.search) params.set('search', _filter.search);
    if(_filter.isFavorite !== null) params.set('isFavorite', _filter.isFavorite);
    if(_filter.sortBy) params.set('sortBy', _filter.sortBy);
    if(_filter.sortDir) params.set('sortDir', _filter.sortDir);
    params.set('limit', _pageSize);
    params.set('offset', _page * _pageSize);

    try {
      var res = await ApiClient.get('/api/v1/buddies?' + params.toString());
      if(res && !res.error){
        _buddies = res.buddies || [];
        _total = res.total || 0;
      } else {
        _buddies = [];
        _total = 0;
      }
    } catch(e){
      console.error('[BuddiesPage] fetch error', e);
      _buddies = [];
      _total = 0;
    }
    _loading = false;
    _renderBody();
  }

  // ── Render ──

  function render(){
    var el = document.getElementById('page-buddies-content');
    if(!el) return;
    if(!Shell.requireAuth('page-buddies-content')) return;

    el.innerHTML = '<div class="bd-page">'
      + '<div class="bd-header">'
      + '<h2 class="bd-title">Buddies</h2>'
      + '<button class="sh-btn-primary bd-add-btn" onclick="BuddiesPage.showAdd()">+ Add Buddy</button>'
      + '</div>'
      + '<div class="bd-toolbar">'
      + '<input type="text" id="bd-search" class="bd-search-input" placeholder="Search by name..." oninput="BuddiesPage.onSearch(this.value)">'
      + '<div class="bd-filters">'
      + '<button class="bd-filter-btn' + (_filter.isFavorite === true ? ' bd-filter-active' : '') + '" onclick="BuddiesPage.toggleFavFilter()">&#9733; Favorites</button>'
      + '<select class="bd-sort-select" onchange="BuddiesPage.onSort(this.value)">'
      + '<option value=""' + (!_filter.sortBy ? ' selected' : '') + '>Default</option>'
      + '<option value="name"' + (_filter.sortBy === 'name' ? ' selected' : '') + '>Name</option>'
      + '<option value="lastPlayed"' + (_filter.sortBy === 'lastPlayed' ? ' selected' : '') + '>Last Played</option>'
      + '<option value="rounds"' + (_filter.sortBy === 'rounds' ? ' selected' : '') + '>Rounds Together</option>'
      + '</select>'
      + '</div>'
      + '</div>'
      + '<div id="bd-body"></div>'
      + '</div>';

    _fetch();
  }

  function _renderBody(){
    var el = document.getElementById('bd-body');
    if(!el) return;

    if(_loading){
      el.innerHTML = '<div class="bd-loading">Loading...</div>';
      return;
    }

    if(_buddies.length === 0){
      el.innerHTML = '<div class="bd-empty">'
        + '<div class="bd-empty-icon">&#129309;</div>'
        + '<div class="bd-empty-text">' + (_filter.search || _filter.isFavorite ? 'No matching buddies found.' : 'No buddies yet. Add your first golf buddy!') + '</div>'
        + '</div>';
      return;
    }

    var html = '<div class="bd-list">';
    for(var i = 0; i < _buddies.length; i++){
      html += _renderBuddyCard(_buddies[i]);
    }
    html += '</div>';

    // Pagination
    var totalPages = Math.ceil(_total / _pageSize);
    if(totalPages > 1){
      html += '<div class="bd-pagination">';
      html += '<span class="bd-page-info">' + (_page * _pageSize + 1) + '–' + Math.min((_page + 1) * _pageSize, _total) + ' of ' + _total + '</span>';
      html += '<button class="bd-page-btn" onclick="BuddiesPage.prevPage()"' + (_page === 0 ? ' disabled' : '') + '>&laquo;</button>';
      html += '<button class="bd-page-btn" onclick="BuddiesPage.nextPage()"' + (_page >= totalPages - 1 ? ' disabled' : '') + '>&raquo;</button>';
      html += '</div>';
    }

    el.innerHTML = html;
  }

  function _renderBuddyCard(b){
    var hcp = b.handicap != null ? b.handicap.toFixed(1) : '—';
    var favCls = b.isFavorite ? ' bd-fav-active' : '';
    return '<div class="bd-card" data-id="' + b.id + '">'
      + '<div class="bd-card-main" onclick="BuddiesPage.showEdit(\'' + b.id + '\')">'
      + '<div class="bd-card-avatar">' + _esc((b.displayName || '?').charAt(0).toUpperCase()) + '</div>'
      + '<div class="bd-card-info">'
      + '<div class="bd-card-name">' + _esc(b.displayName) + '</div>'
      + '<div class="bd-card-meta">'
      + '<span class="bd-meta-item">HCP ' + hcp + '</span>'
      + '<span class="bd-meta-item">' + b.roundsTogetherCount + ' rounds</span>'
      + (b.lastPlayedAt ? '<span class="bd-meta-item">Last: ' + _fmtDate(b.lastPlayedAt) + '</span>' : '')
      + '</div>'
      + (b.notes ? '<div class="bd-card-notes">' + _esc(b.notes) + '</div>' : '')
      + '</div>'
      + '</div>'
      + '<button class="bd-fav-btn' + favCls + '" onclick="BuddiesPage.toggleFav(\'' + b.id + '\')" title="Toggle favorite">&#9733;</button>'
      + '</div>';
  }

  // ── Actions ──

  var _searchTimer = null;
  function onSearch(val){
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(function(){
      _filter.search = val;
      _page = 0;
      _fetch();
    }, 300);
  }

  function toggleFavFilter(){
    _filter.isFavorite = _filter.isFavorite === true ? null : true;
    _page = 0;
    _fetch();
    // Re-render toolbar to update button state
    var btn = document.querySelector('.bd-filter-btn');
    if(btn) btn.classList.toggle('bd-filter-active', _filter.isFavorite === true);
  }

  function onSort(val){
    _filter.sortBy = val || null;
    _page = 0;
    _fetch();
  }

  function prevPage(){ if(_page > 0){ _page--; _fetch(); } }
  function nextPage(){
    var totalPages = Math.ceil(_total / _pageSize);
    if(_page < totalPages - 1){ _page++; _fetch(); }
  }

  async function toggleFav(id){
    try {
      await ApiClient.post('/api/v1/buddies/' + id + '/toggle-favorite');
      _fetch();
    } catch(e){ console.error('[BuddiesPage] toggleFav', e); }
  }

  // ── Add / Edit Modal ──

  function showAdd(){
    _showModal(null);
  }

  function showEdit(id){
    var buddy = null;
    for(var i = 0; i < _buddies.length; i++){
      if(_buddies[i].id === id){ buddy = _buddies[i]; break; }
    }
    if(buddy) _showModal(buddy);
  }

  function _showModal(buddy){
    var isEdit = !!buddy;
    var title = isEdit ? 'Edit Buddy' : 'Add Buddy';

    var overlay = document.createElement('div');
    overlay.className = 'bd-modal-overlay';
    overlay.id = 'bd-modal-overlay';
    overlay.onclick = function(e){ if(e.target === overlay) _closeModal(); };

    var html = '<div class="bd-modal">'
      + '<div class="bd-modal-header">'
      + '<h3>' + title + '</h3>'
      + '<button class="bd-modal-close" onclick="BuddiesPage.closeModal()">&times;</button>'
      + '</div>'
      + '<div class="bd-modal-body">'
      + '<label class="bd-form-label">Name<input type="text" id="bd-f-name" class="bd-form-input" maxlength="50" value="' + _esc(buddy ? buddy.displayName : '') + '"></label>'
      + '<label class="bd-form-label">Handicap<input type="number" id="bd-f-hcp" class="bd-form-input" step="0.1" min="-10" max="54" value="' + (buddy && buddy.handicap != null ? buddy.handicap : '') + '"></label>'
      + '<label class="bd-form-label">Notes<textarea id="bd-f-notes" class="bd-form-textarea" rows="3" maxlength="500">' + _esc(buddy ? buddy.notes || '' : '') + '</textarea></label>'
      + '</div>'
      + '<div class="bd-modal-footer">';

    if(isEdit){
      html += '<button class="sh-btn-danger-sm" onclick="BuddiesPage.deleteBuddy(\'' + buddy.id + '\')">Delete</button>';
    }
    html += '<button class="sh-btn-primary" onclick="BuddiesPage.saveBuddy(\'' + (buddy ? buddy.id : '') + '\')">' + (isEdit ? 'Save' : 'Add') + '</button>';
    html += '</div></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    setTimeout(function(){
      var inp = document.getElementById('bd-f-name');
      if(inp) inp.focus();
    }, 100);
  }

  function closeModal(){
    _closeModal();
  }

  function _closeModal(){
    var overlay = document.getElementById('bd-modal-overlay');
    if(overlay) overlay.remove();
  }

  async function saveBuddy(id){
    var name = (document.getElementById('bd-f-name').value || '').trim();
    var hcpVal = document.getElementById('bd-f-hcp').value;
    var notes = (document.getElementById('bd-f-notes').value || '').trim();

    if(!name){
      alert('Name is required');
      return;
    }

    var body = { displayName: name, notes: notes || null };
    if(hcpVal !== ''){
      body.handicap = parseFloat(hcpVal);
    } else {
      body.handicap = null;
    }

    try {
      var res;
      if(id){
        res = await ApiClient.patch('/api/v1/buddies/' + id, body);
      } else {
        res = await ApiClient.post('/api/v1/buddies', body);
      }
      if(res && res.error){
        alert(res.error);
        return;
      }
      _closeModal();
      _fetch();
    } catch(e){
      console.error('[BuddiesPage] save error', e);
      alert('Failed to save buddy');
    }
  }

  async function deleteBuddy(id){
    if(!confirm('Delete this buddy?')) return;
    try {
      await ApiClient.delete('/api/v1/buddies/' + id);
      _closeModal();
      _fetch();
    } catch(e){
      console.error('[BuddiesPage] delete error', e);
      alert('Failed to delete buddy');
    }
  }

  return {
    render: render,
    onSearch: onSearch,
    toggleFavFilter: toggleFavFilter,
    onSort: onSort,
    prevPage: prevPage,
    nextPage: nextPage,
    toggleFav: toggleFav,
    showAdd: showAdd,
    showEdit: showEdit,
    closeModal: closeModal,
    saveBuddy: saveBuddy,
    deleteBuddy: deleteBuddy
  };

})();
