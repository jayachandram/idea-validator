const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');

router.use(protect);

// GET /api/user/profile — Full profile + stats
router.get('/profile', async (req, res) => {
  const user = req.user;
  const sessionCount = await ChatSession.countDocuments({ user: user._id });

  res.json({
    success: true,
    user: {
      ...user.toJSON(),
      stats: {
        totalSessions: sessionCount,
        totalMessages: user.totalMessages,
        memberSince: user.createdAt
      }
    }
  });
});

// PATCH /api/user/profile — Update name, avatar
router.patch('/profile', async (req, res) => {
  const { name, avatar } = req.body;
  const update = {};
  if (name) update.name = name.trim().substring(0, 100);
  if (avatar) update.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  res.json({ success: true, user });
});

// GET /api/user/thinking-profile — AI analysis of user's thinking
router.get('/thinking-profile', async (req, res) => {
  const user = req.user;
  const profile = user.thinkingProfile;

  // If not enough data yet
  if (!profile?.lastAnalyzed) {
    const msgCount = user.totalMessages;
    const needed = Math.max(0, 10 - Math.floor(msgCount / 2));
    return res.json({
      success: true,
      hasProfile: false,
      message: `Keep chatting! Your thinking profile unlocks after ${needed} more idea${needed === 1 ? '' : 's'}.`,
      progress: Math.min(100, Math.floor((msgCount / 2 / 10) * 100))
    });
  }

  res.json({
    success: true,
    hasProfile: true,
    profile,
    analyzedAt: profile.lastAnalyzed
  });
});

// GET /api/user/dashboard — Analytics for dashboard
router.get('/dashboard', async (req, res) => {
  const userId = req.user._id;

  const [recentSessions, categoryStats] = await Promise.all([
    ChatSession.find({ user: userId })
      .select('title ideaCategory verdict createdAt messageCount')
      .sort({ createdAt: -1 })
      .limit(5),

    ChatSession.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$ideaCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  res.json({
    success: true,
    recentSessions,
    categoryStats,
    profile: req.user.thinkingProfile
  });
});

module.exports = router;
