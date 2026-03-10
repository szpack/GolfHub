// ============================================================
// shell.js — App Shell Controller
// Layout: Collapsible Sidebar | Workspace
// Depends on: router.js, roundHelper.js, homePage.js, roundsPage.js, data.js
// Loaded AFTER app.js — existing init() has already run
// ============================================================

const Shell = (function(){

  var _overlayReady = false;
  var _currentPage = null;
  var _sidebarCollapsed = false;

  var LS_SIDEBAR = 'golf_sidebar_collapsed';

  var PAGES = {
    home:     { elementId:'page-home',     render: function(){ HomePage.render(); }, title:'Console' },
    rounds:   { elementId:'page-rounds',   render: function(){ RoundsPage.render(); }, title:'Rounds' },
    round:    { elementId:'overlay-center', title:'Overlay Center' },
    players:  { elementId:'page-players',  title:'Players' },
    teams:    { elementId:'page-teams',    title:'Teams' },
    courses:  { elementId:'page-courses',  render: function(){ CoursesPage.render(); }, title:'Courses' },
    courseDetail: { elementId:'page-course-detail', render: function(route){ CourseDetailPage.render(route && route.params ? route.params.id : null); }, title:'Club Detail' },
    courseStructure: { elementId:'page-course-structure', render: function(route){ CourseStructureEditor.render(route && route.params ? route.params.id : null); }, title:'Structure Editor' },
    courseImport: { elementId:'page-course-import', render: function(){ CourseImportPage.render(); }, title:'Import Courses' },
    newRound: { elementId:'page-new-round', render: function(){ NewRoundPage.render(); }, title:'New Round' },
    buddies:  { elementId:'page-buddies',  render: function(){ BuddiesPage.render(); }, title:'Buddies' },
    clubs:    { elementId:'page-clubs',    title:'Clubs' },
    login:    { elementId:'page-auth', render: function(route){ AuthPage.render(route); }, title:'Sign In' },
    register: { elementId:'page-auth', render: function(route){ AuthPage.render(route); }, title:'Create Account' },
    profile:  { elementId:'page-profile', render: function(){ ProfilePage.render(); }, title:'Profile' },
    settings: { elementId:'page-settings', render: function(){ _renderSettingsPage(); }, title:'Settings' }
  };

  // ══════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════

  function init(){
    Router.add('/',            'home');
    Router.add('/rounds',      'rounds');
    Router.add('/round/:id',   'round');
    Router.add('/players',     'players');
    Router.add('/teams',       'teams');
    Router.add('/courses',     'courses');
    Router.add('/new-round', 'newRound');
    Router.add('/courses/import', 'courseImport');
    Router.add('/courses/:id/structure', 'courseStructure');
    Router.add('/courses/:id', 'courseDetail');
    Router.add('/buddies',     'buddies');
    Router.add('/clubs',       'clubs');
    Router.add('/login',       'login');
    Router.add('/register',    'register');
    Router.add('/profile',     'profile');
    Router.add('/settings',    'settings');

    _wireNav();
    _restoreSidebarState();
    Router.start(_onRouteChange);
    _syncLangButton();
    _renderLiveRecent();
    _initAuth();

    document.getElementById('app-shell').classList.add('shell-ready');
    console.log('[Shell] initialized');
  }

  // ══════════════════════════════════════════
  // ROUTING
  // ══════════════════════════════════════════

  function _onRouteChange(route, prev){
    // Unsaved changes guard for courseDetail
    if(_currentPage === 'courseDetail' && typeof CourseDetailPage !== 'undefined'){
      var warn = CourseDetailPage.beforeLeave();
      if(warn && !confirm(warn)){
        var prevPath = (prev && prev.path) ? prev.path : '/courses';
        history.replaceState(null, '', '#' + prevPath);
        return;
      }
    }
    // Unsaved changes guard for courseStructure
    if(_currentPage === 'courseStructure' && typeof CourseStructureEditor !== 'undefined'){
      var warn = CourseStructureEditor.beforeLeave();
      if(warn && !confirm(warn)){
        var prevPath = (prev && prev.path) ? prev.path : '/courses';
        history.replaceState(null, '', '#' + prevPath);
        return;
      }
    }

    var pageName = route ? route.name : 'home';

    _hideAllPages();

    var page = PAGES[pageName];
    if(!page){ page = PAGES.home; pageName = 'home'; }

    var el = document.getElementById(page.elementId);
    if(el){
      el.classList.remove('page-hidden');
      el.classList.add('page-active');
    }

    if(page.render) page.render(route);

    if(pageName === 'round'){
      _enterOverlayCenter(route.params.id);
    } else {
      _leaveOverlayCenter();
    }

    _updateNavHighlight(pageName);
    _updateWorkspaceHeader(pageName);
    _renderLiveRecent();

    // Auto-close drawer on mobile
    if(window.innerWidth <= 768) closeSidebar();

    _currentPage = pageName;
  }

  function _hideAllPages(){
    var pages = document.querySelectorAll('.app-page');
    for(var i = 0; i < pages.length; i++){
      pages[i].classList.add('page-hidden');
      pages[i].classList.remove('page-active');
    }
  }

  function _enterOverlayCenter(roundId){
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(typeof render === 'function') render();
      });
    });
    _overlayReady = true;
  }

  function _leaveOverlayCenter(){
    if(typeof doSave === 'function') doSave();
  }

  function _updateNavHighlight(pageName){
    // courseDetail / courseStructure highlight the courses nav item
    var navName = (pageName === 'courseDetail' || pageName === 'courseStructure' || pageName === 'courseImport') ? 'courses'
               : (pageName === 'newRound') ? 'rounds'
               : pageName;
    var items = document.querySelectorAll('.sb-item[data-route]');
    for(var i = 0; i < items.length; i++){
      var item = items[i];
      var route = item.getAttribute('data-route');
      item.classList.toggle('sb-active', route === navName);
    }
    // Quick actions highlight for overlay
    var actions = document.querySelectorAll('.sb-action[data-route]');
    for(var i = 0; i < actions.length; i++){
      var a = actions[i];
      var route = a.getAttribute('data-route');
      a.classList.toggle('sb-active', route === pageName);
    }
    var bnItems = document.querySelectorAll('.bn-item');
    for(var i = 0; i < bnItems.length; i++){
      var item = bnItems[i];
      var route = item.getAttribute('data-route');
      item.classList.toggle('bn-active', route === pageName);
    }
  }

  function _updateWorkspaceHeader(pageName){
    var titleEl = document.getElementById('workspace-title');
    if(titleEl){
      var page = PAGES[pageName];
      titleEl.textContent = (page && page.title) || 'Console';
    }
  }

  function _wireNav(){
    var items = document.querySelectorAll('.sb-item[data-route]');
    for(var i = 0; i < items.length; i++) items[i].addEventListener('click', _navClick);
    var bnItems = document.querySelectorAll('.bn-item[data-route]');
    for(var i = 0; i < bnItems.length; i++) bnItems[i].addEventListener('click', _navClick);
  }

  function _navClick(){
    var route = this.getAttribute('data-route');
    var pathMap = {
      home:'/', rounds:'/rounds',
      round:'/round/' + (D.getActiveRoundId() || 'current'),
      courses:'/courses', players:'/players', buddies:'/buddies', teams:'/teams', clubs:'/clubs',
      settings:'/settings'
    };
    Router.navigate(pathMap[route] || '/');
  }

  // ══════════════════════════════════════════
  // SIDEBAR COLLAPSE / EXPAND
  // ══════════════════════════════════════════

  function toggleSidebar(){
    _sidebarCollapsed = !_sidebarCollapsed;
    _applySidebarState();
    try { localStorage.setItem(LS_SIDEBAR, _sidebarCollapsed ? '1' : '0'); } catch(e){}
  }

  function _restoreSidebarState(){
    try {
      var v = localStorage.getItem(LS_SIDEBAR);
      _sidebarCollapsed = (v === '1');
    } catch(e){}
    _applySidebarState();
  }

  function _applySidebarState(){
    var sb = document.getElementById('app-sidebar');
    if(!sb) return;
    sb.classList.toggle('sb-collapsed', _sidebarCollapsed);
  }

  // ══════════════════════════════════════════
  // MOBILE DRAWER
  // ══════════════════════════════════════════

  function openSidebar(){
    var sb = document.getElementById('app-sidebar');
    var bd = document.getElementById('sb-backdrop');
    if(sb) sb.classList.add('sb-drawer-open');
    if(bd) bd.classList.add('sb-backdrop-show');
  }

  function closeSidebar(){
    var sb = document.getElementById('app-sidebar');
    var bd = document.getElementById('sb-backdrop');
    if(sb) sb.classList.remove('sb-drawer-open');
    if(bd) bd.classList.remove('sb-backdrop-show');
  }

  // ══════════════════════════════════════════
  // LIVE & RECENT
  // ══════════════════════════════════════════

  function _renderLiveRecent(){
    var el = document.getElementById('sb-live-recent');
    if(!el) return;
    if(typeof RoundHelper === 'undefined') return;

    var html = '';

    // Active round
    var active = RoundHelper.getActiveSummary();
    if(active){
      html += _roundItem(active, 'live');
    }

    // Stored rounds: separate planned vs recent finished
    var stored = RoundHelper.getStoredRounds(8);
    var planned = [];
    var recent = [];
    stored.forEach(function(r){
      if(r.status === 'planned') planned.push(r);
      else recent.push(r);
    });

    planned.forEach(function(r){ html += _roundItem(r, 'planned'); });
    recent.slice(0, 5).forEach(function(r){ html += _roundItem(r, 'finished'); });

    if(!html){
      html = '<div class="sb-round-empty" style="padding:8px 12px;font-size:12px;color:#6b7280;">No rounds yet</div>';
    }

    el.innerHTML = html;
  }

  function _roundItem(r, type){
    var dotClass = 'sb-round-dot sb-round-dot-' + type;
    var name = _esc(r.courseName || 'Untitled');
    var meta = r.date ? r.date.slice(5) : '';
    var path = '/round/' + r.id;
    return '<div class="sb-round-item" onclick="Router.navigate(\'' + path + '\')">'
      + '<span class="' + dotClass + '"></span>'
      + '<span class="sb-round-name">' + name + '</span>'
      + '<span class="sb-round-meta">' + meta + '</span>'
      + '</div>';
  }

  function _esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ══════════════════════════════════════════
  // PUBLIC ACTIONS
  // ══════════════════════════════════════════

  function enterOverlay(){
    var id = D.getActiveRoundId() || 'current';
    Router.navigate('/round/' + id);
  }

  function newRound(){
    Router.navigate('/new-round');
  }

  /**
   * Direct page switch to New Round — bypasses Router entirely.
   * Used by sidebar button as fallback when hash routing fails.
   */
  function showNewRound(){
    _hideAllPages();
    var el = document.getElementById('page-new-round');
    if(el){
      el.classList.remove('page-hidden');
      el.classList.add('page-active');
    }
    NewRoundPage.render();
    _updateWorkspaceHeader('newRound');
    _leaveOverlayCenter();
    _currentPage = 'newRound';
    // highlight rounds nav
    _updateNavHighlight('newRound');
    if(window.innerWidth <= 768) closeSidebar();
  }

  function importRound(){
    enterOverlay();
    setTimeout(function(){
      if(typeof openExportModal === 'function') openExportModal();
    }, 300);
  }

  function currentPage(){ return _currentPage; }

  // ══════════════════════════════════════════
  // SETTINGS PAGE
  // ══════════════════════════════════════════

  function _renderSettingsPage(){
    var el = document.getElementById('page-settings-content');
    if(!el) return;

    var ws = (typeof D !== 'undefined' && D.ws()) ? D.ws() : {};
    var uiTheme = ws.uiTheme || 'dark';
    var ratio = ws.ratio || '16:9';
    var showShot = ws.showShot !== false;
    var showScore = ws.showScore !== false;
    var showTotal = ws.showTotal !== false;
    var mode = ws.mode || 'topar';
    var scRange = ws.scorecardRange || '18';
    var showPname = ws.showPlayerName || false;
    var showPnameNav = ws.showPnameNav || false;
    var overlayTheme = ws.overlayTheme || 'classic';
    var exportRes = ws.exportRes || '2160';
    var showSZ = ws.showSafeZone || false;
    var szSize = ws.szSize || '5';

    function themeBtn(val, label){
      return '<button class="st-btn' + (uiTheme===val?' st-btn-active':'') + '" onclick="setUITheme(\'' + val + '\')">' + label + '</button>';
    }
    function ratioBtn(val, label){
      return '<button class="st-btn' + (ratio===val?' st-btn-active':'') + '" onclick="setRatio(\'' + val + '\')">' + label + '</button>';
    }
    function overlayThemeBtn(val, label){
      return '<button class="st-btn' + (overlayTheme===val?' st-btn-active':'') + '" onclick="setTheme(\'' + val + '\')">' + label + '</button>';
    }
    function resBtn(val, label){
      return '<button class="st-btn' + (exportRes===val?' st-btn-active':'') + '" onclick="setRes(this)" data-res="' + val + '">' + label + '</button>';
    }
    function chk(id, checked, label, onchange){
      return '<label class="st-toggle"><input type="checkbox" id="' + id + '"' + (checked?' checked':'') + (onchange?' onchange="'+onchange+'"':'') + '> ' + label + '</label>';
    }
    function scRadio(val, label){
      return '<label class="st-toggle"><input type="radio" name="st-scr" value="' + val + '"' + (scRange===val?' checked':'') + '> ' + label + '</label>';
    }

    var html = '';

    // Appearance
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Appearance</div>';
    html += '<div class="st-btn-group">' + themeBtn('dark','Dark') + themeBtn('light','Light') + themeBtn('auto','Auto') + '</div>';
    html += '</div>';

    // Language
    var curLang = ws.lang || 'en';
    function langBtn(val, label){
      return '<button class="st-btn' + (curLang===val?' st-btn-active':'') + '" onclick="Shell.setLang(\'' + val + '\')">' + label + '</button>';
    }
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Language</div>';
    html += '<div class="st-btn-group st-btn-group-wrap">' + langBtn('en','EN') + langBtn('zh','中文') + langBtn('ja','日本語') + langBtn('ko','한국어') + langBtn('es','ES') + '</div>';
    html += '</div>';

    // Overlay Visibility
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Overlay</div>';
    html += chk('st-chk-shot', showShot, 'Shot Overlay', 'Shell.settingsToggle(\"showShot\",this.checked)');
    html += chk('st-chk-score', showScore, 'Scorecard', 'Shell.settingsToggle(\"showScore\",this.checked)');
    if(showScore){
      html += '<div class="st-indent">';
      html += '<div class="st-btn-group st-btn-group-sm">' + scRadio('front9','F9') + scRadio('back9','B9') + scRadio('18','18H') + '</div>';
      html += chk('st-chk-pname-nav', showPnameNav, 'Player Name on Nav');
      html += '</div>';
    }
    html += chk('st-chk-total', showTotal, 'Total', 'Shell.settingsToggle(\"showTotal\",this.checked)');
    html += '<div class="st-row">';
    html += '<span class="st-row-label">Display</span>';
    html += '<div class="st-btn-group st-btn-group-sm">';
    html += '<button class="st-btn' + (mode==='topar'?' st-btn-active':'') + '" onclick="setMode(\'topar\')">To Par</button>';
    html += '<button class="st-btn' + (mode==='gross'?' st-btn-active':'') + '" onclick="setMode(\'gross\')">Gross</button>';
    html += '</div></div>';
    html += '</div>';

    // Aspect Ratio
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Aspect Ratio</div>';
    html += '<div class="st-btn-group">' + ratioBtn('16:9','16:9') + ratioBtn('9:16','9:16') + ratioBtn('1:1','1:1') + '</div>';
    html += '</div>';

    // Overlay Style
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Overlay Style</div>';
    html += '<div class="st-btn-group st-btn-group-wrap">';
    html += overlayThemeBtn('classic','Classic');
    html += overlayThemeBtn('broadcast_gold','Broadcast Gold');
    html += overlayThemeBtn('pgatour','PGA Tour');
    html += overlayThemeBtn('livgolf','LIV Golf');
    html += overlayThemeBtn('vivid','Vivid');
    html += '</div></div>';

    // Background
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Background Image</div>';
    html += '<div class="st-row"><span class="st-row-label">BG Opacity</span><input type="range" id="st-bg-opacity" min="0" max="100" value="' + (ws.bgOpacity != null ? ws.bgOpacity : 100) + '" style="flex:1" oninput="Shell.settingsSlider(\'bgOpacity\',this.value)"><span class="st-range-val" id="st-bg-opacity-val">' + (ws.bgOpacity != null ? ws.bgOpacity : 100) + '%</span></div>';
    html += '<div class="st-btn-row">';
    html += '<button class="st-action-btn" onclick="document.getElementById(\'bg-file-input\').click()">Upload Background</button>';
    html += '<button class="st-action-btn st-action-danger" onclick="clearBg()">Clear Background</button>';
    html += '</div></div>';

    // Scorecard Overlay
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Scorecard Overlay</div>';
    html += '<button class="st-action-btn" onclick="resetScorecardPos()">Reset Scorecard Position</button>';
    html += chk('st-chk-show-pname', showPname, 'Show Player Name');
    html += '</div>';

    // Export
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Export</div>';
    html += '<div class="st-btn-group">' + resBtn('2160','4K') + resBtn('1440','1440P') + resBtn('1080','1080P') + '</div>';
    html += '<div class="st-row"><span class="st-row-label">Opacity</span><input type="range" id="st-overlay-opacity" min="0" max="100" value="' + (ws.overlayOpacity != null ? ws.overlayOpacity : 100) + '" style="flex:1" oninput="Shell.settingsSlider(\'overlayOpacity\',this.value)"><span class="st-range-val" id="st-overlay-opacity-val">' + (ws.overlayOpacity != null ? ws.overlayOpacity : 100) + '%</span></div>';
    html += '</div>';

    // Safe Zone
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Safe Zone</div>';
    html += chk('st-chk-sz', showSZ, 'Show safe zone guides');
    html += '<div class="st-row"><span class="st-row-label">Zone size</span><select id="st-sz-size" class="st-select" onchange="Shell.settingsSelect(\'szSize\',this.value)"><option value="5"' + (szSize==='5'?' selected':'') + '>5% Action Safe</option><option value="10"' + (szSize==='10'?' selected':'') + '>10% Title Safe</option><option value="both"' + (szSize==='both'?' selected':'') + '>Both</option></select></div>';
    html += '</div>';

    // Course
    html += '<div class="st-section">';
    html += '<div class="st-section-title">Course</div>';
    html += '<div class="st-row"><span class="st-row-label">Name</span><input type="text" id="st-inp-course" class="st-input" placeholder="COURSE" maxlength="24" value="' + _esc(ws.courseName || '') + '"></div>';
    html += '<button class="st-action-btn" onclick="resetAllPars()">Reset All to Par 4</button>';
    html += '</div>';

    el.innerHTML = html;

    // Wire radio buttons for scorecard range
    var radios = el.querySelectorAll('input[name="st-scr"]');
    for(var i=0;i<radios.length;i++){
      radios[i].addEventListener('change', function(){
        if(typeof window.setScorecardRange === 'function') window.setScorecardRange(this.value);
      });
    }
  }

  function settingsToggle(key, val){
    // delegate to existing overlay functions where possible
    if(key === 'showShot'){
      var chk = document.getElementById('chk-shot');
      if(chk) chk.checked = val;
      if(chk) chk.dispatchEvent(new Event('change'));
    } else if(key === 'showScore'){
      var chk = document.getElementById('chk-score');
      if(chk) chk.checked = val;
      if(chk) chk.dispatchEvent(new Event('change'));
    } else if(key === 'showTotal'){
      var chk = document.getElementById('chk-total');
      if(chk) chk.checked = val;
      if(chk) chk.dispatchEvent(new Event('change'));
    }
    _renderSettingsPage();
  }

  function settingsSlider(key, val){
    var valEl = document.getElementById('st-' + key.replace(/([A-Z])/g, function(m){ return '-'+m.toLowerCase(); }) + '-val');
    if(valEl) valEl.textContent = val + '%';
    if(key === 'bgOpacity'){
      var slider = document.getElementById('bg-opacity');
      if(slider){ slider.value = val; slider.dispatchEvent(new Event('input')); }
    } else if(key === 'overlayOpacity'){
      var slider = document.getElementById('overlay-opacity');
      if(slider){ slider.value = val; slider.dispatchEvent(new Event('input')); }
    }
  }

  function settingsSelect(key, val){
    if(key === 'szSize'){
      var sel = document.getElementById('sz-size');
      if(sel){ sel.value = val; sel.dispatchEvent(new Event('change')); }
    }
  }

  // ══════════════════════════════════════════
  // LANGUAGE
  // ══════════════════════════════════════════

  function toggleLangMenu(){
    var menu = document.getElementById('sidebar-lang-menu');
    if(!menu) return;
    var showing = menu.classList.toggle('show');
    if(showing){
      var btn = document.getElementById('sidebar-btn-lang');
      if(btn){
        var r = btn.getBoundingClientRect();
        menu.style.left = (r.right + 4) + 'px';
        menu.style.bottom = (window.innerHeight - r.bottom) + 'px';
      }
    }
  }

  function setLang(lang){
    if(typeof window.setLang === 'function') window.setLang(lang);
    // Re-render settings page to update active button
    if(_currentPage === 'settings') _renderSettingsPage();
  }

  function openSettings(){
    Router.navigate('/settings');
  }

  function _syncLangButton(){
    var lang = (typeof D !== 'undefined' && D.ws()) ? (D.ws().lang || 'en') : 'en';
    var lbl = document.getElementById('sidebar-lang-label');
    var labels = { en:'EN', zh:'中文', ja:'日本語', ko:'한국어', es:'ES' };
    if(lbl) lbl.textContent = labels[lang] || lang;
  }

  // Close lang menu on outside click
  document.addEventListener('click', function(e){
    var wrap = document.getElementById('sidebar-lang-wrap');
    if(wrap && !wrap.contains(e.target)){
      var menu = document.getElementById('sidebar-lang-menu');
      if(menu) menu.classList.remove('show');
    }
  });

  // ══════════════════════════════════════════
  // AUTH — sidebar login state
  // ══════════════════════════════════════════

  function _initAuth(){
    if(typeof AuthState === 'undefined') return;
    // Listen for auth state changes
    AuthState.onChange(_updateAuthUI);
    // Init auth (async, non-blocking)
    AuthState.init();
  }

  function _updateAuthUI(){
    var loggedIn = typeof AuthState !== 'undefined' && AuthState.isLoggedIn();
    var user = loggedIn ? AuthState.getUser() : null;

    // ── Sidebar auth button ──
    var iconEl = document.getElementById('sidebar-auth-icon');
    var labelEl = document.getElementById('sidebar-auth-label');
    if(iconEl && labelEl){
      if(loggedIn){
        var initial = (user && user.displayName) ? user.displayName.charAt(0).toUpperCase() : '?';
        iconEl.textContent = initial;
        labelEl.textContent = user.displayName || 'Profile';
      } else {
        iconEl.innerHTML = '&#128100;';
        labelEl.textContent = 'Sign In';
      }
    }

    // ── Sidebar nav visibility ──
    // Protected nav items: hide when not logged in
    var protectedRoutes = ['rounds', 'courses', 'players', 'buddies', 'teams', 'clubs', 'settings'];
    var navItems = document.querySelectorAll('.sb-item[data-route]');
    for(var i = 0; i < navItems.length; i++){
      var route = navItems[i].getAttribute('data-route');
      if(protectedRoutes.indexOf(route) !== -1){
        navItems[i].style.display = loggedIn ? '' : 'none';
      }
    }
    // New Round button (no data-route, has class sb-new-round)
    var newRoundBtn = document.querySelector('.sb-new-round');
    if(newRoundBtn) newRoundBtn.style.display = loggedIn ? '' : 'none';
    // Overlay Center action
    var overlayAction = document.querySelector('.sb-action[data-route="round"]');
    if(overlayAction) overlayAction.style.display = loggedIn ? '' : 'none';
    // Section labels: Management / Workspace / Recent
    var sectionLabels = document.querySelectorAll('.sb-section-label');
    for(var i = 0; i < sectionLabels.length; i++){
      var labelText = sectionLabels[i].textContent.trim();
      if(labelText === 'Management' || labelText === 'Workspace' || labelText === 'Recent'){
        sectionLabels[i].style.display = loggedIn ? '' : 'none';
      }
    }
    // Live/Recent section
    var liveRecent = document.getElementById('sb-live-recent');
    if(liveRecent) liveRecent.style.display = loggedIn ? '' : 'none';
    // ── Sidebar register button (guest only) ──
    var regEntry = document.getElementById('sidebar-register-entry');
    if(regEntry) regEntry.style.display = loggedIn ? 'none' : '';

    // ── Re-render current page if it's home (to switch between guest/loggedIn view) ──
    if(_currentPage === 'home'){
      HomePage.render();
    }
  }

  function goAuth(){
    if(typeof AuthState !== 'undefined' && AuthState.isLoggedIn()){
      Router.navigate('/profile');
    } else {
      Router.navigate('/login');
    }
  }

  /**
   * Check if the current user can access a protected page.
   * Returns true if logged in, false otherwise.
   * When false, renders a login prompt card into the given container.
   */
  function requireAuth(containerId){
    if(typeof AuthState !== 'undefined' && AuthState.isLoggedIn()) return true;
    var el = document.getElementById(containerId);
    if(!el) return false;
    el.innerHTML = '<div class="auth-guard">'
      + '<div class="auth-guard-icon">&#128274;</div>'
      + '<div class="auth-guard-title">Sign in to continue</div>'
      + '<div class="auth-guard-text">This feature requires a logged-in account.</div>'
      + '<div class="auth-guard-actions">'
      + '<button class="sh-btn-primary" onclick="Router.navigate(\'/login\')">Sign In</button>'
      + '<button class="sh-btn-outline" onclick="Router.navigate(\'/register\')">Create Account</button>'
      + '</div>'
      + '</div>';
    return false;
  }

  // ══════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════

  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(init, 0);
  } else {
    window.addEventListener('DOMContentLoaded', function(){
      setTimeout(init, 50);
    });
  }

  return {
    init: init,
    enterOverlay: enterOverlay,
    newRound: newRound,
    showNewRound: showNewRound,
    importRound: importRound,
    currentPage: currentPage,
    toggleSidebar: toggleSidebar,
    openSidebar: openSidebar,
    closeSidebar: closeSidebar,
    toggleLangMenu: toggleLangMenu,
    setLang: setLang,
    openSettings: openSettings,
    settingsToggle: settingsToggle,
    settingsSlider: settingsSlider,
    settingsSelect: settingsSelect,
    goAuth: goAuth,
    requireAuth: requireAuth
  };

})();
