// ============================================================
// shell.js — App Shell Controller (GolfHub)
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
    landing:  { elementId:'page-landing',    render: function(){ _renderLandingPage(); }, title:'GolfHub' },
    home:     { elementId:'page-home',       render: function(){ HomePage.render(); }, title:'Home' },
    rounds:   { elementId:'page-rounds',     render: function(){ RoundsPage.render(); }, title:'Rounds' },
    broadcast:{ elementId:'overlay-center',  title:'Broadcast' },
    teetimes: { elementId:'page-teetimes',   render: function(){ TeeTimesPage.render(); }, title:'TeeTimes' },
    teams:    { elementId:'page-teams',      title:'Teams' },
    courses:  { elementId:'page-courses',    render: function(){ CoursesPage.render(); }, title:'Course Management' },
    courseDetail: { elementId:'page-course-detail', render: function(route){ CourseDetailPage.render(route && route.params ? route.params.id : null); }, title:'Club Detail' },
    courseStructure: { elementId:'page-course-structure', render: function(route){ CourseStructureEditor.render(route && route.params ? route.params.id : null); }, title:'Structure Editor' },
    courseImport: { elementId:'page-course-import', render: function(){ CourseImportPage.render(); }, title:'Import Courses' },
    newRound: { elementId:'page-new-round',  render: function(){ NewRoundPage.render(); }, title:'New Round' },
    buddies:  { elementId:'page-buddies',    render: function(){ BuddiesPage.render(); }, title:'Buddies' },
    clubs:    { elementId:'page-clubs',      title:'Clubs' },
    login:    { elementId:'page-auth',       render: function(route){ AuthPage.render(route); }, title:'Sign In' },
    register: { elementId:'page-auth',       render: function(route){ AuthPage.render(route); }, title:'Create Account' },
    profile:  { elementId:'page-profile',    render: function(){ ProfilePage.render(); }, title:'Profile' },
    settings: { elementId:'page-settings',   render: function(){ _renderSettingsPage(); }, title:'Settings' }
  };

  // ══════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════

  function init(){
    Router.add('/',              'home');
    Router.add('/rounds',        'rounds');
    Router.add('/broadcast/:id', 'broadcast');
    Router.add('/broadcast',     'broadcast');
    // Legacy: /round/:id redirects to broadcast
    Router.add('/round/:id',     'broadcast');
    Router.add('/teetimes',      'teetimes');
    Router.add('/teams',         'teams');
    Router.add('/courses',       'courses');
    Router.add('/new-round',     'newRound');
    Router.add('/courses/import','courseImport');
    Router.add('/courses/:id/structure', 'courseStructure');
    Router.add('/courses/:id',   'courseDetail');
    Router.add('/buddies',       'buddies');
    // Legacy: /players redirects to buddies
    Router.add('/players',       'buddies');
    Router.add('/clubs',         'clubs');
    Router.add('/login',         'login');
    Router.add('/register',      'register');
    Router.add('/profile',       'profile');
    Router.add('/settings',      'settings');

    _wireNav();
    _restoreSidebarState();
    _syncLangButton();
    _applySidebarLang();
    _initAuth();

    // Wait for ClubStore seed before starting router, so pages see all clubs
    var seedReady = window._clubSeedReady || Promise.resolve();
    seedReady.then(_startShell).catch(_startShell);
  }

  function _startShell(){
    // Lazy lifecycle checks — auto-finish idle rounds, lock expired grace windows
    if(typeof RoundStore !== 'undefined'){
      RoundStore.checkAutoFinish();
      RoundStore.checkGraceLock();
    }

    Router.start(_onRouteChange);
    _renderLiveRecent();

    document.getElementById('app-shell').classList.add('shell-ready');
    // Remove lang-flash cloak — i18n is now applied
    var cloak = document.getElementById('shell-cloak');
    if(cloak) cloak.remove();
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

    // Lazy lifecycle checks on navigation
    if(typeof RoundStore !== 'undefined'){
      RoundStore.checkAutoFinish();
      RoundStore.checkGraceLock();
    }

    var pageName = route ? route.name : 'home';

    // Landing page override: if not logged in and navigating to home
    var loggedIn = typeof AuthState !== 'undefined' && AuthState.isLoggedIn();
    if(pageName === 'home' && !loggedIn){
      pageName = 'landing';
    }

    _hideAllPages();

    var page = PAGES[pageName];
    if(!page){ page = PAGES.home; pageName = 'home'; }

    var el = document.getElementById(page.elementId);
    if(el){
      el.classList.remove('page-hidden');
      el.classList.add('page-active');
    }

    if(page.render) page.render(route);

    if(pageName === 'broadcast'){
      _enterBroadcast(route && route.params ? route.params.id : null);
    } else {
      _leaveBroadcast();
    }

    _updateNavHighlight(pageName);
    _updateMobileMenuBtn(pageName);
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

  function _enterBroadcast(roundId){
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(typeof render === 'function') render();
      });
    });
    _overlayReady = true;
  }

  function _leaveBroadcast(){
    if(typeof doSave === 'function') doSave();
  }

  // ══════════════════════════════════════════
  // LANDING PAGE
  // ══════════════════════════════════════════

  function _renderLandingPage(){
    var el = document.getElementById('landing-content');
    if(!el) return;

    var html = '';

    // Hero
    html += '<div class="landing-hero">';
    html += '<div class="landing-hero-logo">GolfHub</div>';
    html += '<div class="landing-hero-sub">' + T('landingHeroSub') + '</div>';
    html += '<div class="landing-hero-actions">';
    html += '<button class="landing-hero-btn landing-hero-btn-primary" onclick="Router.navigate(\'/teetimes\')">' + T('landingFindTeeTimes') + '</button>';
    html += '<button class="landing-hero-btn landing-hero-btn-secondary" onclick="Router.navigate(\'/register\')">' + T('createAccountBtn') + '</button>';
    html += '<button class="landing-hero-btn landing-hero-btn-ghost" onclick="Router.navigate(\'/login\')">' + T('signInBtn') + '</button>';
    html += '</div>';
    html += '</div>';

    // Features
    html += '<div class="landing-features">';
    html += _landingFeature('&#128339;', T('landingFeature1Title'), T('landingFeature1Desc'));
    html += _landingFeature('&#9971;', T('landingFeature2Title'), T('landingFeature2Desc'));
    html += _landingFeature('&#127919;', T('landingFeature3Title'), T('landingFeature3Desc'));
    html += '</div>';

    // CTA (bottom)
    html += '<div class="landing-cta">';
    html += '<div class="landing-cta-title">' + T('landingCtaTitle') + '</div>';
    html += '<button class="landing-hero-btn landing-hero-btn-primary" onclick="Router.navigate(\'/register\')">' + T('createAccountBtn') + '</button>';
    html += '</div>';

    el.innerHTML = html;
  }

  function _landingFeature(icon, title, desc){
    return '<div class="landing-feature">'
      + '<div class="landing-feature-icon">' + icon + '</div>'
      + '<div class="landing-feature-title">' + title + '</div>'
      + '<div class="landing-feature-desc">' + desc + '</div>'
      + '</div>';
  }

  // ══════════════════════════════════════════
  // NAV HIGHLIGHT
  // ══════════════════════════════════════════

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
    var bnItems = document.querySelectorAll('.bn-item');
    for(var i = 0; i < bnItems.length; i++){
      var item = bnItems[i];
      var route = item.getAttribute('data-route');
      item.classList.toggle('bn-active', route === pageName);
    }
  }

  function _updateMobileMenuBtn(pageName){
    // Workspace-level title removed — each page renders its own header.
    // Only toggle mobile menu button visibility.
    var menuBtn = document.getElementById('ws-menu-btn');
    if(menuBtn) menuBtn.style.display = (pageName === 'landing' || pageName === 'broadcast') ? 'none' : '';
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
      broadcast:'/broadcast/' + (D.getActiveRoundId() || 'current'),
      teetimes:'/teetimes',
      courses:'/courses', buddies:'/buddies', teams:'/teams', clubs:'/clubs',
      settings:'/settings'
    };
    Router.navigate(pathMap[route] || '/');
  }

  // ══════════════════════════════════════════
  // SIDEBAR COLLAPSE / EXPAND
  // ══════════════════════════════════════════

  function toggleSidebar(){
    // Mobile: open/close drawer; Desktop: collapse/expand
    if(window.innerWidth <= 768){
      var sb = document.getElementById('app-sidebar');
      if(sb && sb.classList.contains('sb-drawer-open')){
        closeSidebar();
      } else {
        openSidebar();
      }
    } else {
      _sidebarCollapsed = !_sidebarCollapsed;
      _applySidebarState();
      try { localStorage.setItem(LS_SIDEBAR, _sidebarCollapsed ? '1' : '0'); } catch(e){}
    }
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
      html = '<div class="sb-round-empty" style="padding:8px 12px;font-size:12px;color:#6b7280;">' + T('noRoundsYet') + '</div>';
    }

    el.innerHTML = html;
  }

  function _roundItem(r, type){
    var dotClass = 'sb-round-dot sb-round-dot-' + type;
    var name = _esc(r.courseName || 'Untitled');
    var meta = r.date ? r.date.slice(5) : '';
    var path = '/broadcast/' + r.id;
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

  function enterBroadcast(){
    var id = D.getActiveRoundId() || 'current';
    Router.navigate('/broadcast/' + id);
  }

  function newRound(){
    Router.navigate('/new-round');
  }

  function showNewRound(){
    _hideAllPages();
    var el = document.getElementById('page-new-round');
    if(el){
      el.classList.remove('page-hidden');
      el.classList.add('page-active');
    }
    NewRoundPage.render();
    _updateMobileMenuBtn('newRound');
    _leaveBroadcast();
    _currentPage = 'newRound';
    _updateNavHighlight('newRound');
    if(window.innerWidth <= 768) closeSidebar();
  }

  function importRound(){
    enterBroadcast();
    setTimeout(function(){
      if(typeof openExportModal === 'function') openExportModal();
    }, 300);
  }

  function openSearch(){
    // Phase 1: placeholder — future command palette
    console.log('[Shell] Search not yet implemented');
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

    // Appearance (NO language section — language is now in Top Bar)
    html += '<div class="st-section">';
    html += '<div class="st-section-title">' + T('stAppearance') + '</div>';
    html += '<div class="st-btn-group">' + themeBtn('dark',T('darkLbl')) + themeBtn('light',T('lightLbl')) + themeBtn('auto',T('autoLbl')) + '</div>';
    html += '</div>';

    // Overlay Visibility
    html += '<div class="st-section">';
    html += '<div class="st-section-title">' + T('stOverlay') + '</div>';
    html += chk('st-chk-shot', showShot, T('stShotOverlay'), 'Shell.settingsToggle(\"showShot\",this.checked)');
    html += chk('st-chk-score', showScore, T('stScorecard'), 'Shell.settingsToggle(\"showScore\",this.checked)');
    if(showScore){
      html += '<div class="st-indent">';
      html += '<div class="st-btn-group st-btn-group-sm">' + scRadio('front9','F9') + scRadio('back9','B9') + scRadio('18','18H') + '</div>';
      html += chk('st-chk-pname-nav', showPnameNav, T('stPlayerNameNav'));
      html += '</div>';
    }
    html += chk('st-chk-total', showTotal, T('stTotal'), 'Shell.settingsToggle(\"showTotal\",this.checked)');
    html += '<div class="st-row">';
    html += '<span class="st-row-label">' + T('stDisplay') + '</span>';
    html += '<div class="st-btn-group st-btn-group-sm">';
    html += '<button class="st-btn' + (mode==='topar'?' st-btn-active':'') + '" onclick="setMode(\'topar\')">To Par</button>';
    html += '<button class="st-btn' + (mode==='gross'?' st-btn-active':'') + '" onclick="setMode(\'gross\')">Gross</button>';
    html += '</div></div>';
    html += '</div>';

    // Aspect Ratio
    html += '<div class="st-section">';
    html += '<div class="st-section-title">' + T('stAspectRatio') + '</div>';
    html += '<div class="st-btn-group">' + ratioBtn('16:9','16:9') + ratioBtn('9:16','9:16') + ratioBtn('1:1','1:1') + '</div>';
    html += '</div>';

    // Overlay Style
    html += '<div class="st-section">';
    html += '<div class="st-section-title">' + T('stOverlayStyle') + '</div>';
    html += '<div class="st-btn-group st-btn-group-wrap">';
    html += overlayThemeBtn('classic',T('classicLbl'));
    html += overlayThemeBtn('broadcast_gold',T('broadcastGoldLbl'));
    html += overlayThemeBtn('pgatour',T('pgaTourLbl'));
    html += overlayThemeBtn('livgolf',T('livGolfLbl'));
    html += overlayThemeBtn('vivid',T('vividLbl'));
    html += '</div></div>';

    // Background
    html += '<div class="st-section">';
    html += '<div class="st-section-title">' + T('stBgImage') + '</div>';
    html += '<div class="st-row"><span class="st-row-label">' + T('stBgOpacity') + '</span><input type="range" id="st-bg-opacity" min="0" max="100" value="' + (ws.bgOpacity != null ? ws.bgOpacity : 100) + '" style="flex:1" oninput="Shell.settingsSlider(\'bgOpacity\',this.value)"><span class="st-range-val" id="st-bg-opacity-val">' + (ws.bgOpacity != null ? ws.bgOpacity : 100) + '%</span></div>';
    html += '<div class="st-btn-row">';
    html += '<button class="st-action-btn" onclick="document.getElementById(\'bg-file-input\').click()">' + T('stUploadBg') + '</button>';
    html += '<button class="st-action-btn st-action-danger" onclick="clearBg()">' + T('stClearBg') + '</button>';
    html += '</div></div>';

    // Scorecard Overlay
    html += '<div class="st-section">';
    html += '<div class="st-section-title">' + T('stScorecardOverlay') + '</div>';
    html += '<button class="st-action-btn" onclick="resetScorecardPos()">' + T('stResetScPos') + '</button>';
    html += chk('st-chk-show-pname', showPname, T('stShowPname'));
    html += '</div>';

    // Export
    html += '<div class="st-section">';
    html += '<div class="st-section-title">' + T('stExport') + '</div>';
    html += '<div class="st-btn-group">' + resBtn('2160','4K') + resBtn('1440','1440P') + resBtn('1080','1080P') + '</div>';
    html += '<div class="st-row"><span class="st-row-label">' + T('stExportOpacity') + '</span><input type="range" id="st-overlay-opacity" min="0" max="100" value="' + (ws.overlayOpacity != null ? ws.overlayOpacity : 100) + '" style="flex:1" oninput="Shell.settingsSlider(\'overlayOpacity\',this.value)"><span class="st-range-val" id="st-overlay-opacity-val">' + (ws.overlayOpacity != null ? ws.overlayOpacity : 100) + '%</span></div>';
    html += '</div>';

    // Safe Zone
    html += '<div class="st-section">';
    html += '<div class="st-section-title">' + T('stSafeZone') + '</div>';
    html += chk('st-chk-sz', showSZ, T('stShowSZ'));
    html += '<div class="st-row"><span class="st-row-label">' + T('stZoneSize') + '</span><select id="st-sz-size" class="st-select" onchange="Shell.settingsSelect(\'szSize\',this.value)"><option value="5"' + (szSize==='5'?' selected':'') + '>' + T('actionSafe') + '</option><option value="10"' + (szSize==='10'?' selected':'') + '>' + T('titleSafe') + '</option><option value="both"' + (szSize==='both'?' selected':'') + '>' + T('bothLbl') + '</option></select></div>';
    html += '</div>';

    // Course
    html += '<div class="st-section">';
    html += '<div class="st-section-title">' + T('stCourse') + '</div>';
    html += '<div class="st-row"><span class="st-row-label">' + T('thName') + '</span><input type="text" id="st-inp-course" class="st-input" placeholder="' + T('stCoursePh') + '" maxlength="24" value="' + _esc(ws.courseName || '') + '"></div>';
    html += '<button class="st-action-btn" onclick="resetAllPars()">' + T('stResetPar') + '</button>';
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
  // LANGUAGE (Sidebar footer)
  // ══════════════════════════════════════════

  function toggleLangMenu(){
    var menu = document.getElementById('sb-lang-menu');
    if(!menu) return;
    menu.classList.toggle('show');
  }

  function setLang(lang){
    if(typeof window.setLang === 'function') window.setLang(lang);
    _syncLangButton();
    _applySidebarLang();
    // Close all lang menus
    var menus = document.querySelectorAll('.sb-lang-menu');
    for(var i = 0; i < menus.length; i++) menus[i].classList.remove('show');
    // Re-render current page to apply new language
    var page = PAGES[_currentPage];
    if(page && page.render) page.render();
    _updateMobileMenuBtn(_currentPage);
    _renderLiveRecent();
  }

  function openSettings(){
    Router.navigate('/settings');
  }

  function _syncLangButton(){
    var lang = (typeof D !== 'undefined' && D.ws()) ? (D.ws().lang || 'en') : 'en';
    var labels = { en:'EN', zh:'中文', ja:'日本語', ko:'한국어', es:'ES' };
    var sbLbl = document.getElementById('sb-lang-label');
    if(sbLbl) sbLbl.textContent = labels[lang] || lang;
  }

  function _applySidebarLang(){
    var routeMap = {
      home: 'sbHome', teetimes: 'sbTeeTimes',
      rounds: 'sbRounds', buddies: 'sbBuddies', teams: 'sbTeams',
      clubs: 'sbClubs', broadcast: 'sbBroadcast',
      settings: 'sbSettings', courses: 'sbCourseManagement'
    };
    var items = document.querySelectorAll('.sb-item[data-route]');
    for(var i = 0; i < items.length; i++){
      var route = items[i].getAttribute('data-route');
      var key = routeMap[route];
      if(key){
        var lbl = items[i].querySelector('.sb-label');
        if(lbl) lbl.textContent = T(key);
        items[i].setAttribute('data-tooltip', T(key));
      }
    }
    var sections = document.querySelectorAll('[data-i18n]');
    for(var j = 0; j < sections.length; j++){
      var key2 = sections[j].getAttribute('data-i18n');
      if(key2) sections[j].textContent = T(key2);
    }
    // Search button label
    var searchLbl = document.querySelector('.sb-search-btn .sb-label');
    if(searchLbl) searchLbl.textContent = T('searchLbl');
    // Avatar label
    var avatarLbl = document.getElementById('sb-avatar-label');
    if(avatarLbl){
      var loggedIn = typeof AuthState !== 'undefined' && AuthState.isLoggedIn();
      var user = loggedIn ? AuthState.getUser() : null;
      avatarLbl.textContent = loggedIn && user ? (user.displayName || T('accountLbl')) : T('signInBtn');
    }
  }

  // Close lang menus on outside click
  document.addEventListener('click', function(e){
    // Sidebar lang
    var sbWrap = document.getElementById('sb-lang-wrap');
    if(sbWrap && !sbWrap.contains(e.target)){
      var sbMenu = document.getElementById('sb-lang-menu');
      if(sbMenu) sbMenu.classList.remove('show');
    }
  });

  // ══════════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════════

  function _initAuth(){
    if(typeof AuthState === 'undefined') return;
    AuthState.onChange(_updateAuthUI);
    AuthState.init();
  }

  function _updateAuthUI(){
    var loggedIn = typeof AuthState !== 'undefined' && AuthState.isLoggedIn();
    var user = loggedIn ? AuthState.getUser() : null;

    // ── Sidebar avatar ──
    var avatarEl = document.getElementById('sb-avatar-text');
    if(avatarEl){
      if(loggedIn && user){
        var initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : '?';
        avatarEl.textContent = initial;
      } else {
        avatarEl.innerHTML = '&#128100;';
      }
    }
    var avatarLbl = document.getElementById('sb-avatar-label');
    if(avatarLbl){
      avatarLbl.textContent = loggedIn && user ? (user.displayName || T('accountLbl')) : T('signInBtn');
    }

    // ── Sidebar nav visibility ──
    var protectedRoutes = ['rounds', 'teetimes', 'buddies', 'teams', 'clubs', 'broadcast', 'settings', 'courses'];
    var navItems = document.querySelectorAll('.sb-item[data-route]');
    for(var i = 0; i < navItems.length; i++){
      var route = navItems[i].getAttribute('data-route');
      if(protectedRoutes.indexOf(route) !== -1){
        navItems[i].style.display = loggedIn ? '' : 'none';
      }
    }
    // New button + Search
    var newBtn = document.getElementById('sb-new-btn');
    if(newBtn) newBtn.style.display = loggedIn ? '' : 'none';
    var searchBtn = document.getElementById('sb-search-btn');
    if(searchBtn) searchBtn.style.display = loggedIn ? '' : 'none';
    // Section labels: Recent / System
    var sectionLabels = document.querySelectorAll('.sb-section-label');
    for(var i = 0; i < sectionLabels.length; i++){
      var i18nEl = sectionLabels[i].querySelector('[data-i18n]');
      var key = i18nEl ? i18nEl.getAttribute('data-i18n') : '';
      if(key === 'sbRecent' || key === 'sbSystem'){
        sectionLabels[i].style.display = loggedIn ? '' : 'none';
      }
    }
    // Live/Recent section
    var liveRecent = document.getElementById('sb-live-recent');
    if(liveRecent) liveRecent.style.display = loggedIn ? '' : 'none';

    // ── Re-render current page if it's home/landing ──
    if(_currentPage === 'home' || _currentPage === 'landing'){
      var hash = window.location.hash.slice(1) || '/';
      if(hash === '/' || hash === ''){
        _onRouteChange({ name:'home', params:{}, path:'/' }, null);
      }
    }
  }

  function goAuth(){
    if(typeof AuthState !== 'undefined' && AuthState.isLoggedIn()){
      Router.navigate('/profile');
    } else {
      Router.navigate('/login');
    }
  }

  function requireAuth(containerId){
    if(typeof AuthState !== 'undefined' && AuthState.isLoggedIn()) return true;
    var el = document.getElementById(containerId);
    if(!el) return false;
    el.innerHTML = '<div class="auth-guard">'
      + '<div class="auth-guard-icon">&#128274;</div>'
      + '<div class="auth-guard-title">' + T('authGuardTitle') + '</div>'
      + '<div class="auth-guard-text">' + T('authGuardText') + '</div>'
      + '<div class="auth-guard-actions">'
      + '<button class="sh-btn-primary" onclick="Router.navigate(\'/login\')">' + T('signInBtn') + '</button>'
      + '<button class="sh-btn-outline" onclick="Router.navigate(\'/register\')">' + T('createAccountBtn') + '</button>'
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
    enterOverlay: function(){ enterBroadcast(); },  // backward compat
    enterBroadcast: enterBroadcast,
    newRound: newRound,
    showNewRound: showNewRound,
    importRound: importRound,
    openSearch: openSearch,
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
