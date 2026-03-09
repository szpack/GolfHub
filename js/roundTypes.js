// ============================================================
// roundTypes.js — Round Type Definitions (JSDoc only)
// No runtime code — reference for Round, NewRoundService, data.js
// ============================================================

// ══════════════════════════════════════════
// ROUND (top-level container)
// ══════════════════════════════════════════

/**
 * A single golf round — the core data entity.
 *
 * @typedef {Object} Round
 * @property {string}  id          - Unique ID, format: "rnd_YYYYMMDD_<ts36><rand6>"
 * @property {string}  status      - "planned" | "playing" | "finished"
 * @property {string}  date        - YYYY-MM-DD
 *
 * @property {string|null}  courseId   - Club ID reference (ClubStore)
 * @property {string|null}  routingId  - Layout ID within the club
 * @property {number}       holeCount  - Total holes (typically 9 or 18)
 *
 * @property {PlayerSnapshot[]}           players  - Ordered player list for this round
 * @property {Object<string, RoundScores>} scores  - Keyed by roundPlayerId
 * @property {Object<string, Shot[][]>}    shots   - Keyed by roundPlayerId, [holeIndex][shotIndex]
 *
 * @property {{ type: string|null, options: Object }} game   - Gameplay config (future)
 * @property {{ name: string, id: string }}           event  - Event/tournament info
 *
 * @property {string}  notes      - Free-form round notes
 * @property {string}  createdAt  - ISO 8601 timestamp
 * @property {string}  updatedAt  - ISO 8601 timestamp
 *
 * @property {CourseHoleSnapshot[]|null} _courseSnapshot - [COMPAT] Hole data snapshot
 * @property {string|null}  _title       - Auto-generated display title
 * @property {string|null}  _teeTime     - ISO datetime of tee time
 * @property {string|null}  _teeSetId    - Selected tee set ID
 * @property {string|null}  _clubName    - Club display name at creation time
 * @property {string|null}  _routingName - Layout display name at creation time
 */

// ══════════════════════════════════════════
// PLAYER SNAPSHOT
// ══════════════════════════════════════════

/**
 * Player snapshot within a Round — immutable per-round copy.
 *
 * @typedef {Object} PlayerSnapshot
 * @property {string}      roundPlayerId - Round-scoped unique ID, format: "rp_<ts36>_<rand4>"
 * @property {string|null} playerId      - Long-term identity ID (nullable)
 * @property {string}      name          - Display name
 * @property {number}      order         - 0-based play order
 * @property {string}      team          - Team identifier (empty string if none)
 * @property {string}      color         - Color key: "blue" | "red" | "green" | ... (empty if unset)
 */

// ══════════════════════════════════════════
// SCORES & HOLES
// ══════════════════════════════════════════

/**
 * Score container for one player in a round.
 *
 * @typedef {Object} RoundScores
 * @property {Hole[]} holes - Array of length holeCount, 0-indexed
 */

/**
 * Single hole score in Round domain.
 *
 * @typedef {Object} Hole
 * @property {number|null} gross  - Actual strokes (null = not played)
 * @property {string}      status - "empty" | "valid" | "par" | "pickup" | "dnf" | "x"
 */

/**
 * Single hole score in Scorecard domain (D.sc().scores).
 * Richer than Round Hole — includes UI-coupled fields.
 *
 * @typedef {Object} ScorecardHole
 * @property {number|null} gross      - Actual strokes
 * @property {number|null} net        - Net strokes after handicap
 * @property {number|null} putts      - Putt count
 * @property {number}      penalties  - Penalty count
 * @property {string}      notes      - Hole-level notes
 * @property {string}      status     - "not_started" | "in_progress" | "completed" | "picked_up"
 * @property {Shot[]}      shots      - Per-shot detail array
 */

// ══════════════════════════════════════════
// SHOT
// ══════════════════════════════════════════

/**
 * Single shot detail record.
 *
 * @typedef {Object} Shot
 * @property {number|null}  shotNumber - 1-based ordinal within the hole
 * @property {string|null}  type       - "TEE" | "APPR" | "LAYUP" | "CHIP" | "PUTT"
 * @property {string|null}  purpose    - "FOR_BIRDIE" | "FOR_PAR" | "FOR_BOGEY" | "FOR_DOUBLE" | "FOR_TRIPLE"
 * @property {string|null}  result     - "GREEN" | "FAIRWAY" | "BUNKER" | "LIGHT_ROUGH" | "HEAVY_ROUGH" | "WATER" | "TREES"
 * @property {string[]}     flags      - ["PENALTY", "PROV", ...]
 * @property {string}       notes      - Per-shot notes
 * @property {string|null}  lastTag    - Which category was last set (for canvas display)
 * @property {number|null}  toPin      - Distance to pin in yards
 */

// ══════════════════════════════════════════
// COURSE SNAPSHOT
// ══════════════════════════════════════════

/**
 * Immutable per-round copy of a course hole from the club database.
 *
 * @typedef {Object} CourseHoleSnapshot
 * @property {number}      number   - 1-based hole number (sequential across nines)
 * @property {number}      par      - Par for the hole (3, 4, or 5)
 * @property {number|null} yards    - Yardage from selected tee set (null if no tee selected)
 * @property {string|null} holeId   - Stable hole identifier, format: "<nineId>_h<n>"
 * @property {number|null} hcpIndex - Handicap index (1-18)
 */

// ══════════════════════════════════════════
// NEW ROUND SERVICE TYPES
// ══════════════════════════════════════════

/**
 * Input for NewRoundService.createNewRound().
 *
 * @typedef {Object} NewRoundInput
 * @property {string}  clubId    - Must exist in ClubStore
 * @property {string}  layoutId  - Must exist within the club's layouts
 * @property {string}  [teeSetId]  - Optional tee set for yardage lookup
 * @property {Array<{name: string, playerId?: string}>} players - At least one required
 * @property {string}  [teeTime]   - ISO datetime; today/empty → activate, future → scheduled
 * @property {string}  [title]     - Override auto-generated title
 */

/**
 * Result from NewRoundService.createNewRound().
 * Discriminated union on `success`:
 *   success=true  → round + snapshot + metadata fields present
 *   success=false → errors array present
 *
 * @typedef {Object} NewRoundResult
 * @property {boolean}              success       - true = created, false = validation failed
 * @property {string[]}             [errors]      - Present when success=false
 * @property {Round}                [round]       - Present when success=true
 * @property {CourseHoleSnapshot[]} [snapshot]    - Present when success=true
 * @property {string}               [courseName]  - Club display name
 * @property {string}               [routingName] - Layout display name
 * @property {number}               [holeCount]   - Total holes
 * @property {boolean}              [activate]    - true = start now, false = schedule
 * @property {string}               [title]       - Auto-generated or provided title
 */

/**
 * Derived totals for one player — computed, never stored as truth.
 *
 * @typedef {Object} PlayerTotals
 * @property {number} total         - Sum of all gross scores
 * @property {number} front9        - Sum of front 9 gross
 * @property {number} back9         - Sum of back 9 gross
 * @property {number} toPar         - Sum of (gross - par) for played holes
 * @property {number} played        - Number of holes with valid gross
 * @property {number} front9Played  - Played holes in front 9
 * @property {number} back9Played   - Played holes in back 9
 */
