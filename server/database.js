import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  demoCredentials,
  mockUsers,
  mockGroups,
  mockContent,
  mockPrayerRequests,
  mockEvents,
  mockPastoralNotes,
  mockDonations,
  mockLiveStream,
  mockMessages,
  mockNotifications,
  weeklyAttendance,
  formationSteps,
} from './mockData.js';

const isVercel = !!process.env.VERCEL;
const dbPath = isVercel ? ':memory:' : path.resolve(process.cwd(), 'server/database.db');

export const db = new Database(dbPath);

// Enable WAL for non-in-memory databases to improve concurrency
if (!isVercel) {
  db.pragma('journal_mode = WAL');
}

export function initializeDatabase() {
  console.log('Initializing database schema and seed data...');
  const init = db.transaction(() => {
    // 1. Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS configuration (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
          uid TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          displayName TEXT NOT NULL,
          photoURL TEXT,
          role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'leader', 'member', 'visitor')),
          phone TEXT NOT NULL,
          city TEXT NOT NULL,
          country TEXT NOT NULL,
          birthDate TEXT,
          baptismDate TEXT,
          favoriteVerse TEXT,
          testimony TEXT,
          ministry TEXT,
          leaderId TEXT REFERENCES users(uid) ON DELETE SET NULL,
          status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
          spiritualStatus TEXT CHECK (spiritualStatus IN ('new_believer', 'growing', 'established', 'leader_in_training')),
          privacySettings TEXT NOT NULL,
          onboardingCompleted INTEGER NOT NULL CHECK (onboardingCompleted IN (0, 1)),
          lastActiveAt TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          passwordHash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('cell', 'ministry', 'bible_study', 'youth', 'couples', 'women', 'men')),
          leaderId TEXT REFERENCES users(uid) ON DELETE SET NULL,
          maxCapacity INTEGER NOT NULL,
          meetingDay TEXT NOT NULL,
          meetingTime TEXT NOT NULL,
          meetingFormat TEXT NOT NULL CHECK (meetingFormat IN ('in_person', 'virtual', 'hybrid')),
          meetingLocation TEXT,
          meetingLink TEXT,
          isPublic INTEGER NOT NULL CHECK (isPublic IN (0, 1)),
          coverImage TEXT,
          createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS group_members (
          groupId TEXT REFERENCES groups(id) ON DELETE CASCADE,
          userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
          PRIMARY KEY (groupId, userId)
      );

      CREATE TABLE IF NOT EXISTS group_co_leaders (
          groupId TEXT REFERENCES groups(id) ON DELETE CASCADE,
          userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
          PRIMARY KEY (groupId, userId)
      );

      CREATE TABLE IF NOT EXISTS content (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('sermon', 'devotional', 'post', 'announcement')),
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          coverImage TEXT,
          audioUrl TEXT,
          videoUrl TEXT,
          authorId TEXT REFERENCES users(uid) ON DELETE SET NULL,
          series TEXT,
          tags TEXT,
          bibleReference TEXT,
          visibility TEXT NOT NULL CHECK (visibility IN ('public', 'members', 'leaders', 'admin')),
          publishedAt TEXT,
          scheduledAt TEXT,
          isDraft INTEGER NOT NULL CHECK (isDraft IN (0, 1)),
          viewCount INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS prayer_requests (
          id TEXT PRIMARY KEY,
          userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          visibility TEXT NOT NULL CHECK (visibility IN ('public', 'group', 'private')),
          groupId TEXT REFERENCES groups(id) ON DELETE SET NULL,
          status TEXT NOT NULL CHECK (status IN ('active', 'answered', 'closed')),
          prayerCount INTEGER NOT NULL DEFAULT 0,
          pastoralNote TEXT,
          answeredAt TEXT,
          createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS prayer_prayed_by (
          prayerId TEXT REFERENCES prayer_requests(id) ON DELETE CASCADE,
          userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
          PRIMARY KEY (prayerId, userId)
      );

      CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('service', 'cell', 'retreat', 'conference', 'social', 'training')),
          format TEXT NOT NULL CHECK (format IN ('in_person', 'virtual', 'hybrid')),
          location TEXT,
          virtualLink TEXT,
          coverImage TEXT,
          startDateTime TEXT NOT NULL,
          endDateTime TEXT NOT NULL,
          organizerId TEXT REFERENCES users(uid) ON DELETE SET NULL,
          capacity INTEGER,
          requiresRSVP INTEGER NOT NULL CHECK (requiresRSVP IN (0, 1)),
          rsvpDeadline TEXT,
          reminderSent INTEGER NOT NULL CHECK (reminderSent IN (0, 1)),
          createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS event_target_groups (
          eventId TEXT REFERENCES events(id) ON DELETE CASCADE,
          groupId TEXT REFERENCES groups(id) ON DELETE CASCADE,
          PRIMARY KEY (eventId, groupId)
      );

      CREATE TABLE IF NOT EXISTS event_attendees (
          eventId TEXT REFERENCES events(id) ON DELETE CASCADE,
          userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
          status TEXT NOT NULL CHECK (status IN ('rsvp', 'attended')),
          PRIMARY KEY (eventId, userId, status)
      );

      CREATE TABLE IF NOT EXISTS pastoral_notes (
          id TEXT PRIMARY KEY,
          memberId TEXT REFERENCES users(uid) ON DELETE CASCADE,
          leaderId TEXT REFERENCES users(uid) ON DELETE SET NULL,
          type TEXT NOT NULL CHECK (type IN ('visit', 'call', 'message', 'meeting', 'observation')),
          content TEXT NOT NULL,
          followUpDate TEXT,
          memberStatus TEXT NOT NULL CHECK (memberStatus IN ('new', 'integrating', 'active', 'inactive', 'crisis', 'restoration')),
          isPrivate INTEGER NOT NULL CHECK (isPrivate IN (0, 1)),
          createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS donations (
          id TEXT PRIMARY KEY,
          userId TEXT REFERENCES users(uid) ON DELETE SET NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'COP',
          fund TEXT NOT NULL CHECK (fund IN ('tithe', 'offering', 'missions', 'building', 'social')),
          method TEXT NOT NULL CHECK (method IN ('card', 'pse', 'transfer', 'cash')),
          stripePaymentId TEXT,
          receiptUrl TEXT,
          isRecurring INTEGER NOT NULL CHECK (isRecurring IN (0, 1)),
          recurringFrequency TEXT CHECK (recurringFrequency IN ('weekly', 'biweekly', 'monthly')),
          status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'failed')),
          createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS live_stream (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          platform TEXT NOT NULL CHECK (platform IN ('youtube', 'facebook', 'internal')),
          streamUrl TEXT NOT NULL,
          chatEnabled INTEGER NOT NULL CHECK (chatEnabled IN (0, 1)),
          offeringEnabled INTEGER NOT NULL CHECK (offeringEnabled IN (0, 1)),
          scheduledAt TEXT NOT NULL,
          startedAt TEXT,
          endedAt TEXT,
          status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'ended')),
          viewerCount INTEGER NOT NULL DEFAULT 0,
          recordingUrl TEXT,
          createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          conversationId TEXT REFERENCES groups(id) ON DELETE CASCADE,
          senderId TEXT REFERENCES users(uid) ON DELETE CASCADE,
          content TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('text', 'image', 'audio', 'file')),
          fileUrl TEXT,
          isPinned INTEGER NOT NULL CHECK (isPinned IN (0, 1)),
          createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS message_read_by (
          messageId TEXT REFERENCES messages(id) ON DELETE CASCADE,
          userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
          PRIMARY KEY (messageId, userId)
      );

      CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          userId TEXT REFERENCES users(uid) ON DELETE CASCADE,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('urgent', 'important', 'informational')),
          category TEXT NOT NULL CHECK (category IN ('prayer', 'event', 'message', 'group', 'content', 'pastoral', 'finance')),
          actionUrl TEXT,
          isRead INTEGER NOT NULL CHECK (isRead IN (0, 1)),
          createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS weekly_attendance (
          label TEXT PRIMARY KEY,
          value INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS formation_steps (
          label TEXT PRIMARY KEY,
          progress INTEGER NOT NULL
      );
    `);

    // 2. Check if users table is empty to perform seeding
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
      console.log('Database empty. Seeding initial data...');

      // Seed Configuration
      const insertConfig = db.prepare('INSERT INTO configuration (key, value) VALUES (?, ?)');
      insertConfig.run('organizationName', 'Los Invisibles de Jesus');
      insertConfig.run('themeColor', '#4F46E5');

      // Seed Users
      const insertUser = db.prepare(`
        INSERT INTO users (
          uid, email, displayName, photoURL, role, phone, city, country,
          birthDate, baptismDate, favoriteVerse, testimony, ministry, leaderId,
          status, spiritualStatus, privacySettings, onboardingCompleted, lastActiveAt, createdAt, passwordHash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mockUsers.forEach((user) => {
        const cred = demoCredentials.find((c) => c.email.toLowerCase() === user.email.toLowerCase());
        const plainPassword = cred ? cred.password : 'Password123!';
        const passwordHash = bcrypt.hashSync(plainPassword, 10);

        insertUser.run(
          user.uid,
          user.email,
          user.displayName,
          user.photoURL || null,
          user.role,
          user.phone || '',
          user.city || '',
          user.country || '',
          user.birthDate || null,
          user.baptismDate || null,
          user.favoriteVerse || null,
          user.testimony || null,
          JSON.stringify(user.ministry || []),
          user.leaderId || null,
          user.status,
          user.spiritualStatus || null,
          JSON.stringify(user.privacySettings || { showPhone: false, showEmail: true, showCity: true }),
          user.onboardingCompleted ? 1 : 0,
          user.lastActiveAt || new Date().toISOString(),
          user.createdAt || new Date().toISOString(),
          passwordHash
        );
      });

      // Seed Groups
      const insertGroup = db.prepare(`
        INSERT INTO groups (
          id, name, description, type, leaderId, maxCapacity, meetingDay, meetingTime,
          meetingFormat, meetingLocation, meetingLink, isPublic, coverImage, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertGroupMemberIgnore = db.prepare(`
        INSERT OR IGNORE INTO group_members (groupId, userId) VALUES (?, ?)
      `);

      const insertGroupCoLeader = db.prepare(`
        INSERT INTO group_co_leaders (groupId, userId) VALUES (?, ?)
      `);

      mockGroups.forEach((group) => {
        insertGroup.run(
          group.id,
          group.name,
          group.description,
          group.type,
          group.leaderId || null,
          group.maxCapacity,
          group.meetingDay,
          group.meetingTime,
          group.meetingFormat,
          group.meetingLocation || null,
          group.meetingLink || null,
          group.isPublic ? 1 : 0,
          group.coverImage || null,
          group.createdAt || new Date().toISOString()
        );

        if (group.memberIds) {
          group.memberIds.forEach((mId) => {
            insertGroupMemberIgnore.run(group.id, mId);
          });
        }

        if (group.coLeaderIds) {
          group.coLeaderIds.forEach((clId) => {
            insertGroupCoLeader.run(group.id, clId);
          });
        }
      });

      // Also ensure that user.groupIds mapped to group_members
      mockUsers.forEach((user) => {
        if (user.groupIds) {
          user.groupIds.forEach((gId) => {
            // Check if group exists before inserting member to satisfy foreign key constraints
            const groupExists = db.prepare('SELECT 1 FROM groups WHERE id = ?').get(gId);
            if (groupExists) {
              insertGroupMemberIgnore.run(gId, user.uid);
            }
          });
        }
      });

      // Seed Content
      const insertContent = db.prepare(`
        INSERT INTO content (
          id, type, title, body, excerpt, coverImage, audioUrl, videoUrl, authorId,
          series, tags, bibleReference, visibility, publishedAt, scheduledAt, isDraft, viewCount, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mockContent.forEach((c) => {
        insertContent.run(
          c.id,
          c.type,
          c.title,
          c.body,
          c.excerpt,
          c.coverImage || null,
          c.audioUrl || null,
          c.videoUrl || null,
          c.authorId || null,
          c.series || null,
          JSON.stringify(c.tags || []),
          c.bibleReference || null,
          c.visibility,
          c.publishedAt || null,
          c.scheduledAt || null,
          c.isDraft ? 1 : 0,
          c.viewCount || 0,
          c.createdAt || new Date().toISOString()
        );
      });

      // Seed Prayer Requests
      const insertPrayer = db.prepare(`
        INSERT INTO prayer_requests (
          id, userId, title, description, visibility, groupId, status, prayerCount, pastoralNote, answeredAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertPrayerPrayedBy = db.prepare(`
        INSERT INTO prayer_prayed_by (prayerId, userId) VALUES (?, ?)
      `);

      mockPrayerRequests.forEach((p) => {
        insertPrayer.run(
          p.id,
          p.userId,
          p.title,
          p.description,
          p.visibility,
          p.groupId || null,
          p.status,
          p.prayerCount || 0,
          p.pastoralNote || null,
          p.answeredAt || null,
          p.createdAt || new Date().toISOString()
        );

        if (p.prayedByIds) {
          p.prayedByIds.forEach((uId) => {
            insertPrayerPrayedBy.run(p.id, uId);
          });
        }
      });

      // Seed Events
      const insertEvent = db.prepare(`
        INSERT INTO events (
          id, title, description, type, format, location, virtualLink, coverImage,
          startDateTime, endDateTime, organizerId, capacity, requiresRSVP, rsvpDeadline, reminderSent, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertEventTargetGroup = db.prepare(`
        INSERT INTO event_target_groups (eventId, groupId) VALUES (?, ?)
      `);

      const insertEventAttendee = db.prepare(`
        INSERT INTO event_attendees (eventId, userId, status) VALUES (?, ?, ?)
      `);

      mockEvents.forEach((e) => {
        insertEvent.run(
          e.id,
          e.title,
          e.description,
          e.type,
          e.format,
          e.location || null,
          e.virtualLink || null,
          e.coverImage || null,
          e.startDateTime,
          e.endDateTime,
          e.organizerId || null,
          e.capacity || null,
          e.requiresRSVP ? 1 : 0,
          e.rsvpDeadline || null,
          e.reminderSent ? 1 : 0,
          e.createdAt || new Date().toISOString()
        );

        if (e.targetGroupIds) {
          e.targetGroupIds.forEach((gId) => {
            insertEventTargetGroup.run(e.id, gId);
          });
        }

        if (e.attendeeIds) {
          e.attendeeIds.forEach((uId) => {
            insertEventAttendee.run(e.id, uId, 'attended');
          });
        }
      });

      // Seed Pastoral Notes
      const insertPastoralNote = db.prepare(`
        INSERT INTO pastoral_notes (
          id, memberId, leaderId, type, content, followUpDate, memberStatus, isPrivate, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mockPastoralNotes.forEach((n) => {
        insertPastoralNote.run(
          n.id,
          n.memberId,
          n.leaderId || null,
          n.type,
          n.content,
          n.followUpDate || null,
          n.memberStatus,
          n.isPrivate ? 1 : 0,
          n.createdAt || new Date().toISOString()
        );
      });

      // Seed Donations
      const insertDonation = db.prepare(`
        INSERT INTO donations (
          id, userId, amount, currency, fund, method, stripePaymentId, receiptUrl, isRecurring, recurringFrequency, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mockDonations.forEach((d) => {
        insertDonation.run(
          d.id,
          d.userId || null,
          d.amount,
          d.currency || 'COP',
          d.fund,
          d.method,
          d.stripePaymentId || null,
          d.receiptUrl || null,
          d.isRecurring ? 1 : 0,
          d.recurringFrequency || null,
          d.status,
          d.createdAt || new Date().toISOString()
        );
      });

      // Seed Live Stream
      if (mockLiveStream) {
        const insertLiveStream = db.prepare(`
          INSERT INTO live_stream (
            id, title, platform, streamUrl, chatEnabled, offeringEnabled, scheduledAt, startedAt, endedAt, status, viewerCount, recordingUrl, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertLiveStream.run(
          mockLiveStream.id,
          mockLiveStream.title,
          mockLiveStream.platform,
          mockLiveStream.streamUrl,
          mockLiveStream.chatEnabled ? 1 : 0,
          mockLiveStream.offeringEnabled ? 1 : 0,
          mockLiveStream.scheduledAt,
          mockLiveStream.startedAt || null,
          mockLiveStream.endedAt || null,
          mockLiveStream.status,
          mockLiveStream.viewerCount || 0,
          mockLiveStream.recordingUrl || null,
          mockLiveStream.createdAt || new Date().toISOString()
        );
      }

      // Seed Messages
      const insertMessage = db.prepare(`
        INSERT INTO messages (
          id, conversationId, senderId, content, type, fileUrl, isPinned, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMessageReadBy = db.prepare(`
        INSERT INTO message_read_by (messageId, userId) VALUES (?, ?)
      `);

      mockMessages.forEach((msg) => {
        insertMessage.run(
          msg.id,
          msg.conversationId,
          msg.senderId,
          msg.content,
          msg.type,
          msg.fileUrl || null,
          msg.isPinned ? 1 : 0,
          msg.createdAt || new Date().toISOString()
        );

        if (msg.readBy) {
          msg.readBy.forEach((uId) => {
            insertMessageReadBy.run(msg.id, uId);
          });
        }
      });

      // Seed Notifications
      const insertNotification = db.prepare(`
        INSERT INTO notifications (
          id, userId, title, body, type, category, actionUrl, isRead, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mockNotifications.forEach((nt) => {
        insertNotification.run(
          nt.id,
          nt.userId,
          nt.title,
          nt.body,
          nt.type,
          nt.category,
          nt.actionUrl || null,
          nt.isRead ? 1 : 0,
          nt.createdAt || new Date().toISOString()
        );
      });

      // Seed Weekly Attendance
      const insertWeekly = db.prepare('INSERT INTO weekly_attendance (label, value) VALUES (?, ?)');
      weeklyAttendance.forEach((wa) => {
        insertWeekly.run(wa.label, wa.value);
      });

      // Seed Formation Steps
      const insertStep = db.prepare('INSERT INTO formation_steps (label, progress) VALUES (?, ?)');
      formationSteps.forEach((fs) => {
        insertStep.run(fs.label, fs.progress);
      });

      console.log('Database seeded successfully.');
    } else {
      console.log('Database already initialized.');
    }
  });
  init();
  console.log('Database initialization completed successfully.');
}
