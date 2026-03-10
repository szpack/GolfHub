// ============================================================
// routes/buddies.js — BuddyContact CRUD API
// ============================================================

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const buddyService = require('../services/buddyService');

// All routes require authentication
router.use(requireAuth);

// ── GET /api/v1/buddies ──
router.get('/', async (req, res) => {
  try {
    const { status, isFavorite, search, sortBy, sortDir, limit, offset } = req.query;

    const opts = {};
    if (status) opts.status = status;
    if (isFavorite !== undefined) opts.isFavorite = isFavorite === 'true';
    if (search) opts.search = search;
    if (sortBy) opts.sortBy = sortBy;
    if (sortDir) opts.sortDir = sortDir;
    if (limit) opts.limit = Math.min(parseInt(limit, 10) || 50, 200);
    if (offset) opts.offset = parseInt(offset, 10) || 0;

    const result = await buddyService.list(req.userId, opts);
    res.json(result);
  } catch (err) {
    console.error('[buddies/list]', err);
    res.status(500).json({ error: 'Failed to list buddies' });
  }
});

// ── GET /api/v1/buddies/:id ──
router.get('/:id', async (req, res) => {
  try {
    const buddy = await buddyService.get(req.userId, req.params.id);
    if (!buddy) {
      return res.status(404).json({ error: 'Buddy not found' });
    }
    res.json({ buddy });
  } catch (err) {
    console.error('[buddies/get]', err);
    res.status(500).json({ error: 'Failed to fetch buddy' });
  }
});

// ── POST /api/v1/buddies ──
router.post('/', async (req, res) => {
  try {
    const { displayName, linkedUserId, origin, isFollowed, isFavorite, handicap, notes } = req.body || {};

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    if (handicap !== undefined && handicap !== null) {
      const h = Number(handicap);
      if (isNaN(h) || h < -10 || h > 54) {
        return res.status(400).json({ error: 'Handicap must be between -10 and 54' });
      }
    }

    const result = await buddyService.create(req.userId, {
      displayName, linkedUserId, origin, isFollowed, isFavorite, handicap, notes
    });

    if (result.error) {
      return res.status(409).json(result);
    }
    res.status(201).json(result);
  } catch (err) {
    console.error('[buddies/create]', err);
    res.status(500).json({ error: 'Failed to create buddy' });
  }
});

// ── PATCH /api/v1/buddies/:id ──
router.patch('/:id', async (req, res) => {
  try {
    const { displayName, linkedUserId, isFollowed, isFavorite, handicap, notes, status } = req.body || {};

    if (displayName !== undefined && (typeof displayName !== 'string' || displayName.trim().length === 0)) {
      return res.status(400).json({ error: 'Display name cannot be empty' });
    }

    if (handicap !== undefined && handicap !== null) {
      const h = Number(handicap);
      if (isNaN(h) || h < -10 || h > 54) {
        return res.status(400).json({ error: 'Handicap must be between -10 and 54' });
      }
    }

    const result = await buddyService.update(req.userId, req.params.id, {
      displayName, linkedUserId, isFollowed, isFavorite, handicap, notes, status
    });

    if (result.error) {
      const code = result.error === 'Buddy not found' ? 404 : 400;
      return res.status(code).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[buddies/update]', err);
    res.status(500).json({ error: 'Failed to update buddy' });
  }
});

// ── DELETE /api/v1/buddies/:id ──
router.delete('/:id', async (req, res) => {
  try {
    const result = await buddyService.remove(req.userId, req.params.id);
    if (result.error) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[buddies/delete]', err);
    res.status(500).json({ error: 'Failed to delete buddy' });
  }
});

// ── POST /api/v1/buddies/:id/toggle-favorite ──
router.post('/:id/toggle-favorite', async (req, res) => {
  try {
    const result = await buddyService.toggleFavorite(req.userId, req.params.id);
    if (result.error) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[buddies/toggleFavorite]', err);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

module.exports = router;
