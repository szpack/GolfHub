// ============================================================
// golfliveParser.js — GolfLive Score Sheet Parser
// Depends on: SheetJS (XLSX global), importTypes.js
// ============================================================
//
// GolfLive typical layout:
//   Row 0: Match title  (e.g. "XXX三月赛-R1")
//   Row 1: Column headers (HOLE, 1, 2, ..., 18, 前9, 后9, 总差, ...)
//   Row 2: PAR row       (PAR, 4, 4, 3, 5, ...)
//   Row 3+: Player rows  (name, +1, 0, -1, E, ...)
//
// Parser is "宽松" — tolerant of variations in layout and naming.
// ============================================================

const GolfLiveParser = (function(){

  // ── Column alias dictionary for fuzzy matching ──
  var COL_ALIASES = {
    courseName:  ['所在球场','球场','Course','course'],
    groupNo:     ['分组','组别','组号','Group','group','GRP'],
    gross:       ['总杆','Gross','gross','GROSS','总成绩'],
    net:         ['净杆','Net','net','NET','净成绩'],
    totalDelta:  ['总差','To Par','TOTAL','Total','total','差'],
    outDelta:    ['前9','前九','OUT','Out','out','F9','前9差'],
    inDelta:     ['后9','后九','IN','In','in','B9','后9差'],
    team:        ['团体对抗','团队','Team','team','队伍'],
    handicap:    ['差点','Handicap','HCP','handicap','球差']
  };

  // ── PAR row identifiers ──
  var PAR_IDS = ['PAR','Par','par','标准杆','P.A.R','P A R'];

  // ── Title / round label patterns ──
  var ROUND_PATTERNS = [
    /[-—–\s]+(R\d+)\s*$/i,            // -R1, —R2
    /[-—–\s]+第(\d+)轮\s*$/,           // 第1轮
    /[-—–\s]+(Round\s*\d+)\s*$/i,      // Round 1
    /\s+(R\d+)\s*$/i                   // trailing R1
  ];

  /**
   * Parse a to-par cell value.
   * Returns integer delta or null.
   *
   * @param {*} val - Raw cell value
   * @returns {number|null}
   */
  function parseToParCell(val){
    if(val === null || val === undefined) return null;
    var s = String(val).trim();
    if(s === '' || s === '.' || s === '-' || s === '—' || s === '–' || s === '··') return null;
    // E / PAR / even = 0
    if(/^[Ee]$/.test(s) || /^PAR$/i.test(s) || /^even$/i.test(s)) return 0;
    // Numeric: +2, -1, 2, 0
    var n = parseInt(s, 10);
    if(!isNaN(n)) return n;
    return null;
  }

  /**
   * Parse a PAR cell value. Must be 3, 4, or 5.
   * @param {*} val
   * @returns {number|null}
   */
  function parseParCell(val){
    if(val === null || val === undefined) return null;
    var n = parseInt(String(val).trim(), 10);
    if(n >= 3 && n <= 5) return n;
    return null;
  }

  /**
   * Parse a summary cell (front9, back9, total delta, gross, net).
   * @param {*} val
   * @returns {number|null}
   */
  function parseSummaryCell(val){
    if(val === null || val === undefined) return null;
    var s = String(val).trim();
    if(s === '' || s === '.' || s === '-' || s === '—') return null;
    if(/^[Ee]$/.test(s)) return 0;
    var n = parseInt(s, 10);
    return isNaN(n) ? null : n;
  }

  /**
   * Find consecutive hole columns (1, 2, 3, ...) in a header row.
   * Returns array of column indices.
   *
   * @param {Array} row - Header row values
   * @returns {number[]} Column indices for holes
   */
  function findHoleColumns(row){
    if(!row || !row.length) return [];
    // Find first cell that equals 1
    var start = -1;
    for(var c = 0; c < row.length; c++){
      var v = parseInt(String(row[c] || '').trim(), 10);
      if(v === 1){ start = c; break; }
    }
    if(start < 0) return [];
    var cols = [start];
    var maxGap = 5; // allow up to 5 gap columns (OUT, IN, TOT, etc.)
    for(var c2 = start + 1; c2 < row.length; c2++){
      var v2 = parseInt(String(row[c2] || '').trim(), 10);
      if(v2 === cols.length + 1){
        cols.push(c2);
      } else {
        // Allow gaps for summary columns (OUT, IN, etc.) between hole 9 and 10
        // Look ahead up to maxGap columns for the next expected hole number
        var found = false;
        for(var g = 1; g <= maxGap && (c2 + g) < row.length; g++){
          var vg = parseInt(String(row[c2 + g] || '').trim(), 10);
          if(vg === cols.length + 1){
            cols.push(c2 + g);
            c2 = c2 + g; // skip gap columns
            found = true;
            break;
          }
        }
        if(!found) break;
      }
    }
    return cols;
  }

  /**
   * Match a header cell text against column aliases.
   * @param {string} text
   * @returns {string|null} Alias key or null
   */
  function matchAlias(text){
    if(!text) return null;
    var t = String(text).trim();
    for(var key in COL_ALIASES){
      var aliases = COL_ALIASES[key];
      for(var i = 0; i < aliases.length; i++){
        if(t === aliases[i]) return key;
      }
    }
    return null;
  }

  /**
   * Detect whether a row is the PAR row.
   * @param {Array} row
   * @returns {boolean}
   */
  function isParRow(row){
    if(!row || !row.length) return false;
    var first = String(row[0] || '').trim();
    return PAR_IDS.some(function(id){ return first === id; });
  }

  /**
   * Try to split title into event title + round label.
   * @param {string} raw
   * @returns {{title:string, roundLabel:string|null}}
   */
  function parseTitle(raw){
    if(!raw) return { title: '', roundLabel: null };
    var s = String(raw).trim();
    for(var i = 0; i < ROUND_PATTERNS.length; i++){
      var m = s.match(ROUND_PATTERNS[i]);
      if(m){
        var label = m[1];
        // Normalize "第1轮" → "R1"
        if(/^\d+$/.test(label)) label = 'R' + label;
        return {
          title: s.replace(ROUND_PATTERNS[i], '').trim(),
          roundLabel: label
        };
      }
    }
    return { title: s, roundLabel: null };
  }

  /**
   * Check if a player name looks valid (not a header/footer).
   * @param {*} val
   * @returns {boolean}
   */
  function isValidPlayerName(val){
    if(!val) return false;
    var s = String(val).trim();
    if(!s || s.length > 30) return false;
    // Reject known non-player values
    var reject = ['PAR','Par','par','HOLE','Hole','hole','总杆','净杆','标准杆',
                  '前9','后9','OUT','IN','TOT','TOTAL','总差','分组','球场'];
    if(reject.indexOf(s) >= 0) return false;
    // Reject pure numbers
    if(/^\d+$/.test(s)) return false;
    return true;
  }

  // ══════════════════════════════════════════
  // MAIN PARSE FUNCTION
  // ══════════════════════════════════════════

  /**
   * Parse a SheetJS workbook as a GolfLive score sheet.
   *
   * @param {Object} workbook - SheetJS workbook object
   * @param {Object} meta - { fileName, detectedFormat }
   * @returns {ImportedMatch}
   */
  function parseWorkbook(workbook, meta){
    var warnings = [];
    var errors = [];
    var sheetName = workbook.SheetNames[0];
    var sheet = workbook.Sheets[sheetName];

    if(!sheet){
      errors.push('工作簿中没有可用的工作表');
      return _emptyMatch(meta, sheetName, warnings, errors);
    }

    // Convert to 2D array (array of arrays)
    var rows = XLSX.utils.sheet_to_json(sheet, { header:1, defval:null, raw:false });
    if(!rows || rows.length < 3){
      errors.push('工作表行数不足（至少需要标题行、表头行、PAR行）');
      return _emptyMatch(meta, sheetName, warnings, errors);
    }

    // ── Step 1: Find header row (has consecutive hole numbers) ──
    var headerRowIdx = -1;
    var holeCols = [];
    for(var r = 0; r < Math.min(rows.length, 10); r++){
      var cols = findHoleColumns(rows[r]);
      if(cols.length >= 9){ // at least 9 holes
        headerRowIdx = r;
        holeCols = cols;
        break;
      }
    }
    if(headerRowIdx < 0){
      errors.push('找不到洞号列（需要连续的 1,2,3...9 或 1,2,...18）');
      return _emptyMatch(meta, sheetName, warnings, errors);
    }

    var holeCount = holeCols.length;
    if(holeCount !== 9 && holeCount !== 18){
      errors.push('洞数为 ' + holeCount + '（仅支持 9 洞或 18 洞）');
      return _emptyMatch(meta, sheetName, warnings, errors);
    }

    // ── Step 2: Extract title (first non-empty row before header) ──
    var rawTitle = '';
    for(var t = 0; t < headerRowIdx; t++){
      var firstCell = rows[t] && rows[t][0];
      if(firstCell && String(firstCell).trim()){
        rawTitle = String(firstCell).trim();
        break;
      }
    }
    var titleParsed = parseTitle(rawTitle);
    if(!titleParsed.roundLabel){
      warnings.push('无法从标题中识别轮次标签（如R1）：' + rawTitle);
    }

    // ── Step 3: Identify summary columns from header row ──
    var headerRow = rows[headerRowIdx];
    var summaryCols = {}; // key → column index
    for(var c = 0; c < headerRow.length; c++){
      // Skip hole columns
      if(holeCols.indexOf(c) >= 0) continue;
      var alias = matchAlias(headerRow[c]);
      if(alias) summaryCols[alias] = c;
    }

    // ── Step 4: Find PAR row ──
    var parRowIdx = -1;
    for(var pr = headerRowIdx + 1; pr < Math.min(rows.length, headerRowIdx + 5); pr++){
      if(isParRow(rows[pr])){
        parRowIdx = pr;
        break;
      }
    }
    if(parRowIdx < 0){
      errors.push('找不到PAR行（需要首列为"PAR"的行）');
      return _emptyMatch(meta, sheetName, warnings, errors);
    }

    // Extract pars
    var pars = [];
    var parRow = rows[parRowIdx];
    for(var pi = 0; pi < holeCols.length; pi++){
      var p = parseParCell(parRow[holeCols[pi]]);
      if(p === null){
        warnings.push('第' + (pi+1) + '洞PAR值异常："' + parRow[holeCols[pi]] + '"，默认为4');
        p = 4;
      }
      pars.push(p);
    }

    // ── Step 5: Extract player rows ──
    var players = [];
    var playerStartRow = parRowIdx + 1;
    var eventCourseName = null; // first valid course name

    for(var row = playerStartRow; row < rows.length; row++){
      var r2 = rows[row];
      if(!r2 || !r2.length) continue;
      var name = r2[0];
      if(!isValidPlayerName(name)) continue;

      var playerName = String(name).trim();
      var playerIssues = [];

      // Extract hole deltas
      var holeDeltas = [];
      var grossByHole = [];
      for(var hi = 0; hi < holeCols.length; hi++){
        var raw = r2[holeCols[hi]];
        var delta = parseToParCell(raw);
        holeDeltas.push(delta);
        if(delta !== null){
          var gross = pars[hi] + delta;
          if(gross < 1 || gross > 15){
            playerIssues.push('第' + (hi+1) + '洞: gross=' + gross + '（par=' + pars[hi] + ', delta=' + delta + '），已置为null');
            grossByHole.push(null);
          } else {
            grossByHole.push(gross);
          }
        } else {
          grossByHole.push(null);
        }
      }

      // Extract summary columns
      var totalsRaw = {};
      if(summaryCols.outDelta !== undefined)
        totalsRaw.outDelta = parseSummaryCell(r2[summaryCols.outDelta]);
      if(summaryCols.inDelta !== undefined)
        totalsRaw.inDelta = parseSummaryCell(r2[summaryCols.inDelta]);
      if(summaryCols.totalDelta !== undefined)
        totalsRaw.totalDelta = parseSummaryCell(r2[summaryCols.totalDelta]);
      if(summaryCols.gross !== undefined)
        totalsRaw.gross = parseSummaryCell(r2[summaryCols.gross]);
      if(summaryCols.net !== undefined)
        totalsRaw.net = parseSummaryCell(r2[summaryCols.net]);

      // Extract optional fields
      var groupNo = null;
      if(summaryCols.groupNo !== undefined){
        var gv = parseSummaryCell(r2[summaryCols.groupNo]);
        groupNo = gv;
      }
      var playerCourse = null;
      if(summaryCols.courseName !== undefined){
        var cv = r2[summaryCols.courseName];
        if(cv && String(cv).trim()){
          playerCourse = String(cv).trim();
          if(!eventCourseName) eventCourseName = playerCourse;
        }
      }

      // ── Validate totals against hole-level recalculation ──
      var half = Math.min(9, holeCount);
      var calcOutDelta = _sumDeltas(holeDeltas, 0, half);
      var calcInDelta = holeCount > 9 ? _sumDeltas(holeDeltas, 9, 18) : null;
      var calcTotalDelta = _sumDeltas(holeDeltas, 0, holeCount);
      var calcGross = _sumGross(grossByHole, 0, holeCount);

      if(totalsRaw.outDelta !== null && totalsRaw.outDelta !== undefined
         && calcOutDelta !== null && totalsRaw.outDelta !== calcOutDelta){
        playerIssues.push('前9汇总(' + totalsRaw.outDelta + ')与洞级重算(' + calcOutDelta + ')不一致');
      }
      if(totalsRaw.inDelta !== null && totalsRaw.inDelta !== undefined
         && calcInDelta !== null && totalsRaw.inDelta !== calcInDelta){
        playerIssues.push('后9汇总(' + totalsRaw.inDelta + ')与洞级重算(' + calcInDelta + ')不一致');
      }
      if(totalsRaw.totalDelta !== null && totalsRaw.totalDelta !== undefined
         && calcTotalDelta !== null && totalsRaw.totalDelta !== calcTotalDelta){
        playerIssues.push('总差汇总(' + totalsRaw.totalDelta + ')与洞级重算(' + calcTotalDelta + ')不一致');
      }
      if(totalsRaw.gross !== null && totalsRaw.gross !== undefined
         && calcGross !== null && totalsRaw.gross !== calcGross){
        playerIssues.push('总杆汇总(' + totalsRaw.gross + ')与洞级重算(' + calcGross + ')不一致');
      }

      // Check for empty scorecard
      var hasAny = holeDeltas.some(function(d){ return d !== null; });
      if(!hasAny){
        playerIssues.push('该球员无任何洞成绩');
        warnings.push('球员 "' + playerName + '" 无洞级成绩');
      }

      if(playerIssues.length > 0){
        playerIssues.forEach(function(iss){
          warnings.push('球员 "' + playerName + '": ' + iss);
        });
      }

      players.push({
        name: playerName,
        groupNo: groupNo,
        courseName: playerCourse,
        holeDeltas: holeDeltas,
        grossByHole: grossByHole,
        totalsRaw: totalsRaw,
        _issues: playerIssues,
        _rawRow: { rowIndex: row, values: r2.slice() }
      });
    }

    if(players.length === 0){
      errors.push('未找到有效的球员行');
    }

    // ── Step 6: Course name inference ──
    var courseName = eventCourseName || '';
    // Check if all players have same course
    if(eventCourseName){
      var diffCourses = players.filter(function(p){
        return p.courseName && p.courseName !== eventCourseName;
      });
      if(diffCourses.length > 0){
        warnings.push('部分球员所在球场名称不一致，使用第一个有效球场名: ' + eventCourseName);
      }
    }

    return {
      source: 'golflive',
      sourceMeta: {
        fileName: meta.fileName || '',
        sheetName: sheetName,
        detectedFormat: meta.detectedFormat || 'unknown',
        importedAt: new Date().toISOString()
      },
      event: {
        title: titleParsed.title || rawTitle || meta.fileName || '',
        roundLabel: titleParsed.roundLabel,
        courseName: courseName
      },
      course: {
        holeCount: holeCount,
        pars: pars
      },
      players: players,
      validation: {
        warnings: warnings,
        errors: errors
      }
    };
  }

  // ── Helpers ──

  function _sumDeltas(deltas, start, end){
    var sum = 0, has = false;
    for(var i = start; i < Math.min(end, deltas.length); i++){
      if(deltas[i] !== null){ sum += deltas[i]; has = true; }
    }
    return has ? sum : null;
  }

  function _sumGross(grossArr, start, end){
    var sum = 0, has = false;
    for(var i = start; i < Math.min(end, grossArr.length); i++){
      if(grossArr[i] !== null){ sum += grossArr[i]; has = true; }
    }
    return has ? sum : null;
  }

  function _emptyMatch(meta, sheetName, warnings, errors){
    return {
      source: 'golflive',
      sourceMeta: {
        fileName: meta.fileName || '',
        sheetName: sheetName || '',
        detectedFormat: meta.detectedFormat || 'unknown',
        importedAt: new Date().toISOString()
      },
      event: { title: '', roundLabel: null, courseName: '' },
      course: { holeCount: 0, pars: [] },
      players: [],
      validation: { warnings: warnings, errors: errors }
    };
  }

  // ══════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════

  return {
    parseWorkbook: parseWorkbook,
    parseToParCell: parseToParCell,
    parseTitle: parseTitle,
    findHoleColumns: findHoleColumns
  };

})();
