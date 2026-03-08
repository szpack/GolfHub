// ============================================================
// coursePicker.js — V3.1
// 球场选择器 UI
// 流程：
//   1. 选俱乐部
//   2a. fixed_18   → 选球场 (course)
//   2b. composable_9 → 选前9 segment + 后9 segment
//   3. 确定 → 生成 routing → 初始化 round
// ============================================================

const CoursePicker = (function(){
  let _selectedClubId = null;
  let _routingMode = null;       // 'fixed_18' | 'composable_9'
  // fixed_18 state
  let _selectedCourseId = null;
  // composable_9 state
  let _selectedFrontSegId = null;
  let _selectedBackSegId = null;
  // tee selection
  let _availableTees = [];
  let _selectedTee = 'blue';

  function open(){
    if(!CourseDatabase.isLoaded()){
      CourseDatabase.load().then(()=>_show()).catch(err=>{
        miniToast('Course data load failed');
        console.error(err);
      });
    } else {
      _show();
    }
  }

  function _show(){
    _selectedClubId = null;
    _routingMode = null;
    _selectedCourseId = null;
    _selectedFrontSegId = null;
    _selectedBackSegId = null;
    _availableTees = [];
    _selectedTee = (typeof S !== 'undefined' && S.selectedTee) || 'blue';
    _renderClubs();
    _renderStep2();
    _updateConfirmBtn();
    const bg = document.getElementById('cp-bg');
    const modal = document.getElementById('cp-modal');
    if(bg) bg.classList.add('show');
    if(modal) modal.classList.add('show');
  }

  function close(){
    document.getElementById('cp-bg')?.classList.remove('show');
    document.getElementById('cp-modal')?.classList.remove('show');
  }

  // ── Step 1: Club list ──
  function _renderClubs(){
    const list = document.getElementById('cp-club-list');
    if(!list) return;
    list.innerHTML = '';
    CourseDatabase.getClubs().forEach(club=>{
      const btn = document.createElement('button');
      btn.className = 'cp-item';
      btn.dataset.clubId = club.id;
      const mode = CourseDatabase.getRoutingMode(club.id);
      const tag = mode === 'composable_9' ? '9×N' : '18H';
      btn.innerHTML = '<span class="cp-item-name">' + _esc(club.name) + '</span>'
        + '<span class="cp-item-sub">' + _esc(club.location||'') + ' · ' + tag + '</span>';
      if(club.status === 'closed'){
        btn.innerHTML += '<span class="cp-tag cp-tag-closed">CLOSED</span>';
      }
      btn.onclick = ()=> _selectClub(club.id);
      list.appendChild(btn);
    });
  }

  function _selectClub(clubId){
    _selectedClubId = clubId;
    _routingMode = CourseDatabase.getRoutingMode(clubId);
    _selectedCourseId = null;
    _selectedFrontSegId = null;
    _selectedBackSegId = null;
    _availableTees = CourseDatabase.getAvailableTeesForClub(clubId);
    if(_availableTees.length && !_availableTees.includes(_selectedTee)){
      _selectedTee = _availableTees.includes('blue') ? 'blue' : _availableTees[0];
    }
    // Highlight
    document.querySelectorAll('#cp-club-list .cp-item').forEach(b=>{
      b.classList.toggle('active', b.dataset.clubId === clubId);
    });
    _renderStep2();
    _updateConfirmBtn();
  }

  // ── Step 2: Branch by routing mode ──
  function _renderStep2(){
    const container = document.getElementById('cp-step2');
    const placeholder = document.getElementById('cp-routing-placeholder');
    if(!container) return;
    container.innerHTML = '';

    if(!_selectedClubId){
      if(placeholder) placeholder.style.display = '';
      return;
    }
    if(placeholder) placeholder.style.display = 'none';

    if(_routingMode === 'fixed_18'){
      _renderFixed18(container);
    } else if(_routingMode === 'composable_9'){
      _renderComposable9(container);
    }

    // Tee selector (if teeYards data exists)
    if(_availableTees.length > 0){
      _renderTeeSelector(container);
    }
  }

  // ── fixed_18: course list ──
  function _renderFixed18(container){
    const titleEl = document.createElement('div');
    titleEl.className = 'cp-col-title';
    titleEl.textContent = '选择球场 / Course';
    container.appendChild(titleEl);

    const list = document.createElement('div');
    list.id = 'cp-course-list';
    list.className = 'cp-list';
    container.appendChild(list);

    const courses = CourseDatabase.getFixedCourses(_selectedClubId);
    courses.forEach(c=>{
      const btn = document.createElement('button');
      btn.className = 'cp-item';
      btn.dataset.courseId = c.id;
      btn.innerHTML = '<span class="cp-item-name">' + _esc(c.name) + '</span>'
        + '<span class="cp-item-sub">' + (c.holeCount||18) + 'H</span>';
      if(c.status && c.status !== 'operating'){
        btn.innerHTML += '<span class="cp-tag cp-tag-closed">' + _esc(c.status) + '</span>';
      }
      btn.onclick = ()=>{
        _selectedCourseId = c.id;
        list.querySelectorAll('.cp-item').forEach(b=> b.classList.remove('active'));
        btn.classList.add('active');
        _updateConfirmBtn();
      };
      list.appendChild(btn);
    });
  }

  // ── composable_9: front + back segment selectors ──
  function _renderComposable9(container){
    const segments = CourseDatabase.getSegments(_selectedClubId);

    // Front 9
    const f9Title = document.createElement('div');
    f9Title.className = 'cp-col-title';
    f9Title.textContent = '前9 / Front 9';
    container.appendChild(f9Title);

    const f9List = document.createElement('div');
    f9List.id = 'cp-front-list';
    f9List.className = 'cp-list';
    container.appendChild(f9List);

    segments.forEach(seg=>{
      const btn = document.createElement('button');
      btn.className = 'cp-item';
      btn.dataset.segId = seg.id;
      btn.innerHTML = '<span class="cp-item-name">' + _esc(seg.name) + '</span>'
        + '<span class="cp-item-sub">' + seg.holeCount + 'H</span>';
      btn.onclick = ()=>{
        _selectedFrontSegId = seg.id;
        f9List.querySelectorAll('.cp-item').forEach(b=> b.classList.remove('active'));
        btn.classList.add('active');
        _refreshSegmentDisabled();
        _updateConfirmBtn();
      };
      f9List.appendChild(btn);
    });

    // Back 9
    const b9Title = document.createElement('div');
    b9Title.className = 'cp-col-title';
    b9Title.style.marginTop = '12px';
    b9Title.textContent = '后9 / Back 9';
    container.appendChild(b9Title);

    const b9List = document.createElement('div');
    b9List.id = 'cp-back-list';
    b9List.className = 'cp-list';
    container.appendChild(b9List);

    segments.forEach(seg=>{
      const btn = document.createElement('button');
      btn.className = 'cp-item';
      btn.dataset.segId = seg.id;
      btn.innerHTML = '<span class="cp-item-name">' + _esc(seg.name) + '</span>'
        + '<span class="cp-item-sub">' + seg.holeCount + 'H</span>';
      btn.onclick = ()=>{
        _selectedBackSegId = seg.id;
        b9List.querySelectorAll('.cp-item').forEach(b=> b.classList.remove('active'));
        btn.classList.add('active');
        _refreshSegmentDisabled();
        _updateConfirmBtn();
      };
      b9List.appendChild(btn);
    });
  }

  // ── Tee selector ──
  const TEE_COLORS = {
    gold:'#DAA520', blue:'#2563EB', white:'#CCCCCC', red:'#DC2626',
    black:'#333', green:'#16A34A', silver:'#A0A0A0', champion:'#DAA520'
  };
  const TEE_ORDER = ['black','gold','champion','blue','white','green','silver','red'];

  function _renderTeeSelector(container){
    const titleEl = document.createElement('div');
    titleEl.className = 'cp-col-title';
    titleEl.style.marginTop = '12px';
    titleEl.textContent = '发球台 / Tee Box';
    container.appendChild(titleEl);

    const wrap = document.createElement('div');
    wrap.id = 'cp-tee-list';
    wrap.className = 'cp-tee-wrap';
    container.appendChild(wrap);

    // Sort tees by conventional order
    const sorted = _availableTees.slice().sort((a,b)=>{
      const ai = TEE_ORDER.indexOf(a), bi = TEE_ORDER.indexOf(b);
      return (ai<0?99:ai) - (bi<0?99:bi);
    });

    sorted.forEach(tee=>{
      const btn = document.createElement('button');
      btn.className = 'cp-tee-btn' + (tee === _selectedTee ? ' active' : '');
      btn.dataset.tee = tee;
      const dot = document.createElement('span');
      dot.className = 'cp-tee-dot';
      dot.style.background = TEE_COLORS[tee] || '#888';
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(tee.charAt(0).toUpperCase() + tee.slice(1)));
      btn.onclick = ()=>{
        _selectedTee = tee;
        wrap.querySelectorAll('.cp-tee-btn').forEach(b=> b.classList.remove('active'));
        btn.classList.add('active');
      };
      wrap.appendChild(btn);
    });
  }

  /** Disable segments that would violate compositionRules (e.g. no repeat) */
  function _refreshSegmentDisabled(){
    if(_routingMode !== 'composable_9' || !_selectedClubId) return;
    const club = CourseDatabase.getClub(_selectedClubId);
    const rules = club.compositionRules || {};

    // If allowRepeat is false, dim the already-selected segment in the other list
    if(!rules.allowRepeat){
      document.querySelectorAll('#cp-back-list .cp-item').forEach(btn=>{
        btn.classList.toggle('cp-disabled', btn.dataset.segId === _selectedFrontSegId);
      });
      document.querySelectorAll('#cp-front-list .cp-item').forEach(btn=>{
        btn.classList.toggle('cp-disabled', btn.dataset.segId === _selectedBackSegId);
      });
    }
  }

  // ── Confirm button state ──
  function _updateConfirmBtn(){
    const btn = document.getElementById('cp-confirm');
    if(!btn) return;
    let ready = false;
    if(_routingMode === 'fixed_18'){
      ready = !!(_selectedClubId && _selectedCourseId);
    } else if(_routingMode === 'composable_9'){
      ready = !!(_selectedClubId && _selectedFrontSegId && _selectedBackSegId);
      // Validate pair
      if(ready){
        const v = CourseDatabase.validateSegmentPair(_selectedClubId, _selectedFrontSegId, _selectedBackSegId);
        if(!v.valid) ready = false;
      }
    }
    btn.disabled = !ready;
  }

  // ── Confirm action ──
  function confirm(){
    if(!_selectedClubId) return;

    // Build routing based on mode
    let routing;
    if(_routingMode === 'fixed_18'){
      if(!_selectedCourseId) return;
      routing = CourseDatabase.buildRoutingFromCourse(_selectedClubId, _selectedCourseId);
    } else if(_routingMode === 'composable_9'){
      if(!_selectedFrontSegId || !_selectedBackSegId) return;
      const v = CourseDatabase.validateSegmentPair(_selectedClubId, _selectedFrontSegId, _selectedBackSegId);
      if(!v.valid){
        miniToast(v.errors.join('; '), true);
        return;
      }
      routing = CourseDatabase.buildRoutingFromSegments(_selectedClubId, _selectedFrontSegId, _selectedBackSegId);
    } else {
      return;
    }

    // If current round has score data, ask for confirmation
    if(RoundManager.hasScoreData(S.holes)){
      if(!window.confirm('切换球场将重置当前 round 数据，是否继续？\nSwitching course will reset current round data. Continue?')){
        return;
      }
    }

    // Store selected tee
    S.selectedTee = _availableTees.length > 0 ? _selectedTee : (S.selectedTee || 'blue');

    // Create round
    const round = RoundManager.createRoundFromRouting(_selectedClubId, routing, S.selectedTee);
    const orderedHoles = RoundManager.getOrderedHoles();

    // Apply to global state
    _applyRoundToState(round, orderedHoles);

    close();
    render();
    scheduleSave();
    miniToast(round.clubName + ' · ' + round.routingName);
  }

  /**
   * Apply round data to global state S.
   */
  function _applyRoundToState(round, orderedHoles){
    // Persist round (including _routing for restore)
    S.activeRound = JSON.parse(JSON.stringify(round));

    // Update course name
    S.courseName = round.clubName + ' · ' + round.routingName;
    const courseInp = document.getElementById('inp-course');
    if(courseInp) courseInp.value = S.courseName;

    // Initialize S.holes from ordered hole data
    const count = orderedHoles.length;
    S.holes = Array.from({length:count}, (_,i)=>{
      const oh = orderedHoles[i];
      return {
        par:           oh.par,       // null for placeholder holes
        holeLengthYds: oh.yard,
        isPlaceholder: oh.par==null, // true when course data lacks real par/yard
        delta:         null,
        shots:         [],
        shotIndex:     0,
        manualTypes:   {},
        toPins:        {}
      };
    });

    S.currentHole = 0;
    S.scorecardSummary = null;

    // Clear all per-player data
    if(S.byPlayer){
      Object.keys(S.byPlayer).forEach(pid=>{
        S.byPlayer[pid].holes = S.holes.map(()=>({
          delta:null, shots:[], shotIndex:0, manualTypes:{}, toPins:{}
        }));
      });
    }
  }

  function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { open, close, confirm };
})();

// Global shortcuts
function openCoursePicker(){ CoursePicker.open(); }
function closeCoursePicker(){ CoursePicker.close(); }
function confirmCoursePicker(){ CoursePicker.confirm(); }
