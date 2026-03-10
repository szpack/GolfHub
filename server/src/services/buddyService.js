// ============================================================
// buddyService.js — BuddyContact CRUD + search
// ============================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Enum constants (application-layer validation) ──

const BUDDY_ORIGINS = {
  manual: 'manual',
  round_sedimented: 'round_sedimented',
  browsed_followed: 'browsed_followed',
  invited: 'invited',
  imported: 'imported'
};

const BUDDY_STATUSES = {
  active: 'active',
  archived: 'archived',
  blocked: 'blocked',
  deleted: 'deleted'
};

const VALID_ORIGINS = Object.values(BUDDY_ORIGINS);
const VALID_STATUSES = Object.values(BUDDY_STATUSES);

// ── Helpers ──

function _sanitize(buddy) {
  if (!buddy) return null;
  return {
    id: buddy.id,
    ownerUserId: buddy.ownerUserId,
    linkedUserId: buddy.linkedUserId,
    displayName: buddy.displayName,
    origin: buddy.origin,
    isFollowed: buddy.isFollowed,
    isFavorite: buddy.isFavorite,
    roundsTogetherCount: buddy.roundsTogetherCount,
    lastPlayedAt: buddy.lastPlayedAt,
    firstMetAt: buddy.firstMetAt,
    firstMetAtRoundId: buddy.firstMetAtRoundId,
    lastInteractionAt: buddy.lastInteractionAt,
    // owner 视角下记录的参考差点，不是对方 Player 档案真相
    handicap: buddy.handicap != null ? Number(buddy.handicap) : null,
    notes: buddy.notes,
    status: buddy.status,
    createdAt: buddy.createdAt,
    updatedAt: buddy.updatedAt
  };
}

// ── List buddies ──

async function list(ownerUserId, { status, isFavorite, search, sortBy, sortDir, limit, offset } = {}) {
  const where = { ownerUserId };

  if (status) where.status = status;
  else where.status = { not: 'deleted' };

  if (isFavorite !== undefined) where.isFavorite = isFavorite;

  if (search) {
    where.displayName = { contains: search, mode: 'insensitive' };
  }

  // Sort
  const orderBy = [];
  if (sortBy === 'name') {
    orderBy.push({ displayName: sortDir === 'desc' ? 'desc' : 'asc' });
  } else if (sortBy === 'lastPlayed') {
    orderBy.push({ lastPlayedAt: sortDir === 'asc' ? 'asc' : 'desc' });
  } else if (sortBy === 'rounds') {
    orderBy.push({ roundsTogetherCount: sortDir === 'asc' ? 'asc' : 'desc' });
  } else {
    // Default: favorites first, then by most recent interaction
    orderBy.push({ isFavorite: 'desc' });
    orderBy.push({ lastInteractionAt: 'desc' });
    orderBy.push({ displayName: 'asc' });
  }

  const [buddies, total] = await Promise.all([
    prisma.buddyContact.findMany({
      where,
      orderBy,
      take: limit || 50,
      skip: offset || 0
    }),
    prisma.buddyContact.count({ where })
  ]);

  return { buddies: buddies.map(_sanitize), total };
}

// ── Get single buddy ──

async function get(ownerUserId, buddyId) {
  const buddy = await prisma.buddyContact.findFirst({
    where: { id: buddyId, ownerUserId }
  });
  return _sanitize(buddy);
}

// ── Create buddy ──

async function create(ownerUserId, data) {
  // Validate origin
  const origin = data.origin || BUDDY_ORIGINS.manual;
  if (!VALID_ORIGINS.includes(origin)) {
    return { error: 'Invalid origin: ' + origin };
  }

  // De-duplicate: registered user
  if (data.linkedUserId) {
    const existing = await prisma.buddyContact.findFirst({
      where: { ownerUserId, linkedUserId: data.linkedUserId, status: { not: 'deleted' } }
    });
    if (existing) {
      return { error: 'Buddy already exists', existing: _sanitize(existing) };
    }
  }

  // De-duplicate: guest by exact displayName (MVP)
  if (!data.linkedUserId && data.displayName) {
    const existing = await prisma.buddyContact.findFirst({
      where: {
        ownerUserId,
        linkedUserId: null,
        displayName: data.displayName,
        status: { not: 'deleted' }
      }
    });
    if (existing) {
      return { error: 'A contact with this name already exists', existing: _sanitize(existing) };
    }
  }

  const buddy = await prisma.buddyContact.create({
    data: {
      ownerUserId,
      linkedUserId: data.linkedUserId || null,
      displayName: (data.displayName || '').trim(),
      origin,
      isFollowed: data.isFollowed || false,
      isFavorite: data.isFavorite || false,
      roundsTogetherCount: data.roundsTogetherCount || 0,
      lastPlayedAt: data.lastPlayedAt || null,
      firstMetAt: data.firstMetAt || null,
      firstMetAtRoundId: data.firstMetAtRoundId || null,
      lastInteractionAt: data.lastInteractionAt || new Date(),
      // owner 视角下记录的参考差点，不是对方 Player 档案真相
      handicap: data.handicap != null ? data.handicap : null,
      notes: data.notes || null
    }
  });

  return { buddy: _sanitize(buddy) };
}

// ── Update buddy ──

async function update(ownerUserId, buddyId, data) {
  const existing = await prisma.buddyContact.findFirst({
    where: { id: buddyId, ownerUserId }
  });
  if (!existing) return { error: 'Buddy not found' };

  // Validate status if provided
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    return { error: 'Invalid status: ' + data.status };
  }

  const updateData = {};
  if (data.displayName !== undefined) updateData.displayName = (data.displayName || '').trim();
  if (data.isFollowed !== undefined) updateData.isFollowed = !!data.isFollowed;
  if (data.isFavorite !== undefined) updateData.isFavorite = !!data.isFavorite;
  if (data.handicap !== undefined) updateData.handicap = data.handicap;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.linkedUserId !== undefined) updateData.linkedUserId = data.linkedUserId || null;

  const buddy = await prisma.buddyContact.update({
    where: { id: buddyId },
    data: updateData
  });

  return { buddy: _sanitize(buddy) };
}

// ── Delete (soft) ──

async function remove(ownerUserId, buddyId) {
  const existing = await prisma.buddyContact.findFirst({
    where: { id: buddyId, ownerUserId }
  });
  if (!existing) return { error: 'Buddy not found' };

  await prisma.buddyContact.update({
    where: { id: buddyId },
    data: { status: BUDDY_STATUSES.deleted }
  });
  return { success: true };
}

// ── Toggle favorite ──

async function toggleFavorite(ownerUserId, buddyId) {
  const existing = await prisma.buddyContact.findFirst({
    where: { id: buddyId, ownerUserId }
  });
  if (!existing) return { error: 'Buddy not found' };

  const buddy = await prisma.buddyContact.update({
    where: { id: buddyId },
    data: { isFavorite: !existing.isFavorite }
  });

  return { buddy: _sanitize(buddy) };
}

module.exports = {
  BUDDY_ORIGINS,
  BUDDY_STATUSES,
  list,
  get,
  create,
  update,
  remove,
  toggleFavorite
};
