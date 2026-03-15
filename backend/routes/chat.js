const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const { chat, analyzeThinkingProfile, extractMessageMetadata } = require('../services/aiService');

// All chat routes require authentication
router.use(protect);

// ============================================================
//  GET /api/chat/sessions — List all sessions for current user
// ============================================================
router.get('/sessions', async (req, res) => {
  const { page = 1, limit = 20, archived = false } = req.query;

  const sessions = await ChatSession.find({
    user: req.user._id,
    isArchived: archived === 'true'
  })
    .select('title ideaCategory messageCount createdAt updatedAt isPinned verdict tags aiPersona')
    .sort({ isPinned: -1, updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await ChatSession.countDocuments({ user: req.user._id, isArchived: archived === 'true' });

  res.json({ success: true, sessions, total, page: parseInt(page) });
});

// ============================================================
//  POST /api/chat/sessions — Create new session
// ============================================================
router.post('/sessions', async (req, res) => {
  const { persona = 'investor' } = req.body;

  // Free plan limit: 20 sessions
  if (req.user.plan === 'free') {
    const count = await ChatSession.countDocuments({ user: req.user._id, isArchived: false });
    if (count >= 20) {
      return res.status(403).json({
        success: false,
        message: 'Free plan limit reached (20 sessions). Upgrade to Pro for unlimited.',
        code: 'PLAN_LIMIT'
      });
    }
  }

  const session = await ChatSession.create({
    user: req.user._id,
    aiPersona: persona
  });

  res.status(201).json({ success: true, session });
});

// ============================================================
//  GET /api/chat/sessions/:id — Get full session with messages
// ============================================================
router.get('/sessions/:id', async (req, res) => {
  const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
  res.json({ success: true, session });
});

// ============================================================
//  POST /api/chat/sessions/:id/messages — Send a message (MAIN ENDPOINT)
// ============================================================
router.post('/sessions/:id/messages', async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
  if (message.length > 5000) return res.status(400).json({ success: false, message: 'Message too long (max 5000 chars).' });

  const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

  // Build message history for AI
  const history = session.messages.map(m => ({ role: m.role, content: m.content }));
  history.push({ role: 'user', content: message });

  // Call AI
  const aiResult = await chat(history, session.aiPersona);

  // Extract metadata asynchronously (non-blocking)
  const metadataPromise = extractMessageMetadata(message).catch(() => null);

  // Add both messages to session
  session.messages.push({ role: 'user', content: message });
  session.messages.push({ role: 'assistant', content: aiResult.content });
  await session.save();

  // Update user stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalMessages: 2 },
    lastActive: new Date()
  });

  // Trigger thinking profile re-analysis every 10 user messages
  const userMsgCount = session.messages.filter(m => m.role === 'user').length;
  if (userMsgCount % 10 === 0) {
    // Get ALL messages from ALL sessions for this user
    const allSessions = await ChatSession.find({ user: req.user._id }).select('messages');
    const allMessages = allSessions.flatMap(s => s.messages);

    analyzeThinkingProfile(req.user._id, allMessages)
      .then(async (profile) => {
        if (!profile) return;
        await User.findByIdAndUpdate(req.user._id, {
          thinkingProfile: {
            ...profile,
            analysisVersion: (req.user.thinkingProfile?.analysisVersion || 0) + 1,
            lastAnalyzed: new Date()
          }
        });
      })
      .catch(err => console.error('Profile analysis error:', err));
  }

  // Apply metadata to user message (after response sent)
  metadataPromise.then(async (meta) => {
    if (!meta) return;
    const msgIndex = session.messages.length - 2; // user message
    await ChatSession.findByIdAndUpdate(session._id, {
      [`messages.${msgIndex}.metadata`]: meta,
      ...(meta.ideaTitle && session.title === 'New Idea' && { title: meta.ideaTitle }),
      ...(meta.ideaCategory && { ideaCategory: meta.ideaCategory })
    });
  }).catch(() => {});

  res.json({
    success: true,
    reply: {
      role: 'assistant',
      content: aiResult.content,
      personaName: aiResult.personaName,
      timestamp: new Date()
    }
  });
});

// ============================================================
//  DELETE /api/chat/sessions/:id — Delete session
// ============================================================
router.delete('/sessions/:id', async (req, res) => {
  const session = await ChatSession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
  res.json({ success: true, message: 'Session deleted.' });
});

// ============================================================
//  PATCH /api/chat/sessions/:id — Update session (pin, archive, rename)
// ============================================================
router.patch('/sessions/:id', async (req, res) => {
  const { title, isPinned, isArchived, tags } = req.body;
  const update = {};
  if (title !== undefined) update.title = title.substring(0, 200);
  if (isPinned !== undefined) update.isPinned = isPinned;
  if (isArchived !== undefined) update.isArchived = isArchived;
  if (tags !== undefined) update.tags = tags;

  const session = await ChatSession.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    update,
    { new: true }
  );
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
  res.json({ success: true, session });
});

// ============================================================
//  GET /api/chat/search?q=xxx — Search across all sessions
// ============================================================
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ success: false, message: 'Query too short.' });

  const sessions = await ChatSession.find({
    user: req.user._id,
    $text: { $search: q }
  }, { score: { $meta: 'textScore' } })
    .select('title ideaCategory createdAt updatedAt')
    .sort({ score: { $meta: 'textScore' } })
    .limit(10);

  res.json({ success: true, sessions });
});

module.exports = router;
