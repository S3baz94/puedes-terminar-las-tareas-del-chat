import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, initializeDatabase } from './database.js';

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET env variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

// Initialize database schema and seeds
initializeDatabase();

// Format Helpers to convert SQLite rows to Frontend-compatible JSON formats
function formatUser(row) {
  if (!row) return null;
  const groupIds = db.prepare('SELECT groupId FROM group_members WHERE userId = ?').all(row.uid).map(r => r.groupId);
  
  // Clean passwordHash from output user object
  const user = { ...row };
  delete user.passwordHash;

  return {
    ...user,
    ministry: row.ministry ? JSON.parse(row.ministry) : [],
    privacySettings: row.privacySettings ? JSON.parse(row.privacySettings) : { showPhone: false, showEmail: true, showCity: true },
    onboardingCompleted: row.onboardingCompleted === 1,
    groupIds
  };
}

function formatGroup(row) {
  if (!row) return null;
  const memberIds = db.prepare('SELECT userId FROM group_members WHERE groupId = ?').all(row.id).map(r => r.userId);
  const coLeaderIds = db.prepare('SELECT userId FROM group_co_leaders WHERE groupId = ?').all(row.id).map(r => r.userId);
  return {
    ...row,
    isPublic: row.isPublic === 1,
    memberIds,
    coLeaderIds
  };
}

function formatContent(row) {
  if (!row) return null;
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    isDraft: row.isDraft === 1
  };
}

function formatPrayerRequest(row) {
  if (!row) return null;
  const prayedByIds = db.prepare('SELECT userId FROM prayer_prayed_by WHERE prayerId = ?').all(row.id).map(r => r.userId);
  return {
    ...row,
    prayedByIds
  };
}

function formatEvent(row) {
  if (!row) return null;
  const targetGroupIds = db.prepare('SELECT groupId FROM event_target_groups WHERE eventId = ?').all(row.id).map(r => r.groupId);
  const attendeeIds = db.prepare('SELECT DISTINCT userId FROM event_attendees WHERE eventId = ?').all(row.id).map(r => r.userId);
  return {
    ...row,
    requiresRSVP: row.requiresRSVP === 1,
    reminderSent: row.reminderSent === 1,
    targetGroupIds,
    attendeeIds
  };
}

function formatPastoralNote(row) {
  if (!row) return null;
  return {
    ...row,
    isPrivate: row.isPrivate === 1
  };
}

function formatDonation(row) {
  if (!row) return null;
  return {
    ...row,
    isRecurring: row.isRecurring === 1
  };
}

function formatLiveStream(row) {
  if (!row) return null;
  return {
    ...row,
    chatEnabled: row.chatEnabled === 1,
    offeringEnabled: row.offeringEnabled === 1
  };
}

function formatMessage(row) {
  if (!row) return null;
  const readBy = db.prepare('SELECT userId FROM message_read_by WHERE messageId = ?').all(row.id).map(r => r.userId);
  return {
    ...row,
    isPinned: row.isPinned === 1,
    readBy
  };
}

function formatNotification(row) {
  if (!row) return null;
  return {
    ...row,
    isRead: row.isRead === 1
  };
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Authorization helper middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized access' });
    }
    next();
  };
}

// AUTH ENDPOINTS

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Correo y contraseña requeridos' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Credenciales invalidas' });
  }

  const passMatches = bcrypt.compareSync(password, user.passwordHash);
  if (!passMatches) {
    return res.status(401).json({ success: false, error: 'Credenciales invalidas' });
  }

  if (user.status === 'pending') {
    return res.status(403).json({ success: false, error: 'Su cuenta esta pendiente de aprobacion por un administrador.' });
  }

  if (user.status === 'suspended' || user.status === 'inactive') {
    return res.status(403).json({ success: false, error: 'Su cuenta esta suspendida o inactiva.' });
  }

  // Update lastActiveAt
  const nowStr = new Date().toISOString();
  db.prepare('UPDATE users SET lastActiveAt = ? WHERE uid = ?').run(nowStr, user.uid);
  user.lastActiveAt = nowStr;

  const token = jwt.sign({ uid: user.uid, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    success: true,
    token,
    user: formatUser(user),
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName, city, country } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ success: false, error: 'Campos requeridos faltantes' });
  }

  const existing = db.prepare('SELECT 1 FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (existing) {
    return res.status(400).json({ success: false, error: 'El correo electronico ya esta registrado' });
  }

  const uid = 'u-' + Date.now();
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (
      uid, email, displayName, photoURL, role, phone, city, country,
      birthDate, baptismDate, favoriteVerse, testimony, ministry, leaderId,
      status, spiritualStatus, privacySettings, onboardingCompleted, lastActiveAt, createdAt, passwordHash
    ) VALUES (?, ?, ?, null, 'member', '', ?, ?, null, null, null, null, '[]', null, 'pending', 'new_believer', '{"showPhone":false,"showEmail":true,"showCity":true}', 0, ?, ?, ?)
  `).run(uid, email, displayName, city || '', country || '', now, now, passwordHash);

  return res.status(201).json({
    success: true,
    message: 'Request submitted',
  });
});

app.post('/api/auth/onboarding', authenticateToken, (req, res) => {
  const { phone, favoriteVerse, testimony, privacySettings } = req.body;
  const uid = req.user.uid;

  db.prepare(`
    UPDATE users
    SET phone = ?, favoriteVerse = ?, testimony = ?, privacySettings = ?, onboardingCompleted = 1, lastActiveAt = ?
    WHERE uid = ?
  `).run(
    phone || '',
    favoriteVerse || null,
    testimony || null,
    JSON.stringify(privacySettings || { showPhone: false, showEmail: true, showCity: true }),
    new Date().toISOString(),
    uid
  );

  const updated = db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
  return res.json({
    success: true,
    user: formatUser(updated),
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE uid = ?').get(req.user.uid);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }
  return res.json({
    user: formatUser(user),
  });
});

// APP & ADMIN ENDPOINTS

app.get('/api/bootstrap', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT * FROM users').all().map(formatUser);
  const groups = db.prepare('SELECT * FROM groups').all().map(formatGroup);
  const content = db.prepare('SELECT * FROM content').all().map(formatContent);
  const prayerRequests = db.prepare('SELECT * FROM prayer_requests').all().map(formatPrayerRequest);
  const events = db.prepare('SELECT * FROM events').all().map(formatEvent);
  const pastoralNotes = db.prepare('SELECT * FROM pastoral_notes').all().map(formatPastoralNote);
  const donations = db.prepare('SELECT * FROM donations').all().map(formatDonation);
  const messages = db.prepare('SELECT * FROM messages').all().map(formatMessage);
  const liveStreamRow = db.prepare('SELECT * FROM live_stream LIMIT 1').get();
  const liveStream = liveStreamRow ? formatLiveStream(liveStreamRow) : null;
  const notifications = db.prepare('SELECT * FROM notifications').all().map(formatNotification);

  const configs = db.prepare('SELECT * FROM configuration').all();
  const organizationName = configs.find(c => c.key === 'organizationName')?.value || 'Los Invisibles de Jesus';
  const themeColor = configs.find(c => c.key === 'themeColor')?.value || '#4F46E5';

  return res.json({
    users,
    groups,
    content,
    prayerRequests,
    events,
    pastoralNotes,
    donations,
    messages,
    liveStream,
    notifications,
    organizationName,
    themeColor,
  });
});

app.post('/api/users/:uid/approve', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { uid } = req.params;
  const exists = db.prepare('SELECT 1 FROM users WHERE uid = ?').get(uid);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }

  db.prepare("UPDATE users SET status = 'active', lastActiveAt = ? WHERE uid = ?").run(
    new Date().toISOString(),
    uid
  );

  return res.json({ success: true });
});

app.put('/api/users/:uid', authenticateToken, (req, res) => {
  const { uid } = req.params;

  // Verify that target user exists
  const targetUser = db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }

  // Authorize: user themselves, or leader/admin
  const isSelf = req.user.uid === uid;
  const isAdmin = ['super_admin', 'admin'].includes(req.user.role);
  const isLeader = req.user.role === 'leader';
  if (!isSelf && !isAdmin && !isLeader) {
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  }

  // Get allowed updates
  const {
    displayName,
    photoURL,
    phone,
    city,
    country,
    birthDate,
    baptismDate,
    favoriteVerse,
    testimony,
    ministry,
    leaderId,
    status,
    spiritualStatus,
    privacySettings,
    role,
  } = req.body;

  // Prepare values (revert to existing if not provided)
  const updatedDisplayName = displayName !== undefined ? displayName : targetUser.displayName;
  const updatedPhotoURL = photoURL !== undefined ? photoURL : targetUser.photoURL;
  const updatedPhone = phone !== undefined ? phone : targetUser.phone;
  const updatedCity = city !== undefined ? city : targetUser.city;
  const updatedCountry = country !== undefined ? country : targetUser.country;
  const updatedBirthDate = birthDate !== undefined ? birthDate : targetUser.birthDate;
  const updatedBaptismDate = baptismDate !== undefined ? baptismDate : targetUser.baptismDate;
  const updatedFavoriteVerse = favoriteVerse !== undefined ? favoriteVerse : targetUser.favoriteVerse;
  const updatedTestimony = testimony !== undefined ? testimony : targetUser.testimony;
  
  const updatedMinistry = ministry !== undefined 
    ? (Array.isArray(ministry) ? JSON.stringify(ministry) : ministry) 
    : targetUser.ministry;
    
  const updatedLeaderId = leaderId !== undefined ? leaderId : targetUser.leaderId;
  const updatedStatus = (status !== undefined && isAdmin) ? status : targetUser.status;
  const updatedSpiritualStatus = spiritualStatus !== undefined ? spiritualStatus : targetUser.spiritualStatus;
  
  const updatedPrivacySettings = privacySettings !== undefined
    ? (typeof privacySettings === 'object' ? JSON.stringify(privacySettings) : privacySettings)
    : targetUser.privacySettings;
    
  const updatedRole = (role !== undefined && isAdmin) ? role : targetUser.role;

  db.prepare(`
    UPDATE users SET
      displayName = ?, photoURL = ?, phone = ?, city = ?, country = ?,
      birthDate = ?, baptismDate = ?, favoriteVerse = ?, testimony = ?,
      ministry = ?, leaderId = ?, status = ?, spiritualStatus = ?,
      privacySettings = ?, role = ?, lastActiveAt = ?
    WHERE uid = ?
  `).run(
    updatedDisplayName,
    updatedPhotoURL || null,
    updatedPhone,
    updatedCity,
    updatedCountry,
    updatedBirthDate || null,
    updatedBaptismDate || null,
    updatedFavoriteVerse || null,
    updatedTestimony || null,
    updatedMinistry,
    updatedLeaderId || null,
    updatedStatus,
    updatedSpiritualStatus || null,
    updatedPrivacySettings,
    updatedRole,
    new Date().toISOString(),
    uid
  );

  // If groupIds were updated (admins/leaders or self joining groups)
  if (req.body.groupIds !== undefined && Array.isArray(req.body.groupIds)) {
    // Delete existing associations
    db.prepare('DELETE FROM group_members WHERE userId = ?').run(uid);
    // Insert new associations
    const insertMember = db.prepare('INSERT INTO group_members (groupId, userId) VALUES (?, ?)');
    req.body.groupIds.forEach(gId => {
      const groupExists = db.prepare('SELECT 1 FROM groups WHERE id = ?').get(gId);
      if (groupExists) {
        insertMember.run(gId, uid);
      }
    });
  }

  const updated = db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
  return res.json({
    success: true,
    user: formatUser(updated),
  });
});

app.post('/api/donations', authenticateToken, (req, res) => {
  const { amount, currency, fund, method, stripePaymentId, receiptUrl, isRecurring, recurringFrequency } = req.body;
  if (amount === undefined || !fund || !method) {
    return res.status(400).json({ success: false, error: 'Datos de donacion incompletos' });
  }

  const id = 'd-' + Date.now();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO donations (
      id, userId, amount, currency, fund, method, stripePaymentId, receiptUrl, isRecurring, recurringFrequency, status, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
  `).run(
    id,
    req.user.uid,
    amount,
    currency || 'COP',
    fund,
    method,
    stripePaymentId || null,
    receiptUrl || null,
    isRecurring ? 1 : 0,
    recurringFrequency || null,
    createdAt
  );

  const inserted = db.prepare('SELECT * FROM donations WHERE id = ?').get(id);
  return res.json({
    success: true,
    donation: formatDonation(inserted),
  });
});

app.post('/api/prayer-requests', authenticateToken, (req, res) => {
  const { title, description, visibility, groupId } = req.body;
  if (!title || !description || !visibility) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
  }

  const id = 'p-' + Date.now();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO prayer_requests (
      id, userId, title, description, visibility, groupId, status, prayerCount, pastoralNote, answeredAt, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, 'active', 0, null, null, ?)
  `).run(id, req.user.uid, title, description, visibility, groupId || null, createdAt);

  const inserted = db.prepare('SELECT * FROM prayer_requests WHERE id = ?').get(id);
  return res.json({
    success: true,
    prayerRequest: formatPrayerRequest(inserted),
  });
});

app.post('/api/prayer-requests/:id/pray', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  const exists = db.prepare('SELECT 1 FROM prayer_requests WHERE id = ?').get(id);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Peticion de oracion no encontrada' });
  }

  const alreadyPrayed = db.prepare('SELECT 1 FROM prayer_prayed_by WHERE prayerId = ? AND userId = ?').get(id, userId);

  db.transaction(() => {
    if (alreadyPrayed) {
      db.prepare('DELETE FROM prayer_prayed_by WHERE prayerId = ? AND userId = ?').run(id, userId);
      db.prepare('UPDATE prayer_requests SET prayerCount = MAX(0, prayerCount - 1) WHERE id = ?').run(id);
    } else {
      db.prepare('INSERT INTO prayer_prayed_by (prayerId, userId) VALUES (?, ?)').run(id, userId);
      db.prepare('UPDATE prayer_requests SET prayerCount = prayerCount + 1 WHERE id = ?').run(id);
    }
  })();

  const updated = db.prepare('SELECT * FROM prayer_requests WHERE id = ?').get(id);
  return res.json({
    success: true,
    prayerRequest: formatPrayerRequest(updated),
  });
});

app.put('/api/prayer-requests/:id/pastoral-note', authenticateToken, requireRole(['super_admin', 'admin', 'leader']), (req, res) => {
  const { id } = req.params;
  const { pastoralNote } = req.body;

  const exists = db.prepare('SELECT 1 FROM prayer_requests WHERE id = ?').get(id);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Peticion de oracion no encontrada' });
  }

  db.prepare('UPDATE prayer_requests SET pastoralNote = ? WHERE id = ?').run(pastoralNote || null, id);

  const updated = db.prepare('SELECT * FROM prayer_requests WHERE id = ?').get(id);
  return res.json({
    success: true,
    prayerRequest: formatPrayerRequest(updated),
  });
});

app.post('/api/prayer-requests/:id/resolve', authenticateToken, (req, res) => {
  const { id } = req.params;

  const request = db.prepare('SELECT * FROM prayer_requests WHERE id = ?').get(id);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Peticion de oracion no encontrada' });
  }

  // Authorize: requester, or leader/admin
  const isOwner = request.userId === req.user.uid;
  const isPrivileged = ['super_admin', 'admin', 'leader'].includes(req.user.role);
  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  }

  db.prepare("UPDATE prayer_requests SET status = 'answered', answeredAt = ? WHERE id = ?").run(
    new Date().toISOString(),
    id
  );

  const updated = db.prepare('SELECT * FROM prayer_requests WHERE id = ?').get(id);
  return res.json({
    success: true,
    prayerRequest: formatPrayerRequest(updated),
  });
});

app.post('/api/pastoral-notes', authenticateToken, requireRole(['super_admin', 'admin', 'leader']), (req, res) => {
  const { memberId, type, content, followUpDate, memberStatus, isPrivate } = req.body;
  if (!memberId || !type || !content || !memberStatus) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
  }

  const id = 'n-' + Date.now();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO pastoral_notes (
      id, memberId, leaderId, type, content, followUpDate, memberStatus, isPrivate, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, memberId, req.user.uid, type, content, followUpDate || null, memberStatus, isPrivate ? 1 : 0, createdAt);

  const inserted = db.prepare('SELECT * FROM pastoral_notes WHERE id = ?').get(id);
  return res.json({
    success: true,
    pastoralNote: formatPastoralNote(inserted),
  });
});

app.post('/api/content', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const {
    type,
    title,
    body,
    excerpt,
    coverImage,
    audioUrl,
    videoUrl,
    series,
    tags,
    bibleReference,
    visibility,
    publishedAt,
    scheduledAt,
    isDraft,
  } = req.body;

  if (!type || !title || !body || !excerpt || !visibility) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
  }

  const id = 'c-' + Date.now();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO content (
      id, type, title, body, excerpt, coverImage, audioUrl, videoUrl, authorId,
      series, tags, bibleReference, visibility, publishedAt, scheduledAt, isDraft, viewCount, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    id,
    type,
    title,
    body,
    excerpt,
    coverImage || null,
    audioUrl || null,
    videoUrl || null,
    req.user.uid,
    series || null,
    JSON.stringify(tags || []),
    bibleReference || null,
    visibility,
    publishedAt || null,
    scheduledAt || null,
    isDraft ? 1 : 0,
    createdAt
  );

  const inserted = db.prepare('SELECT * FROM content WHERE id = ?').get(id);
  return res.json({
    success: true,
    content: formatContent(inserted),
  });
});

app.post('/api/events', authenticateToken, requireRole(['super_admin', 'admin', 'leader']), (req, res) => {
  const {
    title,
    description,
    type,
    format,
    location,
    virtualLink,
    coverImage,
    startDateTime,
    endDateTime,
    capacity,
    requiresRSVP,
    rsvpDeadline,
    targetGroupIds,
  } = req.body;

  if (!title || !description || !type || !format || !startDateTime || !endDateTime) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
  }

  const id = 'e-' + Date.now();
  const createdAt = new Date().toISOString();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO events (
        id, title, description, type, format, location, virtualLink, coverImage,
        startDateTime, endDateTime, organizerId, capacity, requiresRSVP, rsvpDeadline, reminderSent, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      title,
      description,
      type,
      format,
      location || null,
      virtualLink || null,
      coverImage || null,
      startDateTime,
      endDateTime,
      req.user.uid,
      capacity || null,
      requiresRSVP ? 1 : 0,
      rsvpDeadline || null,
      createdAt
    );

    if (targetGroupIds && Array.isArray(targetGroupIds)) {
      const insertTarget = db.prepare('INSERT INTO event_target_groups (eventId, groupId) VALUES (?, ?)');
      targetGroupIds.forEach(gId => {
        insertTarget.run(id, gId);
      });
    }
  })();

  const inserted = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  return res.json({
    success: true,
    event: formatEvent(inserted),
  });
});

app.post('/api/events/:id/rsvp', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const alreadyRSVP = db.prepare("SELECT 1 FROM event_attendees WHERE eventId = ? AND userId = ? AND status = 'rsvp'").get(id, userId);

  if (alreadyRSVP) {
    db.prepare("DELETE FROM event_attendees WHERE eventId = ? AND userId = ? AND status = 'rsvp'").run(id, userId);
  } else {
    db.prepare("INSERT INTO event_attendees (eventId, userId, status) VALUES (?, ?, 'rsvp')").run(id, userId);
  }

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  return res.json({
    success: true,
    event: formatEvent(updated),
  });
});

app.post('/api/events/:id/attendance', authenticateToken, requireRole(['super_admin', 'admin', 'leader']), (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId es requerido' });
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  const alreadyAttended = db.prepare("SELECT 1 FROM event_attendees WHERE eventId = ? AND userId = ? AND status = 'attended'").get(id, userId);

  if (alreadyAttended) {
    db.prepare("DELETE FROM event_attendees WHERE eventId = ? AND userId = ? AND status = 'attended'").run(id, userId);
  } else {
    db.prepare("INSERT OR IGNORE INTO event_attendees (eventId, userId, status) VALUES (?, ?, 'attended')").run(id, userId);
  }

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  return res.json({
    success: true,
    event: formatEvent(updated),
  });
});

app.post('/api/messages', authenticateToken, (req, res) => {
  const { conversationId, content, type, fileUrl } = req.body;
  if (!conversationId || !content || !type) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
  }

  const id = 'm-' + Date.now();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO messages (
      id, conversationId, senderId, content, type, fileUrl, isPinned, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(id, conversationId, req.user.uid, content, type, fileUrl || null, createdAt);

  const inserted = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  return res.json({
    success: true,
    message: formatMessage(inserted),
  });
});

app.put('/api/livestream', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const {
    title,
    platform,
    streamUrl,
    chatEnabled,
    offeringEnabled,
    scheduledAt,
    startedAt,
    endedAt,
    status,
    viewerCount,
    recordingUrl,
  } = req.body;

  const currentStream = db.prepare('SELECT * FROM live_stream LIMIT 1').get();
  if (!currentStream) {
    return res.status(404).json({ success: false, error: 'Transmision no configurada' });
  }

  const updatedTitle = title !== undefined ? title : currentStream.title;
  const updatedPlatform = platform !== undefined ? platform : currentStream.platform;
  const updatedStreamUrl = streamUrl !== undefined ? streamUrl : currentStream.streamUrl;
  const updatedChatEnabled = chatEnabled !== undefined ? (chatEnabled ? 1 : 0) : currentStream.chatEnabled;
  const updatedOfferingEnabled = offeringEnabled !== undefined ? (offeringEnabled ? 1 : 0) : currentStream.offeringEnabled;
  const updatedScheduledAt = scheduledAt !== undefined ? scheduledAt : currentStream.scheduledAt;
  const updatedStartedAt = startedAt !== undefined ? startedAt : currentStream.startedAt;
  const updatedEndedAt = endedAt !== undefined ? endedAt : currentStream.endedAt;
  const updatedStatus = status !== undefined ? status : currentStream.status;
  const updatedViewerCount = viewerCount !== undefined ? viewerCount : currentStream.viewerCount;
  const updatedRecordingUrl = recordingUrl !== undefined ? recordingUrl : currentStream.recordingUrl;

  db.prepare(`
    UPDATE live_stream SET
      title = ?, platform = ?, streamUrl = ?, chatEnabled = ?, offeringEnabled = ?,
      scheduledAt = ?, startedAt = ?, endedAt = ?, status = ?, viewerCount = ?, recordingUrl = ?
    WHERE id = ?
  `).run(
    updatedTitle,
    updatedPlatform,
    updatedStreamUrl,
    updatedChatEnabled,
    updatedOfferingEnabled,
    updatedScheduledAt,
    updatedStartedAt,
    updatedEndedAt,
    updatedStatus,
    updatedViewerCount,
    updatedRecordingUrl,
    currentStream.id
  );

  const updated = db.prepare('SELECT * FROM live_stream WHERE id = ?').get(currentStream.id);
  return res.json({
    success: true,
    liveStream: formatLiveStream(updated),
  });
});

// Admin User Operations: Suspend
app.post('/api/users/:uid/suspend', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { uid } = req.params;
  const exists = db.prepare('SELECT 1 FROM users WHERE uid = ?').get(uid);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }
  db.prepare("UPDATE users SET status = 'suspended', lastActiveAt = ? WHERE uid = ?").run(
    new Date().toISOString(),
    uid
  );
  return res.json({ success: true });
});

// Admin User Operations: Activate
app.post('/api/users/:uid/activate', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { uid } = req.params;
  const exists = db.prepare('SELECT 1 FROM users WHERE uid = ?').get(uid);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }
  db.prepare("UPDATE users SET status = 'active', lastActiveAt = ? WHERE uid = ?").run(
    new Date().toISOString(),
    uid
  );
  return res.json({ success: true });
});

// Admin User Operations: Change Role
app.put('/api/users/:uid/role', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;
  const validRoles = ['super_admin', 'admin', 'leader', 'member', 'visitor'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ success: false, error: 'Rol no valido' });
  }
  const exists = db.prepare('SELECT 1 FROM users WHERE uid = ?').get(uid);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }
  db.prepare("UPDATE users SET role = ?, lastActiveAt = ? WHERE uid = ?").run(
    role,
    new Date().toISOString(),
    uid
  );
  return res.json({ success: true });
});

// Admin Content Operations: Delete
app.delete('/api/content/:id', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { id } = req.params;
  const exists = db.prepare('SELECT 1 FROM content WHERE id = ?').get(id);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Contenido no encontrado' });
  }
  db.prepare("DELETE FROM content WHERE id = ?").run(id);
  return res.json({ success: true });
});

// Admin Content Operations: Update
app.put('/api/content/:id', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { id } = req.params;
  const {
    type,
    title,
    body,
    excerpt,
    coverImage,
    audioUrl,
    videoUrl,
    series,
    tags,
    bibleReference,
    visibility,
    publishedAt,
    scheduledAt,
    isDraft,
  } = req.body;

  const exists = db.prepare('SELECT * FROM content WHERE id = ?').get(id);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Contenido no encontrado' });
  }

  db.prepare(`
    UPDATE content
    SET type = ?, title = ?, body = ?, excerpt = ?, coverImage = ?, audioUrl = ?, videoUrl = ?,
        series = ?, tags = ?, bibleReference = ?, visibility = ?, publishedAt = ?, scheduledAt = ?, isDraft = ?
    WHERE id = ?
  `).run(
    type !== undefined ? type : exists.type,
    title !== undefined ? title : exists.title,
    body !== undefined ? body : exists.body,
    excerpt !== undefined ? excerpt : exists.excerpt,
    coverImage !== undefined ? coverImage : exists.coverImage,
    audioUrl !== undefined ? audioUrl : exists.audioUrl,
    videoUrl !== undefined ? videoUrl : exists.videoUrl,
    series !== undefined ? series : exists.series,
    tags !== undefined ? JSON.stringify(tags || []) : exists.tags,
    bibleReference !== undefined ? bibleReference : exists.bibleReference,
    visibility !== undefined ? visibility : exists.visibility,
    publishedAt !== undefined ? publishedAt : exists.publishedAt,
    scheduledAt !== undefined ? scheduledAt : exists.scheduledAt,
    isDraft !== undefined ? (isDraft ? 1 : 0) : exists.isDraft,
    id
  );

  const updated = db.prepare('SELECT * FROM content WHERE id = ?').get(id);
  return res.json({
    success: true,
    content: formatContent(updated),
  });
});

// Admin Events Operations: Delete
app.delete('/api/events/:id', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { id } = req.params;
  const exists = db.prepare('SELECT 1 FROM events WHERE id = ?').get(id);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }
  db.transaction(() => {
    db.prepare("DELETE FROM event_target_groups WHERE eventId = ?").run(id);
    db.prepare("DELETE FROM event_attendees WHERE eventId = ?").run(id);
    db.prepare("DELETE FROM events WHERE id = ?").run(id);
  })();
  return res.json({ success: true });
});

// Admin Events Operations: Update
app.put('/api/events/:id', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    type,
    format,
    location,
    virtualLink,
    coverImage,
    startDateTime,
    endDateTime,
    capacity,
    requiresRSVP,
    rsvpDeadline,
    targetGroupIds
  } = req.body;

  const exists = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Evento no encontrado' });
  }

  db.transaction(() => {
    db.prepare(`
      UPDATE events
      SET title = ?, description = ?, type = ?, format = ?, location = ?, virtualLink = ?, coverImage = ?,
          startDateTime = ?, endDateTime = ?, capacity = ?, requiresRSVP = ?, rsvpDeadline = ?
      WHERE id = ?
    `).run(
      title !== undefined ? title : exists.title,
      description !== undefined ? description : exists.description,
      type !== undefined ? type : exists.type,
      format !== undefined ? format : exists.format,
      location !== undefined ? location : exists.location,
      virtualLink !== undefined ? virtualLink : exists.virtualLink,
      coverImage !== undefined ? coverImage : exists.coverImage,
      startDateTime !== undefined ? startDateTime : exists.startDateTime,
      endDateTime !== undefined ? endDateTime : exists.endDateTime,
      capacity !== undefined ? capacity : exists.capacity,
      requiresRSVP !== undefined ? (requiresRSVP ? 1 : 0) : exists.requiresRSVP,
      rsvpDeadline !== undefined ? rsvpDeadline : exists.rsvpDeadline,
      id
    );

    if (targetGroupIds !== undefined && Array.isArray(targetGroupIds)) {
      db.prepare('DELETE FROM event_target_groups WHERE eventId = ?').run(id);
      const insertTarget = db.prepare('INSERT INTO event_target_groups (eventId, groupId) VALUES (?, ?)');
      targetGroupIds.forEach(gId => {
        insertTarget.run(id, gId);
      });
    }
  })();

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  return res.json({
    success: true,
    event: formatEvent(updated),
  });
});

// Admin Analytics Operations: Get
app.get('/api/analytics', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count;
  const pendingUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'").get().count;
  
  const totalDonations = db.prepare("SELECT SUM(amount) as sum FROM donations WHERE status = 'completed'").get().sum || 0;
  
  const donationsByFundRows = db.prepare("SELECT fund, SUM(amount) as sum FROM donations WHERE status = 'completed' GROUP BY fund").all();
  const donationsByFund = { tithe: 0, offering: 0, missions: 0, building: 0, social: 0 };
  donationsByFundRows.forEach(row => {
    if (row.fund in donationsByFund) {
      donationsByFund[row.fund] = row.sum || 0;
    }
  });

  const publishedContent = db.prepare("SELECT COUNT(*) as count FROM content WHERE isDraft = 0").get().count;
  const draftContent = db.prepare("SELECT COUNT(*) as count FROM content WHERE isDraft = 1").get().count;
  const contentStats = { published: publishedContent, drafts: draftContent };

  const cityDistribution = db.prepare("SELECT city, COUNT(*) as count FROM users GROUP BY city ORDER BY count DESC").all();

  const weeklyAttendance = db.prepare("SELECT label, value FROM weekly_attendance").all();

  const activePrayerRequests = db.prepare("SELECT COUNT(*) as count FROM prayer_requests WHERE status = 'active'").get().count;

  return res.json({
    success: true,
    analytics: {
      totalUsers,
      activeUsers,
      pendingUsers,
      totalDonations,
      donationsByFund,
      contentStats,
      cityDistribution,
      weeklyAttendance,
      activePrayerRequests,
    }
  });
});

// Supports both paths: PUT /api/config and PUT /api/organization
const updateConfigHandler = (req, res) => {
  const { organizationName, themeColor } = req.body;
  if (!organizationName && !themeColor) {
    return res.status(400).json({ success: false, error: 'Proporcione al menos un valor para actualizar' });
  }

  db.transaction(() => {
    if (organizationName !== undefined) {
      db.prepare("UPDATE configuration SET value = ? WHERE key = 'organizationName'").run(organizationName);
    }
    if (themeColor !== undefined) {
      db.prepare("UPDATE configuration SET value = ? WHERE key = 'themeColor'").run(themeColor);
    }
  })();

  const configs = db.prepare('SELECT * FROM configuration').all();
  const resOrganizationName = configs.find(c => c.key === 'organizationName')?.value;
  const resThemeColor = configs.find(c => c.key === 'themeColor')?.value;

  return res.json({
    success: true,
    organizationName: resOrganizationName,
    themeColor: resThemeColor,
  });
};

app.put('/api/config', authenticateToken, requireRole(['super_admin', 'admin']), updateConfigHandler);
app.put('/api/organization', authenticateToken, requireRole(['super_admin', 'admin']), updateConfigHandler);

app.put('/api/groups/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, meetingDay, meetingTime, meetingFormat, meetingLocation, meetingLink, maxCapacity } = req.body;

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
  if (!group) {
    return res.status(404).json({ success: false, error: 'Grupo no encontrado' });
  }

  // Authorize: group leader themselves or admin
  const isLeader = group.leaderId === req.user.uid;
  const isAdmin = ['super_admin', 'admin'].includes(req.user.role);
  if (!isLeader && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Acceso denegado. Solo el líder del grupo o un administrador pueden editarlo.' });
  }

  db.prepare(`
    UPDATE groups SET
      name = ?,
      description = ?,
      meetingDay = ?,
      meetingTime = ?,
      meetingFormat = ?,
      meetingLocation = ?,
      meetingLink = ?,
      maxCapacity = ?
    WHERE id = ?
  `).run(
    name !== undefined ? name : group.name,
    description !== undefined ? description : group.description,
    meetingDay !== undefined ? meetingDay : group.meetingDay,
    meetingTime !== undefined ? meetingTime : group.meetingTime,
    meetingFormat !== undefined ? meetingFormat : group.meetingFormat,
    meetingLocation !== undefined ? meetingLocation : group.meetingLocation,
    meetingLink !== undefined ? meetingLink : group.meetingLink,
    maxCapacity !== undefined ? Number(maxCapacity) : group.maxCapacity,
    id
  );

  const updated = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
  return res.json({
    success: true,
    group: formatGroup(updated)
  });
});

app.get('/api/devotional-notes/:contentId', authenticateToken, (req, res) => {
  const { contentId } = req.params;
  const userId = req.user.uid;

  const note = db.prepare('SELECT * FROM devotional_notes WHERE userId = ? AND contentId = ?').get(userId, contentId);
  return res.json({
    success: true,
    noteText: note ? note.noteText : '',
  });
});

app.post('/api/devotional-notes/:contentId', authenticateToken, (req, res) => {
  const { contentId } = req.params;
  const { noteText } = req.body;
  const userId = req.user.uid;

  if (noteText === undefined) {
    return res.status(400).json({ success: false, error: 'noteText es requerido' });
  }

  const id = 'note-' + Date.now();
  const updatedAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO devotional_notes (id, userId, contentId, noteText, updatedAt)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(userId, contentId) DO UPDATE SET
      noteText = excluded.noteText,
      updatedAt = excluded.updatedAt
  `).run(id, userId, contentId, noteText, updatedAt);

  return res.json({
    success: true,
    noteText,
  });
});

// Local listener
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Express server running on http://127.0.0.1:${PORT}`);
  });
}

export default app;
