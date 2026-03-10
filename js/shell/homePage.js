// ============================================================
// homePage.js — Home Page Renderer
// Depends on: roundHelper.js
// ============================================================

const HomePage = (function(){

  var H = null; // lazy ref to RoundHelper

  function _h(){ if(!H) H = RoundHelper; return H; }

  function render(){
    var el = document.getElementById('page-home-content');
    if(!el){ console.error('[HomePage] #page-home-content not found'); return; }

    try {
    var loggedIn = typeof AuthState !== 'undefined' && AuthState.isLoggedIn();

    if(!loggedIn){
      el.innerHTML = _renderGuestHome();
      return;
    }

    // ── Logged-in home ──
    var user = AuthState.getUser();
    var active = _h().getActiveSummary();
    var recent = _h().getStoredRounds(5);

    var html = '';

    // Welcome
    var displayName = (user && user.displayName) ? user.displayName : 'Golfer';
    html += '<div class="sh-welcome">';
    html += '<span class="sh-welcome-text">Welcome back, <strong>' + _h().esc(displayName) + '</strong></span>';
    html += '</div>';

    // ── 1. Current Round ──
    html += '<div class="sh-section">';
    html += '<h2 class="sh-section-title">Current Round</h2>';
    if(active){
      html += _renderHero(active);
    } else {
      html += '<div class="sh-empty-state sh-empty-compact">';
      html += '<div class="sh-empty-text">No active round</div>';
      html += '<button class="sh-btn-primary" onclick="Shell.showNewRound()">New Round</button>';
      html += '</div>';
    }
    html += '</div>';

    // ── 2. Recent Rounds ──
    if(recent.length > 0){
      html += '<div class="sh-section">';
      html += '<h2 class="sh-section-title">Recent Rounds</h2>';
      html += '<div class="sh-round-list">';
      recent.forEach(function(r){ html += _renderCard(r); });
      html += '</div>';
      html += '</div>';
    }

    // ── Legacy data cleanup notice ──
    var hasLegacy = active || recent.length > 0;
    if(hasLegacy){
      html += '<div class="sh-legacy-notice">';
      html += '<span class="sh-legacy-icon">&#9888;</span>';
      html += '<div class="sh-legacy-body">';
      html += '<div class="sh-legacy-title">Legacy data detected</div>';
      html += '<div class="sh-legacy-text">These rounds were created before the account system. They are stored locally and not synced to your account.</div>';
      html += '</div>';
      html += '<button class="sh-btn-danger-sm" onclick="HomePage.clearLegacyData()">Clear All</button>';
      html += '</div>';
    }

    // ── 3. Quick Actions ──
    html += '<div class="sh-section">';
    html += '<h2 class="sh-section-title">Quick Actions</h2>';
    html += '<div class="sh-actions">';
    html += '<button class="sh-action-btn" onclick="Shell.showNewRound()">';
    html += '<span class="sh-action-icon">&#10133;</span><span>New Round</span></button>';
    html += '<button class="sh-action-btn" onclick="Shell.importRound()">';
    html += '<span class="sh-action-icon">&#128229;</span><span>Import</span></button>';
    html += '<button class="sh-action-btn" onclick="Router.navigate(\'/rounds\')">';
    html += '<span class="sh-action-icon">&#128203;</span><span>All Rounds</span></button>';
    html += '</div>';
    html += '</div>';

    // ── 4. Management (subdued) ──
    html += '<div class="sh-section sh-section-subdued">';
    html += '<h2 class="sh-section-title">Management</h2>';
    html += '<div class="sh-mgmt-row">';
    html += _pill('Players', '/players');
    html += _pill('Teams', '/teams');
    html += _pill('Clubs', '/clubs');
    html += '</div>';
    html += '</div>';

    el.innerHTML = html;
    } catch(e){ console.error('[HomePage] render error:', e); el.innerHTML = '<div style="padding:24px;color:red">Render error: ' + e.message + '</div>'; }
  }

  // ── Guest (not logged in) home ──
  function _renderGuestHome(){
    var html = '<div class="guest-home">';
    html += '<div class="guest-hero">';
    html += '<div class="guest-hero-icon">&#9971;</div>';
    html += '<h1 class="guest-hero-title">Golf Event Console</h1>';
    html += '<p class="guest-hero-subtitle">Professional golf event management and live overlay system.</p>';
    html += '</div>';
    html += '<div class="guest-cta">';
    html += '<button class="sh-btn-primary sh-btn-lg" onclick="Router.navigate(\'/login\')">Sign In</button>';
    html += '<button class="sh-btn-outline sh-btn-lg" onclick="Router.navigate(\'/register\')">Create Account</button>';
    html += '</div>';
    html += '<div class="guest-features">';
    html += _featureCard('&#127963;', 'Course Management', 'Manage golf clubs with full course structure, tees, and layouts.');
    html += _featureCard('&#9971;', 'Round Tracking', 'Score tracking with real-time leaderboard and player statistics.');
    html += _featureCard('&#127909;', 'Live Overlay', 'Broadcast-quality overlays for streaming and content creation.');
    html += '</div>';
    html += '</div>';
    return html;
  }

  function _featureCard(icon, title, desc){
    return '<div class="guest-feature">'
      + '<div class="guest-feature-icon">' + icon + '</div>'
      + '<div class="guest-feature-title">' + title + '</div>'
      + '<div class="guest-feature-desc">' + desc + '</div>'
      + '</div>';
  }

  // ── Hero card (current round) ──

  function _renderHero(r){
    var html = '<div class="sh-hero-card">';

    // Head: status + date
    html += '<div class="sh-hero-head">';
    html += '<span class="sh-card-status sh-status-' + r.status + '">' + _h().statusLabel(r.status) + '</span>';
    var gp = _h().formatGameplay(r.gameplay);
    if(gp) html += '<span class="sh-hero-gameplay">' + _h().esc(gp) + '</span>';
    if(r.date) html += '<span class="sh-hero-date">' + r.date + '</span>';
    html += '</div>';

    // Course + routing
    html += '<div class="sh-hero-course">' + _h().esc(r.courseName || 'Untitled Round') + '</div>';
    if(r.routingName){
      html += '<div class="sh-hero-routing">' + _h().esc(r.routingName) + '</div>';
    }

    // Stats
    html += '<div class="sh-hero-stats">';
    html += _stat(r.playerCount, 'Players');
    html += _stat(r.holeCount, 'Holes');
    html += _stat(r.playedCount + '/' + r.holeCount, 'Progress');
    html += '</div>';

    // Progress bar
    var pct = r.holeCount > 0 ? Math.round(r.playedCount / r.holeCount * 100) : 0;
    html += '<div class="sh-hero-progress"><div class="sh-hero-progress-bar" style="width:' + pct + '%"></div></div>';

    // Player names (truncated)
    if(r.playerNames && r.playerNames.length > 0){
      html += '<div class="sh-hero-players">' + _h().formatPlayerNames(r.playerNames) + '</div>';
    }

    // Actions
    html += '<div class="sh-hero-actions">';
    html += '<button class="sh-btn-primary sh-btn-lg" onclick="Shell.enterOverlay()">Continue Round</button>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  // ── Compact card (recent rounds, same as Rounds page card) ──

  function _renderCard(r){
    var html = '<div class="sh-card sh-card-compact" onclick="Router.navigate(\'/round/' + r.id + '\')">';
    html += '<div class="sh-card-head">';
    html += '<span class="sh-card-status sh-status-' + r.status + '">' + _h().statusLabel(r.status) + '</span>';
    html += '<span class="sh-card-date">' + r.date + '</span>';
    html += '</div>';
    html += '<div class="sh-card-title">' + _h().esc(r.courseName || 'Untitled') + '</div>';
    html += '<div class="sh-card-meta">' + _h().formatMeta(r) + '</div>';
    html += '</div>';
    return html;
  }

  function _stat(val, label){
    return '<div class="sh-hero-stat"><span class="sh-hero-stat-val">' + val + '</span><span class="sh-hero-stat-lbl">' + label + '</span></div>';
  }

  function _pill(label, path){
    return '<button class="sh-mgmt-pill" onclick="Router.navigate(\'' + path + '\')">' + label + '</button>';
  }

  function clearLegacyData(){
    if(!confirm('This will permanently delete all local rounds and scorecard data. Continue?')) return;
    if(typeof D !== 'undefined' && D.clearAllRounds) D.clearAllRounds();
    render();
  }

  return { render: render, clearLegacyData: clearLegacyData };
})();
