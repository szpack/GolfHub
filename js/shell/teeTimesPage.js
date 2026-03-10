// ============================================================
// teeTimesPage.js — TeeTimes Booking Page (完整版)
// Route: #/teetimes
// 包含: Intent Bar + TeeTime Card List + Detail Drawer
// ============================================================

const TeeTimesPage = (function(){

  // Mock 数据
  var _courses = [
    { id: 'shahe', name: '沙河高尔夫球会', location: '深圳南山', price: 520, image: 'bkimg.jpeg' },
    { id: 'xili', name: '西丽高尔夫乡村俱乐部', location: '深圳南山', price: 480, image: 'bkimg-9-16.jpg' },
    { id: 'mission', name: '观澜湖高尔夫球会', location: '深圳龙华', price: 1280, image: 'bkimg-1-1.jpg' }
  ];

  var _areas = [
    { id: 'shenzhen', name: '深圳' },
    { id: 'guangzhou', name: '广州' },
    { id: 'dongguan', name: '东莞' }
  ];

  // Mock TeeTime 数据
  var _teeTimes = [
    {
      id: 'tt_001',
      courseId: 'shahe',
      courseName: '沙河高尔夫球会',
      courseRouting: 'A/B 场',
      date: '2026-03-10',
      time: '07:30',
      availableSlots: 2,
      capacity: 4,
      accessLevel: 'member',
      accessLabel: '会员',
      displayPrice: 520,
      currency: 'CNY',
      priceNote: '会员价',
      bookingMethod: 'member_portal',
      bookingLabel: '会员门户预订',
      bookingUrl: 'https://member.shahegolf.com',
      phone: '0755-12345678',
      restrictions: [],
      meta: ['含球车', '不可取消'],
      description: '沙河高尔夫球会 A/B 场，标准杆 72 杆，球道宽阔，适合各级别球手。'
    },
    {
      id: 'tt_002',
      courseId: 'shahe',
      courseName: '沙河高尔夫球会',
      courseRouting: 'A/B 场',
      date: '2026-03-10',
      time: '08:30',
      availableSlots: 4,
      capacity: 4,
      accessLevel: 'public',
      accessLabel: '公开',
      displayPrice: 880,
      currency: 'CNY',
      priceNote: '公开价',
      bookingMethod: 'external_link',
      bookingLabel: '在线预订',
      bookingUrl: 'https://booking.shahegolf.com',
      phone: '',
      restrictions: [],
      meta: ['含球车'],
      description: '沙河高尔夫球会公开预订时段，欢迎各界人士预订。'
    },
    {
      id: 'tt_003',
      courseId: 'xili',
      courseName: '西丽高尔夫乡村俱乐部',
      courseRouting: 'A 场',
      date: '2026-03-10',
      time: '09:00',
      availableSlots: 1,
      capacity: 4,
      accessLevel: 'member',
      accessLabel: '会员',
      displayPrice: 480,
      currency: 'CNY',
      priceNote: '会员价',
      bookingMethod: 'phone',
      bookingLabel: '电话预订',
      bookingUrl: '',
      phone: '0755-87654321',
      restrictions: ['仅限会员'],
      meta: ['需提前1天'],
      description: '西丽高尔夫 A 场，风景优美，挑战性适中。'
    },
    {
      id: 'tt_004',
      courseId: 'mission',
      courseName: '观澜湖高尔夫球会',
      courseRouting: '世界杯球场',
      date: '2026-03-10',
      time: '10:30',
      availableSlots: 3,
      capacity: 4,
      accessLevel: 'public',
      accessLabel: '公开',
      displayPrice: 1280,
      currency: 'CNY',
      priceNote: '周末价',
      bookingMethod: 'external_link',
      bookingLabel: '在线预订',
      bookingUrl: 'https://missionhills.com/booking',
      phone: '',
      restrictions: [],
      meta: ['含球车', '含球童'],
      description: '观澜湖世界杯球场，国际标准锦标赛球场。'
    },
    {
      id: 'tt_005',
      courseId: 'shahe',
      courseName: '沙河高尔夫球会',
      courseRouting: 'C 场',
      date: '2026-03-10',
      time: '13:00',
      availableSlots: 0,
      capacity: 4,
      accessLevel: 'public',
      accessLabel: '公开',
      displayPrice: 680,
      currency: 'CNY',
      priceNote: '下午场',
      bookingMethod: 'display_only',
      bookingLabel: '已满',
      bookingUrl: '',
      phone: '',
      restrictions: ['已售罄'],
      meta: [],
      description: '沙河 C 场下午时段，目前名额已满。'
    },
    {
      id: 'tt_006',
      courseId: 'xili',
      courseName: '西丽高尔夫乡村俱乐部',
      courseRouting: 'B 场',
      date: '2026-03-10',
      time: '14:30',
      availableSlots: 2,
      capacity: 4,
      accessLevel: 'guest',
      accessLabel: '会员带客',
      displayPrice: 680,
      currency: 'CNY',
      priceNote: '嘉宾价',
      bookingMethod: 'phone',
      bookingLabel: '电话预订',
      bookingUrl: '',
      phone: '0755-87654321',
      restrictions: ['需会员陪同'],
      meta: ['含球车'],
      description: '西丽 B 场会员带客时段，需会员陪同下场。'
    }
  ];

  // 状态
  var _state = {
    where: { type: 'area', id: 'shenzhen', name: '深圳' },
    when: { preset: 'today', date: _formatDate(new Date()) },
    players: 2,
    access: 'all'
  };

  var _ui = {
    openField: null,
    selectedTeeTime: null // 当前打开的 Detail Drawer
  };

  // 工具函数
  function _formatDate(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function _getDisplayDate(){
    if(_state.when.preset === 'today') return T('today');
    if(_state.when.preset === 'tomorrow') return T('tomorrow');
    if(_state.when.preset === 'weekend') return T('thisWeekend');
    return _state.when.date;
  }

  function _filterTeeTimes(){
    return _teeTimes.filter(function(tt){
      if(_state.access !== 'all' && tt.accessLevel !== _state.access){
        return false;
      }
      return true;
    });
  }

  // 渲染主页面
  function render(){
    var el = document.getElementById('page-teetimes-content');
    if(!el) return;

    var html = '';

    // 页面头部
    html += '<div class="sh-page-header">';
    html += '<h1 class="sh-page-title">' + T('teeTimesTitle') + '</h1>';
    html += '<p class="sh-page-subtitle">' + T('teeTimesSubtitle') + '</p>';
    html += '</div>';

    // Intent Bar
    html += '<div class="tt-intent-bar">';
    html += _renderWhereField();
    html += _renderWhenField();
    html += _renderPlayersField();
    html += _renderAccessField();
    html += '</div>';

    // 展开的面板
    if(_ui.openField){
      html += '<div class="tt-intent-panel">';
      html += _renderOpenPanel();
      html += '</div>';
    }

    // 结果列表
    var filtered = _filterTeeTimes();
    html += _renderResults(filtered);

    // Detail Drawer
    if(_ui.selectedTeeTime){
      html += _renderDetailDrawer();
    }

    el.innerHTML = html;
    _wireEvents();
  }

  // Intent Bar 字段
  function _renderWhereField(){
    var active = _ui.openField === 'where' ? ' tt-field-active' : '';
    var value = _state.where ? _state.where.name : T('selectLocation');
    return '<div class="tt-intent-field' + active + '" data-field="where">' +
           '<label>' + T('where') + '</label>' +
           '<span class="tt-field-value">' + value + '</span>' +
           '<span class="tt-field-arrow">▼</span>' +
           '</div>';
  }

  function _renderWhenField(){
    var active = _ui.openField === 'when' ? ' tt-field-active' : '';
    var value = _getDisplayDate();
    return '<div class="tt-intent-field' + active + '" data-field="when">' +
           '<label>' + T('when') + '</label>' +
           '<span class="tt-field-value">' + value + '</span>' +
           '<span class="tt-field-arrow">▼</span>' +
           '</div>';
  }

  function _renderPlayersField(){
    var active = _ui.openField === 'players' ? ' tt-field-active' : '';
    return '<div class="tt-intent-field' + active + '" data-field="players">' +
           '<label>' + T('players') + '</label>' +
           '<span class="tt-field-value">' + _state.players + ' ' + T('people') + '</span>' +
           '<span class="tt-field-arrow">▼</span>' +
           '</div>';
  }

  function _renderAccessField(){
    var active = _ui.openField === 'access' ? ' tt-field-active' : '';
    var labels = { all: T('all'), public: T('public'), member: T('member') };
    return '<div class="tt-intent-field' + active + '" data-field="access">' +
           '<label>' + T('access') + '</label>' +
           '<span class="tt-field-value">' + labels[_state.access] + '</span>' +
           '<span class="tt-field-arrow">▼</span>' +
           '</div>';
  }

  // 展开面板
  function _renderOpenPanel(){
    switch(_ui.openField){
      case 'where': return _renderWherePanel();
      case 'when': return _renderWhenPanel();
      case 'players': return _renderPlayersPanel();
      case 'access': return _renderAccessPanel();
      default: return '';
    }
  }

  function _renderWherePanel(){
    var html = '<div class="tt-panel-title">' + T('selectLocation') + '</div>';
    html += '<div class="tt-where-options">';
    html += '<div class="tt-where-section">';
    html += '<div class="tt-where-section-title">' + T('areas') + '</div>';
    for(var i = 0; i < _areas.length; i++){
      var a = _areas[i];
      var selected = _state.where.type === 'area' && _state.where.id === a.id ? ' tt-option-selected' : '';
      html += '<div class="tt-where-option' + selected + '" data-type="area" data-id="' + a.id + '" data-name="' + a.name + '">' + a.name + '</div>';
    }
    html += '</div>';
    html += '<div class="tt-where-section">';
    html += '<div class="tt-where-section-title">' + T('courses') + '</div>';
    for(var i = 0; i < _courses.length; i++){
      var c = _courses[i];
      var selected = _state.where.type === 'course' && _state.where.id === c.id ? ' tt-option-selected' : '';
      html += '<div class="tt-where-option' + selected + '" data-type="course" data-id="' + c.id + '" data-name="' + c.name + '">' + 
              '<span>' + c.name + '</span>' +
              '<span class="tt-where-price">$' + c.price + '</span>' +
              '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  function _renderWhenPanel(){
    var html = '<div class="tt-panel-title">' + T('selectDate') + '</div>';
    html += '<div class="tt-when-presets">';
    var presets = [
      { id: 'today', label: T('today') },
      { id: 'tomorrow', label: T('tomorrow') },
      { id: 'weekend', label: T('thisWeekend') }
    ];
    for(var i = 0; i < presets.length; i++){
      var p = presets[i];
      var selected = _state.when.preset === p.id ? ' tt-option-selected' : '';
      html += '<button class="tt-when-preset' + selected + '" data-preset="' + p.id + '">' + p.label + '</button>';
    }
    html += '</div>';
    html += '<div class="tt-when-calendar">';
    html += '<div class="tt-calendar-title">' + T('pickDate') + '</div>';
    html += '<div class="tt-calendar-grid">';
    for(var i = 0; i < 14; i++){
      var d = new Date();
      d.setDate(d.getDate() + i);
      var dateStr = _formatDate(d);
      var dayLabel = d.getDate();
      var selected = _state.when.date === dateStr && !_state.when.preset ? ' tt-calendar-day-selected' : '';
      html += '<div class="tt-calendar-day' + selected + '" data-date="' + dateStr + '">' + dayLabel + '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  function _renderPlayersPanel(){
    var html = '<div class="tt-panel-title">' + T('selectPlayers') + '</div>';
    html += '<div class="tt-players-options">';
    for(var i = 1; i <= 4; i++){
      var selected = _state.players === i ? ' tt-option-selected' : '';
      html += '<button class="tt-players-option' + selected + '" data-players="' + i + '">' + i + ' ' + T('people') + '</button>';
    }
    html += '</div>';
    return html;
  }

  function _renderAccessPanel(){
    var html = '<div class="tt-panel-title">' + T('selectAccess') + '</div>';
    html += '<div class="tt-access-options">';
    var options = [
      { id: 'all', label: T('allAccess') },
      { id: 'public', label: T('publicOnly') },
      { id: 'member', label: T('memberOnly') }
    ];
    for(var i = 0; i < options.length; i++){
      var o = options[i];
      var selected = _state.access === o.id ? ' tt-option-selected' : '';
      html += '<button class="tt-access-option' + selected + '" data-access="' + o.id + '">' + o.label + '</button>';
    }
    html += '</div>';
    return html;
  }

  // 结果列表
  function _renderResults(teeTimes){
    var html = '';
    
    // 结果摘要
    html += '<div class="tt-results-summary">';
    html += '<span>' + teeTimes.length + ' ' + T('teeTimesFound') + '</span>';
    html += '<span class="tt-summary-filters">' + _getDisplayDate() + ' · ' + _state.players + ' ' + T('people') + '</span>';
    html += '</div>';

    // 结果列表
    html += '<div class="tt-results-list">';
    if(teeTimes.length === 0){
      html += '<div class="tt-empty-state">';
      html += '<div class="tt-empty-icon">&#128339;</div>';
      html += '<div class="tt-empty-title">' + T('noTeeTimesFound') + '</div>';
      html += '<div class="tt-empty-text">' + T('tryAdjustFilters') + '</div>';
      html += '</div>';
    } else {
      for(var i = 0; i < teeTimes.length; i++){
        html += _renderTeeTimeCard(teeTimes[i]);
      }
    }
    html += '</div>';

    return html;
  }

  // TeeTime Card
  function _renderTeeTimeCard(tt){
    var accessColors = {
      public: 'tt-access-public',
      member: 'tt-access-member',
      guest: 'tt-access-guest',
      limited: 'tt-access-limited',
      private: 'tt-access-private'
    };
    var accessClass = accessColors[tt.accessLevel] || 'tt-access-default';
    
    var isFull = tt.availableSlots === 0;
    var availabilityText = isFull ? T('full') : (tt.availableSlots + ' ' + T('spotsLeft'));
    var availabilityClass = isFull ? 'tt-avail-full' : (tt.availableSlots <= 2 ? 'tt-avail-low' : 'tt-avail-open');

    var html = '<div class="tt-card" data-tt-id="' + tt.id + '">';
    
    // L1: 主信息
    html += '<div class="tt-card-primary">';
    html += '<div class="tt-card-time">' + tt.time + '</div>';
    html += '<div class="tt-card-availability ' + availabilityClass + '">' + availabilityText + '</div>';
    html += '<div class="tt-card-price">';
    if(tt.priceNote) html += '<span class="tt-price-note">' + tt.priceNote + '</span>';
    html += '<span class="tt-price-amount">¥' + tt.displayPrice + '</span>';
    html += '</div>';
    html += '</div>';
    
    // L2: 场地信息
    html += '<div class="tt-card-course">';
    html += '<div class="tt-course-name">' + tt.courseName + '</div>';
    html += '<div class="tt-course-routing">' + tt.courseRouting + '</div>';
    html += '</div>';
    
    // L3: 决策信息
    html += '<div class="tt-card-decision">';
    html += '<span class="tt-access-badge ' + accessClass + '">' + tt.accessLabel + '</span>';
    html += '<span class="tt-booking-method">' + tt.bookingLabel + '</span>';
    if(tt.restrictions && tt.restrictions.length > 0){
      html += '<span class="tt-restriction">' + tt.restrictions[0] + '</span>';
    }
    html += '</div>';
    
    // L4: 辅助信息
    if(tt.meta && tt.meta.length > 0){
      html += '<div class="tt-card-meta">' + tt.meta.join(' · ') + '</div>';
    }
    
    // L5: 动作按钮
    html += '<div class="tt-card-actions">';
    
    // View Details 按钮（打开 Drawer）
    html += '<button class="tt-btn tt-btn-secondary" data-action="viewDetails" data-tt-id="' + tt.id + '">' + T('viewDetails') + '</button>';
    
    html += '</div>';
    html += '</div>';
    
    return html;
  }

  // Detail Drawer
  function _renderDetailDrawer(){
    var tt = _teeTimes.find(function(t){ return t.id === _ui.selectedTeeTime; });
    if(!tt) return '';

    var accessColors = {
      public: 'tt-access-public',
      member: 'tt-access-member',
      guest: 'tt-access-guest',
      limited: 'tt-access-limited',
      private: 'tt-access-private'
    };
    var accessClass = accessColors[tt.accessLevel] || 'tt-access-default';
    var isFull = tt.availableSlots === 0;

    var html = '<div class="tt-drawer-overlay" onclick="TeeTimesPage.closeDrawer()"></div>';
    html += '<div class="tt-drawer">';
    
    // Drawer 头部
    html += '<div class="tt-drawer-header">';
    html += '<h3>' + T('teeTimeDetail') + '</h3>';
    html += '<button class="tt-drawer-close" onclick="TeeTimesPage.closeDrawer()">&times;</button>';
    html += '</div>';
    
    // Drawer 内容
    html += '<div class="tt-drawer-content">';
    
    // 球场和时间
    html += '<div class="tt-drawer-section">';
    html += '<div class="tt-drawer-course">' + tt.courseName + '</div>';
    html += '<div class="tt-drawer-routing">' + tt.courseRouting + '</div>';
    html += '<div class="tt-drawer-datetime">' + tt.date + ' ' + tt.time + '</div>';
    html += '</div>';
    
    // 名额信息
    html += '<div class="tt-drawer-section">';
    html += '<div class="tt-drawer-label">' + T('availability') + '</div>';
    html += '<div class="tt-drawer-value">' + tt.capacity + ' ' + T('playerSlots') + ' · ' + (isFull ? T('full') : (tt.availableSlots + ' ' + T('spotsLeft'))) + '</div>';
    html += '</div>';
    
    // Access & Price
    html += '<div class="tt-drawer-section">';
    html += '<div class="tt-drawer-label">' + T('accessAndPrice') + '</div>';
    html += '<div class="tt-drawer-access-row">';
    html += '<span class="tt-access-badge ' + accessClass + '">' + tt.accessLabel + '</span>';
    html += '<span class="tt-drawer-price">¥' + tt.displayPrice + '</span>';
    html += '</div>';
    if(tt.priceNote){
      html += '<div class="tt-drawer-price-note">' + tt.priceNote + '</div>';
    }
    html += '</div>';
    
    // 预订方式
    html += '<div class="tt-drawer-section">';
    html += '<div class="tt-drawer-label">' + T('bookingMethod') + '</div>';
    html += '<div class="tt-drawer-value">' + tt.bookingLabel + '</div>';
    if(tt.phone){
      html += '<div class="tt-drawer-phone">' + T('phone') + ': ' + tt.phone + '</div>';
    }
    html += '</div>';
    
    // 描述
    if(tt.description){
      html += '<div class="tt-drawer-section">';
      html += '<div class="tt-drawer-label">' + T('aboutThisTeeTime') + '</div>';
      html += '<div class="tt-drawer-description">' + tt.description + '</div>';
      html += '</div>';
    }
    
    // 限制和元信息
    if(tt.restrictions.length > 0 || tt.meta.length > 0){
      html += '<div class="tt-drawer-section">';
      html += '<div class="tt-drawer-label">' + T('notes') + '</div>';
      if(tt.restrictions.length > 0){
        html += '<div class="tt-drawer-restrictions">' + tt.restrictions.join(' · ') + '</div>';
      }
      if(tt.meta.length > 0){
        html += '<div class="tt-drawer-meta">' + tt.meta.join(' · ') + '</div>';
      }
      html += '</div>';
    }
    
    html += '</div>';
    
    // Drawer 底部动作
    html += '<div class="tt-drawer-footer">';
    
    // Book 按钮
    var bookDisabled = isFull || tt.bookingMethod === 'display_only';
    var bookClass = bookDisabled ? 'tt-btn-disabled' : 'tt-btn-primary';
    var bookText = isFull ? T('full') : (tt.bookingMethod === 'phone' ? T('callToBook') : T('bookNow'));
    html += '<button class="tt-btn ' + bookClass + '" data-action="book" data-tt-id="' + tt.id + '"' + (bookDisabled ? ' disabled' : '') + '>' + bookText + '</button>';
    
    // Start Round 按钮
    var srDisabled = isFull;
    var srClass = srDisabled ? 'tt-btn-disabled' : 'tt-btn-secondary';
    html += '<button class="tt-btn ' + srClass + '" data-action="startRound" data-tt-id="' + tt.id + '"' + (srDisabled ? ' disabled' : '') + '>' + T('startRound') + '</button>';
    
    html += '</div>';
    html += '</div>';
    
    return html;
  }

  // 事件绑定
  function _wireEvents(){
    // Intent Bar 字段点击
    var fields = document.querySelectorAll('.tt-intent-field');
    for(var i = 0; i < fields.length; i++){
      fields[i].addEventListener('click', function(){
        var field = this.dataset.field;
        _ui.openField = _ui.openField === field ? null : field;
        render();
      });
    }

    // Where 选项
    var whereOptions = document.querySelectorAll('.tt-where-option');
    for(var i = 0; i < whereOptions.length; i++){
      whereOptions[i].addEventListener('click', function(){
        _state.where = { type: this.dataset.type, id: this.dataset.id, name: this.dataset.name };
        _ui.openField = null;
        render();
      });
    }

    // When 快捷选项
    var whenPresets = document.querySelectorAll('.tt-when-preset');
    for(var i = 0; i < whenPresets.length; i++){
      whenPresets[i].addEventListener('click', function(){
        var preset = this.dataset.preset;
        var d = new Date();
        if(preset === 'tomorrow') d.setDate(d.getDate() + 1);
        if(preset === 'weekend'){
          var daysUntilSat = 6 - d.getDay();
          if(daysUntilSat < 0) daysUntilSat += 7;
          d.setDate(d.getDate() + daysUntilSat);
        }
        _state.when = { preset: preset, date: _formatDate(d) };
        _ui.openField = null;
        render();
      });
    }

    // When 日历选择
    var calendarDays = document.querySelectorAll('.tt-calendar-day');
    for(var i = 0; i < calendarDays.length; i++){
      calendarDays[i].addEventListener('click', function(){
        _state.when = { preset: null, date: this.dataset.date };
        _ui.openField = null;
        render();
      });
    }

    // Players 选项
    var playersOptions = document.querySelectorAll('.tt-players-option');
    for(var i = 0; i < playersOptions.length; i++){
      playersOptions[i].addEventListener('click', function(){
        _state.players = parseInt(this.dataset.players);
        _ui.openField = null;
        render();
      });
    }

    // Access 选项
    var accessOptions = document.querySelectorAll('.tt-access-option');
    for(var i = 0; i < accessOptions.length; i++){
      accessOptions[i].addEventListener('click', function(){
        _state.access = this.dataset.access;
        _ui.openField = null;
        render();
      });
    }

    // View Details 按钮
    var viewDetailsBtns = document.querySelectorAll('[data-action="viewDetails"]');
    for(var i = 0; i < viewDetailsBtns.length; i++){
      viewDetailsBtns[i].addEventListener('click', function(){
        _ui.selectedTeeTime = this.dataset.ttId;
        _ui.openField = null;
        render();
      });
    }

    // Book 按钮
    var bookBtns = document.querySelectorAll('[data-action="book"]');
    for(var i = 0; i < bookBtns.length; i++){
      bookBtns[i].addEventListener('click', function(){
        var ttId = this.dataset.ttId;
        var tt = _teeTimes.find(function(t){ return t.id === ttId; });
        if(!tt) return;
        
        if(tt.bookingMethod === 'phone'){
          alert(T('callToBook') + ': ' + tt.phone);
        } else if(tt.bookingMethod === 'external_link'){
          if(tt.bookingUrl) window.open(tt.bookingUrl, '_blank');
          else alert(T('externalBooking'));
        } else if(tt.bookingMethod === 'member_portal'){
          if(typeof AuthState !== 'undefined' && !AuthState.isLoggedIn()){
            alert(T('pleaseLoginToBook'));
            Router.navigate('/login');
            return;
          }
          if(tt.bookingUrl) window.open(tt.bookingUrl, '_blank');
          else alert(T('redirectToMemberPortal'));
        }
      });
    }

    // Start Round 按钮
    var srBtns = document.querySelectorAll('[data-action="startRound"]');
    for(var i = 0; i < srBtns.length; i++){
      srBtns[i].addEventListener('click', function(){
        var ttId = this.dataset.ttId;
        var tt = _teeTimes.find(function(t){ return t.id === ttId; });
        if(!tt) return;
        
        var params = 'teetime=' + encodeURIComponent(ttId) + 
                     '&course=' + encodeURIComponent(tt.courseId) +
                     '&date=' + encodeURIComponent(tt.date) +
                     '&time=' + encodeURIComponent(tt.time);
        Router.navigate('/new-round?' + params);
      });
    }
  }

  // 关闭 Drawer
  function closeDrawer(){
    _ui.selectedTeeTime = null;
    render();
  }

  return {
    render: render,
    closeDrawer: closeDrawer
  };
})();
