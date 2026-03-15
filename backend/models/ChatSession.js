const mongoose = require('mongoose');

// --- Individual Message ---
const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 10000 },
  timestamp: { type: Date, default: Date.now },

  // AI-extracted metadata from this message
  metadata: {
    ideaTitle: String,       // extracted idea name if detected
    ideaCategory: String,    // e.g. 'SaaS', 'Marketplace', 'Hardware'
    keywords: [String],      // key concepts extracted
    sentimentScore: Number,  // -1 to 1
    thinkingSignals: {       // signals for thinking profile analysis
      isAnalytical: Boolean,
      isCreative: Boolean,
      mentionsCompetition: Boolean,
      mentionsRevenue: Boolean,
      mentionsTechnology: Boolean,
      mentionsUsers: Boolean,
      clarityRating: Number  // 1-5
    }
  }
});

// --- Chat Session ---
const ChatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Idea', maxlength: 200 },
  ideaSummary: { type: String, maxlength: 500 },
  ideaCategory: { type: String, default: 'Uncategorized' },
  messages: [MessageSchema],
  messageCount: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  tags: [String],
  aiPersona: {
    type: String,
    enum: ['investor', 'technical', 'market', 'user', 'general'],
    default: 'investor'
  },
  // Final AI verdict on this session
  verdict: {
    overall: { type: String, enum: ['bullish', 'bearish', 'neutral', 'promising', 'risky'] },
    score: { type: Number, min: 0, max: 100 },
    summary: String
  }
}, {
  timestamps: true
});

// Auto-update messageCount and session title
ChatSessionSchema.pre('save', function(next) {
  this.messageCount = this.messages.length;
  // Auto-title from first user message
  if (this.messages.length > 0 && this.title === 'New Idea') {
    const firstUserMsg = this.messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      this.title = firstUserMsg.content.substring(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '');
    }
  }
  next();
});

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
