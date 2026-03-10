// ============================================================
// app.js
// 应用初始化、数据管理、全局状态、Canvas渲染、导出
// ============================================================

// ============================================================
// FONT / CANVAS CONSTANTS
// ============================================================
const SF = `ui-sans-serif,-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Helvetica,Arial,sans-serif`;
const SHOT_W=490, SHOT_H=132, ROW1=46, ROW2=42, ROW3=44, COL_W=148, RPAD=12;

// Transient UI state: next-shot-ready index for quick Shot Type input (-1 = inactive)
let _readyIndex = -1;
function clearReady(){ _readyIndex=-1; }
function getReadyIndex(){ return _readyIndex; }

// ============================================================
// I18N
// ============================================================
const STRINGS = {
  en:{
    holeHero:h=>`HOLE ${h}`, holeLbl:'HOLE', parLabel:p=>`PAR ${p}`,
    hintMain:'Click to upload background / Drop image here',
    hintSub:'Preview only — not included in export',
    distLabel:'To Pin', distUnit:'yds',
    totalLabel:'TOTAL DISP',
    finalScore:'FINAL SCORE (DELTA)',
    setScore:'SET SCORE',
    everyShot:'EVERY SHOT',
    shotSection:'SHOT', optionsTitle:'DISPLAY OPTIONS',
    shotOverlay:'Shot Overlay', scorecardOverlay:'Scorecard',
    front9:'F9', back9:'B9', h18:'18H',
    topar:'To Par', gross:'Gross',
    sdTitle:'⚙️ Settings', sdBg:'Background Image', sdBgOp:'BG Opacity',
    sdClearBg:'🗑 Clear Background (restore default)',
    sdSc:'Scorecard Overlay', sdResetSc:'↺ Reset Scorecard Position',
    sdSz:'Safe Zone', sdSzLbl:'Show safe zone guides', sdSzSize:'Zone size',
    sdPar:'Course Par',
    settingsLbl:' Settings',
    nrTitle:'🏌️ New Round', nrClearScores:"Clear this round's scores",
    nrResetPars:'Reset course Par to 4 (all holes)',
    nrCancel:'Cancel', nrConfirm:'Confirm',
    pickerTitle:'Final Score', pickerCancel:'Cancel',
    exportTitle:'EXPORT',
    exportBtn:'Create Overlay PNG',
    bgBtn:'Upload Background', opaLbl:'Opacity',
    nextHoleShort:'NEXT',
    parLbl:'Par',
    // canvas strings — ALL UPPERCASE
    toeOff:'TEE OFF', approach:'APPROACH', layup:'LAYUP', chip:'CHIP', putt:'PUTT',
    forBirdie:'FOR BIRDIE', forPar:'FOR PAR', forBogey:'FOR BOGEY',
    forDouble:'FOR DOUBLE', forTriple:'FOR TRIPLE',
    // shot type button labels — abbreviated
    typeTee:'TEE', typeAppr:'APPR', typeLayup:'LAYUP', typeChip:'CHIP', typePutt:'PUTT', typeProv:'PROVISIONAL',
    typeFB:'FOR BIRDIE', typeFP:'FOR PAR', typeFBo:'FOR BOGEY', typePenalty:'PENALTY',
    provisional:'PROVISIONAL',
    pickerRows:d=>{
      if(d==='clear') return 'CLEAR';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  ALBATROSS';
      if(d===-2) return '-2  EAGLE';
      if(d===-1) return '-1  BIRDIE';
      if(d===0)  return '0  PAR';
      if(d===1)  return '+1  BOGEY';
      if(d===2)  return '+2  DOUBLE';
      if(d===3)  return '+3  TRIPLE';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`Gross: ${g}  (Par ${p}  ${d>=0?'+':''}${d})`,
    toPinLabel:'TO PIN', ydsLabel:'YDS',
    albatross:'ALBATROSS', eagle:'EAGLE', birdie:'BIRDIE', par:'PAR',
    bogey:'BOGEY', double:'DOUBLE', triple:'TRIPLE',
    // UI labels
    noCourseSelected:'No course selected', selectCourseBtn:'Select Course',
    courseLbl:'Course', playersLbl:'Players', scoreLbl:'Score', shotLbl:'SHOT',
    shotTypeLbl:'SHOT TYPE', purposeLbl:'PURPOSE', resultLbl:'RESULT', flagsLbl:'FLAGS', noteLbl:'NOTE',
    landGreen:'ON GREEN', landFairway:'FAIRWAY', landBunker:'BUNKER', landLight:'L.ROUGH', landHeavy:'H.ROUGH', landWater:'WATER', landTrees:'TREES',
    editBtn:'EDIT', prevBtn:'PREV', nextBtn:'NEXT', exportBtn2:'Export…',
    singleLbl:'Single', batchLbl:'Batch', allLbl:'All',
    expShotPng:'Shot PNG', expScPng:'Scorecard PNG',
    expHoleZip:'Hole Shots ZIP', expScZip:'Scorecard ZIP', expAllZip:'Export All ZIP',
    dataLbl:'Data', expRoundExport:'Export Round', expDescRoundExport:'Save current round as JSON', expRoundImport:'Import Round', expDescRoundImport:'Load round from JSON file',
    // Player manager
    pmTitle:'Players', pmActive:'Active Players', pmAdd:'Add Player', pmHist:'History',
    pmNamePh:'Name…', pmSearchPh:'Search…',
    noPlayersYet:'No players yet', noHistory:'No history',
    playerAdded:n=>n+' added',
    // Messages
    maxPlayers:'Max 150 players', playerExists:'Player exists',
    courseNamePrompt:'Course name:',
    scPosReset:'Scorecard position reset',
    setScoreFirst:'Set score first', jsZipNotLoaded:'JSZip not loaded',
    addPlayersFirst:'Add players first', exportError:'Export error',
    holeCleared:'Hole cleared',
    // New round / dialogs
    clearBtn:'Clear', cancelBtn:'Cancel', okBtn:'OK',
    showPlayerName:'Show Player Name',
    logoText:'⛳ GOLF <span>OVERLAY</span>',
    // Settings drawer
    appearanceLbl:'Appearance', overlayLbl:'Overlay',
    darkLbl:'Dark', lightLbl:'Light', autoLbl:'Auto',
    playerLbl:'Player', displayLbl:'Display:',
    ratioLbl:'Aspect Ratio', styleLbl:'Overlay Style',
    classicLbl:'Classic', broadcastGoldLbl:'Broadcast Gold', pgaTourLbl:'PGA Tour', livGolfLbl:'LIV Golf', vividLbl:'Vivid',
    bgUploadBtn:'📷 Upload Background',
    exportLbl:'Export',
    zoneSizeLbl:'Zone size',
    actionSafe:'5% Action Safe', titleSafe:'10% Title Safe', bothLbl:'Both',
    resetParBtn:'Reset All to Par 4',
    newRoundBtn:'New…', skinBtn:'Skin',
    // Score drawer
    scoreDrawerTitle:(h,p)=>'HOLE '+h+' · Par '+p,
    // Mobile
    strokesTxt:g=>'Strokes: '+g, strokesEmpty:'Strokes: —',
    addStrokeBtn:'+Stroke', finishHoleBtn:'Finish Hole', undoBtn:'Undo',
    previewBtn:'Preview', exportPngBtn:'Export PNG',
    resetHoleBtn:'Reset Hole', backBtn:'← Back',
    optionsBtn:'Options…', optionsClose:'Options ▴',
    yardsPh:'yards',
    // Shell pages — Buddies
    buddiesTitle: 'Buddies',
    addBuddyBtn: '+ Add Buddy',
    searchByNamePh: 'Search by name...',
    favoritesLbl: 'Favorites',
    sortDefaultLbl: 'Default',
    sortNameLbl: 'Name',
    sortLastPlayedLbl: 'Last Played',
    sortRoundsLbl: 'Rounds Together',
    loadingLbl: 'Loading...',
    noMatchingBuddies: 'No matching buddies found.',
    noBuddiesYet: 'No buddies yet. Add your first golf buddy!',
    hcpLbl: 'HCP',
    roundsCountLbl: 'rounds',
    lastPlayedLbl: 'Last:',
    editBuddyTitle: 'Edit Buddy',
    addBuddyTitle: 'Add Buddy',
    nameLbl: 'Name',
    handicapLbl: 'Handicap',
    notesLbl: 'Notes',
    deleteLbl: 'Delete',
    saveLbl: 'Save',
    addLbl: 'Add',
    nameRequiredMsg: 'Name is required',
    deleteBuddyConfirm: 'Delete this buddy?',
    failedSaveBuddy: 'Failed to save buddy',
    failedDeleteBuddy: 'Failed to delete buddy',
    ofLbl: 'of',
    fromBuddiesLbl: 'From Buddies',
    addBuddiesLink: 'Add buddies',
    allBuddiesAdded: 'All buddies already added',
    searchUserPh: 'Search by user ID...',
    linkedUserLbl: 'Linked user',
    clearLinkBtn: 'Clear link',
    noUserFound: 'No user found',
    searchBtn: 'Search',
    orLbl: 'or',
    searchingLbl: 'Searching...',
    invalidGolfId: 'Golf ID must be exactly 6 digits',
    cannotAddSelf: 'Cannot add yourself',
    userNotFound: 'User not found',
    followBtn: 'Follow',
    alreadyBuddy: 'Already in your buddies',
    networkError: 'Network error',
    // Shell pages — Profile
    notSignedIn: 'Not signed in.',
    signInBtn: 'Sign In',
    accountLbl: 'Account',
    defaultPlayerLbl: 'Default Player',
    editProfileBtn: 'Edit Profile',
    savingLbl: 'Saving...',
    profileUpdated: 'Profile updated',
    networkErrorMsg: 'Network error',
    signOutBtn: 'Sign Out',
    yourIdLbl: 'Golf ID',
    copyIdBtn: 'Copy',
    copiedLbl: 'Copied!',
    changeAvatarBtn: 'Change Avatar',
    removeAvatarBtn: 'Remove',
    // Shell pages — Home
    welcomeBack: n => 'Welcome back, ' + n,
    currentRoundLbl: 'Current Round',
    noActiveRound: 'No active round',
    recentRoundsLbl: 'Recent Rounds',
    legacyDataTitle: 'Legacy data detected',
    legacyDataText: 'These rounds were created before the account system. They are stored locally and not synced.',
    clearAllBtn: 'Clear All',
    clearLegacyConfirm: 'This will permanently delete all locally stored legacy rounds. Continue?',
    quickActionsLbl: 'Quick Actions',
    newRoundLbl: 'New Round',
    importLbl: 'Import',
    allRoundsLbl: 'All Rounds',
    managementLbl: 'Management',
    guestHeroTitle: 'GolfHub',
    guestHeroSubtitle: 'Where every round begins.',
    guestSignIn: 'Sign In',
    guestCreateAccount: 'Create Account',
    featureCourseTitle: 'Course Management',
    featureCourseDesc: 'Manage golf clubs with full course structure, tee sets, and hole-by-hole details.',
    featureRoundTitle: 'Round Tracking',
    featureRoundDesc: 'Score tracking with real-time leaderboard and per-hole statistics.',
    featureOverlayTitle: 'Live Overlay',
    featureOverlayDesc: 'Broadcast-quality overlays for streaming and event coverage.',
    continueRoundBtn: 'Continue Round',
    holesLbl: 'Holes',
    progressLbl: 'Progress',
    // Shell pages — Tee Times
    ttPageTitle: 'Tee Times',
    ttReviews: 'reviews',
    ttToday: 'Today',
    ttAllTimes: 'All',
    ttMorning: 'Morning',
    ttAfternoon: 'Afternoon',
    ttEvening: 'Evening',
    ttLoadingTimes: 'Loading tee times...',
    ttNoTimesTitle: 'No tee times available',
    ttNoTimesText: 'Try another date or time period.',
    ttCancellationPolicy: 'Free cancellation up to 24 hours before tee time. Weather closure refunds supported.',
    ttHoles: 'holes',
    ttPopular: 'Popular',
    ttLimited: 'Limited',
    ttSpotsLeft: 'spots left',
    ttPerPlayer: '/ player',
    ttSelect: 'Select',
    ttBookingTitle: 'Book Tee Time',
    ttSignInRequired: 'Sign in to book',
    ttSignInText: 'You need an account before confirming a tee time reservation.',
    ttTime: 'Time',
    ttDate: 'Date',
    ttPrice: 'Price',
    ttPlayers: 'Players',
    ttPlayer: 'Player',
    ttCancellationTitle: 'Cancellation policy',
    ttPolicy24h: 'Free cancellation up to 24 hours before tee time.',
    ttPolicyWeather: 'Full refund if the course closes due to weather.',
    ttPolicyRefund: 'Late cancellations may be charged by the course.',
    ttTotal: 'Total',
    ttConfirmBooking: 'Confirm Booking',
    ttBookingSuccess: 'Booking submitted successfully',
    // Shell pages — Auth guard
    authGuardTitle: 'Sign in to continue',
    authGuardText: 'This feature requires a logged-in account.',
    createAccountBtn: 'Create Account',
    // Shell pages — New Round (main page)
    nrSelectCourse: 'Select course',
    nrSelectPlayers: 'Select players',
    nrPersonCount: n => n + ' players',
    nrNowLbl: 'Now',
    nrVisibilityLbl: 'Visibility',
    nrVisPrivateLabel: 'Private: only you & players',
    nrVisFriendsLabel: 'Semi-public: buddies can see',
    nrVisPublicLabel: 'Public: discoverable',
    nrCreateBtn: 'Start',
    nrHintCourse: 'Select a course',
    nrHintRouting: 'Select a routing',
    nrHintFront9: 'Select front 9',
    nrHintBack9: 'Select back 9',
    nrHintPlayer: 'Add at least one player',
    nrHintTeeTime: 'Set tee time',
    nrHintVisibility: 'Set visibility',
    // Shell pages — New Round (pickers)
    nrSearchClubsPh: 'Search clubs...',
    nrNoClubsFound: 'No clubs found',
    nrSearchToFind: 'Use the search box above to find a club',
    nrShowAllClubs: n => 'Show all ' + n + ' clubs',
    nrNoLayouts: 'No layouts configured for this club',
    nrRoutingLbl: 'Routing',
    nrTeeLbl: 'Tee',
    nrTeeTimeLbl: 'Tee Time',
    nrNearbyLbl: 'Nearby',
    nrRecentLbl: 'Recent',
    nrAllClubsLbl: 'All Clubs',
    nrFront9Lbl: 'Front 9',
    nrBack9Lbl: 'Back 9',
    nrCurrentSelection: 'Current selection',
    nrConfirmBtn: 'Confirm',
    nrPlayerPlaceholder: 'Player name...',
    nrAddBtn: '+ Add',
    nrAddGuestBtn: '+ Add guest',
    nrRecentCoPlayersLbl: 'Recent co-players',
    nrMyBuddiesLbl: 'My Buddies',
    nrGuestLbl: 'Guest',
    nrSelfLbl: 'You',
    nrNoBuddies: 'No buddies yet.',
    nrSelectedCount: n => n + ' selected',
    nrStartNow: 'Start now',
    nrIn10Min: 'In 10 min',
    nrIn30Min: 'In 30 min',
    nrIn1Hr: 'In 1 hour',
    nrCustomTime: 'Custom',
    nrQuickSelectLbl: 'Quick select',
    nrCustomTimeLbl: 'Custom time',
    nrTodayLbl: 'Today',
    nrTomorrowLbl: 'Tomorrow',
    nrDateLbl: 'Date',
    nrTimeLbl: 'Time',
    nrVisPrivateName: 'Private',
    nrVisFriendsName: 'Semi-public',
    nrVisPublicName: 'Public',
    nrVisPrivateDesc: 'Only you and selected players can see this round',
    nrVisFriendsDesc: 'Your buddies can see, but not on the discover page',
    nrVisPublicDesc: 'Other users can discover and spectate this round',
    nrSearchPlayersPh: 'Search players…',
    nrGuestNamePh: 'Enter guest name',
    nrNoPlayersFound: 'No players found',
    nrSelectedLbl: 'Selected',
    nrErrClubRequired: 'Please select a course',
    nrErrFront9Required: 'Please select front 9',
    nrErrBack9Required: 'Please select back 9',
    nrErrLayoutRequired: 'Please select a layout',
    nrErrRouteRequired: 'Please select a routing mode',
    nrErrPlayerRequired: 'At least one player is required',
    nrErrPlayerNoName: function(n){ return 'Player ' + n + ' has no name'; },
    nrErrSnapshotEmpty: 'Course data unavailable — check route configuration',
    nrErrClubNotFound: 'Club not found',
    nrScheduledLbl: 'Scheduled',
    nrActiveLbl: 'Active',
    // Shell pages — Rounds
    roundsTitle: 'Rounds',
    searchPh: 'Search...',
    newRoundBtn2: '+ New Round',
    noRoundsYet: 'No rounds yet',
    createFirstRound: 'Create your first round',
    noMatchingRounds: 'No matching rounds',
    playingLbl: 'Playing',
    plannedLbl: 'Planned',
    finishedLbl: 'Finished',
    openBtn: 'Open',
    duplicateBtn: 'Duplicate',
    confirmBtn: 'Confirm',
    deleteBtn: 'Delete',
    // Shell pages — Courses
    coursesTitle: 'Courses',
    importBtn: 'Import',
    newClubBtn: '+ New Club',
    searchClubsPh: 'Search clubs...',
    allProvincesLbl: 'All Provinces',
    allCitiesLbl: 'All Cities',
    allStatusLbl: 'All Status',
    allSourcesLbl: 'All Sources',
    operatingLbl: 'Operating',
    unknownLbl: 'Unknown',
    manualLbl: 'Manual',
    golfliveSourceLbl: 'GolfLive',
    importSourceLbl: 'Import',
    clubsCountLbl: n => n + ' club' + (n !== 1 ? 's' : ''),
    pageLbl: 'Page',
    perPageLbl: '/ page',
    archivedLbl: n => 'Archived (' + n + ')',
    noClubsFound: 'No clubs found',
    adjustFilters: 'Try adjusting your filters.',
    addFirstClub: 'Add your first golf club to get started.',
    thName: 'Name',
    thCity: 'City',
    thHoles: 'Holes',
    thLayouts: 'Layouts',
    thStatus: 'Status',
    thUpdated: 'Updated',
    thActions: 'Actions',
    editBtn2: 'Edit',
    delBtn: 'Del',
    clubDetailLbl: 'Club Detail',
    locationLbl: 'Location',
    structureLbl: 'Structure',
    holesAcrossLbl: (h, n) => h + ' holes across ' + n + ' nine(s)',
    layoutsLbl: n => 'Layouts (' + n + ')',
    defaultLbl: 'Default',
    teeSetsLbl: n => 'Tee Sets (' + n + ')',
    aliasesLbl: 'Aliases',
    metadataLbl: 'Metadata',
    phoneLbl: 'Phone',
    webLbl: 'Web',
    sourceLbl: 'Source',
    createdLbl: 'Created',
    updatedLbl: 'Updated',
    editDetailsBtn: 'Edit Details',
    clubNamePrompt: 'Club name:',
    deleteClubConfirm: (name) => 'Are you sure you want to delete "' + name + '"?',
    deleteClubRefConfirm: (name, refs) => '"' + name + '" is referenced by ' + refs + ' round(s). It will be archived instead of permanently deleted.\n\nContinue?',
    // Shell pages — Settings
    stAppearance: 'Appearance',
    stLanguage: 'Language',
    stOverlay: 'Overlay',
    stShotOverlay: 'Shot Overlay',
    stScorecard: 'Scorecard',
    stPlayerNameNav: 'Player Name on Nav',
    stTotal: 'Total',
    stDisplay: 'Display',
    stAspectRatio: 'Aspect Ratio',
    stOverlayStyle: 'Overlay Style',
    stBgImage: 'Background Image',
    stBgOpacity: 'BG Opacity',
    stUploadBg: 'Upload Background',
    stClearBg: 'Clear Background',
    stScorecardOverlay: 'Scorecard Overlay',
    stResetScPos: 'Reset Scorecard Position',
    stShowPname: 'Show Player Name',
    stExport: 'Export',
    stExportOpacity: 'Opacity',
    stSafeZone: 'Safe Zone',
    stShowSZ: 'Show safe zone guides',
    stZoneSize: 'Zone size',
    stCourse: 'Course',
    stCoursePh: 'COURSE',
    stResetPar: 'Reset All to Par 4',
    // Sidebar nav (GolfHub)
    sbHome: 'Home',
    sbTeeTimes: 'TeeTimes',
    sbRounds: 'Rounds',
    sbBuddies: 'Buddies',
    sbTeams: 'Teams',
    sbClubs: 'Clubs',
    sbBroadcast: 'Broadcast',
    sbSettings: 'Settings',
    sbCourseManagement: 'Course Management',
    sbRecent: 'Recent',
    sbSystem: 'System',
    searchLbl: 'Search',
    // Landing page
    landingHeroSub: 'Where every round begins.',
    landingFindTeeTimes: 'Find TeeTimes',
    landingFeature1Title: 'Find TeeTimes',
    landingFeature1Desc: 'Browse clubs and book your slot.',
    landingFeature2Title: 'Start a Round',
    landingFeature2Desc: 'Score, track, and share your rounds.',
    landingFeature3Title: 'Track Your Game',
    landingFeature3Desc: 'Statistics, history, and improvement insights.',
    landingCtaTitle: 'Start your first round',
    // TeeTimes placeholder
    teetimesPlaceholder: 'Find and book tee times across clubs. Coming soon.',
    // TeeTimes page
    teeTimesTitle: 'Tee Times',
    teeTimesSubtitle: 'Book your perfect tee time',
    selectCourse: 'Select Course',
    selectDate: 'Select Date',
    selectPeriod: 'Time Period',
    availableTeeTimes: 'Available Tee Times',
    selectPlayers: 'Players',
    bookingSummary: 'Booking Summary',
    confirmBooking: 'Confirm Booking',
    perPerson: '/person',
    allPeriods: 'All',
    morning: 'Morning',
    noon: 'Noon',
    afternoon: 'Afternoon',
    noSlotsAvailable: 'No tee times available for this period',
    priceIncludesTax: 'Price includes all taxes and fees',
    pleaseLoginToBook: 'Please sign in to book a tee time',
    bookingConfirm: 'Confirm your booking?',
    bookingSuccess: 'Booking successful!',
  },
  zh:{
    holeHero:h=>`第 ${h} 洞`, holeLbl:'第·洞', parLabel:p=>`标准杆 ${p}`,
    hintMain:'点击上传背景图 / 拖拽图片到此处',
    hintSub:'仅用于预览，不参与导出',
    distLabel:'距旗杆', distUnit:'码',
    totalLabel:'总杆显示',
    finalScore:'本洞成绩 (DELTA)',
    setScore:'设置成绩',
    everyShot:'每一杆',
    shotSection:'击球', optionsTitle:'显示选项',
    shotOverlay:'Shot Overlay', scorecardOverlay:'计分卡',
    front9:'前9', back9:'后9', h18:'18H',
    topar:'To Par', gross:'Gross',
    sdTitle:'⚙️ 设置', sdBg:'背景图', sdBgOp:'背景透明度',
    sdClearBg:'🗑 清除背景（恢复默认）',
    sdSc:'计分卡信息版', sdResetSc:'↺ 复位计分卡位置',
    sdSz:'安全区', sdSzLbl:'显示安全区虚线', sdSzSize:'区域大小',
    sdPar:'球场标准杆',
    settingsLbl:' 设置',
    nrTitle:'🏌️ 清空本轮', nrClearScores:'清空本轮成绩',
    nrResetPars:'重置全部球场标准杆（恢复 Par 4）',
    nrCancel:'取消', nrConfirm:'确认',
    pickerTitle:'本洞成绩', pickerCancel:'取消',
    exportTitle:'导出',
    exportBtn:'生成角标PNG',
    bgBtn:'上传背景', opaLbl:'透明度',
    nextHoleShort:'下一洞',
    parLbl:'标准杆',
    toeOff:'开球', approach:'攻果岭', layup:'过渡', chip:'切杆', putt:'推杆',
    forBirdie:'抓鸟推', forPar:'保帕推', forBogey:'保柏忌推',
    forDouble:'保双推', forTriple:'保三+推',
    typeTee:'开球', typeAppr:'攻果岭', typeLayup:'过渡', typeChip:'切杆', typePutt:'推杆', typeProv:'暂定球',
    typeFB:'抓鸟推', typeFP:'保帕推', typeFBo:'保柏忌推', typePenalty:'罚杆',
    provisional:'暂定球',
    pickerRows:d=>{
      if(d==='clear') return '清除';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  信天翁';
      if(d===-2) return '-2  老鹰';
      if(d===-1) return '-1  小鸟';
      if(d===0)  return '0  标准杆';
      if(d===1)  return '+1  柏忌';
      if(d===2)  return '+2  双柏忌';
      if(d===3)  return '+3  三柏忌';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`总杆: ${g}（标准杆 ${p}  ${d>=0?'+':''}${d}）`,
    toPinLabel:'距旗杆', ydsLabel:'码',
    albatross:'信天翁', eagle:'老鹰', birdie:'小鸟', par:'帕',
    bogey:'柏忌', double:'双柏忌', triple:'三柏忌',
    // UI labels
    noCourseSelected:'未选择球场', selectCourseBtn:'选择球场',
    courseLbl:'球场', playersLbl:'球员', scoreLbl:'成绩', shotLbl:'击球',
    shotTypeLbl:'击球类型', purposeLbl:'目标', resultLbl:'结果', flagsLbl:'标记', noteLbl:'备注',
    landGreen:'上果岭', landFairway:'上球道', landBunker:'下沙', landLight:'二级草', landHeavy:'三级草', landWater:'下水', landTrees:'进树林',
    editBtn:'编辑', prevBtn:'上一洞', nextBtn:'下一洞', exportBtn2:'导出…',
    singleLbl:'单张', batchLbl:'批量', allLbl:'全部',
    expShotPng:'击球 PNG', expScPng:'计分卡 PNG',
    expHoleZip:'当前洞击球包', expScZip:'18洞计分卡包', expAllZip:'全部导出 ZIP',
    dataLbl:'数据', expRoundExport:'导出本局', expDescRoundExport:'保存当前球局为JSON文件', expRoundImport:'导入本局', expDescRoundImport:'从JSON文件恢复球局',
    // Player manager
    pmTitle:'球员管理', pmActive:'已添加球员', pmAdd:'添加球员', pmHist:'历史球员',
    pmNamePh:'球员姓名…', pmSearchPh:'搜索球员…',
    noPlayersYet:'暂无球员', noHistory:'无历史球员',
    playerAdded:n=>n+' 已添加',
    // Messages
    maxPlayers:'最多150名球员', playerExists:'球员已存在',
    courseNamePrompt:'球场名称：',
    scPosReset:'计分卡位置已重置',
    setScoreFirst:'请先录入成绩', jsZipNotLoaded:'JSZip 未加载',
    addPlayersFirst:'请先添加球员', exportError:'导出错误',
    holeCleared:'本洞已清空',
    // New round / dialogs
    clearBtn:'清空', cancelBtn:'取消', okBtn:'确定',
    showPlayerName:'显示球员名字',
    logoText:'⛳ 高尔夫<span>角标助手</span>',
    // Settings drawer
    appearanceLbl:'外观', overlayLbl:'角标显示',
    darkLbl:'深色', lightLbl:'浅色', autoLbl:'自动',
    playerLbl:'球员', displayLbl:'显示：',
    ratioLbl:'画面比例', styleLbl:'角标样式',
    classicLbl:'经典', broadcastGoldLbl:'转播金', pgaTourLbl:'PGA巡回赛', livGolfLbl:'LIV高尔夫', vividLbl:'活力',
    bgUploadBtn:'📷 上传背景图',
    exportLbl:'导出',
    zoneSizeLbl:'区域大小',
    actionSafe:'5% 动作安全区', titleSafe:'10% 标题安全区', bothLbl:'两者',
    resetParBtn:'全部重置为 Par 4',
    newRoundBtn:'新一轮…', skinBtn:'主题',
    // Score drawer
    scoreDrawerTitle:(h,p)=>'第 '+h+' 洞 · 标准杆 '+p,
    // Mobile
    strokesTxt:g=>'总杆: '+g, strokesEmpty:'总杆: —',
    addStrokeBtn:'+击球', finishHoleBtn:'完成本洞', undoBtn:'撤销',
    previewBtn:'预览', exportPngBtn:'导出 PNG',
    resetHoleBtn:'重置本洞', backBtn:'← 返回',
    optionsBtn:'选项…', optionsClose:'选项 ▴',
    yardsPh:'码',
    // Shell pages — Buddies
    buddiesTitle: '球友',
    addBuddyBtn: '+ 添加球友',
    searchByNamePh: '按姓名搜索...',
    favoritesLbl: '收藏',
    sortDefaultLbl: '默认',
    sortNameLbl: '姓名',
    sortLastPlayedLbl: '最近同场',
    sortRoundsLbl: '同场次数',
    loadingLbl: '加载中...',
    noMatchingBuddies: '未找到匹配的球友。',
    noBuddiesYet: '暂无球友，添加你的第一个球友吧！',
    hcpLbl: '差点',
    roundsCountLbl: '场',
    lastPlayedLbl: '最近:',
    editBuddyTitle: '编辑球友',
    addBuddyTitle: '添加球友',
    nameLbl: '姓名',
    handicapLbl: '差点',
    notesLbl: '备注',
    deleteLbl: '删除',
    saveLbl: '保存',
    addLbl: '添加',
    nameRequiredMsg: '姓名不能为空',
    deleteBuddyConfirm: '确定删除该球友？',
    failedSaveBuddy: '保存球友失败',
    failedDeleteBuddy: '删除球友失败',
    ofLbl: '/',
    fromBuddiesLbl: '从球友添加',
    addBuddiesLink: '添加球友',
    allBuddiesAdded: '所有球友已添加',
    searchUserPh: '按用户ID搜索...',
    linkedUserLbl: '关联用户',
    clearLinkBtn: '清除关联',
    noUserFound: '未找到用户',
    searchBtn: '搜索',
    orLbl: '或',
    searchingLbl: '搜索中...',
    invalidGolfId: 'Golf ID 必须是6位数字',
    cannotAddSelf: '不能添加自己',
    userNotFound: '未找到该用户',
    followBtn: '关注',
    alreadyBuddy: '已经是你的球友了',
    networkError: '网络错误',
    // Shell pages — Profile
    notSignedIn: '未登录。',
    signInBtn: '登录',
    accountLbl: '账户',
    defaultPlayerLbl: '默认球员',
    editProfileBtn: '编辑资料',
    savingLbl: '保存中...',
    profileUpdated: '资料已更新',
    networkErrorMsg: '网络错误',
    signOutBtn: '退出登录',
    yourIdLbl: 'Golf ID',
    copyIdBtn: '复制',
    copiedLbl: '已复制！',
    changeAvatarBtn: '更换头像',
    removeAvatarBtn: '移除',
    // Shell pages — Home
    welcomeBack: n => '欢迎回来，' + n,
    currentRoundLbl: '当前球局',
    noActiveRound: '无进行中的球局',
    recentRoundsLbl: '最近球局',
    legacyDataTitle: '检测到旧版数据',
    legacyDataText: '这些球局在账户系统之前创建，仅存储在本地，未同步。',
    clearAllBtn: '全部清除',
    clearLegacyConfirm: '这将永久删除所有本地存储的旧版球局。继续？',
    quickActionsLbl: '快捷操作',
    newRoundLbl: '新建球局',
    importLbl: '导入',
    allRoundsLbl: '全部球局',
    managementLbl: '管理',
    guestHeroTitle: 'GolfHub',
    guestHeroSubtitle: '专业高尔夫赛事管理与实时画面叠加系统。',
    guestSignIn: '登录',
    guestCreateAccount: '创建账户',
    featureCourseTitle: '球场管理',
    featureCourseDesc: '管理高尔夫球会，包含完整球场结构、发球台组合及逐洞详情。',
    featureRoundTitle: '球局追踪',
    featureRoundDesc: '实时计分及排行榜，支持逐洞统计。',
    featureOverlayTitle: '实时画面叠加',
    featureOverlayDesc: '广播级画面叠加，适用于直播和赛事转播。',
    continueRoundBtn: '继续球局',
    holesLbl: '洞',
    progressLbl: '进度',
    // Shell pages — Tee Times
    ttPageTitle: '开球时间',
    ttReviews: '条评价',
    ttToday: '今天',
    ttAllTimes: '全部',
    ttMorning: '早场',
    ttAfternoon: '午场',
    ttEvening: '晚场',
    ttLoadingTimes: '正在加载开球时间...',
    ttNoTimesTitle: '暂无可预订时间',
    ttNoTimesText: '试试切换日期或时间段。',
    ttCancellationPolicy: '开球前 24 小时可免费取消，若因天气封场支持退款。',
    ttHoles: '洞',
    ttPopular: '热门',
    ttLimited: '紧张',
    ttSpotsLeft: '个名额',
    ttPerPlayer: '/人',
    ttSelect: '选择',
    ttBookingTitle: '预订开球时间',
    ttSignInRequired: '登录后可预订',
    ttSignInText: '确认预订前需要先登录账户。',
    ttTime: '时间',
    ttDate: '日期',
    ttPrice: '价格',
    ttPlayers: '人数',
    ttPlayer: '位球手',
    ttCancellationTitle: '取消政策',
    ttPolicy24h: '开球前 24 小时内可免费取消。',
    ttPolicyWeather: '如球场因天气关闭，可全额退款。',
    ttPolicyRefund: '临时取消可能由球场收取费用。',
    ttTotal: '总计',
    ttConfirmBooking: '确认预订',
    ttBookingSuccess: '预订提交成功',
    // Shell pages — Auth guard
    authGuardTitle: '请登录以继续',
    authGuardText: '此功能需要登录账户。',
    createAccountBtn: '创建账户',
    // Shell pages — New Round (main page)
    nrSelectCourse: '选择球场',
    nrSelectPlayers: '选择球友',
    nrPersonCount: n => n + '人',
    nrNowLbl: '现在',
    nrVisibilityLbl: '可见范围',
    nrVisPrivateLabel: '私密：仅自己和球友可见',
    nrVisFriendsLabel: '半公开：球友可见',
    nrVisPublicLabel: '公开：所有人可发现',
    nrCreateBtn: '开始',
    nrHintCourse: '请选择球场',
    nrHintRouting: '请选择路线',
    nrHintFront9: '请选择前9',
    nrHintBack9: '请选择后9',
    nrHintPlayer: '请至少添加一名球员',
    nrHintTeeTime: '请设置开球时间',
    nrHintVisibility: '请设置可见范围',
    // Shell pages — New Round (pickers)
    nrSearchClubsPh: '搜索球会...',
    nrNoClubsFound: '未找到球会',
    nrSearchToFind: '请在上方搜索框中查找球场',
    nrShowAllClubs: n => '显示全部 ' + n + ' 个球会',
    nrNoLayouts: '该球会未配置路线',
    nrRoutingLbl: '路线',
    nrTeeLbl: '发球台',
    nrTeeTimeLbl: '开球时间',
    nrNearbyLbl: '附近球场',
    nrRecentLbl: '最近使用',
    nrAllClubsLbl: '全部球会',
    nrFront9Lbl: '前9',
    nrBack9Lbl: '后9',
    nrCurrentSelection: '当前选择',
    nrConfirmBtn: '确定',
    nrPlayerPlaceholder: '球员姓名...',
    nrAddBtn: '+ 添加',
    nrAddGuestBtn: '+ 添加临时球友',
    nrRecentCoPlayersLbl: '最近一起打球',
    nrMyBuddiesLbl: '我的球友',
    nrGuestLbl: '临时',
    nrSelfLbl: '自己',
    nrNoBuddies: '暂无球友。',
    nrSelectedCount: n => '已选 ' + n + ' 人',
    nrStartNow: '现在开始',
    nrIn10Min: '10分钟后',
    nrIn30Min: '30分钟后',
    nrIn1Hr: '1小时后',
    nrCustomTime: '自定义',
    nrQuickSelectLbl: '快捷选择',
    nrCustomTimeLbl: '自定义时间',
    nrTodayLbl: '今天',
    nrTomorrowLbl: '明天',
    nrDateLbl: '日期',
    nrTimeLbl: '时间',
    nrVisPrivateName: '私密',
    nrVisFriendsName: '半公开',
    nrVisPublicName: '公开',
    nrVisPrivateDesc: '仅你与已选球友可见',
    nrVisFriendsDesc: '你的球友可见，不进入公开发现页',
    nrVisPublicDesc: '其他用户可发现并围观该球局',
    nrSearchPlayersPh: '搜索球员…',
    nrGuestNamePh: '输入嘉宾姓名',
    nrNoPlayersFound: '未找到球员',
    nrSelectedLbl: '已选球员',
    nrErrClubRequired: '请选择球场',
    nrErrFront9Required: '请选择前9',
    nrErrBack9Required: '请选择后9',
    nrErrLayoutRequired: '请选择路线',
    nrErrRouteRequired: '请选择路线模式',
    nrErrPlayerRequired: '请至少添加一名球员',
    nrErrPlayerNoName: function(n){ return '球员 ' + n + ' 缺少姓名'; },
    nrErrSnapshotEmpty: '球场数据不可用 — 请检查路线配置',
    nrErrClubNotFound: '球会不存在',
    nrScheduledLbl: '已预约',
    nrActiveLbl: '进行中',
    // Shell pages — Rounds
    roundsTitle: '球局',
    searchPh: '搜索...',
    newRoundBtn2: '+ 新建球局',
    noRoundsYet: '暂无球局',
    createFirstRound: '创建你的第一个球局',
    noMatchingRounds: '无匹配球局',
    playingLbl: '进行中',
    plannedLbl: '已计划',
    finishedLbl: '已完成',
    openBtn: '打开',
    duplicateBtn: '复制',
    confirmBtn: '确认',
    deleteBtn: '删除',
    // Shell pages — Courses
    coursesTitle: '球场',
    importBtn: '导入',
    newClubBtn: '+ 新建球会',
    searchClubsPh: '搜索球会...',
    allProvincesLbl: '全部省份',
    allCitiesLbl: '全部城市',
    allStatusLbl: '全部状态',
    allSourcesLbl: '全部来源',
    operatingLbl: '营业中',
    unknownLbl: '未知',
    manualLbl: '手动',
    golfliveSourceLbl: 'GolfLive',
    importSourceLbl: '导入',
    clubsCountLbl: n => n + ' 个球会',
    pageLbl: '页',
    perPageLbl: '/ 页',
    archivedLbl: n => '已归档 (' + n + ')',
    noClubsFound: '未找到球会',
    adjustFilters: '请调整筛选条件。',
    addFirstClub: '添加你的第一个高尔夫球会。',
    thName: '名称',
    thCity: '城市',
    thHoles: '球洞',
    thLayouts: '路线',
    thStatus: '状态',
    thUpdated: '更新时间',
    thActions: '操作',
    editBtn2: '编辑',
    delBtn: '删除',
    clubDetailLbl: '球会详情',
    locationLbl: '位置',
    structureLbl: '结构',
    holesAcrossLbl: (h, n) => h + ' 洞，' + n + ' 个九洞',
    layoutsLbl: n => '路线 (' + n + ')',
    defaultLbl: '默认',
    teeSetsLbl: n => '发球台组 (' + n + ')',
    aliasesLbl: '别名',
    metadataLbl: '元数据',
    phoneLbl: '电话',
    webLbl: '网站',
    sourceLbl: '来源',
    createdLbl: '创建时间',
    updatedLbl: '更新时间',
    editDetailsBtn: '编辑详情',
    clubNamePrompt: '球会名称：',
    deleteClubConfirm: (name) => '确定删除"' + name + '"？',
    deleteClubRefConfirm: (name, refs) => '"' + name + '"被 ' + refs + ' 个球局引用。将归档而非永久删除。\n\n继续？',
    // Shell pages — Settings
    stAppearance: '外观',
    stLanguage: '语言',
    stOverlay: '画面叠加',
    stShotOverlay: '击球叠加',
    stScorecard: '计分卡',
    stPlayerNameNav: '导航显示球员名',
    stTotal: '总计',
    stDisplay: '显示',
    stAspectRatio: '画面比例',
    stOverlayStyle: '叠加样式',
    stBgImage: '背景图',
    stBgOpacity: '背景透明度',
    stUploadBg: '上传背景',
    stClearBg: '清除背景',
    stScorecardOverlay: '计分卡叠加',
    stResetScPos: '重置计分卡位置',
    stShowPname: '显示球员名字',
    stExport: '导出',
    stExportOpacity: '透明度',
    stSafeZone: '安全区',
    stShowSZ: '显示安全区虚线',
    stZoneSize: '区域大小',
    stCourse: '球场',
    stCoursePh: '球场名称',
    stResetPar: '全部重置为 Par 4',
    // Sidebar nav (GolfHub)
    sbHome: '首页',
    sbTeeTimes: '开球时间',
    sbRounds: '球局',
    sbBuddies: '球友',
    sbTeams: '团队',
    sbClubs: '球会',
    sbBroadcast: '转播',
    sbSettings: '设置',
    sbCourseManagement: '球场管理',
    sbRecent: '最近',
    sbSystem: '系统',
    searchLbl: '搜索',
    // Landing page
    landingHeroSub: '每一轮从这里开始。',
    landingFindTeeTimes: '查找开球时间',
    landingFeature1Title: '查找开球时间',
    landingFeature1Desc: '浏览球会，预约开球时间。',
    landingFeature2Title: '开始球局',
    landingFeature2Desc: '计分、追踪，分享你的球局。',
    landingFeature3Title: '追踪你的比赛',
    landingFeature3Desc: '统计、历史记录和进步洞察。',
    landingCtaTitle: '开始你的第一轮',
    teetimesPlaceholder: '查找并预约各球会开球时间。即将推出。',
    // TeeTimes page (重构版)
    teeTimesTitle: '开球时间',
    teeTimesSubtitle: '查找并预订理想的开球时间',
    where: '地点',
    when: '日期',
    players: '人数',
    access: '身份',
    selectLocation: '选择地点',
    selectDate: '选择日期',
    selectPlayers: '选择人数',
    selectAccess: '选择身份',
    areas: '区域',
    courses: '球场',
    today: '今天',
    tomorrow: '明天',
    thisWeekend: '本周末',
    pickDate: '选择日期',
    all: '全部',
    allAccess: '全部身份',
    public: '公开',
    publicOnly: '仅公开',
    member: '会员',
    memberOnly: '仅会员',
    people: '人',
    teeTimesFound: '个开球时间',
    availableTeeTimes: '可选开球时间',
    bookingSummary: '预订摘要',
    confirmBooking: '确认预订',
    perPerson: '/人',
    perPersonShort: '/人',
    noSlotsAvailable: '该时段暂无可选时间',
    priceIncludesTax: '价格已含所有税费',
    pleaseLoginToBook: '请登录后预订',
    bookingConfirm: '确认您的预订？',
    bookingSuccess: '预订成功！',
  },
  ja:{
    holeHero:h=>`ホール ${h}`, holeLbl:'HOLE', parLabel:p=>`パー ${p}`,
    hintMain:'クリックして背景画像をアップロード / 画像をここにドロップ',
    hintSub:'プレビュー専用 — エクスポートには含まれません',
    distLabel:'ピンまで', distUnit:'ヤード',
    totalLabel:'合計表示',
    finalScore:'ホールスコア (DELTA)',
    setScore:'スコア設定',
    everyShot:'全ショット',
    shotSection:'ショット', optionsTitle:'表示オプション',
    shotOverlay:'Shot Overlay', scorecardOverlay:'スコアカード',
    front9:'前半', back9:'後半', h18:'18H',
    topar:'To Par', gross:'Gross',
    sdTitle:'⚙️ 設定', sdBg:'背景画像', sdBgOp:'背景の不透明度',
    sdClearBg:'🗑 背景をクリア（デフォルトに戻す）',
    sdSc:'スコアカード', sdResetSc:'↺ スコアカード位置をリセット',
    sdSz:'セーフゾーン', sdSzLbl:'セーフゾーンガイドを表示', sdSzSize:'ゾーンサイズ',
    sdPar:'コースパー',
    settingsLbl:' 設定',
    nrTitle:'🏌️ 新ラウンド', nrClearScores:'このラウンドのスコアをクリア',
    nrResetPars:'コースパーを4にリセット（全ホール）',
    nrCancel:'キャンセル', nrConfirm:'確認',
    pickerTitle:'ホールスコア', pickerCancel:'キャンセル',
    exportTitle:'エクスポート',
    exportBtn:'オーバーレイ PNG 作成',
    bgBtn:'背景をアップロード', opaLbl:'不透明度',
    nextHoleShort:'次のホール',
    parLbl:'パー',
    toeOff:'ティーショット', approach:'アプローチ', layup:'レイアップ', chip:'チップ', putt:'パット',
    forBirdie:'バーディーパット', forPar:'パーパット', forBogey:'ボギーパット',
    forDouble:'ダブルパット', forTriple:'トリプル+パット',
    typeTee:'TEE OFF', typeAppr:'APPROACH', typeLayup:'LAYUP', typeChip:'CHIP', typePutt:'PUTT', typeProv:'PROVISIONAL',
    typeFB:'バーディー', typeFP:'パー', typeFBo:'ボギー', typePenalty:'ペナルティ',
    provisional:'プロビジョナル',
    pickerRows:d=>{
      if(d==='clear') return 'クリア';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  アルバトロス';
      if(d===-2) return '-2  イーグル';
      if(d===-1) return '-1  バーディー';
      if(d===0)  return '0  パー';
      if(d===1)  return '+1  ボギー';
      if(d===2)  return '+2  ダブルボギー';
      if(d===3)  return '+3  トリプルボギー';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`グロス: ${g}（パー ${p}  ${d>=0?'+':''}${d}）`,
    toPinLabel:'ピンまで', ydsLabel:'ヤード',
    albatross:'アルバトロス', eagle:'イーグル', birdie:'バーディー', par:'パー',
    bogey:'ボギー', double:'ダブルボギー', triple:'トリプル',
    // UI labels
    courseLbl:'コース', playersLbl:'プレーヤー', scoreLbl:'スコア', shotLbl:'ショット',
    shotTypeLbl:'ショットタイプ', purposeLbl:'目的', resultLbl:'結果', flagsLbl:'フラグ', noteLbl:'メモ',
    landGreen:'グリーンオン', landFairway:'フェアウェイ', landBunker:'バンカー', landLight:'L.ラフ', landHeavy:'H.ラフ', landWater:'ウォーター', landTrees:'林',
    editBtn:'編集', prevBtn:'前へ', nextBtn:'次へ', exportBtn2:'エクスポート…',
    singleLbl:'単体', batchLbl:'バッチ', allLbl:'全て',
    expShotPng:'ショット PNG', expScPng:'スコアカード PNG',
    expHoleZip:'ホールショット ZIP', expScZip:'スコアカード ZIP', expAllZip:'全てエクスポート ZIP',
    dataLbl:'データ', expRoundExport:'ラウンド出力', expDescRoundExport:'現在のラウンドをJSONで保存', expRoundImport:'ラウンド入力', expDescRoundImport:'JSONファイルからラウンドを復元',
    // Player manager
    pmTitle:'プレーヤー管理', pmActive:'追加済み', pmAdd:'プレーヤー追加', pmHist:'履歴',
    pmNamePh:'名前…', pmSearchPh:'検索…',
    noPlayersYet:'プレーヤーなし', noHistory:'履歴なし',
    playerAdded:n=>n+' 追加済み',
    // Messages
    maxPlayers:'最大150名', playerExists:'既に存在します',
    courseNamePrompt:'コース名：',
    scPosReset:'スコアカード位置リセット',
    setScoreFirst:'先にスコアを設定', jsZipNotLoaded:'JSZip未読込',
    addPlayersFirst:'先にプレーヤーを追加', exportError:'エクスポートエラー',
    holeCleared:'ホールクリア',
    // New round / dialogs
    clearBtn:'クリア', cancelBtn:'キャンセル', okBtn:'OK',
    showPlayerName:'プレーヤー名表示',
    logoText:'⛳ GOLF <span>OVERLAY</span>',
    appearanceLbl:'外観', overlayLbl:'オーバーレイ',
    darkLbl:'ダーク', lightLbl:'ライト', autoLbl:'自動',
    playerLbl:'プレーヤー', displayLbl:'表示：',
    ratioLbl:'アスペクト比', styleLbl:'オーバーレイスタイル',
    classicLbl:'クラシック', broadcastGoldLbl:'ブロードキャスト', pgaTourLbl:'PGA Tour', livGolfLbl:'LIV Golf', vividLbl:'ビビッド',
    bgUploadBtn:'📷 背景アップロード',
    exportLbl:'エクスポート',
    zoneSizeLbl:'ゾーンサイズ',
    actionSafe:'5% アクションセーフ', titleSafe:'10% タイトルセーフ', bothLbl:'両方',
    resetParBtn:'全ホール Par 4 にリセット',
    newRoundBtn:'新規…', skinBtn:'スキン',
    scoreDrawerTitle:(h,p)=>'ホール '+h+' · パー '+p,
    strokesTxt:g=>'ストローク: '+g, strokesEmpty:'ストローク: —',
    addStrokeBtn:'+ストローク', finishHoleBtn:'ホール完了', undoBtn:'元に戻す',
    previewBtn:'プレビュー', exportPngBtn:'PNG出力',
    resetHoleBtn:'ホールリセット', backBtn:'← 戻る',
    optionsBtn:'オプション…', optionsClose:'オプション ▴',
    yardsPh:'ヤード',
    // Shell pages — Buddies
    buddiesTitle: 'バディ',
    addBuddyBtn: '+ バディ追加',
    searchByNamePh: '名前で検索...',
    favoritesLbl: 'お気に入り',
    sortDefaultLbl: 'デフォルト',
    sortNameLbl: '名前',
    sortLastPlayedLbl: '最終プレー',
    sortRoundsLbl: '一緒のラウンド数',
    loadingLbl: '読み込み中...',
    noMatchingBuddies: '該当するバディが見つかりません。',
    noBuddiesYet: 'バディがいません。最初のゴルフバディを追加しましょう！',
    hcpLbl: 'HCP',
    roundsCountLbl: 'ラウンド',
    lastPlayedLbl: '最終:',
    editBuddyTitle: 'バディ編集',
    addBuddyTitle: 'バディ追加',
    nameLbl: '名前',
    handicapLbl: 'ハンディキャップ',
    notesLbl: 'メモ',
    deleteLbl: '削除',
    saveLbl: '保存',
    addLbl: '追加',
    nameRequiredMsg: '名前は必須です',
    deleteBuddyConfirm: 'このバディを削除しますか？',
    failedSaveBuddy: 'バディの保存に失敗しました',
    failedDeleteBuddy: 'バディの削除に失敗しました',
    ofLbl: '/',
    fromBuddiesLbl: 'バディから',
    addBuddiesLink: 'バディを追加',
    allBuddiesAdded: '全バディ追加済み',
    searchUserPh: 'ユーザーIDで検索...',
    linkedUserLbl: 'リンクユーザー',
    clearLinkBtn: 'リンク解除',
    noUserFound: 'ユーザーが見つかりません',
    searchBtn: '検索',
    orLbl: 'または',
    searchingLbl: '検索中...',
    invalidGolfId: 'Golf IDは6桁の数字です',
    cannotAddSelf: '自分を追加できません',
    userNotFound: 'ユーザーが見つかりません',
    followBtn: 'フォロー',
    alreadyBuddy: 'すでにバディです',
    networkError: 'ネットワークエラー',
    // Shell pages — Profile
    notSignedIn: 'サインインしていません。',
    signInBtn: 'サインイン',
    accountLbl: 'アカウント',
    defaultPlayerLbl: 'デフォルトプレーヤー',
    editProfileBtn: 'プロフィール編集',
    savingLbl: '保存中...',
    profileUpdated: 'プロフィール更新済み',
    networkErrorMsg: 'ネットワークエラー',
    signOutBtn: 'サインアウト',
    yourIdLbl: 'Golf ID',
    copyIdBtn: 'コピー',
    copiedLbl: 'コピー済み！',
    changeAvatarBtn: 'アバター変更',
    removeAvatarBtn: '削除',
    // Shell pages — Home
    welcomeBack: n => 'おかえりなさい、' + n,
    currentRoundLbl: '現在のラウンド',
    noActiveRound: 'アクティブなラウンドなし',
    recentRoundsLbl: '最近のラウンド',
    legacyDataTitle: 'レガシーデータを検出',
    legacyDataText: 'これらのラウンドはアカウントシステム導入前に作成されました。ローカルに保存され、同期されていません。',
    clearAllBtn: '全て消去',
    clearLegacyConfirm: 'ローカル保存の全レガシーラウンドを完全に削除します。続行しますか？',
    quickActionsLbl: 'クイックアクション',
    newRoundLbl: '新規ラウンド',
    importLbl: 'インポート',
    allRoundsLbl: '全ラウンド',
    managementLbl: '管理',
    guestHeroTitle: 'GolfHub',
    guestHeroSubtitle: 'プロフェッショナルなゴルフイベント管理とライブオーバーレイシステム。',
    guestSignIn: 'サインイン',
    guestCreateAccount: 'アカウント作成',
    featureCourseTitle: 'コース管理',
    featureCourseDesc: 'コース構造、ティーセット、ホール別詳細を含むゴルフクラブを管理。',
    featureRoundTitle: 'ラウンド記録',
    featureRoundDesc: 'リアルタイムリーダーボードとホール別統計によるスコア記録。',
    featureOverlayTitle: 'ライブオーバーレイ',
    featureOverlayDesc: '配信・イベント中継用の放送品質オーバーレイ。',
    continueRoundBtn: 'ラウンド続行',
    holesLbl: 'ホール',
    progressLbl: '進捗',
    // Shell pages — Auth guard
    authGuardTitle: 'サインインしてください',
    authGuardText: 'この機能にはログインが必要です。',
    createAccountBtn: 'アカウント作成',
    // Shell pages — New Round (main page)
    nrSelectCourse: 'コースを選択',
    nrSelectPlayers: 'プレーヤーを選択',
    nrPersonCount: n => n + '名',
    nrNowLbl: '今すぐ',
    nrVisibilityLbl: '公開範囲',
    nrVisPrivateLabel: 'プライベート：自分とプレーヤーのみ',
    nrVisFriendsLabel: '半公開：バディに表示',
    nrVisPublicLabel: '公開：発見可能',
    nrCreateBtn: 'スタート',
    nrHintCourse: 'コースを選択してください',
    nrHintRouting: 'ルーティングを選択してください',
    nrHintFront9: '前半9を選択してください',
    nrHintBack9: '後半9を選択してください',
    nrHintPlayer: '少なくとも1名のプレーヤーを追加してください',
    nrHintTeeTime: 'ティータイムを設定してください',
    nrHintVisibility: '公開範囲を設定してください',
    // Shell pages — New Round (pickers)
    nrSearchClubsPh: 'クラブを検索...',
    nrNoClubsFound: 'クラブが見つかりません',
    nrSearchToFind: '上の検索ボックスでクラブを検索してください',
    nrShowAllClubs: n => '全 ' + n + ' クラブを表示',
    nrNoLayouts: 'このクラブにはレイアウトが設定されていません',
    nrRoutingLbl: 'ルーティング',
    nrTeeLbl: 'ティー',
    nrTeeTimeLbl: 'ティータイム',
    nrNearbyLbl: '近くのコース',
    nrRecentLbl: '最近使用',
    nrAllClubsLbl: '全クラブ',
    nrFront9Lbl: '前半9',
    nrBack9Lbl: '後半9',
    nrCurrentSelection: '現在の選択',
    nrConfirmBtn: '確定',
    nrPlayerPlaceholder: 'プレーヤー名...',
    nrAddBtn: '+ 追加',
    nrAddGuestBtn: '+ ゲスト追加',
    nrRecentCoPlayersLbl: '最近の同伴者',
    nrMyBuddiesLbl: 'マイバディ',
    nrGuestLbl: 'ゲスト',
    nrSelfLbl: '自分',
    nrNoBuddies: 'まだバディがいません。',
    nrSelectedCount: n => n + '名選択中',
    nrStartNow: '今すぐ開始',
    nrIn10Min: '10分後',
    nrIn30Min: '30分後',
    nrIn1Hr: '1時間後',
    nrCustomTime: 'カスタム',
    nrQuickSelectLbl: 'クイック選択',
    nrCustomTimeLbl: 'カスタム時間',
    nrTodayLbl: '今日',
    nrTomorrowLbl: '明日',
    nrDateLbl: '日付',
    nrTimeLbl: '時間',
    nrVisPrivateName: 'プライベート',
    nrVisFriendsName: '半公開',
    nrVisPublicName: '公開',
    nrVisPrivateDesc: '自分と選択したプレーヤーのみ閲覧可能',
    nrVisFriendsDesc: 'バディに表示、発見ページには非表示',
    nrVisPublicDesc: '他のユーザーが発見・観戦可能',
    nrSearchPlayersPh: 'プレーヤーを検索…',
    nrGuestNamePh: 'ゲスト名を入力',
    nrNoPlayersFound: 'プレーヤーが見つかりません',
    nrSelectedLbl: '選択済み',
    nrErrClubRequired: 'コースを選択してください',
    nrErrFront9Required: '前半9を選択してください',
    nrErrBack9Required: '後半9を選択してください',
    nrErrLayoutRequired: 'レイアウトを選択してください',
    nrErrRouteRequired: 'ルーティングモードを選択してください',
    nrErrPlayerRequired: '少なくとも1名のプレーヤーを追加してください',
    nrErrPlayerNoName: function(n){ return 'プレーヤー ' + n + ' の名前がありません'; },
    nrErrSnapshotEmpty: 'コースデータが利用できません — ルート設定を確認してください',
    nrErrClubNotFound: 'クラブが見つかりません',
    nrScheduledLbl: '予約済み',
    nrActiveLbl: 'プレイ中',
    // Shell pages — Rounds
    roundsTitle: 'ラウンド',
    searchPh: '検索...',
    newRoundBtn2: '+ 新規ラウンド',
    noRoundsYet: 'ラウンドなし',
    createFirstRound: '最初のラウンドを作成',
    noMatchingRounds: '該当するラウンドなし',
    playingLbl: 'プレイ中',
    plannedLbl: '予定',
    finishedLbl: '完了',
    openBtn: '開く',
    duplicateBtn: '複製',
    confirmBtn: '確認',
    deleteBtn: '削除',
    // Shell pages — Courses
    coursesTitle: 'コース',
    importBtn: 'インポート',
    newClubBtn: '+ 新規クラブ',
    searchClubsPh: 'クラブを検索...',
    allProvincesLbl: '全都道府県',
    allCitiesLbl: '全都市',
    allStatusLbl: '全ステータス',
    allSourcesLbl: '全ソース',
    operatingLbl: '営業中',
    unknownLbl: '不明',
    manualLbl: '手動',
    golfliveSourceLbl: 'GolfLive',
    importSourceLbl: 'インポート',
    clubsCountLbl: n => n + ' クラブ',
    pageLbl: 'ページ',
    perPageLbl: '/ ページ',
    archivedLbl: n => 'アーカイブ (' + n + ')',
    noClubsFound: 'クラブが見つかりません',
    adjustFilters: 'フィルターを調整してみてください。',
    addFirstClub: '最初のゴルフクラブを追加しましょう。',
    thName: '名前',
    thCity: '都市',
    thHoles: 'ホール',
    thLayouts: 'レイアウト',
    thStatus: 'ステータス',
    thUpdated: '更新日',
    thActions: '操作',
    editBtn2: '編集',
    delBtn: '削除',
    clubDetailLbl: 'クラブ詳細',
    locationLbl: '所在地',
    structureLbl: '構成',
    holesAcrossLbl: (h, n) => h + ' ホール、' + n + ' ナイン',
    layoutsLbl: n => 'レイアウト (' + n + ')',
    defaultLbl: 'デフォルト',
    teeSetsLbl: n => 'ティーセット (' + n + ')',
    aliasesLbl: '別名',
    metadataLbl: 'メタデータ',
    phoneLbl: '電話',
    webLbl: 'ウェブ',
    sourceLbl: 'ソース',
    createdLbl: '作成日',
    updatedLbl: '更新日',
    editDetailsBtn: '詳細を編集',
    clubNamePrompt: 'クラブ名：',
    deleteClubConfirm: (name) => '"' + name + '"を削除しますか？',
    deleteClubRefConfirm: (name, refs) => '"' + name + '"は ' + refs + ' ラウンドで使用中です。永久削除ではなくアーカイブされます。\n\n続行しますか？',
    // Shell pages — Settings
    stAppearance: '外観',
    stLanguage: '言語',
    stOverlay: 'オーバーレイ',
    stShotOverlay: 'ショットオーバーレイ',
    stScorecard: 'スコアカード',
    stPlayerNameNav: 'ナビにプレーヤー名表示',
    stTotal: '合計',
    stDisplay: '表示',
    stAspectRatio: 'アスペクト比',
    stOverlayStyle: 'オーバーレイスタイル',
    stBgImage: '背景画像',
    stBgOpacity: '背景の不透明度',
    stUploadBg: '背景アップロード',
    stClearBg: '背景をクリア',
    stScorecardOverlay: 'スコアカードオーバーレイ',
    stResetScPos: 'スコアカード位置をリセット',
    stShowPname: 'プレーヤー名を表示',
    stExport: 'エクスポート',
    stExportOpacity: '不透明度',
    stSafeZone: 'セーフゾーン',
    stShowSZ: 'セーフゾーンガイドを表示',
    stZoneSize: 'ゾーンサイズ',
    stCourse: 'コース',
    stCoursePh: 'コース名',
    stResetPar: '全ホール Par 4 にリセット',
    // Sidebar nav (GolfHub)
    sbHome: 'ホーム',
    sbTeeTimes: 'ティータイム',
    sbRounds: 'ラウンド',
    sbBuddies: 'バディ',
    sbTeams: 'チーム',
    sbClubs: 'クラブ',
    sbBroadcast: 'ブロードキャスト',
    sbSettings: '設定',
    sbCourseManagement: 'コース管理',
    sbRecent: '最近',
    sbSystem: 'システム',
    searchLbl: '検索',
    landingHeroSub: 'すべてのラウンドはここから始まる。',
    landingFindTeeTimes: 'ティータイムを探す',
    landingFeature1Title: 'ティータイムを探す',
    landingFeature1Desc: 'クラブを検索してティータイムを予約。',
    landingFeature2Title: 'ラウンドを始める',
    landingFeature2Desc: 'スコア記録、追跡、共有。',
    landingFeature3Title: 'ゲームを追跡',
    landingFeature3Desc: '統計、履歴、上達のヒント。',
    landingCtaTitle: '最初のラウンドを始めよう',
    teetimesPlaceholder: 'クラブのティータイムを検索・予約。近日公開。',
  },
  ko:{
    holeHero:h=>`${h}번 홀`, holeLbl:'HOLE', parLabel:p=>`파 ${p}`,
    hintMain:'클릭하여 배경 이미지 업로드 / 여기에 이미지를 드롭',
    hintSub:'미리보기 전용 — 내보내기에 포함되지 않음',
    distLabel:'핀까지', distUnit:'야드',
    totalLabel:'합계 표시',
    finalScore:'홀 스코어 (DELTA)',
    setScore:'스코어 설정',
    everyShot:'모든 샷',
    shotSection:'샷', optionsTitle:'표시 옵션',
    shotOverlay:'Shot Overlay', scorecardOverlay:'스코어카드',
    front9:'전반', back9:'후반', h18:'18H',
    topar:'To Par', gross:'Gross',
    sdTitle:'⚙️ 설정', sdBg:'배경 이미지', sdBgOp:'배경 투명도',
    sdClearBg:'🗑 배경 지우기（기본값으로 복원）',
    sdSc:'스코어카드', sdResetSc:'↺ 스코어카드 위치 초기화',
    sdSz:'안전 영역', sdSzLbl:'안전 영역 가이드 표시', sdSzSize:'영역 크기',
    sdPar:'코스 파',
    settingsLbl:' 설정',
    nrTitle:'🏌️ 새 라운드', nrClearScores:'이 라운드 스코어 초기화',
    nrResetPars:'코스 파를 4로 리셋（전 홀）',
    nrCancel:'취소', nrConfirm:'확인',
    pickerTitle:'홀 스코어', pickerCancel:'취소',
    exportTitle:'내보내기',
    exportBtn:'오버레이 PNG 생성',
    bgBtn:'배경 업로드', opaLbl:'투명도',
    nextHoleShort:'다음 홀',
    parLbl:'파',
    toeOff:'티샷', approach:'어프로치', layup:'레이업', chip:'칩샷', putt:'퍼트',
    forBirdie:'버디 퍼트', forPar:'파 퍼트', forBogey:'보기 퍼트',
    forDouble:'더블 퍼트', forTriple:'트리플+ 퍼트',
    typeTee:'TEE OFF', typeAppr:'APPROACH', typeLayup:'LAYUP', typeChip:'CHIP', typePutt:'PUTT', typeProv:'PROVISIONAL',
    typeFB:'버디', typeFP:'파', typeFBo:'보기', typePenalty:'페널티',
    provisional:'잠정구',
    pickerRows:d=>{
      if(d==='clear') return '지우기';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  알바트로스';
      if(d===-2) return '-2  이글';
      if(d===-1) return '-1  버디';
      if(d===0)  return '0  파';
      if(d===1)  return '+1  보기';
      if(d===2)  return '+2  더블보기';
      if(d===3)  return '+3  트리플보기';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`그로스: ${g}（파 ${p}  ${d>=0?'+':''}${d}）`,
    toPinLabel:'핀까지', ydsLabel:'야드',
    albatross:'알바트로스', eagle:'이글', birdie:'버디', par:'파',
    bogey:'보기', double:'더블보기', triple:'트리플',
    // UI labels
    courseLbl:'코스', playersLbl:'플레이어', scoreLbl:'스코어', shotLbl:'샷',
    shotTypeLbl:'샷 타입', purposeLbl:'목적', resultLbl:'결과', flagsLbl:'플래그', noteLbl:'메모',
    landGreen:'온 그린', landFairway:'페어웨이', landBunker:'벙커', landLight:'L.러프', landHeavy:'H.러프', landWater:'워터', landTrees:'숲',
    editBtn:'편집', prevBtn:'이전', nextBtn:'다음', exportBtn2:'내보내기…',
    singleLbl:'단일', batchLbl:'배치', allLbl:'전체',
    expShotPng:'샷 PNG', expScPng:'스코어카드 PNG',
    expHoleZip:'홀 샷 ZIP', expScZip:'스코어카드 ZIP', expAllZip:'전체 내보내기 ZIP',
    dataLbl:'데이터', expRoundExport:'라운드 내보내기', expDescRoundExport:'현재 라운드를 JSON으로 저장', expRoundImport:'라운드 가져오기', expDescRoundImport:'JSON 파일에서 라운드 복원',
    // Player manager
    pmTitle:'플레이어 관리', pmActive:'추가된 선수', pmAdd:'플레이어 추가', pmHist:'히스토리',
    pmNamePh:'이름…', pmSearchPh:'검색…',
    noPlayersYet:'플레이어 없음', noHistory:'히스토리 없음',
    playerAdded:n=>n+' 추가됨',
    // Messages
    maxPlayers:'최대 150명', playerExists:'이미 존재합니다',
    courseNamePrompt:'코스 이름:',
    scPosReset:'스코어카드 위치 초기화',
    setScoreFirst:'먼저 스코어를 설정하세요', jsZipNotLoaded:'JSZip 미로드',
    addPlayersFirst:'먼저 플레이어를 추가하세요', exportError:'내보내기 오류',
    holeCleared:'홀 초기화',
    // New round / dialogs
    clearBtn:'지우기', cancelBtn:'취소', okBtn:'확인',
    showPlayerName:'플레이어 이름 표시',
    logoText:'⛳ GOLF <span>OVERLAY</span>',
    appearanceLbl:'외관', overlayLbl:'오버레이',
    darkLbl:'다크', lightLbl:'라이트', autoLbl:'자동',
    playerLbl:'플레이어', displayLbl:'표시:',
    ratioLbl:'화면 비율', styleLbl:'오버레이 스타일',
    classicLbl:'클래식', broadcastGoldLbl:'브로드캐스트', pgaTourLbl:'PGA Tour', livGolfLbl:'LIV Golf', vividLbl:'비비드',
    bgUploadBtn:'📷 배경 업로드',
    exportLbl:'내보내기',
    zoneSizeLbl:'영역 크기',
    actionSafe:'5% 액션 세이프', titleSafe:'10% 타이틀 세이프', bothLbl:'둘 다',
    resetParBtn:'전체 Par 4로 리셋',
    newRoundBtn:'새 라운드…', skinBtn:'스킨',
    scoreDrawerTitle:(h,p)=>h+'번 홀 · 파 '+p,
    strokesTxt:g=>'스트로크: '+g, strokesEmpty:'스트로크: —',
    addStrokeBtn:'+스트로크', finishHoleBtn:'홀 완료', undoBtn:'실행 취소',
    previewBtn:'미리보기', exportPngBtn:'PNG 내보내기',
    resetHoleBtn:'홀 리셋', backBtn:'← 뒤로',
    optionsBtn:'옵션…', optionsClose:'옵션 ▴',
    yardsPh:'야드',
    // Shell pages — Buddies
    buddiesTitle: '버디',
    addBuddyBtn: '+ 버디 추가',
    searchByNamePh: '이름으로 검색...',
    favoritesLbl: '즐겨찾기',
    sortDefaultLbl: '기본',
    sortNameLbl: '이름',
    sortLastPlayedLbl: '최근 플레이',
    sortRoundsLbl: '함께한 라운드',
    loadingLbl: '로딩 중...',
    noMatchingBuddies: '일치하는 버디가 없습니다.',
    noBuddiesYet: '버디가 없습니다. 첫 번째 골프 버디를 추가하세요!',
    hcpLbl: 'HCP',
    roundsCountLbl: '라운드',
    lastPlayedLbl: '최근:',
    editBuddyTitle: '버디 편집',
    addBuddyTitle: '버디 추가',
    nameLbl: '이름',
    handicapLbl: '핸디캡',
    notesLbl: '메모',
    deleteLbl: '삭제',
    saveLbl: '저장',
    addLbl: '추가',
    nameRequiredMsg: '이름은 필수입니다',
    deleteBuddyConfirm: '이 버디를 삭제하시겠습니까?',
    failedSaveBuddy: '버디 저장 실패',
    failedDeleteBuddy: '버디 삭제 실패',
    ofLbl: '/',
    fromBuddiesLbl: '버디에서',
    addBuddiesLink: '버디 추가',
    allBuddiesAdded: '모든 버디가 이미 추가됨',
    searchUserPh: '사용자 ID로 검색...',
    linkedUserLbl: '연결된 사용자',
    clearLinkBtn: '연결 해제',
    noUserFound: '사용자를 찾을 수 없음',
    searchBtn: '검색',
    orLbl: '또는',
    searchingLbl: '검색 중...',
    invalidGolfId: 'Golf ID는 6자리 숫자여야 합니다',
    cannotAddSelf: '자신을 추가할 수 없습니다',
    userNotFound: '사용자를 찾을 수 없음',
    followBtn: '팔로우',
    alreadyBuddy: '이미 버디입니다',
    networkError: '네트워크 오류',
    // Shell pages — Profile
    notSignedIn: '로그인하지 않았습니다.',
    signInBtn: '로그인',
    accountLbl: '계정',
    defaultPlayerLbl: '기본 플레이어',
    editProfileBtn: '프로필 편집',
    savingLbl: '저장 중...',
    profileUpdated: '프로필 업데이트됨',
    networkErrorMsg: '네트워크 오류',
    signOutBtn: '로그아웃',
    yourIdLbl: 'Golf ID',
    copyIdBtn: '복사',
    copiedLbl: '복사됨!',
    changeAvatarBtn: '아바타 변경',
    removeAvatarBtn: '제거',
    // Shell pages — Home
    welcomeBack: n => '다시 오셨군요, ' + n,
    currentRoundLbl: '현재 라운드',
    noActiveRound: '진행 중인 라운드 없음',
    recentRoundsLbl: '최근 라운드',
    legacyDataTitle: '레거시 데이터 감지됨',
    legacyDataText: '이 라운드들은 계정 시스템 도입 전에 생성되었습니다. 로컬에 저장되어 있으며 동기화되지 않습니다.',
    clearAllBtn: '모두 지우기',
    clearLegacyConfirm: '로컬에 저장된 모든 레거시 라운드를 영구적으로 삭제합니다. 계속하시겠습니까?',
    quickActionsLbl: '빠른 작업',
    newRoundLbl: '새 라운드',
    importLbl: '가져오기',
    allRoundsLbl: '전체 라운드',
    managementLbl: '관리',
    guestHeroTitle: 'GolfHub',
    guestHeroSubtitle: '전문 골프 이벤트 관리 및 라이브 오버레이 시스템.',
    guestSignIn: '로그인',
    guestCreateAccount: '계정 만들기',
    featureCourseTitle: '코스 관리',
    featureCourseDesc: '코스 구조, 티 세트, 홀별 세부 정보를 포함한 골프 클럽 관리.',
    featureRoundTitle: '라운드 기록',
    featureRoundDesc: '실시간 리더보드와 홀별 통계를 포함한 스코어 기록.',
    featureOverlayTitle: '라이브 오버레이',
    featureOverlayDesc: '스트리밍 및 이벤트 중계를 위한 방송 품질 오버레이.',
    continueRoundBtn: '라운드 계속',
    holesLbl: '홀',
    progressLbl: '진행률',
    // Shell pages — Auth guard
    authGuardTitle: '로그인이 필요합니다',
    authGuardText: '이 기능은 로그인된 계정이 필요합니다.',
    createAccountBtn: '계정 만들기',
    // Shell pages — New Round (main page)
    nrSelectCourse: '코스 선택',
    nrSelectPlayers: '플레이어 선택',
    nrPersonCount: n => n + '명',
    nrNowLbl: '지금',
    nrVisibilityLbl: '공개 범위',
    nrVisPrivateLabel: '비공개: 나와 플레이어만',
    nrVisFriendsLabel: '반공개: 버디에게 표시',
    nrVisPublicLabel: '공개: 발견 가능',
    nrCreateBtn: '시작',
    nrHintCourse: '코스를 선택하세요',
    nrHintRouting: '라우팅을 선택하세요',
    nrHintFront9: '전반 9홀을 선택하세요',
    nrHintBack9: '후반 9홀을 선택하세요',
    nrHintPlayer: '최소 한 명의 플레이어를 추가하세요',
    nrHintTeeTime: '티 타임을 설정하세요',
    nrHintVisibility: '공개 범위를 설정하세요',
    // Shell pages — New Round (pickers)
    nrSearchClubsPh: '클럽 검색...',
    nrNoClubsFound: '클럽을 찾을 수 없음',
    nrSearchToFind: '위의 검색창에서 클럽을 검색하세요',
    nrShowAllClubs: n => '전체 ' + n + '개 클럽 보기',
    nrNoLayouts: '이 클럽에 설정된 레이아웃이 없습니다',
    nrRoutingLbl: '라우팅',
    nrTeeLbl: '티',
    nrTeeTimeLbl: '티 타임',
    nrNearbyLbl: '근처 코스',
    nrRecentLbl: '최근 사용',
    nrAllClubsLbl: '전체 클럽',
    nrFront9Lbl: '전반 9홀',
    nrBack9Lbl: '후반 9홀',
    nrCurrentSelection: '현재 선택',
    nrConfirmBtn: '확인',
    nrPlayerPlaceholder: '플레이어 이름...',
    nrAddBtn: '+ 추가',
    nrAddGuestBtn: '+ 게스트 추가',
    nrRecentCoPlayersLbl: '최근 동반자',
    nrMyBuddiesLbl: '내 버디',
    nrGuestLbl: '게스트',
    nrSelfLbl: '본인',
    nrNoBuddies: '아직 버디가 없습니다.',
    nrSelectedCount: n => n + '명 선택됨',
    nrStartNow: '바로 시작',
    nrIn10Min: '10분 후',
    nrIn30Min: '30분 후',
    nrIn1Hr: '1시간 후',
    nrCustomTime: '직접 설정',
    nrQuickSelectLbl: '빠른 선택',
    nrCustomTimeLbl: '직접 설정',
    nrTodayLbl: '오늘',
    nrTomorrowLbl: '내일',
    nrDateLbl: '날짜',
    nrTimeLbl: '시간',
    nrVisPrivateName: '비공개',
    nrVisFriendsName: '반공개',
    nrVisPublicName: '공개',
    nrVisPrivateDesc: '나와 선택한 플레이어만 볼 수 있음',
    nrVisFriendsDesc: '버디에게 표시, 발견 페이지에는 비표시',
    nrVisPublicDesc: '다른 사용자가 발견하고 관전 가능',
    nrSearchPlayersPh: '플레이어 검색…',
    nrGuestNamePh: '게스트 이름 입력',
    nrNoPlayersFound: '플레이어를 찾을 수 없음',
    nrSelectedLbl: '선택됨',
    nrErrClubRequired: '코스를 선택하세요',
    nrErrFront9Required: '전반 9홀을 선택하세요',
    nrErrBack9Required: '후반 9홀을 선택하세요',
    nrErrLayoutRequired: '레이아웃을 선택하세요',
    nrErrRouteRequired: '라우팅 모드를 선택하세요',
    nrErrPlayerRequired: '최소 한 명의 플레이어를 추가하세요',
    nrErrPlayerNoName: function(n){ return '플레이어 ' + n + '의 이름이 없습니다'; },
    nrErrSnapshotEmpty: '코스 데이터를 사용할 수 없습니다 — 경로 설정을 확인하세요',
    nrErrClubNotFound: '클럽을 찾을 수 없습니다',
    nrScheduledLbl: '예약됨',
    nrActiveLbl: '진행 중',
    // Shell pages — Rounds
    roundsTitle: '라운드',
    searchPh: '검색...',
    newRoundBtn2: '+ 새 라운드',
    noRoundsYet: '라운드 없음',
    createFirstRound: '첫 번째 라운드를 만드세요',
    noMatchingRounds: '일치하는 라운드 없음',
    playingLbl: '진행 중',
    plannedLbl: '예정',
    finishedLbl: '완료',
    openBtn: '열기',
    duplicateBtn: '복제',
    confirmBtn: '확인',
    deleteBtn: '삭제',
    // Shell pages — Courses
    coursesTitle: '코스',
    importBtn: '가져오기',
    newClubBtn: '+ 새 클럽',
    searchClubsPh: '클럽 검색...',
    allProvincesLbl: '전체 도',
    allCitiesLbl: '전체 시',
    allStatusLbl: '전체 상태',
    allSourcesLbl: '전체 소스',
    operatingLbl: '운영 중',
    unknownLbl: '미확인',
    manualLbl: '수동',
    golfliveSourceLbl: 'GolfLive',
    importSourceLbl: '가져오기',
    clubsCountLbl: n => n + '개 클럽',
    pageLbl: '페이지',
    perPageLbl: '/ 페이지',
    archivedLbl: n => '보관됨 (' + n + ')',
    noClubsFound: '클럽을 찾을 수 없음',
    adjustFilters: '필터를 조정해 보세요.',
    addFirstClub: '첫 번째 골프 클럽을 추가하세요.',
    thName: '이름',
    thCity: '도시',
    thHoles: '홀',
    thLayouts: '레이아웃',
    thStatus: '상태',
    thUpdated: '업데이트',
    thActions: '작업',
    editBtn2: '편집',
    delBtn: '삭제',
    clubDetailLbl: '클럽 상세',
    locationLbl: '위치',
    structureLbl: '구성',
    holesAcrossLbl: (h, n) => h + '홀, ' + n + '개 나인',
    layoutsLbl: n => '레이아웃 (' + n + ')',
    defaultLbl: '기본',
    teeSetsLbl: n => '티 세트 (' + n + ')',
    aliasesLbl: '별명',
    metadataLbl: '메타데이터',
    phoneLbl: '전화',
    webLbl: '웹',
    sourceLbl: '소스',
    createdLbl: '생성일',
    updatedLbl: '업데이트',
    editDetailsBtn: '상세 편집',
    clubNamePrompt: '클럽 이름:',
    deleteClubConfirm: (name) => '"' + name + '"을(를) 삭제하시겠습니까?',
    deleteClubRefConfirm: (name, refs) => '"' + name + '"이(가) ' + refs + '개 라운드에서 사용 중입니다. 영구 삭제 대신 보관됩니다.\n\n계속하시겠습니까?',
    // Shell pages — Settings
    stAppearance: '외관',
    stLanguage: '언어',
    stOverlay: '오버레이',
    stShotOverlay: '샷 오버레이',
    stScorecard: '스코어카드',
    stPlayerNameNav: '네비에 플레이어 이름 표시',
    stTotal: '합계',
    stDisplay: '표시',
    stAspectRatio: '화면 비율',
    stOverlayStyle: '오버레이 스타일',
    stBgImage: '배경 이미지',
    stBgOpacity: '배경 투명도',
    stUploadBg: '배경 업로드',
    stClearBg: '배경 지우기',
    stScorecardOverlay: '스코어카드 오버레이',
    stResetScPos: '스코어카드 위치 초기화',
    stShowPname: '플레이어 이름 표시',
    stExport: '내보내기',
    stExportOpacity: '투명도',
    stSafeZone: '안전 영역',
    stShowSZ: '안전 영역 가이드 표시',
    stZoneSize: '영역 크기',
    stCourse: '코스',
    stCoursePh: '코스 이름',
    stResetPar: '전체 Par 4로 리셋',
    // Sidebar nav (GolfHub)
    sbHome: '홈',
    sbTeeTimes: '티타임',
    sbRounds: '라운드',
    sbBuddies: '버디',
    sbTeams: '팀',
    sbClubs: '클럽',
    sbBroadcast: '방송',
    sbSettings: '설정',
    sbCourseManagement: '코스 관리',
    sbRecent: '최근',
    sbSystem: '시스템',
    searchLbl: '검색',
    landingHeroSub: '모든 라운드는 여기서 시작됩니다.',
    landingFindTeeTimes: '티타임 찾기',
    landingFeature1Title: '티타임 찾기',
    landingFeature1Desc: '클럽을 검색하고 티타임을 예약하세요.',
    landingFeature2Title: '라운드 시작',
    landingFeature2Desc: '스코어 기록, 추적, 공유.',
    landingFeature3Title: '게임 추적',
    landingFeature3Desc: '통계, 기록, 향상 인사이트.',
    landingCtaTitle: '첫 라운드를 시작하세요',
    teetimesPlaceholder: '클럽의 티타임을 검색하고 예약하세요. 곧 출시.',
  },
  es:{
    holeHero:h=>`HOYO ${h}`, holeLbl:'HOYO', parLabel:p=>`PAR ${p}`,
    hintMain:'Clic para subir fondo / Soltar imagen aquí',
    hintSub:'Solo vista previa — no se incluye en la exportación',
    distLabel:'Al hoyo', distUnit:'yds',
    totalLabel:'MOSTRAR TOTAL',
    finalScore:'PUNTUACIÓN FINAL (DELTA)',
    setScore:'ESTABLECER PUNT.',
    everyShot:'CADA GOLPE',
    shotSection:'GOLPE', optionsTitle:'OPCIONES DE PANTALLA',
    shotOverlay:'Shot Overlay', scorecardOverlay:'Tarjeta',
    front9:'F9', back9:'B9', h18:'18H',
    topar:'A par', gross:'Brutos',
    sdTitle:'⚙️ Ajustes', sdBg:'Imagen de fondo', sdBgOp:'Opacidad del fondo',
    sdClearBg:'🗑 Borrar fondo (restaurar por defecto)',
    sdSc:'Tarjeta de puntuación', sdResetSc:'↺ Restablecer posición',
    sdSz:'Zona segura', sdSzLbl:'Mostrar guías de zona segura', sdSzSize:'Tamaño de zona',
    sdPar:'Par del campo',
    settingsLbl:' Ajustes',
    nrTitle:'🏌️ Nueva ronda', nrClearScores:'Borrar puntuaciones de esta ronda',
    nrResetPars:'Restablecer par del campo a 4 (todos los hoyos)',
    nrCancel:'Cancelar', nrConfirm:'Confirmar',
    pickerTitle:'Puntuación final', pickerCancel:'Cancelar',
    exportTitle:'EXPORTAR',
    exportBtn:'Crear PNG del overlay',
    bgBtn:'Subir fondo', opaLbl:'Opacidad',
    nextHoleShort:'SIGUIENTE',
    parLbl:'Par',
    toeOff:'SALIDA', approach:'APROXIMACIÓN', layup:'LAYUP', chip:'CHIP', putt:'PUTT',
    forBirdie:'P/ BIRDIE', forPar:'P/ PAR', forBogey:'P/ BOGEY',
    forDouble:'P/ DOBLE', forTriple:'P/ TRIPLE',
    typeTee:'SALIDA', typeAppr:'APROX', typeLayup:'LAYUP', typeChip:'CHIP', typePutt:'PUTT', typeProv:'PROVISIONAL',
    typeFB:'P/BIRDIE', typeFP:'P/PAR', typeFBo:'P/BOGEY', typePenalty:'PENALTI',
    provisional:'PROVISIONAL',
    pickerRows:d=>{
      if(d==='clear') return 'BORRAR';
      if(d<=-4) return d+'';
      if(d===-3) return '-3  ALBATROS';
      if(d===-2) return '-2  ÁGUILA';
      if(d===-1) return '-1  BIRDIE';
      if(d===0)  return '0  PAR';
      if(d===1)  return '+1  BOGEY';
      if(d===2)  return '+2  DOBLE';
      if(d===3)  return '+3  TRIPLE';
      return (d>0?'+':'')+d;
    },
    grossDisp:(g,p,d)=>`Brutos: ${g}  (Par ${p}  ${d>=0?'+':''}${d})`,
    toPinLabel:'AL HOYO', ydsLabel:'YDS',
    albatross:'ALBATROS', eagle:'ÁGUILA', birdie:'BIRDIE', par:'PAR',
    bogey:'BOGEY', double:'DOBLE', triple:'TRIPLE',
    // UI labels
    courseLbl:'Campo', playersLbl:'Jugadores', scoreLbl:'Puntuación', shotLbl:'GOLPE',
    shotTypeLbl:'TIPO DE GOLPE', purposeLbl:'PROPÓSITO', resultLbl:'RESULTADO', flagsLbl:'BANDERAS', noteLbl:'NOTA',
    landGreen:'EN GREEN', landFairway:'FAIRWAY', landBunker:'BÚNKER', landLight:'L.ROUGH', landHeavy:'H.ROUGH', landWater:'AGUA', landTrees:'ÁRBOLES',
    editBtn:'EDITAR', prevBtn:'ANT', nextBtn:'SIG', exportBtn2:'Exportar…',
    singleLbl:'Individual', batchLbl:'Lote', allLbl:'Todo',
    expShotPng:'Golpe PNG', expScPng:'Tarjeta PNG',
    expHoleZip:'Golpes del hoyo ZIP', expScZip:'Tarjeta ZIP', expAllZip:'Exportar todo ZIP',
    dataLbl:'Datos', expRoundExport:'Exportar Ronda', expDescRoundExport:'Guardar ronda actual como JSON', expRoundImport:'Importar Ronda', expDescRoundImport:'Restaurar ronda desde archivo JSON',
    // Player manager
    pmTitle:'Jugadores', pmActive:'Jugadores activos', pmAdd:'Añadir jugador', pmHist:'Historial',
    pmNamePh:'Nombre…', pmSearchPh:'Buscar…',
    noPlayersYet:'Sin jugadores', noHistory:'Sin historial',
    playerAdded:n=>n+' añadido',
    // Messages
    maxPlayers:'Máx. 150 jugadores', playerExists:'Jugador ya existe',
    courseNamePrompt:'Nombre del campo:',
    scPosReset:'Posición de tarjeta restablecida',
    setScoreFirst:'Primero establezca el puntaje', jsZipNotLoaded:'JSZip no cargado',
    addPlayersFirst:'Primero añada jugadores', exportError:'Error de exportación',
    holeCleared:'Hoyo limpiado',
    // New round / dialogs
    clearBtn:'Borrar', cancelBtn:'Cancelar', okBtn:'OK',
    showPlayerName:'Mostrar nombre del jugador',
    logoText:'⛳ GOLF <span>OVERLAY</span>',
    appearanceLbl:'Apariencia', overlayLbl:'Superposición',
    darkLbl:'Oscuro', lightLbl:'Claro', autoLbl:'Auto',
    playerLbl:'Jugador', displayLbl:'Mostrar:',
    ratioLbl:'Relación de aspecto', styleLbl:'Estilo de overlay',
    classicLbl:'Clásico', broadcastGoldLbl:'Broadcast Gold', pgaTourLbl:'PGA Tour', livGolfLbl:'LIV Golf', vividLbl:'Vibrante',
    bgUploadBtn:'📷 Subir fondo',
    exportLbl:'Exportar',
    zoneSizeLbl:'Tamaño de zona',
    actionSafe:'5% Acción segura', titleSafe:'10% Título seguro', bothLbl:'Ambos',
    resetParBtn:'Restablecer todo a Par 4',
    newRoundBtn:'Nuevo…', skinBtn:'Tema',
    scoreDrawerTitle:(h,p)=>'HOYO '+h+' · Par '+p,
    strokesTxt:g=>'Golpes: '+g, strokesEmpty:'Golpes: —',
    addStrokeBtn:'+Golpe', finishHoleBtn:'Terminar hoyo', undoBtn:'Deshacer',
    previewBtn:'Vista previa', exportPngBtn:'Exportar PNG',
    resetHoleBtn:'Reiniciar hoyo', backBtn:'← Volver',
    optionsBtn:'Opciones…', optionsClose:'Opciones ▴',
    yardsPh:'yds',
    // Shell pages — Buddies
    buddiesTitle: 'Compañeros',
    addBuddyBtn: '+ Añadir compañero',
    searchByNamePh: 'Buscar por nombre...',
    favoritesLbl: 'Favoritos',
    sortDefaultLbl: 'Predeterminado',
    sortNameLbl: 'Nombre',
    sortLastPlayedLbl: 'Último juego',
    sortRoundsLbl: 'Rondas juntos',
    loadingLbl: 'Cargando...',
    noMatchingBuddies: 'No se encontraron compañeros.',
    noBuddiesYet: 'Sin compañeros aún. ¡Añade tu primer compañero de golf!',
    hcpLbl: 'HCP',
    roundsCountLbl: 'rondas',
    lastPlayedLbl: 'Último:',
    editBuddyTitle: 'Editar compañero',
    addBuddyTitle: 'Añadir compañero',
    nameLbl: 'Nombre',
    handicapLbl: 'Hándicap',
    notesLbl: 'Notas',
    deleteLbl: 'Eliminar',
    saveLbl: 'Guardar',
    addLbl: 'Añadir',
    nameRequiredMsg: 'El nombre es obligatorio',
    deleteBuddyConfirm: '¿Eliminar este compañero?',
    failedSaveBuddy: 'Error al guardar compañero',
    failedDeleteBuddy: 'Error al eliminar compañero',
    ofLbl: 'de',
    fromBuddiesLbl: 'De compañeros',
    addBuddiesLink: 'Añadir compañeros',
    allBuddiesAdded: 'Todos los compañeros ya añadidos',
    searchUserPh: 'Buscar por ID de usuario...',
    linkedUserLbl: 'Usuario vinculado',
    clearLinkBtn: 'Borrar vínculo',
    noUserFound: 'Usuario no encontrado',
    searchBtn: 'Buscar',
    orLbl: 'o',
    searchingLbl: 'Buscando...',
    invalidGolfId: 'Golf ID debe ser exactamente 6 dígitos',
    cannotAddSelf: 'No puedes añadirte a ti mismo',
    userNotFound: 'Usuario no encontrado',
    followBtn: 'Seguir',
    alreadyBuddy: 'Ya está en tus compañeros',
    networkError: 'Error de red',
    // Shell pages — Profile
    notSignedIn: 'No ha iniciado sesión.',
    signInBtn: 'Iniciar sesión',
    accountLbl: 'Cuenta',
    defaultPlayerLbl: 'Jugador predeterminado',
    editProfileBtn: 'Editar perfil',
    savingLbl: 'Guardando...',
    profileUpdated: 'Perfil actualizado',
    networkErrorMsg: 'Error de red',
    signOutBtn: 'Cerrar sesión',
    yourIdLbl: 'Golf ID',
    copyIdBtn: 'Copiar',
    copiedLbl: '¡Copiado!',
    changeAvatarBtn: 'Cambiar avatar',
    removeAvatarBtn: 'Eliminar',
    // Shell pages — Home
    welcomeBack: n => 'Bienvenido de nuevo, ' + n,
    currentRoundLbl: 'Ronda actual',
    noActiveRound: 'Sin ronda activa',
    recentRoundsLbl: 'Rondas recientes',
    legacyDataTitle: 'Datos heredados detectados',
    legacyDataText: 'Estas rondas fueron creadas antes del sistema de cuentas. Están almacenadas localmente y no sincronizadas.',
    clearAllBtn: 'Borrar todo',
    clearLegacyConfirm: 'Esto eliminará permanentemente todas las rondas heredadas almacenadas localmente. ¿Continuar?',
    quickActionsLbl: 'Acciones rápidas',
    newRoundLbl: 'Nueva ronda',
    importLbl: 'Importar',
    allRoundsLbl: 'Todas las rondas',
    managementLbl: 'Gestión',
    guestHeroTitle: 'GolfHub',
    guestHeroSubtitle: 'Sistema profesional de gestión de eventos de golf y superposición en vivo.',
    guestSignIn: 'Iniciar sesión',
    guestCreateAccount: 'Crear cuenta',
    featureCourseTitle: 'Gestión de campos',
    featureCourseDesc: 'Gestiona clubes de golf con estructura completa, tees y detalles hoyo por hoyo.',
    featureRoundTitle: 'Seguimiento de rondas',
    featureRoundDesc: 'Registro de puntuación con tabla de posiciones en tiempo real y estadísticas por hoyo.',
    featureOverlayTitle: 'Superposición en vivo',
    featureOverlayDesc: 'Superposiciones de calidad de transmisión para streaming y cobertura de eventos.',
    continueRoundBtn: 'Continuar ronda',
    holesLbl: 'Hoyos',
    progressLbl: 'Progreso',
    // Shell pages — Auth guard
    authGuardTitle: 'Inicie sesión para continuar',
    authGuardText: 'Esta función requiere una cuenta con sesión iniciada.',
    createAccountBtn: 'Crear cuenta',
    // Shell pages — New Round (main page)
    nrSelectCourse: 'Seleccionar campo',
    nrSelectPlayers: 'Seleccionar jugadores',
    nrPersonCount: n => n + ' jugadores',
    nrNowLbl: 'Ahora',
    nrVisibilityLbl: 'Visibilidad',
    nrVisPrivateLabel: 'Privado: solo tú y jugadores',
    nrVisFriendsLabel: 'Semi-público: compañeros pueden ver',
    nrVisPublicLabel: 'Público: descubrible',
    nrCreateBtn: 'Iniciar',
    nrHintCourse: 'Seleccione un campo',
    nrHintRouting: 'Seleccione una ruta',
    nrHintFront9: 'Seleccione los primeros 9',
    nrHintBack9: 'Seleccione los últimos 9',
    nrHintPlayer: 'Añada al menos un jugador',
    nrHintTeeTime: 'Establecer hora de salida',
    nrHintVisibility: 'Establecer visibilidad',
    // Shell pages — New Round (pickers)
    nrSearchClubsPh: 'Buscar clubes...',
    nrNoClubsFound: 'No se encontraron clubes',
    nrSearchToFind: 'Usa el buscador de arriba para encontrar un club',
    nrShowAllClubs: n => 'Mostrar los ' + n + ' clubes',
    nrNoLayouts: 'No hay layouts configurados para este club',
    nrRoutingLbl: 'Ruta',
    nrTeeLbl: 'Tee',
    nrTeeTimeLbl: 'Hora de salida',
    nrNearbyLbl: 'Campos cercanos',
    nrRecentLbl: 'Recientes',
    nrAllClubsLbl: 'Todos los clubes',
    nrFront9Lbl: 'Primeros 9',
    nrBack9Lbl: 'Últimos 9',
    nrCurrentSelection: 'Selección actual',
    nrConfirmBtn: 'Confirmar',
    nrPlayerPlaceholder: 'Nombre del jugador...',
    nrAddBtn: '+ Añadir',
    nrAddGuestBtn: '+ Añadir invitado',
    nrRecentCoPlayersLbl: 'Compañeros recientes',
    nrMyBuddiesLbl: 'Mis compañeros',
    nrGuestLbl: 'Invitado',
    nrSelfLbl: 'Tú',
    nrNoBuddies: 'Sin compañeros aún.',
    nrSelectedCount: n => n + ' seleccionados',
    nrStartNow: 'Comenzar ahora',
    nrIn10Min: 'En 10 min',
    nrIn30Min: 'En 30 min',
    nrIn1Hr: 'En 1 hora',
    nrCustomTime: 'Personalizado',
    nrQuickSelectLbl: 'Selección rápida',
    nrCustomTimeLbl: 'Hora personalizada',
    nrTodayLbl: 'Hoy',
    nrTomorrowLbl: 'Mañana',
    nrDateLbl: 'Fecha',
    nrTimeLbl: 'Hora',
    nrVisPrivateName: 'Privado',
    nrVisFriendsName: 'Semi-público',
    nrVisPublicName: 'Público',
    nrVisPrivateDesc: 'Solo tú y los jugadores seleccionados pueden ver esta ronda',
    nrVisFriendsDesc: 'Tus compañeros pueden ver, no aparece en la página de descubrimiento',
    nrVisPublicDesc: 'Otros usuarios pueden descubrir y observar esta ronda',
    nrSearchPlayersPh: 'Buscar jugadores…',
    nrGuestNamePh: 'Nombre del invitado',
    nrNoPlayersFound: 'No se encontraron jugadores',
    nrSelectedLbl: 'Seleccionados',
    nrErrClubRequired: 'Por favor seleccione un campo',
    nrErrFront9Required: 'Por favor seleccione los primeros 9',
    nrErrBack9Required: 'Por favor seleccione los últimos 9',
    nrErrLayoutRequired: 'Por favor seleccione un layout',
    nrErrRouteRequired: 'Por favor seleccione un modo de ruta',
    nrErrPlayerRequired: 'Se requiere al menos un jugador',
    nrErrPlayerNoName: function(n){ return 'Jugador ' + n + ' no tiene nombre'; },
    nrErrSnapshotEmpty: 'Datos del campo no disponibles — verifique la configuración de ruta',
    nrErrClubNotFound: 'Club no encontrado',
    nrScheduledLbl: 'Programado',
    nrActiveLbl: 'Activo',
    // Shell pages — Rounds
    roundsTitle: 'Rondas',
    searchPh: 'Buscar...',
    newRoundBtn2: '+ Nueva ronda',
    noRoundsYet: 'Sin rondas aún',
    createFirstRound: 'Crea tu primera ronda',
    noMatchingRounds: 'No hay rondas coincidentes',
    playingLbl: 'En juego',
    plannedLbl: 'Planificada',
    finishedLbl: 'Terminada',
    openBtn: 'Abrir',
    duplicateBtn: 'Duplicar',
    confirmBtn: 'Confirmar',
    deleteBtn: 'Eliminar',
    // Shell pages — Courses
    coursesTitle: 'Campos',
    importBtn: 'Importar',
    newClubBtn: '+ Nuevo club',
    searchClubsPh: 'Buscar clubes...',
    allProvincesLbl: 'Todas las provincias',
    allCitiesLbl: 'Todas las ciudades',
    allStatusLbl: 'Todos los estados',
    allSourcesLbl: 'Todas las fuentes',
    operatingLbl: 'Operando',
    unknownLbl: 'Desconocido',
    manualLbl: 'Manual',
    golfliveSourceLbl: 'GolfLive',
    importSourceLbl: 'Importación',
    clubsCountLbl: n => n + ' club' + (n !== 1 ? 'es' : ''),
    pageLbl: 'Página',
    perPageLbl: '/ página',
    archivedLbl: n => 'Archivados (' + n + ')',
    noClubsFound: 'No se encontraron clubes',
    adjustFilters: 'Intenta ajustar los filtros.',
    addFirstClub: 'Añade tu primer club de golf para comenzar.',
    thName: 'Nombre',
    thCity: 'Ciudad',
    thHoles: 'Hoyos',
    thLayouts: 'Layouts',
    thStatus: 'Estado',
    thUpdated: 'Actualizado',
    thActions: 'Acciones',
    editBtn2: 'Editar',
    delBtn: 'Elim.',
    clubDetailLbl: 'Detalle del club',
    locationLbl: 'Ubicación',
    structureLbl: 'Estructura',
    holesAcrossLbl: (h, n) => h + ' hoyos en ' + n + ' nueve(s)',
    layoutsLbl: n => 'Layouts (' + n + ')',
    defaultLbl: 'Predeterminado',
    teeSetsLbl: n => 'Tees (' + n + ')',
    aliasesLbl: 'Alias',
    metadataLbl: 'Metadatos',
    phoneLbl: 'Teléfono',
    webLbl: 'Web',
    sourceLbl: 'Fuente',
    createdLbl: 'Creado',
    updatedLbl: 'Actualizado',
    editDetailsBtn: 'Editar detalles',
    clubNamePrompt: 'Nombre del club:',
    deleteClubConfirm: (name) => '¿Está seguro de eliminar "' + name + '"?',
    deleteClubRefConfirm: (name, refs) => '"' + name + '" es referenciado por ' + refs + ' ronda(s). Se archivará en lugar de eliminarse permanentemente.\n\n¿Continuar?',
    // Shell pages — Settings
    stAppearance: 'Apariencia',
    stLanguage: 'Idioma',
    stOverlay: 'Superposición',
    stShotOverlay: 'Superposición de golpe',
    stScorecard: 'Tarjeta de puntuación',
    stPlayerNameNav: 'Nombre en navegación',
    stTotal: 'Total',
    stDisplay: 'Mostrar',
    stAspectRatio: 'Relación de aspecto',
    stOverlayStyle: 'Estilo de superposición',
    stBgImage: 'Imagen de fondo',
    stBgOpacity: 'Opacidad del fondo',
    stUploadBg: 'Subir fondo',
    stClearBg: 'Borrar fondo',
    stScorecardOverlay: 'Superposición de tarjeta',
    stResetScPos: 'Restablecer posición de tarjeta',
    stShowPname: 'Mostrar nombre del jugador',
    stExport: 'Exportar',
    stExportOpacity: 'Opacidad',
    stSafeZone: 'Zona segura',
    stShowSZ: 'Mostrar guías de zona segura',
    stZoneSize: 'Tamaño de zona',
    stCourse: 'Campo',
    stCoursePh: 'CAMPO',
    stResetPar: 'Restablecer todo a Par 4',
    // Sidebar nav (GolfHub)
    sbHome: 'Inicio',
    sbTeeTimes: 'Horarios',
    sbRounds: 'Rondas',
    sbBuddies: 'Compañeros',
    sbTeams: 'Equipos',
    sbClubs: 'Clubes',
    sbBroadcast: 'Transmisión',
    sbSettings: 'Ajustes',
    sbCourseManagement: 'Gestión de campos',
    sbRecent: 'Recientes',
    sbSystem: 'Sistema',
    searchLbl: 'Buscar',
    landingHeroSub: 'Donde cada ronda comienza.',
    landingFindTeeTimes: 'Buscar horarios',
    landingFeature1Title: 'Buscar horarios',
    landingFeature1Desc: 'Explora clubes y reserva tu horario.',
    landingFeature2Title: 'Iniciar una ronda',
    landingFeature2Desc: 'Puntaje, seguimiento y compartir.',
    landingFeature3Title: 'Sigue tu juego',
    landingFeature3Desc: 'Estadísticas, historial y mejoras.',
    landingCtaTitle: 'Comienza tu primera ronda',
    teetimesPlaceholder: 'Busca y reserva horarios de salida. Próximamente.',
  }
};

let LANG = 'en';
function T(key,...args){
  const s=STRINGS[LANG], v=s[key];
  if(typeof v==='function') return v(...args);
  return v??key;
}

const LANG_LABELS={en:'🇺🇸 EN',zh:'🇨🇳 中文',ja:'🇯🇵 日本語',ko:'🇰🇷 한국어',es:'🇪🇸 ES'};

// ── UI Theme (dark/light/auto) ──
function applyUITheme(mode){
  const prefer=mode==='auto'?(window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'):mode;
  document.documentElement.classList.toggle('light',prefer==='light');
}
function setUITheme(mode){
  S.uiTheme=mode; D.ws().uiTheme=mode;
  applyUITheme(mode);
  document.querySelectorAll('[data-ui-theme]').forEach(b=>b.classList.toggle('active',b.dataset.uiTheme===mode));
  scheduleSave();
}
window.matchMedia('(prefers-color-scheme:light)').addEventListener('change',()=>{
  if(S.uiTheme==='auto') applyUITheme('auto');
});

function setLang(l){
  LANG=l; S.lang=l; D.ws().lang=l;
  const btn=document.getElementById('btn-lang');
  if(btn) btn.textContent=LANG_LABELS[l]||l;
  document.querySelectorAll('.lang-opt').forEach(b=>b.classList.toggle('active',b.dataset.lang===l));
  const menu=document.getElementById('lang-menu');
  if(menu) menu.classList.remove('open');
  applyLang(); render(); scheduleSave();
}

// toggleLangMenu moved to Shell.toggleLangMenu()
function toggleLangMenu(){}
document.addEventListener('click',e=>{
  const wrap=document.getElementById('lang-wrap');
  const menu=document.getElementById('lang-menu');
  if(wrap&&menu&&!wrap.contains(e.target)) menu.classList.remove('open');
});

function applyLang(){
  const g=id=>document.getElementById(id);
  const logoEl=document.getElementById('logo-text');
  if(logoEl) logoEl.innerHTML=T('logoText');
  g('hint-main').textContent=T('hintMain');
  g('hint-sub').textContent=T('hintSub');
  const _es=g('every-shot-title'); if(_es) _es.textContent=T('everyShot');
  const _distLbl=g('dist-lbl'); if(_distLbl) _distLbl.textContent=T('distLabel')+':';
  const _distUnit=g('dist-unit'); if(_distUnit) _distUnit.textContent=T('distUnit');
  g('total-lbl').textContent=T('totalLabel');
  const _dst=g('delta-section-title'); if(_dst) _dst.textContent=T('finalScore');
  const _sst=g('shot-section-title'); if(_sst) _sst.textContent=T('shotSection');
  if(g('options-title')) g('options-title').textContent=T('optionsTitle');
  g('lbl-shot').textContent=T('shotOverlay');
  g('lbl-score').textContent=T('scorecardOverlay');
  g('mode-tp').textContent=T('topar');
  g('mode-gr').textContent=T('gross');
  g('sd-title').textContent=T('sdTitle');
  g('sd-bg-title').textContent=T('sdBg');
  g('sd-opacity-lbl').textContent=T('sdBgOp');
  g('sd-clear-bg').textContent=T('sdClearBg');
  g('sd-sc-title').textContent=T('sdSc');
  g('sd-reset-sc').textContent=T('sdResetSc');
  g('sd-sz-title').textContent=T('sdSz');
  g('sd-sz-lbl').textContent=T('sdSzLbl');
  g('sd-par-title').textContent=T('sdPar');
  g('nr-title').textContent=T('nrTitle');
  g('nr-clear-scores').textContent=T('nrClearScores');
  g('nr-reset-pars').textContent=T('nrResetPars');
  g('nr-cancel').textContent=T('nrCancel');
  g('nr-confirm').textContent=T('nrConfirm');
  g('picker-title').textContent=T('pickerTitle');
  g('picker-cancel').textContent=T('pickerCancel');
  const _expTitle=g('export-title'); if(_expTitle) _expTitle.textContent=T('exportTitle');
  const _expBtnTxt=g('export-btn-txt'); if(_expBtnTxt) _expBtnTxt.textContent=T('exportBtn');
  g('lbl-opa').textContent=T('opaLbl');
  g('settings-lbl').textContent=T('settingsLbl');
  const nhil=g('nhi-lbl'); if(nhil) nhil.textContent=T('nextHoleShort');
  // Scorecard range labels — dynamic based on hole count
  updateScoreRangeLabels();
  // Export modal labels
  const lbHS=g('lbl-exp-hole-seq'); if(lbHS) lbHS.textContent=T('expHoleZip');
  const lbSS=g('lbl-exp-sc-seq'); if(lbSS) lbSS.textContent=T('expScZip');
  const lbES=g('lbl-exp-shot'); if(lbES) lbES.textContent=T('expShotPng');
  const lbESc=g('lbl-exp-sc'); if(lbESc) lbESc.textContent=T('expScPng');
  const expSingleLbl=g('exp-modal-lbl-single'); if(expSingleLbl) expSingleLbl.textContent=T('singleLbl');
  const expBatchLbl=g('exp-modal-lbl-batch'); if(expBatchLbl) expBatchLbl.textContent=T('batchLbl');
  const expAllLbl=g('exp-modal-lbl-all'); if(expAllLbl) expAllLbl.textContent=T('allLbl');
  const expAllBtn=g('lbl-exp-all'); if(expAllBtn) expAllBtn.textContent=T('expAllZip');
  const expDataLbl=g('exp-modal-lbl-data'); if(expDataLbl) expDataLbl.textContent=T('dataLbl');
  const expRndExp=g('lbl-exp-round-export'); if(expRndExp) expRndExp.textContent=T('expRoundExport');
  const expRndExpDesc=g('exp-desc-round-export'); if(expRndExpDesc) expRndExpDesc.textContent=T('expDescRoundExport');
  const expRndImp=g('lbl-exp-round-import'); if(expRndImp) expRndImp.textContent=T('expRoundImport');
  const expRndImpDesc=g('exp-desc-round-import'); if(expRndImpDesc) expRndImpDesc.textContent=T('expDescRoundImport');
  const expTrigger=g('btn-export-trigger'); if(expTrigger) expTrigger.textContent=T('exportBtn2');
  const expModalTitle=g('exp-modal-title-txt'); if(expModalTitle) expModalTitle.textContent=T('exportTitle');
  // Player manager labels
  const pmTitle=g('pm-title'); if(pmTitle) pmTitle.textContent=T('pmTitle');
  const pmActiveTitle=g('pm-active-title'); if(pmActiveTitle) pmActiveTitle.textContent=T('pmActive');
  const pmAddTitle=g('pm-add-title'); if(pmAddTitle) pmAddTitle.textContent=T('pmAdd');
  const pmHistTitle=g('pm-hist-title'); if(pmHistTitle) pmHistTitle.textContent=T('pmHist');
  const pmAddInp=g('pm-add-input'); if(pmAddInp) pmAddInp.placeholder=T('pmNamePh');
  const pmSearch=g('pm-hist-search'); if(pmSearch) pmSearch.placeholder=T('pmSearchPh');
  const btnPM=g('btn-player-mgr'); if(btnPM) btnPM.textContent=T('editBtn');
  const pSecLbl=g('player-section-lbl'); if(pSecLbl) pSecLbl.textContent=T('playersLbl');
  const showPNLbl=g('sd-show-pname-lbl'); if(showPNLbl) showPNLbl.textContent=T('showPlayerName');
  // Right panel section labels
  const rpCourseLbl=g('rp-course-lbl'); if(rpCourseLbl) rpCourseLbl.textContent=T('courseLbl');
  const rpCourseEdit=g('btn-course-edit'); if(rpCourseEdit) rpCourseEdit.textContent=T('editBtn');
  const rpPlayersLbl=g('rp-players-lbl'); if(rpPlayersLbl) rpPlayersLbl.textContent=T('playersLbl');
  const rpScoreLbl=g('rp-score-lbl'); if(rpScoreLbl) rpScoreLbl.textContent=T('scoreLbl');
  const rpToPinLbl=g('rp-topin-lbl'); if(rpToPinLbl) rpToPinLbl.textContent=T('toPinLabel');
  const distUnit=g('dist-unit'); if(distUnit) distUnit.textContent=T('ydsLabel');
  const spTypeLbl=g('sp-type-lbl'); if(spTypeLbl) spTypeLbl.textContent=T('shotTypeLbl');
  const spPurposeLbl=g('sp-purpose-lbl'); if(spPurposeLbl) spPurposeLbl.textContent=T('purposeLbl');
  const spResultLbl=g('sp-result-lbl'); if(spResultLbl) spResultLbl.textContent=T('resultLbl');
  const spFlagLbl=g('sp-flag-lbl'); if(spFlagLbl) spFlagLbl.textContent=T('flagsLbl');
  const spNoteLbl=g('sp-note-lbl'); if(spNoteLbl) spNoteLbl.textContent=T('noteLbl');
  const rpPrevText=g('btn-prev-text'); if(rpPrevText) rpPrevText.textContent=T('prevBtn');
  const rpNextText=g('btn-next-text'); if(rpNextText) rpNextText.textContent=T('nextBtn');
  // Settings drawer — appearance, themes, safe zone, etc.
  const sdAppLbl=g('sd-appearance-title'); if(sdAppLbl) sdAppLbl.textContent=T('appearanceLbl');
  const sdOvlLbl=g('sd-overlay-title'); if(sdOvlLbl) sdOvlLbl.textContent=T('overlayLbl');
  const sdRatLbl=g('sd-ratio-title'); if(sdRatLbl) sdRatLbl.textContent=T('ratioLbl');
  const sdExpLbl=g('sd-export-title'); if(sdExpLbl) sdExpLbl.textContent=T('exportLbl');
  const sdDispLbl=g('sd-disp-lbl'); if(sdDispLbl) sdDispLbl.textContent=T('displayLbl');
  const sdSzSizeLbl=g('sd-sz-size-lbl'); if(sdSzSizeLbl) sdSzSizeLbl.textContent=T('zoneSizeLbl');
  const pnameLbl=g('lbl-pname-nav'); if(pnameLbl) pnameLbl.textContent=T('playerLbl');
  // Theme buttons
  document.querySelectorAll('[data-ui-theme="dark"]').forEach(b=>b.textContent=T('darkLbl'));
  document.querySelectorAll('[data-ui-theme="light"]').forEach(b=>b.textContent=T('lightLbl'));
  document.querySelectorAll('[data-ui-theme="auto"]').forEach(b=>b.textContent=T('autoLbl'));
  // Overlay style buttons
  const sdStyleTitle=g('sd-theme-sec'); if(sdStyleTitle){ const t=sdStyleTitle.querySelector('.sd-sec-title'); if(t) t.textContent=T('styleLbl'); }
  document.querySelectorAll('[data-theme="classic"]').forEach(b=>b.textContent=T('classicLbl'));
  document.querySelectorAll('[data-theme="broadcast_gold"]').forEach(b=>b.textContent=T('broadcastGoldLbl'));
  document.querySelectorAll('[data-theme="pgatour"]').forEach(b=>b.textContent=T('pgaTourLbl'));
  document.querySelectorAll('[data-theme="livgolf"]').forEach(b=>b.textContent=T('livGolfLbl'));
  document.querySelectorAll('[data-theme="vivid"]').forEach(b=>b.textContent=T('vividLbl'));
  // BG upload, reset par
  const bgUpBtn=g('bg-upload-btn'); if(bgUpBtn) bgUpBtn.textContent=T('bgUploadBtn');
  const resetParBtn=g('btn-reset-par'); if(resetParBtn) resetParBtn.textContent=T('resetParBtn');
  // Safe zone options
  const szSelect=g('sz-size');
  if(szSelect){
    const opts=szSelect.options;
    if(opts[0]) opts[0].text=T('actionSafe');
    if(opts[1]) opts[1].text=T('titleSafe');
    if(opts[2]) opts[2].text=T('bothLbl');
  }
  // Skin button
  const btnSkin=g('btn-skin-narrow'); if(btnSkin) btnSkin.textContent=T('skinBtn');
  // Course input placeholder
  const inpCourse=g('inp-course'); if(inpCourse) inpCourse.placeholder=T('courseLbl').toUpperCase();
  // Score drawer footer
  const sdClr=g('sd-foot-clear'); if(sdClr) sdClr.textContent=T('clearBtn');
  const sdCan=g('sd-foot-cancel'); if(sdCan) sdCan.textContent=T('cancelBtn');
  const sdOk=g('sd-foot-ok'); if(sdOk) sdOk.textContent=T('okBtn');
  // To Pin label
  // (legacy distance labels handled above)
  // Note placeholder
  const noteInp=g('inp-shot-note'); if(noteInp) noteInp.placeholder=T('noteLbl').toLowerCase()+'…';
  // Course edit modal
  const ceLbl=g('course-edit-label'); if(ceLbl) ceLbl.textContent=T('courseNamePrompt');
  const ceCan=g('course-edit-cancel'); if(ceCan) ceCan.textContent=T('cancelBtn');
  const ceOk=g('course-edit-ok'); if(ceOk) ceOk.textContent=T('okBtn');
  // Mobile UI
  const mobStroke=g('mob-btn-stroke'); if(mobStroke) mobStroke.textContent=T('addStrokeBtn');
  const mobFinish=g('mob-btn-finish'); if(mobFinish) mobFinish.textContent=T('finishHoleBtn');
  const mobUndo=g('mob-btn-undo'); if(mobUndo) mobUndo.textContent=T('undoBtn');
  const mobDistInp=g('mob-dist-inp'); if(mobDistInp) mobDistInp.placeholder=T('yardsPh');
  // Mobile more menu
  const mobMenu=g('mob-more-menu');
  if(mobMenu){
    const btns=mobMenu.querySelectorAll('button');
    if(btns[0]) btns[0].textContent=T('previewBtn');
    if(btns[1]) btns[1].textContent=T('exportPngBtn');
    if(btns[2]) btns[2].textContent=T('settingsLbl').trim();
    if(btns[3]) btns[3].textContent=T('playersLbl');
    if(btns[4]) btns[4].textContent=T('resetHoleBtn');
    if(btns[5]) btns[5].textContent=T('cancelBtn');
  }
  // Mobile preview header
  const mobPvHdr=g('mob-pv-hdr');
  if(mobPvHdr){
    const btns=mobPvHdr.querySelectorAll('button');
    if(btns[0]) btns[0].textContent=T('backBtn');
    const sp=mobPvHdr.querySelector('span'); if(sp) sp.textContent=T('previewBtn');
    if(btns[1]) btns[1].textContent=T('exportLbl');
  }
  // Narrow opts
  const optsToggle=g('btn-opts-toggle'); if(optsToggle&&optsToggle.textContent.includes('…')) optsToggle.textContent=T('optionsBtn');
  const pvNarrow=g('btn-preview-narrow'); if(pvNarrow) pvNarrow.textContent=T('previewBtn');
  if(typeof buildPlayerArea==='function') buildPlayerArea();
  if(typeof buildFocusPlayerBtns==='function') buildFocusPlayerBtns();
  buildTypeButtons();
  buildDeltaBtn();
}

// ============================================================
// DATA MODEL — v4.0
// All business data lives in D (data.js). S is a legacy compatibility view.
// ============================================================
const DEFAULT_BG = './bkimg.jpeg';
const LS_KEY = 'golf_v531';       // legacy key, kept for migration
const SESSION_ID = D.SESSION;     // re-export for compat

function defaultScorecardCenter(ratio){
  return { x:0.5, y:0.83, centered:true };
}

// S is a legacy view object, rebuilt from D via D.syncS(S)
let S = {};

// ============================================================
// PLAYER MANAGEMENT — v4.0
// All player data lives in D.sc().scores[pid]. No dual-truth swap.
// ============================================================
function effectivePlayerId(){ return D.pid(); }

function ensurePlayerData(pid){ D.ensureScores(pid); }

function currentPlayerDisplayName(){
  if(D.ws().currentPlayerId){
    const p=D.getPlayer(D.ws().currentPlayerId);
    if(p) return D.playerDisplayName(p);
  }
  return D.ws().playerName||'PLAYER';
}

function resetAllShotIndex(hi){
  // v4: shotIndex is global in workspace, just reset it
  // Also sync currentHole to D before rebuilding S, so syncS reads the correct hole
  D.ws().currentHole=S.currentHole;
  D.ws().shotIndex=-1;
  D.syncS(S);
}

// Legacy compat stubs — no longer needed in v4 (single truth in D)
function saveCurrentPlayerData(){ /* no-op: v4 single truth */ }
function loadPlayerData(pid){ D.syncS(S); /* just refresh S view */ }

function trackRecentPlayer(pid){
  if(!pid||pid===SESSION_ID) return;
  const ws=D.ws();
  if(!ws.recentPlayerIds) ws.recentPlayerIds=[];
  ws.recentPlayerIds=[pid,...ws.recentPlayerIds.filter(id=>id!==pid)].slice(0,8);
}

function switchToPlayer(pid){
  if(pid===effectivePlayerId()) return;
  const ws=D.ws();
  ws.currentPlayerId=(pid===SESSION_ID)?null:pid;
  ws.shotIndex=-1; // reset to overview
  trackRecentPlayer(pid);
  clearReady();
  D.syncS(S);
  if(typeof buildPlayerArea==='function') buildPlayerArea();
  if(typeof buildFocusPlayerBtns==='function') buildFocusPlayerBtns();
  render(); scheduleSave();
}

function addPlayer(name){
  name=(name||'').trim();
  if(!name) return false;
  const players=D.sc().players;
  if(players.length>=150){ miniToast(T('maxPlayers'),true); return false; }
  if(players.find(p=>p.name===name)){ miniToast(T('playerExists'),true); return false; }
  const isFirst=players.length===0;
  const newPlayer=D.addPlayer(name);  // v4.1: auto-generates roundPlayerId
  const rpId=newPlayer.roundPlayerId;
  const ws=D.ws();
  if(!ws.playerHistory) ws.playerHistory=[];
  // Store as {name, playerId} objects (consistent with newRoundService)
  var entry={name:name, playerId: rpId || null};
  ws.playerHistory=[entry,...ws.playerHistory.filter(function(h){
    var hName = (typeof h === 'string') ? h : (h && h.name || '');
    return hName !== name;
  })].slice(0,50);
  if(isFirst){
    // Migrate session data to this player
    const sessionScores=D.sc().scores[SESSION_ID];
    if(sessionScores){
      D.sc().scores[rpId]=JSON.parse(JSON.stringify(sessionScores));
      delete D.sc().scores[SESSION_ID];
    }
    ws.currentPlayerId=rpId;
  }
  D.syncS(S);
  scheduleSave();
  return true;
}

function removePlayer(roundPlayerId){
  D.removePlayer(roundPlayerId);
  const ws=D.ws();
  if(ws.currentPlayerId===roundPlayerId){
    const first=D.sc().players[0];
    ws.currentPlayerId=first ? D.rpid(first) : null;
  }
  // Clean dangling references
  if(ws.focusSlots) ws.focusSlots=ws.focusSlots.filter(id=>id!==roundPlayerId);
  if(ws.recentPlayerIds) ws.recentPlayerIds=ws.recentPlayerIds.filter(id=>id!==roundPlayerId);
  D.syncS(S);
  if(typeof buildPlayerArea==='function') buildPlayerArea();
  if(typeof buildFocusPlayerBtns==='function') buildFocusPlayerBtns();
  render(); scheduleSave();
}

// ============================================================
// PERSISTENCE — v4.0
// Business data in D.sc(), workspace in D.ws(), S is rebuilt view
// ============================================================
let saveTimer;
function scheduleSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(doSave,350); }
function doSave(){
  try{
    // Sync any direct S mutations back to D
    D.syncFromS(S);
    // Sync round manager state to course snapshot
    const rm=typeof RoundManager!=='undefined'?RoundManager.getRound():null;
    if(rm){
      const sc=D.sc();
      sc.course.clubId=rm.clubId||null;
      sc.course.clubName=rm.clubName||'';
      sc.course.routingId=rm.routingId||null;
      sc.course.routingName=rm.routingName||'';
      sc.course.routingSourceType=rm.routingSourceType||null;
      sc.course.routingMeta=rm.routingMeta||{};
    }
    D.save();
  } catch(e){ console.warn('save error',e); }
}

function loadSaved(){
  try{
    const result=D.load();
    LANG=D.ws().lang||'en';
    D.syncS(S);
    console.log('[app] loaded data:', result);
    // activeRound is restored later after ClubStore seed completes
  } catch(e){ console.warn('loadSaved error',e); }
}

/** Restore active round from course snapshot after ClubStore is ready */
function restoreActiveRound(){
  const cs=D.sc().course;
  if(cs.clubId && cs.routingId){
    // Build a legacy activeRound object for RoundManager.restoreRound()
    const fakeRound={
      clubId:cs.clubId, clubName:cs.clubName,
      routingId:cs.routingId, routingName:cs.routingName,
      routingSourceType:cs.routingSourceType, routingMeta:cs.routingMeta,
      _routing:S._activeRouting||null
    };
    try {
      const restored = RoundManager.restoreRound(fakeRound, cs.selectedTee || 'blue');
      if(restored){
        S._activeRouting=restored._routing; // cache for future restores
        // Sync par/yard from course DB into course snapshot
        const oh = RoundManager.getOrderedHoles();
        if(oh){
          oh.forEach((hd,i)=>{
            if(hd){
              if(hd.par != null) D.setCourseHolePar(i, hd.par);
              if(hd.yard != null) D.setCourseHoleYards(i, hd.yard);
            }
          });
        }
        D.syncS(S);
        console.log('[init] restored round:', cs.routingName);
        render();
      } else {
        console.warn('[init] round restore returned null — clearing');
        D.sc().course.clubId=null; D.sc().course.routingId=null;
        D.syncS(S);
        miniToast('Round restore failed — manual mode', true);
      }
    } catch(e){
      console.warn('[init] failed to restore round:', e.message);
      D.sc().course.clubId=null; D.sc().course.routingId=null;
      D.syncS(S);
      miniToast('Round restore error — manual mode', true);
    }
  }
}

// ============================================================
// COURSE PICKER STUB — redirect to shell new round page
// ============================================================
function openCoursePicker(){
  if(typeof Shell !== 'undefined' && Shell.navigate){
    Shell.navigate('#/new-round');
  }
}

// ============================================================
// COURSE NAME (right panel)
// ============================================================
const CB_TEE_COLORS={gold:'#DAA520',blue:'#2563EB',white:'#CCCCCC',red:'#DC2626',black:'#333',green:'#16A34A',silver:'#A0A0A0',champion:'#DAA520'};
function updateCourseDisplay(){
  // Bottom nav course name (legacy)
  const el=document.getElementById('rp-course-name');
  if(el) el.textContent=S.courseName||'';
  // Course bar (left panel)
  const nameEl=document.getElementById('cb-course-name');
  const teeEl=document.getElementById('cb-tee-info');
  const editBtn=document.getElementById('cb-edit-btn');
  if(!nameEl) return;
  const hasCourse=!!S.courseName;
  if(hasCourse){
    nameEl.textContent=S.courseName;
    nameEl.classList.remove('cb-empty');
  } else {
    nameEl.textContent=T('noCourseSelected')||'未选择球场';
    nameEl.classList.add('cb-empty');
  }
  // Tee info
  if(teeEl){
    teeEl.innerHTML='';
    const tee=S.selectedTee;
    if(hasCourse && tee){
      const dot=document.createElement('span');
      dot.className='cb-tee-dot';
      dot.style.background=CB_TEE_COLORS[tee]||'#888';
      teeEl.appendChild(dot);
      const lbl=document.createElement('span');
      lbl.textContent=tee.charAt(0).toUpperCase()+tee.slice(1);
      teeEl.appendChild(lbl);
      // Total yardage
      const totalYds=S.holes.reduce((a,h)=>a+(h.holeLengthYds||0),0);
      if(totalYds>0){
        const yEl=document.createElement('span');
        yEl.textContent=totalYds+'y';
        yEl.style.color='var(--text-muted)';
        teeEl.appendChild(yEl);
      }
    }
  }
  // Edit button
  if(editBtn){
    if(hasCourse){
      editBtn.textContent='Edit';
      editBtn.classList.remove('cb-important');
      editBtn.onclick=()=>openCoursePicker();
    } else {
      editBtn.textContent=T('selectCourseBtn')||'选择球场';
      editBtn.classList.add('cb-important');
      editBtn.onclick=()=>openCoursePicker();
    }
  }
}
function editCourseName(){
  const bg=document.getElementById('course-edit-bg');
  const modal=document.getElementById('course-edit-modal');
  const inp=document.getElementById('course-edit-input');
  const lbl=document.getElementById('course-edit-label');
  const cancelBtn=document.getElementById('course-edit-cancel');
  const okBtn=document.getElementById('course-edit-ok');
  if(lbl) lbl.textContent=T('courseNamePrompt');
  if(cancelBtn) cancelBtn.textContent=T('cancelBtn');
  if(okBtn) okBtn.textContent=T('okBtn');
  if(inp) inp.value=S.courseName||'';
  if(bg) bg.classList.add('show');
  if(modal) modal.classList.add('show');
  if(inp){ inp.focus(); inp.select(); }
  // Enter key to confirm
  if(inp) inp.onkeydown=e=>{ if(e.key==='Enter') confirmCourseEdit(); };
}
function closeCourseEdit(){
  const bg=document.getElementById('course-edit-bg');
  const modal=document.getElementById('course-edit-modal');
  if(bg) bg.classList.remove('show');
  if(modal) modal.classList.remove('show');
}
function confirmCourseEdit(){
  const inp=document.getElementById('course-edit-input');
  const v=inp?inp.value.trim():'';
  S.courseName=v;
  D.sc().course.courseName=v;
  const courseInp=document.getElementById('inp-course');
  if(courseInp) courseInp.value=v;
  updateCourseDisplay();
  redrawOnly(); scheduleSave();
  closeCourseEdit();
}

// ============================================================
// BACKGROUND MANAGEMENT
// ============================================================
function applyBg(){
  const img=document.getElementById('bg-img');
  const hint=document.getElementById('upload-hint');
  // Always set onerror BEFORE src to catch any load failure (including cached failures)
  img.onerror=()=>{ img.onerror=null; img.style.display='none'; hint.classList.remove('hidden'); };
  img.src=S.userBg||DEFAULT_BG;
  img.style.display='block';
  img.style.opacity=S.bgOpacity;
  hint.classList.add('hidden');
}
function setBgFile(file){
  if(!file||!file.type.startsWith('image/')) return;
  const reader=new FileReader();
  reader.onload=ev=>{ S.userBg=ev.target.result; D.ws().userBg=S.userBg; applyBg(); scheduleSave(); };
  reader.readAsDataURL(file);
}
function clearBg(){ S.userBg=null; D.ws().userBg=null; applyBg(); scheduleSave(); closeSettings(); }

// ============================================================
// MUTATIONS
// ============================================================
function setPar(v){
  const hi=D.ws().currentHole;
  D.setCourseHolePar(hi, v);
  // Re-derive gross for current player if they have a score
  const pid=D.pid();
  const ph=D.getPlayerHole(pid, hi);
  if(ph && ph.gross!==null){
    // gross stays the same — par change only affects delta display
  }
  D.syncS(S);
  render(); scheduleSave();
}

function setDelta(d){
  const hi=D.ws().currentHole;
  const par=D.getCourseHole(hi).par||4;
  D.setPlayerGross(D.pid(), hi, par+d);
  D.ws().shotIndex=-1;
  clearReady();
  D.syncS(S);
  render(); scheduleSave();
}

function adjDelta(inc){
  const pid=D.pid();
  const hi=D.ws().currentHole;
  const ph=D.getPlayerHole(pid, hi);
  if(ph.gross===null){
    const par=D.getCourseHole(hi).par||4;
    D.setPlayerGross(pid, hi, par); // start at par
    const g=D.getPlayerGross(pid, hi);
    D.ws().shotIndex=(g&&g>0)?g-1:0;
  } else {
    D.adjPlayerGross(pid, hi, inc);
    const g=D.getPlayerGross(pid, hi);
    D.ws().shotIndex=(g&&g>0)?g-1:0;
  }
  D.syncS(S);
  render(); scheduleSave();
}

// Legacy compat — reconcileShots now handled internally by D
function reconcileShots(h){
  // Delegate: find the player hole in D and reconcile
  // This is called from some legacy paths; in v4, D handles reconciliation automatically
}

function clearHole(){
  D.clearPlayerHole(D.pid(), D.ws().currentHole);
  D.ws().shotIndex=-1;
  D.syncS(S);
  render(); scheduleSave();
}

function setMode(m){ S.displayMode=m; D.ws().displayMode=m; render(); scheduleSave(); }

// Update F9/B9/18H radio labels to reflect actual hole count
function updateScoreRangeLabels(){
  const total=D.holeCount();
  const half=Math.ceil(total/2);
  const lf=document.getElementById('lbl-front9');
  const lb=document.getElementById('lbl-back9');
  const la=document.getElementById('lbl-18h');
  if(total===18){
    // Standard 18-hole: use translated labels
    if(lf) lf.textContent=T('front9');
    if(lb) lb.textContent=T('back9');
    if(la) la.textContent=T('h18');
  } else {
    // Non-standard hole count: show actual numbers
    if(lf) lf.textContent='F'+half;
    if(lb) lb.textContent='B'+(total-half);
    if(la) la.textContent=total+'H';
  }
}

function focusToPin(){
  // disabled — no longer auto-focus to pin input
}
function prevShot(){
  const h=curHole(), g=getGross(h);
  if(h.delta===null||!g) return;
  clearReady();
  const ws=D.ws();
  if(ws.shotIndex<0) { ws.shotIndex=g-1; }
  else { ws.shotIndex=ws.shotIndex<=0?g-1:ws.shotIndex-1; }
  D.syncS(S);
  render(); scheduleSave();
}
function nextShot(){
  const h=curHole(), g=getGross(h);
  if(h.delta===null||!g) return;
  clearReady();
  const ws=D.ws();
  if(ws.shotIndex<0) { ws.shotIndex=0; }
  else { ws.shotIndex=ws.shotIndex>=g-1?0:ws.shotIndex+1; }
  D.syncS(S);
  render(); scheduleSave();
}
function ensureShotSelected(){
  const h=curHole(), g=getGross(h);
  if(h.delta===null||!g) return false;
  const ws=D.ws();
  if(ws.shotIndex<0){ clearReady(); ws.shotIndex=0; D.syncS(S); render(); scheduleSave(); return 'just_selected'; }
  return 'ready';
}

/** Switch to next player in S.players list (cycle) */
function switchToNextPlayer(){
  const ps=S.players||[];
  if(!ps.length) return;
  const curPid=effectivePlayerId();
  const idx=ps.findIndex(p=>D.rpid(p)===curPid);
  const next=idx<0?0:(idx+1)%ps.length;
  switchToPlayer(D.rpid(ps[next]));
}

/** Switch to previous player in S.players list (cycle) */
function switchToPrevPlayer(){
  const ps=S.players||[];
  if(!ps.length) return;
  const curPid=effectivePlayerId();
  const idx=ps.findIndex(p=>D.rpid(p)===curPid);
  const next=idx<=0?ps.length-1:idx-1;
  switchToPlayer(D.rpid(ps[next]));
}
function setShotTag(type){
  const h=curHole();
  const ws=D.ws();
  if(h.delta===null||ws.shotIndex<0) return;
  clearReady();
  const cat=getShotCategory(type);
  D.setShotTag(D.pid(), ws.currentHole, ws.shotIndex, cat, type);
  D.syncS(S);
  render(); scheduleSave();
}
// Legacy aliases
function setShotType(type){ setShotTag(type); }
function setLanding(type){ setShotTag(type); }

function getShotCategory(type){
  if(['PENALTY','PROV'].includes(type)) return 'flags';
  if(['FOR_BIRDIE','FOR_PAR','FOR_BOGEY','FOR_DOUBLE','FOR_TRIPLE'].includes(type)) return 'purpose';
  if(['GREEN','FAIRWAY','BUNKER','LIGHT_ROUGH','HEAVY_ROUGH','WATER','TREES'].includes(type)) return 'result';
  return 'type';
}

function onShotNoteInput(val){
  const ws=D.ws();
  const h=curHole();
  if(h.delta===null||ws.shotIndex<0) return;
  clearReady();
  D.setShotNotes(D.pid(), ws.currentHole, ws.shotIndex, val||'');
  D.syncS(S);
  render(); scheduleSave();
}

function getShotToPin(h,idx){
  // TEE shot (idx=0): always use shared hole length — same distance for all players
  if(idx===0) return h.holeLengthYds??null;
  return h.toPins?.[idx]??null;
}
function setShotToPin(val){
  const ws=D.ws();
  if(ws.shotIndex<0||ws.shotIndex===0){
    // Overview mode or TEE Off: update course snapshot hole length
    D.setCourseHoleYards(ws.currentHole, val);
    D.syncS(S);
  } else {
    D.setShotToPin(D.pid(), ws.currentHole, ws.shotIndex, val);
    D.syncS(S);
  }
  redrawOnly(); scheduleSave();
}

function resetAllPars(){
  const oh=RoundManager.getRound()?RoundManager.getOrderedHoles():null;
  for(let i=0;i<D.holeCount();i++){
    D.setCourseHolePar(i, (oh&&oh[i]&&oh[i].par!=null)?oh[i].par:4);
  }
  D.syncS(S);
  render(); scheduleSave(); closeSettings();
}

function gotoNextHole(){
  const total=D.holeCount();
  const ws=D.ws();
  const next=(ws.currentHole+1)%total;
  ws.currentHole=next;
  ws.scorecardSummary=null;
  ws.shotIndex=-1;
  if(RoundManager.getRound()){
    const oh=RoundManager.getOrderedHoles();
    if(oh&&oh[next]) RoundManager.setCurrentHole(oh[next].holeId);
  }
  clearReady();
  D.syncS(S);
  render(); scheduleSave();
}
function gotoPrevHole(){
  const total=D.holeCount();
  const ws=D.ws();
  const prev=(ws.currentHole+total-1)%total;
  ws.currentHole=prev;
  ws.scorecardSummary=null;
  ws.shotIndex=-1;
  if(RoundManager.getRound()){
    const oh=RoundManager.getOrderedHoles();
    if(oh&&oh[prev]) RoundManager.setCurrentHole(oh[prev].holeId);
  }
  clearReady();
  D.syncS(S);
  render(); scheduleSave();
}

const RATIO_BG={'16:9':'./bkimg.jpeg','9:16':'./bkimg-9-16.jpg','1:1':'./bkimg-1-1.jpg'};

function setRatio(r){
  S.ratio=r; D.ws().ratio=r;
  document.querySelectorAll('.ratio-btn').forEach(b=>b.classList.toggle('active',b.dataset.ratio===r));
  if(!S.userBg){
    const bgEl=document.getElementById('bg-img');
    if(bgEl){ bgEl.src=RATIO_BG[r]||DEFAULT_BG; bgEl.style.display='block'; }
  }
  const dw=D.defWorkspace();
  S.overlayPos[r]=dw.overlayPos[r];
  S.scorecardPos[r]=dw.scorecardPos[r];
  D.ws().overlayPos[r]=dw.overlayPos[r];
  D.ws().scorecardPos[r]=dw.scorecardPos[r];
  render(); scheduleSave();
}

function setRes(btn){
  S.exportRes=parseInt(btn.dataset.res)||2160; D.ws().exportRes=S.exportRes;
  document.querySelectorAll('.res-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  scheduleSave();
}

// v4.5: reset scorecard to default center position
function resetScorecardPos(){
  ['16:9','9:16','1:1'].forEach(r=>{
    S.scorecardPos[r]={x:0.5, y:0.83, centered:true};
  });
  redrawOnly(); scheduleSave();
  miniToast(T('scPosReset'));
  closeSettings();
}

// ============================================================
// THEME SYSTEM
// ============================================================
const THEMES = {
  classic: {
    shot: {
      // Card frame
      borderColor:        'rgba(184,150,46,0.55)',
      borderWidth:        1.5,          // × scale, min 1.5
      cornerRadius:       5,            // × scale
      // Background regions
      leftBg:             '#1B5E3B',
      midBandBg:          '#1B5E3B',
      rightBg:            '#F8F8F8',
      // Left column — hole number
      holeNumColor:       '#ffffff',
      holeNumWeight:      900,
      holeNumSize:        56,           // × scale
      // Left column — PAR label
      parLabelColor:      'rgba(255,255,255,0.6)',
      parLabelWeight:     700,
      parLabelSize:       20,
      // Left column — par value
      parValColor:        '#B8962E',
      parValWeight:       900,
      parValSize:         36,
      // Row1 — player name
      playerNameColor:    '#111111',
      playerNameWeight:   700,
      playerNameSize:     38,
      // Row1 — total badge
      totalBadgeWeight:   900,
      totalBadgeSize:     38,
      totalBadgeColorFn:  td => td<0?'#C0392B':td<=7?'#1a5bb5':td<=17?'#2e7d32':td<=27?'#888888':'#111111',
      totalBadgeTextColor:'#ffffff',
      // Row2 — progress squares
      sqCurBg:            '#ffffff',
      sqCurTextColor:     '#1B5E3B',
      sqPastBg:           'rgba(255,255,255,.25)',
      sqPastTextColor:    'rgba(255,255,255,.85)',
      sqFutureBg:         'rgba(255,255,255,.10)',
      sqFutureTextColor:  'rgba(255,255,255,.3)',
      sqRadius:           0,
      sqNumWeight:        700,
      sqNumSize:          15,
      // Dividers
      dividerColor:       'rgba(184,150,46,0.7)',
      dividerWidth:       1.2,
      row12DivColor:      'rgba(200,200,200,0.5)',
      row12DivWidth:      0.6,
      // Row3 — To Pin distance
      distValColor:       '#1e7a3e',
      distValWeight:      700,
      distValSize:        22,
      distUnitColor:      'rgba(20,100,50,0.9)',
      distUnitWeight:     600,
      distUnitSize:       13,
      // Row3 — shot type label
      shotTypeColor:      '#1a6e35',
      shotTypeWeight:     700,
      shotTypeSize:       24,
      // Row3 — result badge
      resultBadgeRadius:  3,
      resultBadgeWeight:  700,
      resultBadgeSize:    24,
      resultBadgeTextColor:'#ffffff',
    },
    sc: {
      // Card
      cardBg:             '#F2F2F2',
      cardRadius:         8,
      shadowColor:        'rgba(0,0,0,0.35)',
      shadowBlur:         10,
      shadowOffsetY:      3,
      // Separators
      vlineColor:         'rgba(180,190,180,0.4)',
      vlineWidth:         0.6,
      subVlineColor:      'rgba(27,94,59,0.25)',
      subVlineWidth:      1.5,
      // Header row
      hdrBg:              '#1B5E3B',
      holeLabelColor:     'rgba(255,255,255,0.6)',
      holeLabelWeight:    600,
      holeNumColor:       'rgba(255,255,255,.85)',
      holeNumWeight:      600,
      outInDimBg:         'rgba(0,0,0,0.18)',
      outInTextColor:     'rgba(255,255,255,.95)',
      outInWeight:        700,
      totHdrTextColor:    'rgba(255,255,255,.95)',
      totHdrWeight:       700,
      // PAR row
      parRowBg:           '#EAF0EA',
      parLabelColor:      'rgba(0,0,0,0.45)',
      parLabelWeight:     500,
      parValColor:        '#2a5e2a',
      parValWeight:       500,
      parSubColor:        '#1B5E3B',
      parSubWeight:       700,
      parTotColor:        '#1B5E3B',
      parTotWeight:       700,
      // SCORE row
      scoreRowBg:         '#FFFFFF',
      scoreRowDivColor:   'rgba(180,190,180,0.5)',
      scoreLabelColor:    'rgba(0,0,0,0.45)',
      scoreLabelWeight:   700,
      scoreSubBg:         'rgba(27,94,59,0.06)',
      // Score cell — empty
      emptyDashColor:     'rgba(0,0,0,0.18)',
      emptyDashWeight:    400,
      // Score cell — badge
      scoreBadgeRadius:   4,
      scoreBadgeTextColor:'#ffffff',
      scoreBadgeWeight:   800,
      // OUT/IN sub-total badge
      subTotBg:           '#ffffff',
      subTotTextColor:    '#111111',
      subTotWeight:       800,
      // TOT column
      totTextColor:       '#111111',
      totWeight:          700,
      // Delta score badge colors
      scoreColors: {
        eagle:  '#7c3aed',
        birdie: '#C0392B',
        par:    '#1a5bb5',
        bogey:  '#2e7d32',
        double: '#9e9e9e',
        triple: '#555555',
        over:   '#111111',
        empty:  '#888888',
      },
      // Player name badge
      nameBadgeBg:        '#ffffff',
      nameBadgeTextColor: '#111111',
      nameBadgeWeight:    700,
      nameBadgeSize:      34,
      nameBadgeRadius:    5,
    },
  },
};

THEMES.broadcast_gold = {
  name: 'Broadcast Gold',
  shot: {
    // Frame
    borderColor:        '#c9a44a',
    borderWidth:        3,
    cornerRadius:       18,
    goldFrame:          true,
    borderInnerColor:   'rgba(255,255,255,0.55)',
    borderInnerWidth:   1.5,
    // Background regions
    leftBg:             '#1a5a3a',
    midBandBg:          '#1a5a3a',
    rightBg:            '#f7f7f7',
    // Left col — hole number
    holeNumColor:       '#ffffff',
    holeNumWeight:      900,
    holeNumSize:        60,
    // Left col — PAR label
    parLabelColor:      'rgba(255,255,255,0.62)',
    parLabelWeight:     700,
    parLabelSize:       20,
    // Left col — par value (gold)
    parValColor:        '#d4af37',
    parValWeight:       900,
    parValSize:         42,
    // Row1 — player name
    playerNameColor:    '#111111',
    playerNameWeight:   700,
    playerNameSize:     34,
    // Row1 — total badge
    totalBadgeWeight:   900,
    totalBadgeSize:     38,
    totalBadgeColorFn:  td => td<0?'#C0392B':td<=7?'#1a5bb5':td<=17?'#2e7d32':td<=27?'#888888':'#111111',
    totalBadgeTextColor:'#ffffff',
    // Row2 — progress squares
    sqCurBg:            '#ffffff',
    sqCurTextColor:     '#1a5a3a',
    sqPastBg:           'rgba(255,255,255,0.55)',
    sqPastTextColor:    'rgba(255,255,255,0.90)',
    sqFutureBg:         'rgba(255,255,255,0.25)',
    sqFutureTextColor:  'rgba(255,255,255,0.40)',
    sqRadius:           0,
    sqNumWeight:        700,
    sqNumSize:          15,
    // Dividers
    dividerColor:       '#d4af37',
    dividerWidth:       1,
    row12DivColor:      'rgba(0,0,0,0.10)',
    row12DivWidth:      0.6,
    // Row3 — distance
    distValColor:       '#1a5a3a',
    distValWeight:      700,
    distValSize:        22,
    distUnitColor:      'rgba(26,90,58,0.80)',
    distUnitWeight:     600,
    distUnitSize:       13,
    // Row3 — shot type
    shotTypeColor:      '#1a5a3a',
    shotTypeWeight:     700,
    shotTypeSize:       24,
    // Row3 — result badge
    resultBadgeRadius:  8,
    resultBadgeWeight:  700,
    resultBadgeSize:    24,
    resultBadgeTextColor:'#ffffff',
  },
  sc: {
    // Card frame
    cardBg:             '#f7f7f7',
    cardRadius:         18,
    shadowColor:        'rgba(0,0,0,0.22)',
    shadowBlur:         18,
    shadowOffsetY:      8,
    goldFrame:          true,
    borderColor:        '#c9a44a',
    borderWidth:        3,
    borderInnerColor:   'rgba(255,255,255,0.55)',
    borderInnerWidth:   1.5,
    // Separators
    vlineColor:         'rgba(0,0,0,0.10)',
    vlineWidth:         0.6,
    subVlineColor:      'rgba(26,90,58,0.25)',
    subVlineWidth:      1.5,
    // Header
    hdrBg:              '#1f6a43',
    holeLabelColor:     'rgba(255,255,255,0.62)',
    holeLabelWeight:    600,
    holeNumColor:       'rgba(255,255,255,.90)',
    holeNumWeight:      600,
    outInDimBg:         'rgba(0,0,0,0.15)',
    outInTextColor:     'rgba(255,255,255,.95)',
    outInWeight:        700,
    totHdrTextColor:    'rgba(255,255,255,.95)',
    totHdrWeight:       700,
    // PAR row
    parRowBg:           '#e8f0e8',
    parLabelColor:      'rgba(0,0,0,0.45)',
    parLabelWeight:     500,
    parValColor:        '#2a5e2a',
    parValWeight:       500,
    parSubColor:        '#1a5a3a',
    parSubWeight:       700,
    parTotColor:        '#1a5a3a',
    parTotWeight:       700,
    // Score row
    scoreRowBg:         '#ffffff',
    scoreRowDivColor:   'rgba(0,0,0,0.10)',
    scoreLabelColor:    'rgba(0,0,0,0.45)',
    scoreLabelWeight:   700,
    scoreSubBg:         'rgba(26,90,58,0.06)',
    emptyDashColor:     'rgba(0,0,0,0.18)',
    emptyDashWeight:    400,
    scoreBadgeRadius:   6,
    scoreBadgeTextColor:'#ffffff',
    scoreBadgeWeight:   800,
    subTotBg:           '#ffffff',
    subTotTextColor:    '#111111',
    subTotWeight:       800,
    totTextColor:       '#111111',
    totWeight:          700,
    scoreColors: {
      eagle:'#7c3aed', birdie:'#C0392B', par:'#1a5bb5',
      bogey:'#2e7d32', double:'#9e9e9e', triple:'#555555', over:'#111111', empty:'#888888',
    },
    nameBadgeBg:        '#ffffff',
    nameBadgeTextColor: '#111111',
    nameBadgeWeight:    700,
    nameBadgeSize:      34,
    nameBadgeRadius:    8,
  },
};

THEMES.pgatour = {
  name: 'PGA Tour',
  shot: {
    // Frame — navy thin border, no goldFrame
    borderColor:        'rgba(10,42,102,0.35)',
    borderWidth:        1.5,
    cornerRadius:       16,
    // Background
    leftBg:             '#0a2a66',
    midBandBg:          '#0a2a66',
    rightBg:            '#ffffff',
    // Left col — hole number
    holeNumColor:       '#ffffff',
    holeNumWeight:      900,
    holeNumSize:        58,
    // Left col — PAR label
    parLabelColor:      'rgba(255,255,255,0.70)',
    parLabelWeight:     700,
    parLabelSize:       20,
    // Left col — par value (red accent)
    parValColor:        '#e2231a',
    parValWeight:       900,
    parValSize:         40,
    // Row1 — player name
    playerNameColor:    '#0b0f18',
    playerNameWeight:   700,
    playerNameSize:     34,
    // Row1 — total badge
    totalBadgeWeight:   900,
    totalBadgeSize:     38,
    totalBadgeColorFn:  td => td<0?'#C0392B':td<=7?'#1a5bb5':td<=17?'#2e7d32':td<=27?'#888888':'#111111',
    totalBadgeTextColor:'#ffffff',
    // Row2 — progress squares
    sqCurBg:            '#ffffff',
    sqCurTextColor:     '#0a2a66',
    sqPastBg:           'rgba(255,255,255,0.60)',
    sqPastTextColor:    'rgba(255,255,255,0.90)',
    sqFutureBg:         'rgba(255,255,255,0.25)',
    sqFutureTextColor:  'rgba(255,255,255,0.40)',
    sqRadius:           0,
    sqNumWeight:        700,
    sqNumSize:          15,
    // Dividers — red accent divider
    dividerColor:       '#e2231a',
    dividerWidth:       1,
    row12DivColor:      'rgba(10,42,102,0.14)',
    row12DivWidth:      0.6,
    // Row3 — distance
    distValColor:       '#0a2a66',
    distValWeight:      700,
    distValSize:        22,
    distUnitColor:      'rgba(11,15,24,0.55)',
    distUnitWeight:     600,
    distUnitSize:       13,
    // Row3 — shot type
    shotTypeColor:      '#0a2a66',
    shotTypeWeight:     700,
    shotTypeSize:       24,
    // Row3 — result badge
    resultBadgeRadius:  7,
    resultBadgeWeight:  700,
    resultBadgeSize:    24,
    resultBadgeTextColor:'#ffffff',
  },
  sc: {
    cardBg:             '#ffffff',
    cardRadius:         16,
    shadowColor:        'rgba(0,0,0,0.20)',
    shadowBlur:         16,
    shadowOffsetY:      7,
    // Separators
    vlineColor:         'rgba(10,42,102,0.14)',
    vlineWidth:         0.6,
    subVlineColor:      'rgba(10,42,102,0.22)',
    subVlineWidth:      1.5,
    // Header — dark navy
    hdrBg:              '#0a2a66',
    holeLabelColor:     'rgba(255,255,255,0.70)',
    holeLabelWeight:    600,
    holeNumColor:       'rgba(255,255,255,.90)',
    holeNumWeight:      600,
    outInDimBg:         'rgba(0,0,0,0.18)',
    outInTextColor:     'rgba(255,255,255,.95)',
    outInWeight:        700,
    totHdrTextColor:    'rgba(255,255,255,.95)',
    totHdrWeight:       700,
    // PAR row — slight blue tint
    parRowBg:           '#f0f2f5',
    parLabelColor:      'rgba(0,0,0,0.45)',
    parLabelWeight:     500,
    parValColor:        '#0a2a66',
    parValWeight:       500,
    parSubColor:        '#0a2a66',
    parSubWeight:       700,
    parTotColor:        '#0a2a66',
    parTotWeight:       700,
    // Score row
    scoreRowBg:         '#ffffff',
    scoreRowDivColor:   'rgba(10,42,102,0.14)',
    scoreLabelColor:    'rgba(0,0,0,0.45)',
    scoreLabelWeight:   700,
    scoreSubBg:         'rgba(10,42,102,0.04)',
    emptyDashColor:     'rgba(0,0,0,0.18)',
    emptyDashWeight:    400,
    scoreBadgeRadius:   5,
    scoreBadgeTextColor:'#ffffff',
    scoreBadgeWeight:   800,
    subTotBg:           '#ffffff',
    subTotTextColor:    '#0b0f18',
    subTotWeight:       800,
    totTextColor:       '#0b0f18',
    totWeight:          700,
    scoreColors: {
      eagle:'#2d4cff', birdie:'#e2231a', par:'#0a2a66',
      bogey:'#2e7d32', double:'#9e9e9e', triple:'#555555', over:'#111111', empty:'#888888',
    },
    nameBadgeBg:        '#ffffff',
    nameBadgeTextColor: '#0b0f18',
    nameBadgeWeight:    700,
    nameBadgeSize:      34,
    nameBadgeRadius:    5,
  },
};

THEMES.livgolf = {
  name: 'LIV Golf',
  shot: {
    // Frame — neon green glow border
    borderColor:        'rgba(57,255,20,0.55)',
    borderWidth:        2,
    cornerRadius:       18,
    glow:               true,
    glowColor:          '#39ff14',
    glowBlur:           12,
    // Background — near-black
    leftBg:             '#101010',
    midBandBg:          '#101010',
    rightBg:            '#0b0b0b',
    // Left col — hole number
    holeNumColor:       '#f2f2f2',
    holeNumWeight:      900,
    holeNumSize:        58,
    // Left col — PAR label
    parLabelColor:      'rgba(242,242,242,0.65)',
    parLabelWeight:     700,
    parLabelSize:       20,
    // Left col — par value (neon green)
    parValColor:        '#39ff14',
    parValWeight:       900,
    parValSize:         40,
    // Row1 — player name
    playerNameColor:    '#f2f2f2',
    playerNameWeight:   700,
    playerNameSize:     34,
    // Row1 — total badge
    totalBadgeWeight:   900,
    totalBadgeSize:     38,
    totalBadgeColorFn:  td => td<0?'#C0392B':td<=7?'#1a5bb5':td<=17?'#2e7d32':td<=27?'#888888':'#111111',
    totalBadgeTextColor:'#f2f2f2',
    // Row2 — progress squares
    sqCurBg:            '#39ff14',
    sqCurTextColor:     '#0b0b0b',
    sqPastBg:           'rgba(255,255,255,0.65)',
    sqPastTextColor:    'rgba(255,255,255,0.90)',
    sqFutureBg:         'rgba(255,255,255,0.18)',
    sqFutureTextColor:  'rgba(255,255,255,0.35)',
    sqRadius:           0,
    sqNumWeight:        700,
    sqNumSize:          15,
    // Dividers — neon green
    dividerColor:       '#39ff14',
    dividerWidth:       1,
    row12DivColor:      'rgba(255,255,255,0.10)',
    row12DivWidth:      0.6,
    // Row3 — distance (neon green)
    distValColor:       '#39ff14',
    distValWeight:      700,
    distValSize:        22,
    distUnitColor:      'rgba(242,242,242,0.60)',
    distUnitWeight:     600,
    distUnitSize:       13,
    // Row3 — shot type
    shotTypeColor:      'rgba(242,242,242,0.80)',
    shotTypeWeight:     700,
    shotTypeSize:       24,
    // Row3 — result badge
    resultBadgeRadius:  8,
    resultBadgeWeight:  700,
    resultBadgeSize:    24,
    resultBadgeTextColor:'#0b0b0b',
  },
  sc: {
    cardBg:             '#0b0b0b',
    cardRadius:         18,
    shadowColor:        'rgba(0,0,0,0.45)',
    shadowBlur:         24,
    shadowOffsetY:      10,
    glow:               true,
    glowColor:          '#39ff14',
    glowBlur:           12,
    borderColor:        'rgba(57,255,20,0.55)',
    borderWidth:        2,
    // Separators
    vlineColor:         'rgba(255,255,255,0.10)',
    vlineWidth:         0.6,
    subVlineColor:      'rgba(57,255,20,0.20)',
    subVlineWidth:      1.5,
    // Header — black
    hdrBg:              '#0b0b0b',
    holeLabelColor:     'rgba(242,242,242,0.65)',
    holeLabelWeight:    600,
    holeNumColor:       'rgba(242,242,242,0.90)',
    holeNumWeight:      600,
    outInDimBg:         'rgba(255,255,255,0.05)',
    outInTextColor:     'rgba(242,242,242,0.95)',
    outInWeight:        700,
    totHdrTextColor:    'rgba(242,242,242,0.95)',
    totHdrWeight:       700,
    // PAR row — dark
    parRowBg:           '#111111',
    parLabelColor:      'rgba(242,242,242,0.55)',
    parLabelWeight:     500,
    parValColor:        '#39ff14',
    parValWeight:       500,
    parSubColor:        '#39ff14',
    parSubWeight:       700,
    parTotColor:        '#39ff14',
    parTotWeight:       700,
    // Score row — dark
    scoreRowBg:         '#0d0d0d',
    scoreRowDivColor:   'rgba(255,255,255,0.08)',
    scoreLabelColor:    'rgba(242,242,242,0.55)',
    scoreLabelWeight:   700,
    scoreSubBg:         'rgba(57,255,20,0.05)',
    emptyDashColor:     'rgba(255,255,255,0.22)',
    emptyDashWeight:    400,
    scoreBadgeRadius:   6,
    scoreBadgeTextColor:'#0b0b0b',
    scoreBadgeWeight:   800,
    subTotBg:           '#1a1a1a',
    subTotTextColor:    '#f2f2f2',
    subTotWeight:       800,
    totTextColor:       '#39ff14',
    totWeight:          700,
    scoreColors: {
      eagle:'#7b2cff', birdie:'#39ff14', par:'#e0e0e0',
      bogey:'#ff4d4d', double:'#9e9e9e', triple:'#555555', over:'#333333', empty:'#444444',
    },
    nameBadgeBg:        '#1a1a1a',
    nameBadgeTextColor: '#39ff14',
    nameBadgeWeight:    700,
    nameBadgeSize:      34,
    nameBadgeRadius:    8,
  },
};

THEMES.vivid = {
  name: 'Vivid',
  shot: {
    // Frame — coral-pink glow border
    borderColor:        'rgba(255,90,120,0.70)',
    borderWidth:        2,
    cornerRadius:       14,
    glow:               true,
    glowColor:          '#ff5a78',
    glowBlur:           10,
    // Background — deep dark blue
    leftBg:             '#0d1b2a',
    midBandBg:          '#0d1b2a',
    rightBg:            '#0a1628',
    // Left col — hole number
    holeNumColor:       '#ffffff',
    holeNumWeight:      900,
    holeNumSize:        58,
    // Left col — PAR label
    parLabelColor:      'rgba(255,255,255,0.60)',
    parLabelWeight:     700,
    parLabelSize:       20,
    // Left col — par value (electric cyan)
    parValColor:        '#00e5ff',
    parValWeight:       900,
    parValSize:         40,
    // Row1 — player name
    playerNameColor:    '#ffffff',
    playerNameWeight:   700,
    playerNameSize:     34,
    // Row1 — total badge
    totalBadgeWeight:   900,
    totalBadgeSize:     38,
    totalBadgeColorFn:  td => td<0?'#ff5a78':td<=7?'#00e5ff':td<=17?'#a78bfa':td<=27?'#64748b':'#1e293b',
    totalBadgeTextColor:'#ffffff',
    // Row2 — progress squares
    sqCurBg:            '#ff5a78',
    sqCurTextColor:     '#ffffff',
    sqPastBg:           'rgba(255,255,255,0.55)',
    sqPastTextColor:    'rgba(255,255,255,0.90)',
    sqFutureBg:         'rgba(255,255,255,0.15)',
    sqFutureTextColor:  'rgba(255,255,255,0.30)',
    sqRadius:           0,
    sqNumWeight:        700,
    sqNumSize:          15,
    // Dividers — coral pink
    dividerColor:       '#ff5a78',
    dividerWidth:       1,
    row12DivColor:      'rgba(255,255,255,0.10)',
    row12DivWidth:      0.6,
    // Row3 — distance (electric cyan)
    distValColor:       '#00e5ff',
    distValWeight:      700,
    distValSize:        22,
    distUnitColor:      'rgba(255,255,255,0.55)',
    distUnitWeight:     600,
    distUnitSize:       13,
    // Row3 — shot type
    shotTypeColor:      'rgba(255,255,255,0.85)',
    shotTypeWeight:     700,
    shotTypeSize:       24,
    // Row3 — result badge
    resultBadgeRadius:  6,
    resultBadgeWeight:  700,
    resultBadgeSize:    24,
    resultBadgeTextColor:'#ffffff',
  },
  sc: {
    cardBg:             '#0d1b2a',
    cardRadius:         14,
    shadowColor:        'rgba(0,0,0,0.50)',
    shadowBlur:         20,
    shadowOffsetY:      8,
    glow:               true,
    glowColor:          '#ff5a78',
    glowBlur:           10,
    borderColor:        'rgba(255,90,120,0.50)',
    borderWidth:        2,
    // Separators
    vlineColor:         'rgba(255,255,255,0.08)',
    vlineWidth:         0.6,
    subVlineColor:      'rgba(0,229,255,0.20)',
    subVlineWidth:      1.5,
    // Header — deep navy
    hdrBg:              '#0a1628',
    holeLabelColor:     'rgba(255,255,255,0.55)',
    holeLabelWeight:    600,
    holeNumColor:       'rgba(255,255,255,0.90)',
    holeNumWeight:      600,
    outInDimBg:         'rgba(255,90,120,0.15)',
    outInTextColor:     'rgba(255,255,255,0.95)',
    outInWeight:        700,
    totHdrTextColor:    'rgba(255,255,255,0.95)',
    totHdrWeight:       700,
    // PAR row
    parRowBg:           '#111d2e',
    parLabelColor:      'rgba(255,255,255,0.50)',
    parLabelWeight:     500,
    parValColor:        '#00e5ff',
    parValWeight:       500,
    parSubColor:        '#00e5ff',
    parSubWeight:       700,
    parTotColor:        '#00e5ff',
    parTotWeight:       700,
    // Score row
    scoreRowBg:         '#0d1b2a',
    scoreRowDivColor:   'rgba(255,255,255,0.06)',
    scoreLabelColor:    'rgba(255,255,255,0.50)',
    scoreLabelWeight:   700,
    scoreSubBg:         'rgba(0,229,255,0.05)',
    emptyDashColor:     'rgba(255,255,255,0.20)',
    emptyDashWeight:    400,
    scoreBadgeRadius:   6,
    scoreBadgeTextColor:'#ffffff',
    scoreBadgeWeight:   800,
    subTotBg:           '#152238',
    subTotTextColor:    '#ffffff',
    subTotWeight:       800,
    totTextColor:       '#ff5a78',
    totWeight:          700,
    scoreColors: {
      eagle:'#a78bfa', birdie:'#ff5a78', par:'#00e5ff',
      bogey:'#fbbf24', double:'#9e9e9e', triple:'#555555', over:'#333333', empty:'#3a3a3a',
    },
    nameBadgeBg:        '#152238',
    nameBadgeTextColor: '#ff5a78',
    nameBadgeWeight:    700,
    nameBadgeSize:      34,
    nameBadgeRadius:    8,
  },
};

function getTheme(){ return THEMES[S.theme] || THEMES.classic; }

// ── Panel frame helper — draws border, shadow, bg fill, sets clip ──
// withBg: true for scorecard (fill whole card first), false for shot (caller draws bg sections)
// crVal:  corner radius in unscaled px (e.g. th.cornerRadius or th.cardRadius)
function drawPanelFrame(ctx, X, Y, W, H, scale, th, withBg, crVal){
  const r = Math.min((crVal||8)*scale, W/2, H/2);
  const goldFrame = !!th.goldFrame;

  if(withBg){
    ctx.shadowColor   = th.shadowColor    || 'rgba(0,0,0,0.35)';
    ctx.shadowBlur    = (th.shadowBlur    || 10) * scale;
    ctx.shadowOffsetY = (th.shadowOffsetY || 3)  * scale;
    rrect(ctx, X, Y, W, H, r);
    ctx.fillStyle = th.cardBg || '#fff';
    ctx.fill();
    ctx.shadowColor = 'transparent';
  }

  if(goldFrame){
    // Outer gold border
    rrect(ctx, X, Y, W, H, r);
    ctx.strokeStyle = th.borderColor;
    ctx.lineWidth   = Math.max(th.borderWidth, th.borderWidth * scale);
    ctx.stroke();
    // Inner highlight border (inset by half outer border width)
    const d = (th.borderWidth * scale) / 2;
    rrect(ctx, X+d, Y+d, W-2*d, H-2*d, Math.max(r-d, 0));
    ctx.strokeStyle = th.borderInnerColor || 'rgba(255,255,255,0.55)';
    ctx.lineWidth   = Math.max(1, (th.borderInnerWidth||1.5) * scale);
    ctx.stroke();
  } else if(th.borderColor){
    // Border — with optional neon glow
    if(th.glow){
      ctx.save();
      ctx.shadowColor   = th.glowColor || th.borderColor;
      ctx.shadowBlur    = (th.glowBlur || 12) * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    rrect(ctx, X, Y, W, H, r);
    ctx.strokeStyle = th.borderColor;
    ctx.lineWidth   = Math.max(th.borderWidth||1.5, (th.borderWidth||1.5) * scale);
    ctx.stroke();
    if(th.glow) ctx.restore(); // clear shadow immediately
  }

  // Clip to card shape
  rrect(ctx, X, Y, W, H, r);
  ctx.clip();

  if(goldFrame){
    // Top highlight streak
    ctx.fillStyle = th.borderInnerColor || 'rgba(255,255,255,0.55)';
    ctx.fillRect(X, Y, W, Math.max(1, 1.5*scale));
  }
}

function setTheme(t){
  S.theme = t; D.ws().theme = t;
  document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active', b.dataset.theme===t));
  render(); scheduleSave();
}

// ============================================================
// CANVAS ENGINE
// ============================================================
let cvEl, dpr=1, cvCssW=0, cvCssH=0;
let dragging=null, dragStart={};
const SNAP_CENTER_PX = 12; // snap-to-center threshold in px

function getCanvasCssDims(){
  const area=document.getElementById('preview');
  const aw=area.clientWidth||800, ah=area.clientHeight||450;
  let cw,ch;
  if(S.ratio==='16:9'){ch=ah;cw=ah*(16/9);if(cw>aw){cw=aw;ch=aw*(9/16);}}
  else if(S.ratio==='9:16'){cw=aw;ch=aw*(16/9);if(ch>ah){ch=ah;cw=ah*(9/16);}}
  else{const s=Math.min(aw,ah);cw=s;ch=s;}
  return{w:Math.floor(cw),h:Math.floor(ch)};
}

function initCanvas(){
  cvEl=document.getElementById('cv');
  dpr=window.devicePixelRatio||1;
  cvEl.addEventListener('mousedown',onDragStart);
  cvEl.addEventListener('mousemove',onCursorUpdate);
  window.addEventListener('mousemove',onDragMove);
  window.addEventListener('mouseup',onDragEnd);
  cvEl.addEventListener('touchstart',onTouchStart,{passive:false});
  window.addEventListener('touchend',onTouchEnd);
}

function evPt(e){
  if(e.touches&&e.touches.length) return{x:e.touches[0].clientX,y:e.touches[0].clientY};
  if(e.changedTouches&&e.changedTouches.length) return{x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};
  return{x:e.clientX,y:e.clientY};
}

function snapPos(px,py,ow,oh){
  // Only snap to safe zone edges when safe zone is enabled
  if(S.safeZone){
    const sz=parseFloat(S.szSize||10)/100;
    const sx=cvCssW*sz,sy=cvCssH*sz,ex=cvCssW*(1-sz),ey=cvCssH*(1-sz);
    if(Math.abs(px-sx)<8) px=sx;
    if(Math.abs(px+ow-ex)<8) px=ex-ow;
    if(Math.abs(py-sy)<8) py=sy;
    if(Math.abs(py+oh-ey)<8) py=ey-oh;
  }
  // Canvas edge snaps (always)
  if(Math.abs(px)<6) px=0;
  if(Math.abs(px+ow-cvCssW)<6) px=cvCssW-ow;
  if(Math.abs(py)<6) py=0;
  if(Math.abs(py+oh-cvCssH)<6) py=cvCssH-oh;
  // Clamp: keep at least 40% of overlay height visible vertically, 10px horizontally
  return{x:Math.max(-ow+10,Math.min(cvCssW-10,px)),y:Math.max(-oh+10,Math.min(cvCssH-oh*0.4,py))};
}

// v4.5: center-snap for scorecard
function snapPosWithCenter(px,py,ow,oh){
  const sn=snapPos(px,py,ow,oh);
  // horizontal center snap
  const centerX=(cvCssW-ow)/2;
  if(Math.abs(sn.x-centerX)<SNAP_CENTER_PX){
    sn.x=centerX;
    return{...sn, centered:true};
  }
  return{...sn, centered:false};
}

// Resolve scorecard X accounting for 'centered' flag
function getSCDrawX(scale){
  const pos=S.scorecardPos[S.ratio];
  const w=getSCWidth(scale);
  if(pos.centered){
    return (cvCssW-w)/2;
  }
  if(pos.absX!==undefined) return pos.absX*cvCssW;
  return pos.x*cvCssW-w/2; // pos.x is center-x, convert to left edge
}

function onDragStart(e){
  const pt=evPt(e);
  const rect=cvEl.getBoundingClientRect();
  const mx=(pt.x-rect.left)/rect.width*cvCssW;
  const my=(pt.y-rect.top)/rect.height*cvCssH;
  const scale=cvCssW/1920;
  if(S.showShot&&curHole().delta!==null){
    const pos=S.overlayPos[S.ratio];
    const ox=pos.x*cvCssW, oy=pos.y*cvCssH;
    if(mx>=ox&&mx<=ox+SHOT_W*scale&&my>=oy&&my<=oy+SHOT_H*scale){
      dragging='overlay'; dragStart={mx,my,ox,oy}; e.preventDefault(); return;
    }
  }
  if(S.showScore){
    const scX=getSCDrawX(scale);
    const scY=S.scorecardPos[S.ratio].y*cvCssH;
    const sw=getSCWidth(scale),sh=getSCHeight(scale);
    if(mx>=scX&&mx<=scX+sw&&my>=scY&&my<=scY+sh){
      dragging='scorecard'; dragStart={mx,my,ox:scX,oy:scY}; e.preventDefault();
    }
  }
}
function onDragMove(e){
  if(!dragging) return; e.preventDefault();
  const pt=evPt(e);
  const rect=cvEl.getBoundingClientRect();
  const mx=(pt.x-rect.left)/rect.width*cvCssW;
  const my=(pt.y-rect.top)/rect.height*cvCssH;
  const dx=mx-dragStart.mx, dy=my-dragStart.my;
  const scale=cvCssW/1920;
  if(dragging==='overlay'){
    const sn=snapPos(dragStart.ox+dx,dragStart.oy+dy,SHOT_W*scale,SHOT_H*scale);
    S.overlayPos[S.ratio]={x:sn.x/cvCssW,y:sn.y/cvCssH};
  } else {
    const sw=getSCWidth(scale),sh=getSCHeight(scale);
    const sn=snapPosWithCenter(dragStart.ox+dx,dragStart.oy+dy,sw,sh);
    S.scorecardPos[S.ratio]={
      x:(sn.x+sw/2)/cvCssW, // store center-x for reference
      y:sn.y/cvCssH,
      centered:sn.centered||false,
      // also store absolute for non-centered
      absX:sn.x/cvCssW
    };
  }
  redrawOnly(); scheduleSave();
}
function onDragEnd(e){
  if(dragging==='scorecard'&&dragStart){
    const pt=evPt(e);
    const rect=cvEl.getBoundingClientRect();
    const mx=(pt.x-rect.left)/rect.width*cvCssW;
    const my=(pt.y-rect.top)/rect.height*cvCssH;
    const moved=Math.abs(mx-dragStart.mx)+Math.abs(my-dragStart.my);
    if(moved<4){
      // Click (not drag) — check if on course name area (name row, right half)
      const scale=cvCssW/1920;
      // (course name editing moved to right panel)
    }
  }
  dragging=null;
}
function onTouchStart(e){
  if(e.touches.length===1) onDragStart(e);
  if(dragging) window.addEventListener('touchmove',onTouchMove,{passive:false});
}
function onTouchMove(e){ if(e.touches.length===1) onDragMove(e); }
function onTouchEnd(e){
  onDragEnd(e);
  window.removeEventListener('touchmove',onTouchMove);
}

function onCursorUpdate(e){
  if(dragging) return;
  const rect=cvEl.getBoundingClientRect();
  const mx=(e.clientX-rect.left)/rect.width*cvCssW;
  const my=(e.clientY-rect.top)/rect.height*cvCssH;
  const scale=cvCssW/1920;
  // Check if over scorecard course name area
  if(S.showScore){
    const scX=getSCDrawX(scale);
    const scY=S.scorecardPos[S.ratio].y*cvCssH;
    const sw=getSCWidth(scale);
    const nameRowH=40*scale;
    if(mx>=scX+sw/2&&mx<=scX+sw&&my>=scY&&my<=scY+nameRowH){
      cvEl.style.cursor='text'; return;
    }
  }
  cvEl.style.cursor='move';
}

// ── RENDER ──
function render(){
  dpr=window.devicePixelRatio||1;
  const dims=getCanvasCssDims();
  cvCssW=dims.w; cvCssH=dims.h;
  cvEl.width=Math.round(dims.w*dpr);
  cvEl.height=Math.round(dims.h*dpr);
  cvEl.style.width=dims.w+'px';
  cvEl.style.height=dims.h+'px';
  const area=document.getElementById('preview');
  cvEl.style.left=((area.clientWidth-dims.w)/2)+'px';
  cvEl.style.top=((area.clientHeight-dims.h)/2)+'px';
  redrawOnly();
  buildHoleNav();
  buildDeltaBtn();
  buildTypeButtons();
  updateRightPanel();
  updateMobUI();
}

function redrawOnly(){
  const ctx=cvEl.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,cvCssW,cvCssH);
  ctx.save();
  ctx.globalAlpha=S.overlayOpacity??1;
  drawOverlays(ctx,cvCssW,cvCssH,false);
  ctx.restore();
}

function drawOverlays(ctx,w,h,forExport){
  if(S.safeZone) drawSafeZone(ctx,w,h);
  const baseScale=w/1920;
  const is916=S.ratio==='9:16';
  if(S.showShot&&curHole().delta!==null){
    const shotScale=baseScale*(is916?1.6:1);
    const pos=S.overlayPos[S.ratio];
    drawShotOverlay(ctx,pos.x*w,pos.y*h,shotScale);
  }
  if(S.showScore){
    const scScale=baseScale*(is916?1.35:1);
    const scW=getSCWidth(scScale), scH=getSCHeight(scScale);
    let scX;
    const pos=S.scorecardPos[S.ratio];
    if(pos.centered){
      scX=(w-scW)/2;
    } else if(pos.absX!==undefined){
      scX=pos.absX*w;
    } else {
      scX=pos.x*w-scW/2;
    }
    // Clamp Y so scorecard stays visible (at least 60% of height within canvas)
    const scY=Math.min(pos.y*h, h-scH*0.6);
    drawScorecardOverlay(ctx,scX,scY,scScale);
  }
}

function drawSafeZone(ctx,w,h){
  ctx.save(); ctx.setLineDash([6,5]); ctx.lineWidth=1;
  if(S.szSize==='5'||S.szSize==='both'){const p=0.05;ctx.strokeStyle='rgba(255,220,0,.35)';ctx.strokeRect(w*p,h*p,w*(1-2*p),h*(1-2*p));}
  if(S.szSize==='10'||S.szSize==='both'){const p=0.10;ctx.strokeStyle='rgba(255,160,0,.4)';ctx.strokeRect(w*p,h*p,w*(1-2*p),h*(1-2*p));}
  ctx.restore();
}

// ── SHOT OVERLAY — v4.5 ──
function drawShotOverlay(ctx,X,Y,scale){
  const th=getTheme().shot;
  const h=curHole();
  const W=SHOT_W*scale, H=SHOT_H*scale;
  const r1=ROW1*scale, r2=ROW2*scale, r3=ROW3*scale;
  const colW=COL_W*scale, rpad=RPAD*scale;

  ctx.save();
  drawPanelFrame(ctx, X, Y, W, H, scale, th, false, th.cornerRadius);

  // BG
  ctx.fillStyle=th.leftBg;   ctx.fillRect(X,Y,colW,H);
  ctx.fillStyle=th.rightBg;  ctx.fillRect(X+colW,Y,W-colW,H);
  ctx.fillStyle=th.midBandBg; ctx.fillRect(X+colW,Y+r1,W-colW,r2);

  // ── LEFT: hole number ──
  ctx.fillStyle=th.holeNumColor;
  ctx.font=`${th.holeNumWeight} ${Math.round(th.holeNumSize*scale)}px ${SF}`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(String(S.currentHole+1),X+colW/2,Y+H*0.31);

  ctx.fillStyle=th.parLabelColor;
  ctx.font=`${th.parLabelWeight} ${Math.round(th.parLabelSize*scale)}px ${SF}`;
  ctx.fillText('PAR',X+colW/2,Y+H*0.57);

  ctx.fillStyle=th.parValColor;
  ctx.font=`${th.parValWeight} ${Math.round(th.parValSize*scale)}px ${SF}`;
  ctx.fillText(parDisplay(h),X+colW/2,Y+H*0.80);

  // ── ROW1: player name + total badge ──
  const rx=X+colW+rpad, rW=W-colW-2*rpad;

  // Total badge: only show in overview/result mode (shotIndex<0), not per-shot view
  const _ci=S.currentHole;
  const _totalHoles=S.holes.slice(0,_ci+1).filter(x=>x.delta!==null);
  const _ctxTd=_totalHoles.reduce((a,x)=>a+x.delta,0);
  const _ctxTg=_totalHoles.reduce((a,x)=>a+safePar(x)+x.delta,0);
  const _showTotal=S.showTotal&&_totalHoles.length>0&&h.shotIndex<0;

  let nameMaxW=rW;
  if(_showTotal){
    const bTxt=S.displayMode==='topar'?fmtDeltaDisplay(_ctxTd):String(_ctxTg);
    ctx.font=`${th.totalBadgeWeight} ${Math.round(th.totalBadgeSize*scale)}px ${SF}`;
    const btw=ctx.measureText(bTxt).width;
    const reservedBadgeW=Math.max(80*scale,btw+24*scale);
    nameMaxW=rW-reservedBadgeW+rpad;
  }

  const nameFontSz=Math.round(th.playerNameSize*scale);
  ctx.fillStyle=th.playerNameColor;
  ctx.font=`${th.playerNameWeight} ${nameFontSz}px ${SF}`;
  ctx.textAlign='left'; ctx.textBaseline='middle';
  let name=currentPlayerDisplayName().toUpperCase();
  const origName=name;
  while(ctx.measureText(name).width>nameMaxW&&name.length>1) name=name.slice(0,-1);
  if(name!==origName) name=name.slice(0,-1)+'…';
  ctx.fillText(name,rx,Y+r1/2);

  // Total badge — context-aware: in-play=prev holes, result=include current hole
  if(_showTotal){
    const bColor=th.totalBadgeColorFn(_ctxTd);
    const bTxt=S.displayMode==='topar'?fmtDeltaDisplay(_ctxTd):String(_ctxTg);
    const badgeMinW=80*scale;
    ctx.font=`${th.totalBadgeWeight} ${Math.round(th.totalBadgeSize*scale)}px ${SF}`;
    const btw=ctx.measureText(bTxt).width;
    const bW=Math.max(badgeMinW,btw+24*scale);
    const bx=X+W-bW, by=Y, bh=r1;
    ctx.fillStyle=bColor; ctx.fillRect(bx,by,bW,bh);
    ctx.fillStyle=th.totalBadgeTextColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(bTxt,bx+bW/2,by+bh/2);
  }

  // ── ROW2: progress squares ──
  const gross=getGross(h), si=h.shotIndex;
  const overviewMode=si<0;
  const noScore=(h.delta===null);
  const hp=safePar(h);
  // Overview+score: show exactly gross squares; overview+no-score: show par*2+1; per-shot: max(si+1, par*2+1)
  const sqCount=overviewMode?(noScore?Math.max(hp*2+1,1):(gross||0)):Math.max(si+1, hp*2+1);
  const sqSz=24*scale, sqGap=5*scale;
  const totalSqW=sqCount*(sqSz+sqGap)-sqGap;
  const sqStartX=X+W-rpad-totalSqW;
  const sqCY=Y+r1+r2/2;

  for(let i=0;i<sqCount;i++){
    const bx=sqStartX+i*(sqSz+sqGap), by=sqCY-sqSz/2;
    const isCur=!overviewMode&&i===si, isPast=!overviewMode&&i<si;
    const isParZone=i<hp; // within par strokes
    rrect(ctx,bx,by,sqSz,sqSz,th.sqRadius*scale);
    if(isCur){
      ctx.fillStyle=th.sqCurBg; ctx.fill();
      ctx.fillStyle=th.sqCurTextColor;
    } else if(isPast||(overviewMode&&!noScore)){
      ctx.fillStyle=th.sqPastBg; ctx.fill();
      ctx.fillStyle=th.sqPastTextColor;
    } else if(isParZone){
      // Par-zone squares: darker (prominent)
      ctx.fillStyle=th.sqPastBg; ctx.fill();
      ctx.fillStyle=th.sqPastTextColor;
    } else {
      // Beyond-par squares: lighter (subdued)
      ctx.fillStyle=th.sqFutureBg; ctx.fill();
      ctx.fillStyle=th.sqFutureTextColor;
    }
    ctx.font=`${th.sqNumWeight} ${Math.round(th.sqNumSize*scale)}px ${SF}`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(i+1),bx+sqSz/2,sqCY);
  }

  // DIVIDER (gold)
  const divY=Y+r1+r2;
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle=th.dividerColor;
  ctx.lineWidth=Math.max(1,th.dividerWidth*scale);
  ctx.beginPath(); ctx.moveTo(X+colW,divY); ctx.lineTo(X+W,divY); ctx.stroke();
  ctx.restore();

  // ── ROW3: three-column ──
  const r3y=divY, r3h=r3;
  const midX=X+colW+rW/2;
  const shotFontSz=Math.round(th.shotTypeSize*scale);
  const toPinFontSz=Math.round(th.distValSize*scale);
  const resultFontSz=Math.round(th.resultBadgeSize*scale);

  // ── Shot display (v11.4 — lastTag model) ──
  const effSi=overviewMode?Math.max((gross||1)-1,0):si;
  const eff=getEffectiveShot(h,effSi);
  const isResultMode=overviewMode; // overview = result mode (show delta badge)

  // LEFT: To Pin distance (only in per-shot mode)
  const shotToPin=overviewMode?null:getShotToPin(h,si);
  if(!isResultMode && shotToPin!==null){
    const distVal=String(shotToPin);
    const unit=T('ydsLabel');
    ctx.fillStyle=th.distValColor;
    ctx.font=`${th.distValWeight} ${toPinFontSz}px ${SF}`;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(distVal,rx,r3y+r3h/2);
    const dw=ctx.measureText(distVal).width;
    ctx.fillStyle=th.distUnitColor;
    ctx.font=`${th.distUnitWeight} ${Math.round(th.distUnitSize*scale)}px ${SF}`;
    ctx.fillText(unit,rx+dw+3*scale,r3y+r3h/2);
  }

  // CENTER: show only the lastTag label (most recently clicked)
  let centerTxt='';
  if(!overviewMode){
    centerTxt=shotLastTagLabel(h,si);
    // Fallback to note if no tag label
    if(!centerTxt){
      const shotNote=h.shots[si]?.notes||h.shots[si]?.note||'';
      if(shotNote) centerTxt=shotNote.toUpperCase();
    }
  }
  if(centerTxt){
    ctx.font=`${th.shotTypeWeight} ${shotFontSz}px ${SF}`;
    ctx.fillStyle=th.shotTypeColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(centerTxt,midX,r3y+r3h/2);
  }

  // RIGHT: result badge (only in overview/result mode)
  if(isResultMode){
    const resultTxt=deltaLabel(h.delta);
    ctx.font=`${th.resultBadgeWeight} ${resultFontSz}px ${SF}`;
    const rtw=ctx.measureText(resultTxt).width;
    const rbW=Math.max(rtw+20*scale,64*scale), rbH=32*scale;
    const rbx=X+W-rpad-rbW, rby=r3y+(r3h-rbH)/2;
    rrect(ctx,rbx,rby,rbW,rbH,th.resultBadgeRadius*scale);
    ctx.fillStyle=deltaColorHex(h.delta); ctx.fill();
    ctx.fillStyle=th.resultBadgeTextColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(resultTxt,rbx+rbW/2,rby+rbH/2);
  }

  // Row1/Row2 divider
  ctx.strokeStyle=th.row12DivColor;
  ctx.lineWidth=Math.max(.5,th.row12DivWidth*scale);
  ctx.beginPath(); ctx.moveTo(X+colW,Y+r1); ctx.lineTo(X+W,Y+r1); ctx.stroke();

  ctx.restore();
}

function rrect(ctx,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

// ============================================================
// EXPORT — helpers
// ============================================================
function expGetDims(){
  const res=S.exportRes||2160;
  let w,h;
  if(S.ratio==='16:9'){w=Math.round(res*16/9);h=res;}
  else if(S.ratio==='9:16'){w=Math.round(res*9/16);h=res;}
  else{w=res;h=res;}
  return{w,h};
}
function expSanitize(s){ return (s||'').replace(/[^\w\u4e00-\u9fa5\u3040-\u30ff\uAC00-\uD7A3]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')||'_'; }
// Capitalize first letter of each underscore-separated word, lowercase the rest
function expTitleCase(s){ return s.split('_').map(w=>w?w[0].toUpperCase()+w.slice(1).toLowerCase():'').join('_'); }
function expResLabel(){ const r=S.exportRes||2160; return r>=2160?'4K':r>=1440?'1440P':'1080P'; }
function expModeLabel(){ return S.displayMode==='gross'?'Gross':'ToPar'; }
function expCourse(){ return expTitleCase(expSanitize(S.courseName)||'Course'); }
function expPlayer(){ if(S.currentPlayerId){const p=(S.players||[]).find(p=>D.rpid(p)===S.currentPlayerId);if(p)return expTitleCase(expSanitize(D.playerDisplayName(p)));} return 'Session'; }
function expShotType(st){ return expTitleCase(st||'Shot'); }
function expHole(n){ return `Hole${String(n).padStart(2,'0')}`; }
function expShotFile(hole,shotNum,st){ return `${expPlayer()}_${expHole(hole)}_S${String(shotNum).padStart(2,'0')}_${expShotType(st)}_${expResLabel()}.png`; }
function expFinalFile(hole,res){ return `${expPlayer()}_${expHole(hole)}_ZFinal_${res}_${expResLabel()}.png`; }
function expSCFile(k,range){ return `${expPlayer()}_SC_${String(k).padStart(2,'0')}_${range}_${expResLabel()}.png`; }

function expCanvasToBlob(canvas){ return new Promise(r=>canvas.toBlob(r,'image/png')); }
function expSleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function expMakeShotCanvas(w,h){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d'); ctx.globalAlpha=S.overlayOpacity??1;
  const is916=S.ratio==='9:16';
  const scale=(w/1920)*(is916?1.6:1), pos=S.overlayPos[S.ratio];
  drawShotOverlay(ctx,pos.x*w,pos.y*h,scale);
  return c;
}
function expMakeSCCanvas(w,h){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d'); ctx.globalAlpha=S.overlayOpacity??1;
  const is916=S.ratio==='9:16';
  const scale=(w/1920)*(is916?1.35:1), scW=getSCWidth(scale), pos=S.scorecardPos[S.ratio];
  let scX; if(pos.centered)scX=(w-scW)/2; else if(pos.absX!==undefined)scX=pos.absX*w; else scX=pos.x*w-scW/2;
  const scH=getSCHeight(scale);
  const scY=Math.min(pos.y*h, h-scH*0.6);
  drawScorecardOverlay(ctx,scX,scY,scale);
  return c;
}

function expGetForType(delta){
  if(delta<=-1) return 'FOR_BIRDIE';
  if(delta===0) return 'FOR_PAR';
  if(delta===1) return 'FOR_BOGEY';
  if(delta===2) return 'FOR_DOUBLE';
  return 'FOR_TRIPLE';
}

function expDownloadBlob(blob,fname){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=fname;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),4000);
}

function showExpStatus(ok,errMsg){
  const el=document.getElementById('exp-status');
  el.className=''; el.textContent=ok?'✓':'!';
  el.classList.add(ok?'ok':'err');
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.className='',ok?1000:2000);
}

function expShowProgress(txt,frac){
  const wrap=document.getElementById('exp-progress-wrap');
  const bar=document.getElementById('exp-progress-bar');
  const label=document.getElementById('exp-progress-txt');
  if(!wrap) return;
  wrap.style.display='block';
  if(bar) bar.style.width=Math.round((frac||0)*100)+'%';
  if(label) label.textContent=txt||'';
}
function expHideProgress(){
  const wrap=document.getElementById('exp-progress-wrap');
  if(wrap) wrap.style.display='none';
}

// ── Export Modal ──
function openExportModal(){
  const m=document.getElementById('export-modal');
  if(m) m.style.display='';
}
function closeExportModal(e){
  if(e&&e.target&&e.target.id!=='export-modal') return;
  const m=document.getElementById('export-modal');
  if(m) m.style.display='none';
}

// ── Single: Shot Overlay only ──
function doExportShotOnly(){
  const h=curHole();
  if(h.delta===null){ miniToast(T('setScoreFirst'),true); return; }
  const{w,h:H}=expGetDims();
  const canvas=expMakeShotCanvas(w,H);
  const effIdx=h.shotIndex<0?Math.max((getGross(h)||1)-1,0):h.shotIndex;
  const st=(h.shots[effIdx]?.type||'SHOT').toUpperCase();
  const fname=expShotFile(S.currentHole+1,effIdx+1,st);
  expCanvasToBlob(canvas).then(blob=>{ expDownloadBlob(blob,fname); showExpStatus(true); }).catch(()=>showExpStatus(false));
}

// ── Single: Scorecard only ──
function doExportScorecardOnly(){
  const{w,h}=expGetDims();
  const canvas=expMakeSCCanvas(w,h);
  const fname=expSCFile(S.currentHole+1,`1-${Math.max(0,S.currentHole)}`);
  expCanvasToBlob(canvas).then(blob=>{ expDownloadBlob(blob,fname); showExpStatus(true); }).catch(()=>showExpStatus(false));
}

// ── Batch: current hole shot sequence → ZIP ──
async function doExportHoleSequence(){
  if(typeof JSZip==='undefined'){ miniToast(T('jsZipNotLoaded'),true); return; }
  const players=D.sc().players;
  if(players.length===0){ miniToast(T('addPlayersFirst'),true); return; }
  const holeIdx=D.ws().currentHole, holeNum=holeIdx+1;
  const savedPid=D.ws().currentPlayerId;
  const savedShotIndex=D.ws().shotIndex;
  const exportPlayers=[];
  for(const p of players){
    if(D.getPlayerGross(D.rpid(p), holeIdx)!==null) exportPlayers.push(p);
  }
  if(exportPlayers.length===0){ miniToast(T('setScoreFirst'),true); return; }

  const{w,h:H}=expGetDims();
  const zip=new JSZip();
  let totalSteps=1;
  exportPlayers.forEach(p=>{
    const g=D.getPlayerGross(D.rpid(p), holeIdx)||0;
    totalSteps+=g*2+1;
  });
  let step=0;

  try{
    for(const p of exportPlayers){
      // Switch to this player for rendering
      const _rpId=D.rpid(p);
      D.ws().currentPlayerId=(_rpId===D.SESSION)?null:_rpId;
      D.syncS(S);
      const h=S.holes[holeIdx];
      const gross=getGross(h);
      if(!gross||gross<=0) continue;
      const pName=expTitleCase(expSanitize(D.playerDisplayName(p)));

      for(let i=0;i<gross;i++){
        D.ws().shotIndex=i;
        D.syncS(S);
        if(i===gross-1){
          const ft=expGetForType(h.delta);
          if(!h.shots[i]) h.shots[i]=D.defShot();
          if(!h.shots[i].purpose) { h.shots[i].purpose=ft; h.shots[i].lastTag='purpose'; }
        }
        const eff=getEffectiveShot(h,i);
        const setTags=[];
        if(eff.type)    setTags.push({cat:'type',    val:eff.type});
        if(eff.purpose) setTags.push({cat:'purpose', val:eff.purpose});
        if(eff.result)  setTags.push({cat:'result',  val:eff.result});
        // flags is now an array
        if(eff.flags&&eff.flags.length) eff.flags.forEach(f=>setTags.push({cat:'flags',val:f}));
        if(setTags.length===0) setTags.push({cat:'type',val:'SHOT'});
        const savedLastTag=h.shots[i]?.lastTag;
        for(const tag of setTags){
          if(!h.shots[i]) h.shots[i]=D.defShot();
          h.shots[i].lastTag=tag.cat;
          D.syncS(S);
          step++;
          const tagStr=String(tag.val).replace(/ /g,'_').toUpperCase();
          expShowProgress(`${pName} S${i+1} ${tagStr}`,step/totalSteps);
          const canvas=expMakeShotCanvas(w,H);
          zip.file(`${pName}_${expHole(holeNum)}_S${String(i+1).padStart(2,'0')}_${expShotType(tagStr)}_${expResLabel()}.png`,await expCanvasToBlob(canvas));
          await expSleep(10);
        }
        if(h.shots[i]) h.shots[i].lastTag=savedLastTag;
      }
      // FINAL frame: overview mode
      D.ws().shotIndex=-1;
      D.syncS(S);
      step++;
      expShowProgress(`${pName} Final`,step/totalSteps);
      const fcanvas=expMakeShotCanvas(w,H);
      const resultStr=deltaLabel(h.delta).replace(/\s+/g,'_').toUpperCase();
      zip.file(`${pName}_${expHole(holeNum)}_ZFinal_${resultStr}_${expResLabel()}.png`,await expCanvasToBlob(fcanvas));
    }
    // Restore original player
    D.ws().currentPlayerId=savedPid;
    D.ws().shotIndex=savedShotIndex;
    D.syncS(S);

    expShowProgress('Packaging ZIP…',0.97);
    const zblob=await zip.generateAsync({type:'blob'});
    expDownloadBlob(zblob,`${expHole(holeNum)}_AllPlayers.zip`);
    expShowProgress('Done ✓',1);
    setTimeout(expHideProgress,2500);
  } catch(err){
    miniToast(T('exportError')+': '+err.message,true);
    expHideProgress();
    // restore original player
    D.ws().currentPlayerId=savedPid; S.currentPlayerId=savedPid;
    D.syncS(S);
  } finally{
    redrawOnly();
    if(typeof buildPlayerArea==='function') buildPlayerArea();
  }
}

// ── Batch: scorecard sequence (hole 1-18) → ZIP ──
async function doExportScorecardSequence(){
  if(typeof JSZip==='undefined'){ miniToast(T('jsZipNotLoaded'),true); return; }
  const{w,h}=expGetDims();
  const zip=new JSZip();
  const savedHole=S.currentHole, savedSummary=S.scorecardSummary;
  S.scorecardSummary=null;

  const _scTotal=S.holes.length||18;
  try{
    for(let k=1;k<=_scTotal;k++){
      S.currentHole=k; // scorecard shows holes 0..k-1 (before hole k)
      expShowProgress(`Scorecard ${k}/${_scTotal}`,k/_scTotal);
      const canvas=expMakeSCCanvas(w,h);
      const rangeStr=k<=1?'0':`1-${k-1}`;
      const fname=expSCFile(k,rangeStr);
      const blob=await expCanvasToBlob(canvas);
      zip.file(fname,blob);
      await expSleep(10);
    }
    // TOT view
    S.scorecardSummary='tot';
    expShowProgress('SC TOT…',0.97);
    const totCanvas=expMakeSCCanvas(w,h);
    const totFname=`${expPlayer()}_SC_TOT_1-${_scTotal}_${expModeLabel()}_${expResLabel()}.png`;
    const totBlob=await expCanvasToBlob(totCanvas);
    zip.file(totFname,totBlob);

    expShowProgress('Packaging ZIP…',0.99);
    const zblob=await zip.generateAsync({type:'blob'});
    expDownloadBlob(zblob,`${expPlayer()}_SC_sequence.zip`);
    expShowProgress('Done ✓',1);
    setTimeout(expHideProgress,2500);
  } catch(err){
    miniToast(T('exportError')+': '+err.message,true);
    expHideProgress();
  } finally{
    S.currentHole=savedHole; S.scorecardSummary=savedSummary;
    redrawOnly();
  }
}

// ── EXPORT ALL (all players × all holes) ──
async function doExportAll(){
  if(typeof JSZip==='undefined'){ miniToast(T('jsZipNotLoaded'),true); return; }
  const zip=new JSZip();
  const{w,h}=expGetDims();
  const ws=D.ws();
  const savedHole=ws.currentHole, savedPid=ws.currentPlayerId, savedSummary=ws.scorecardSummary, savedSI=ws.shotIndex;
  const players=(D.sc().players.length>0)?D.sc().players:[{roundPlayerId:effectivePlayerId(),name:ws.playerName||T('playerLbl')}];
  const _expHoles=D.holeCount();
  const totalSteps=players.length*_expHoles+players.length*(_expHoles+1);
  let step=0;
  try{
    for(const p of players){
      const _rpId=D.rpid(p);
      const _pName=D.playerDisplayName(p);
      ws.currentPlayerId=(_rpId===D.SESSION)?null:_rpId;
      D.syncS(S);
      for(let hi=0;hi<_expHoles;hi++){
        ws.currentHole=hi; ws.scorecardSummary=null; ws.shotIndex=-1;
        D.syncS(S);
        step++; expShowProgress(`${_pName} Shot H${hi+1}`,step/totalSteps);
        redrawOnly();
        const cv=expMakeShotCanvas(w,h);
        const fn=`${expSanitize(_pName)}_${expHole(hi+1)}_Shot_${expModeLabel()}_${expResLabel()}.png`;
        const blob=await expCanvasToBlob(cv);
        zip.file(fn,blob);
        await expSleep(10);
      }
      ws.scorecardSummary=null;
      for(let k=1;k<=_expHoles;k++){
        ws.currentHole=k;
        D.syncS(S);
        step++; expShowProgress(`${_pName} SC ${k}/${_expHoles}`,step/totalSteps);
        const scCv=expMakeSCCanvas(w,h);
        const rangeStr=k<=1?'0':`1-${k-1}`;
        const fn=expSCFile(k,rangeStr).replace(expPlayer(),expSanitize(_pName));
        const blob=await expCanvasToBlob(scCv);
        zip.file(fn,blob);
        await expSleep(10);
      }
      ws.scorecardSummary='tot';
      D.syncS(S);
      step++; expShowProgress(`${_pName} SC TOT`,step/totalSteps);
      const totCv=expMakeSCCanvas(w,h);
      const totFn=`${expSanitize(D.playerDisplayName(p))}_SC_TOT_1-${_expHoles}_${expModeLabel()}_${expResLabel()}.png`;
      const totBlob=await expCanvasToBlob(totCv);
      zip.file(totFn,totBlob);
    }
    ws.currentPlayerId=savedPid; ws.currentHole=savedHole; ws.scorecardSummary=savedSummary; ws.shotIndex=savedSI;
    D.syncS(S);
    expShowProgress('Packaging ZIP…',0.99);
    const zblob=await zip.generateAsync({type:'blob'});
    expDownloadBlob(zblob,`ALL_export.zip`);
    expShowProgress('Done ✓',1);
    setTimeout(expHideProgress,2500);
  } catch(err){
    miniToast(T('exportError')+': '+err.message,true);
    expHideProgress();
    ws.currentPlayerId=savedPid; ws.currentHole=savedHole; ws.scorecardSummary=savedSummary; ws.shotIndex=savedSI;
    D.syncS(S);
  }
  redrawOnly();
}


// ============================================================
// MOBILE RECORD MODE
// ============================================================
const MOB_LIE_TYPES = [
  {type:'FW',label:'FW'},{type:'ROUGH',label:'Rough'},
  {type:'BUNKER',label:'Bunker'},{type:'TREES',label:'Trees'},
  {type:'WATER',label:'Water'},{type:'OB',label:'OB'},
  {type:'DROP',label:'Drop'},{type:'GREEN',label:'Green'},
];

function isMobile(){ return screen.width <= 480 || document.documentElement.classList.contains('narrow'); }

function mobAddStroke(){
  const pid=D.pid(), hi=D.ws().currentHole;
  D.adjPlayerGross(pid, hi, 1);
  const g=D.getPlayerGross(pid, hi);
  if(g && g > 0) D.ws().shotIndex = g - 1;
  D.syncS(S);
  render(); scheduleSave();
}

function mobUndoStroke(){
  const pid=D.pid(), hi=D.ws().currentHole;
  const g=D.getPlayerGross(pid, hi);
  if(g === null) return;
  if(g <= 1){
    clearHole();
  } else {
    D.adjPlayerGross(pid, hi, -1);
    const ng=D.getPlayerGross(pid, hi);
    if(ng && ng > 0) D.ws().shotIndex = ng - 1;
    D.syncS(S);
    render(); scheduleSave();
  }
}

function mobFinishHole(){ gotoNextHole(); }

function mobCyclePar(){
  const h = curHole();
  const p = safePar(h);
  const next = p === 3 ? 4 : p === 4 ? 5 : p === 5 ? 3 : 4;
  setPar(next);
}

function mobAdjDist(delta){
  const inp = document.getElementById('mob-dist-inp');
  let val = parseInt(inp.value) || 0;
  val = Math.max(0, Math.min(999, val + delta));
  inp.value = val;
  setShotToPin(val);
  updateMobUI();
}

function mobToggleResult(){
  document.getElementById('mob-result-sec').classList.toggle('expanded');
}

function mobResetHole(){
  clearHole(); closeMobMore();
}

function openMobMore(){
  document.getElementById('mob-more-bg').classList.add('show');
  document.getElementById('mob-more-menu').classList.add('show');
}
function closeMobMore(){
  document.getElementById('mob-more-bg').classList.remove('show');
  document.getElementById('mob-more-menu').classList.remove('show');
}

function mobDoExport(){
  closeMobMore();
  const h = curHole();
  if(h.delta === null){ miniToast('Set score first', true); return; }
  doExportShotOnly();
}

// ── Mobile Preview ──
let mobPvCv, mobPvDragging=null, mobPvDragStart={};

function openMobPreview(){
  closeMobMore();
  const pv = document.getElementById('mob-preview');
  pv.classList.add('show');
  const bgEl = document.getElementById('mob-pv-bg');
  bgEl.src = S.userBg || DEFAULT_BG;
  bgEl.style.display = 'block';
  bgEl.style.opacity = S.bgOpacity;
  mobPvCv = document.getElementById('mob-pv-cv');
  setTimeout(mobPvRender, 50);
  mobPvCv.addEventListener('touchstart', mobPvTouchStart, {passive:false});
  window.addEventListener('touchmove', mobPvTouchMove, {passive:false});
  window.addEventListener('touchend', mobPvTouchEnd);
}

function closeMobPreview(){
  document.getElementById('mob-preview').classList.remove('show');
  if(mobPvCv){
    mobPvCv.removeEventListener('touchstart', mobPvTouchStart);
    window.removeEventListener('touchmove', mobPvTouchMove);
    window.removeEventListener('touchend', mobPvTouchEnd);
  }
}

function mobPvRender(){
  if(!mobPvCv) return;
  const area = document.getElementById('mob-pv-area');
  const aw = area.clientWidth, ah = area.clientHeight;
  let cw, ch;
  if(S.ratio==='16:9'){ch=ah;cw=ah*(16/9);if(cw>aw){cw=aw;ch=aw*(9/16);}}
  else if(S.ratio==='9:16'){cw=aw;ch=aw*(16/9);if(ch>ah){ch=ah;cw=ah*(9/16);}}
  else{const s=Math.min(aw,ah);cw=s;ch=s;}
  cw=Math.floor(cw); ch=Math.floor(ch);
  const d = window.devicePixelRatio || 1;
  mobPvCv.width = Math.round(cw * d);
  mobPvCv.height = Math.round(ch * d);
  mobPvCv.style.width = cw + 'px';
  mobPvCv.style.height = ch + 'px';
  mobPvCv.style.left = ((aw - cw) / 2) + 'px';
  mobPvCv.style.top = ((ah - ch) / 2) + 'px';
  const ctx = mobPvCv.getContext('2d');
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.globalAlpha = S.overlayOpacity ?? 1;
  const savedW = cvCssW, savedH = cvCssH;
  cvCssW = cw; cvCssH = ch;
  drawOverlays(ctx, cw, ch, false);
  cvCssW = savedW; cvCssH = savedH;
  ctx.restore();
}

function mobPvTouchStart(e){
  if(e.touches.length !== 1) return;
  const t = e.touches[0];
  const rect = mobPvCv.getBoundingClientRect();
  const cw = parseInt(mobPvCv.style.width);
  const ch = parseInt(mobPvCv.style.height);
  const mx = (t.clientX - rect.left) / rect.width * cw;
  const my = (t.clientY - rect.top) / rect.height * ch;
  const scale = cw / 1920;
  if(S.showShot && curHole().delta !== null){
    const pos = S.overlayPos[S.ratio];
    const ox = pos.x * cw, oy = pos.y * ch;
    if(mx >= ox && mx <= ox + SHOT_W*scale && my >= oy && my <= oy + SHOT_H*scale){
      mobPvDragging = 'overlay'; mobPvDragStart = {mx, my, ox, oy, cw, ch};
      e.preventDefault(); return;
    }
  }
  if(S.showScore){
    const is916 = S.ratio==='9:16';
    const scScale = scale * (is916?1.35:1);
    const scW = getSCWidth(scScale);
    const pos = S.scorecardPos[S.ratio];
    const scX = pos.centered ? (cw-scW)/2 : (pos.absX!==undefined ? pos.absX*cw : pos.x*cw-scW/2);
    const scY = pos.y * ch;
    const scH = getSCHeight(scScale);
    if(mx >= scX && mx <= scX+scW && my >= scY && my <= scY+scH){
      mobPvDragging = 'scorecard'; mobPvDragStart = {mx, my, ox:scX, oy:scY, cw, ch};
      e.preventDefault();
    }
  }
}

function mobPvTouchMove(e){
  if(!mobPvDragging) return;
  e.preventDefault();
  const t = e.touches[0];
  const rect = mobPvCv.getBoundingClientRect();
  const {cw, ch} = mobPvDragStart;
  const mx = (t.clientX - rect.left) / rect.width * cw;
  const my = (t.clientY - rect.top) / rect.height * ch;
  const dx = mx - mobPvDragStart.mx, dy = my - mobPvDragStart.my;
  const scale = cw / 1920;
  if(mobPvDragging === 'overlay'){
    const nx = Math.max(0, Math.min(cw-1, mobPvDragStart.ox + dx));
    const ny = Math.max(0, Math.min(ch-1, mobPvDragStart.oy + dy));
    S.overlayPos[S.ratio] = {x: nx/cw, y: ny/ch};
  } else {
    const is916 = S.ratio==='9:16';
    const scScale = scale * (is916?1.35:1);
    const sw = getSCWidth(scScale);
    const sh = getSCHeight(scScale);
    const nx = Math.max(0, Math.min(cw-1, mobPvDragStart.ox + dx));
    const ny = Math.max(0, Math.min(ch-sh*0.4, mobPvDragStart.oy + dy));
    const centerX = (cw - sw) / 2;
    const centered = Math.abs(nx - centerX) < 12;
    S.scorecardPos[S.ratio] = {x:(nx+sw/2)/cw, y:ny/ch, centered, absX:nx/cw};
  }
  mobPvRender(); scheduleSave();
}

function mobPvTouchEnd(){ mobPvDragging = null; }

// ── Mobile UI Update ──
function updateMobUI(){
  if(!isMobile()) return;
  const h = curHole();
  const idx = S.currentHole;
  const gross = getGross(h);

  // Header
  document.getElementById('mob-hole-lbl').textContent = T('holeHero', idx+1);
  document.getElementById('mob-par-lbl').textContent = T('parLabel', hasRealPar(h)?h.par:'—');
  const tp = h.shotIndex<0?null:getShotToPin(h, h.shotIndex);
  document.getElementById('mob-tp-val').textContent = tp !== null ? tp : '\u2014';
  document.getElementById('mob-tp-unit').textContent = T('distUnit').charAt(0);

  // Distance input
  const distInp = document.getElementById('mob-dist-inp');
  if(document.activeElement !== distInp){
    distInp.value = tp !== null ? tp : '';
  }

  // Lie capsules
  buildMobLieCapsules();

  // Result bar
  const strokesTxt = document.getElementById('mob-strokes-txt');
  const resultTxt = document.getElementById('mob-result-txt');
  if(h.delta !== null){
    strokesTxt.textContent = T('strokesTxt',gross);
    resultTxt.textContent = deltaLabel(h.delta);
    resultTxt.style.background = deltaColorHex(h.delta);
  } else {
    strokesTxt.textContent = T('strokesEmpty');
    resultTxt.textContent = '\u2014';
    resultTxt.style.background = 'var(--s2)';
  }

  // Result edit
  document.getElementById('mob-result-gross').textContent = gross !== null ? gross : '\u2014';
  buildMobResultQuick();

  // Scorecard summary
  buildMobScSummary();

  // Hole nav
  buildMobHoleNav();
}

function buildMobLieCapsules(){
  const cont = document.getElementById('mob-lie-scroll');
  if(!cont) return;
  cont.innerHTML = '';
  const h = curHole();
  const curType = (h.delta !== null && h.shotIndex >= 0) ? (h.shots[h.shotIndex]?.type || '') : '';
  const allTypes = [
    ...ACTION_TYPES.map(t => ({type:t.type, label:T(t.labelKey)})),
    ...MOB_LIE_TYPES,
  ];
  allTypes.forEach(({type, label}) => {
    const btn = document.createElement('button');
    btn.className = 'mob-lie-btn' + (curType === type ? ' active' : '');
    btn.textContent = label;
    btn.onclick = () => {
      if(h.delta === null) mobAddStroke();
      setShotType(type);
      updateMobUI();
    };
    cont.appendChild(btn);
  });
}

function buildMobResultQuick(){
  const cont = document.getElementById('mob-result-quick');
  if(!cont) return;
  cont.innerHTML = '';
  const h = curHole();
  const quick = [
    {d:-3,l:'Albatross'},{d:-2,l:'Eagle'},{d:-1,l:'Birdie'},
    {d:0,l:'Par'},{d:1,l:'Bogey'},{d:2,l:'+2'},{d:3,l:'+3+'}
  ];
  quick.forEach(({d,l}) => {
    const btn = document.createElement('button');
    btn.className = 'mob-quick-btn' + (h.delta === d ? ' active' : '');
    btn.textContent = l;
    if(h.delta === d) btn.style.background = deltaColorHex(d);
    btn.onclick = () => { setDelta(d); };
    cont.appendChild(btn);
  });
}

function buildMobScSummary(){
  const cont = document.getElementById('mob-sc-row');
  if(!cont) return;
  cont.innerHTML = '';
  const _mHalf=Math.ceil((S.holes.length||18)/2);
  const f9p = S.holes.slice(0,_mHalf).reduce((a,h)=>a+safePar(h),0);
  const f9g = S.holes.slice(0,_mHalf).reduce((a,h)=>a+safePar(h)+(h.delta??0),0);
  const b9p = S.holes.slice(_mHalf).reduce((a,h)=>a+safePar(h),0);
  const b9g = S.holes.slice(_mHalf).reduce((a,h)=>a+safePar(h)+(h.delta??0),0);
  [{lbl:'F9',par:f9p,val:f9g},{lbl:'B9',par:b9p,val:b9g},{lbl:'TOT',par:f9p+b9p,val:f9g+b9g}].forEach(({lbl,par,val}) => {
    const span = document.createElement('span');
    span.className = 'mob-sc-item';
    span.innerHTML = `<span class="sc-lbl">${lbl}</span><span class="sc-val">${val}</span><span class="sc-par">/${par}</span>`;
    cont.appendChild(span);
  });
}

function buildMobHoleNav(){
  const cont = document.getElementById('mob-nav-scroll');
  if(!cont) return;
  cont.innerHTML = '';
  for(let i=0; i<(S.holes.length||18); i++){
    const h = S.holes[i];
    const btn = document.createElement('div');
    btn.className = 'mob-hole-btn ' + deltaCardClass(h.delta);
    if(i === S.currentHole) btn.classList.add('active');
    let sc = '\u2014';
    if(h.delta !== null) sc = S.displayMode === 'topar' ? fmtDeltaDisplay(h.delta) : String(safePar(h) + h.delta);
    btn.innerHTML = `<div class="mh-num">${i+1}</div><div class="mh-par">P${hasRealPar(h)?h.par:'—'}</div><div class="mh-sc">${sc}</div>`;
    btn.onclick = () => {
      S.currentHole = i; D.ws().currentHole = i;
      S.scorecardSummary = null; D.ws().scorecardSummary = null;
      if(RoundManager.getRound()){
        const oh=RoundManager.getOrderedHoles();
        if(oh&&oh[i]) RoundManager.setCurrentHole(oh[i].holeId);
      }
      resetAllShotIndex(i);
      render(); scheduleSave();
    };
    cont.appendChild(btn);
  }
  setTimeout(() => {
    const active = cont.querySelector('.active');
    if(active){
      const parent=cont.parentElement||cont;
      const left=active.offsetLeft - parent.clientWidth/2 + active.offsetWidth/2;
      parent.scrollTo({left:Math.max(0,left), behavior:'smooth'});
    }
  }, 50);
}

// ── Mobile Swipe Gesture ──
function initMobSwipe(){
  const body = document.getElementById('mob-body');
  if(!body) return;
  let startX = 0, startY = 0, startTime = 0;
  body.addEventListener('touchstart', e => {
    if(e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }, {passive:true});
  body.addEventListener('touchend', e => {
    if(e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;
    if(dt > 400 || Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 60) return;
    if(dx < 0) gotoNextHole();
    else gotoPrevHole();
  }, {passive:true});
}

// ── Mobile Distance Input Wiring ──
function wireMobDist(){
  const inp = document.getElementById('mob-dist-inp');
  if(!inp) return;
  inp.oninput = e => {
    const val = e.target.value === '' ? null : parseInt(e.target.value);
    setShotToPin(isNaN(val) ? null : val);
    updateMobUI();
  };
  // (removed auto scrollIntoView on focus — causes page jump on mobile)
  // Long-press support for distance +/- buttons
  const adjMap = {
    'mob-adj-m5': -5, 'mob-adj-m1': -1,
    'mob-adj-p1': 1,  'mob-adj-p5': 5
  };
  Object.entries(adjMap).forEach(([id, delta]) => {
    const btn = document.getElementById(id);
    if(!btn) return;
    let timer = null, interval = null;
    const fire = () => mobAdjDist(delta);
    const stopRepeat = () => { clearTimeout(timer); clearInterval(interval); timer=null; interval=null; };
    btn.addEventListener('click', fire);
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      fire();
      timer = setTimeout(() => { interval = setInterval(fire, 80); }, 400);
    }, {passive:false});
    btn.addEventListener('touchend', stopRepeat);
    btn.addEventListener('touchcancel', stopRepeat);
  });
}

// ── Mobile Keyboard Handling ──
function initMobKeyboard(){
  if(!window.visualViewport) return;
  window.visualViewport.addEventListener('resize', () => {
    const vvh = window.visualViewport.height;
    const wh = window.innerHeight;
    const bar = document.getElementById('mob-bar');
    if(!bar) return;
    if(vvh < wh * 0.75){
      bar.style.display = 'none';
    } else {
      bar.style.display = '';
    }
  });
}

// ============================================================
// NARROW SCREEN HELPERS (≤480px — iPhone adaptation)
// ============================================================

function toggleNarrowOpts(){
  const ptool = document.getElementById('ptool');
  if(!ptool) return;
  ptool.classList.toggle('narrow-hidden');
  const btn = document.getElementById('btn-opts-toggle');
  if(btn) btn.textContent = ptool.classList.contains('narrow-hidden') ? T('optionsBtn') : T('optionsClose');
}

function narrowAutoScrollNav(){
  if(!isMobile()) return;
  const cont = document.getElementById('sc-grid');
  if(!cont) return;
  const active = cont.querySelector('.sg-active');
  if(active) setTimeout(() => {
    const parent=cont.parentElement||cont;
    const left=active.offsetLeft - parent.clientWidth/2 + active.offsetWidth/2;
    parent.scrollTo({left:Math.max(0,left), behavior:'smooth'});
  }, 60);
}

// ============================================================
// INIT
// ============================================================
function init(){
  loadSaved();
  initCanvas();
  wireAll();

  // Seed ClubStore from courses.json (incremental merge), then restore active round.
  // Expose promise so Shell can wait before routing.
  window._clubSeedReady = ClubStore.seedFromJSON().then(()=>{
    restoreActiveRound();
  }).catch(e=>{
    console.warn('[init] ClubStore seed skipped:', e.message);
    restoreActiveRound();
  });

  // Sync UI
  document.querySelectorAll('.ratio-btn').forEach(b=>b.classList.toggle('active',b.dataset.ratio===S.ratio));
  document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active',b.dataset.theme===(S.theme||'classic')));
  document.querySelectorAll('.res-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.res)===S.exportRes));
  const _ip=document.getElementById('inp-player'); if(_ip) _ip.value=S.playerName||'';
  document.getElementById('inp-course').value=S.courseName||'';
  document.getElementById('chk-shot').checked=S.showShot;
  document.getElementById('chk-score').checked=S.showScore;
  const chkPN=document.getElementById('chk-show-pname'); if(chkPN) chkPN.checked=!!S.showPlayerName;
  const chkPNnav=document.getElementById('chk-pname-nav'); if(chkPNnav) chkPNnav.checked=!!S.showPlayerName;
  document.getElementById('chk-total').checked=S.showTotal;
  const _scRangeSec=document.getElementById('score-range-sec'); if(_scRangeSec){ _scRangeSec.style.display=''; _scRangeSec.classList.toggle('show',!!S.showScore); }
  document.querySelectorAll('[name=scr]').forEach(r=>r.checked=r.value===S.scoreRange);
  // Clear transient scorecardSummary on load so radio setting takes effect
  S.scorecardSummary=null; D.ws().scorecardSummary=null;
  updateScoreRangeLabels();
  document.getElementById('bg-opacity').value=Math.round((S.bgOpacity??1)*100);
  document.getElementById('bg-opacity-val').textContent=Math.round((S.bgOpacity??1)*100)+'%';
  document.getElementById('overlay-opacity').value=Math.round((S.overlayOpacity??1)*100);
  document.getElementById('overlay-opacity-val').textContent=Math.round((S.overlayOpacity??1)*100)+'%';
  document.getElementById('chk-sz').checked=!!S.safeZone;
  document.getElementById('sz-size').value=S.szSize||'10';

  LANG=S.lang||'en';
  document.querySelectorAll('.lang-opt').forEach(b=>b.classList.toggle('active',b.dataset.lang===LANG));
  const _langBtn=document.getElementById('btn-lang');
  if(_langBtn) _langBtn.textContent=LANG_LABELS[LANG]||LANG;

  applyLang();
  applyUITheme(S.uiTheme);
  document.querySelectorAll('[data-ui-theme]').forEach(b=>b.classList.toggle('active',b.dataset.uiTheme===S.uiTheme));
  applyBg();
  // Restore saved player — only switch if saved player is valid
  const ws=D.ws();
  if(S.players.length>0 && ws.currentPlayerId){
    const valid=S.players.some(p=>D.rpid(p)===ws.currentPlayerId);
    if(!valid){ ws.currentPlayerId=D.rpid(S.players[0]); D.syncS(S); }
  } else if(S.players.length>0 && !ws.currentPlayerId){
    ws.currentPlayerId=D.rpid(S.players[0]); D.syncS(S);
  }
  // Preserve saved currentHole (clamp to valid range)
  const maxHole=D.holeCount()-1;
  if(typeof ws.currentHole!=='number'||ws.currentHole<0||ws.currentHole>maxHole){ ws.currentHole=0; D.syncS(S); }

  if(typeof buildPlayerArea==='function') buildPlayerArea();

  // Defer first render to ensure layout is settled — prevents position jumping
  requestAnimationFrame(()=>{ render(); requestAnimationFrame(render); });

  // Mobile init
  initMobSwipe();
  wireMobDist();
  initMobKeyboard();
  updateMobUI();

  // Narrow screen init
  // lang button init handled above
  if(isMobile()){
    const ptool = document.getElementById('ptool');
    if(ptool) ptool.classList.add('narrow-hidden');
  }
}

window.addEventListener('DOMContentLoaded',init);
// Flush pending saves on page unload / tab switch to prevent data loss
window.addEventListener('beforeunload',()=>{ clearTimeout(saveTimer); doSave(); });
window.addEventListener('pagehide',()=>{ clearTimeout(saveTimer); doSave(); });
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'){ clearTimeout(saveTimer); doSave(); } });
