// ============================================================
// index.js — Express server entry point
// ============================================================

require('dotenv/config');
const express = require('express');
const cors = require('cors');
const config = require('./config');

const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const playerRoutes = require('./routes/players');
const buddyRoutes = require('./routes/buddies');

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Trust proxy for correct req.ip behind reverse proxy ──
app.set('trust proxy', 1);

// ── Basic rate limiting (simple in-memory, replace with redis in production) ──
const rateLimitMap = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const key = req.ip + ':' + req.path;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now - entry.start > windowMs) {
      rateLimitMap.set(key, { start: now, count: 1 });
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    next();
  };
}

// ── Routes ──
app.use('/api/v1/auth', rateLimit(60000, 20), authRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/players', playerRoutes);
app.use('/api/v1/buddies', buddyRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start ──
app.listen(config.port, () => {
  console.log(`[Server] listening on port ${config.port}`);
});
