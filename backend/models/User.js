const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // --- Identity ---
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String,
    unique: true,
    sparse: true, // allows null (phone-only users)
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\+[1-9]\d{7,14}$/, 'Phone must be E.164 format e.g. +919876543210']
  },
  password: { type: String, minlength: 8, select: false },
  avatar: { type: String, default: null },

  // --- Auth Providers ---
  providers: [{
    type: { type: String, enum: ['email', 'google', 'phone'] },
    providerId: String, // Google UID or Firebase UID
    linkedAt: { type: Date, default: Date.now }
  }],
  firebaseUid: { type: String, unique: true, sparse: true },

  // --- Verification ---
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailVerifyToken: String,
  emailVerifyExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // --- Subscription & Status ---
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // --- Usage Stats ---
  totalIdeasSubmitted: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },

  // === THINKING PROFILE — AI-analyzed personality ===
  thinkingProfile: {
    dominantStyle: {
      type: String,
      enum: ['analytical', 'creative', 'pragmatic', 'visionary', 'mixed'],
      default: 'mixed'
    },
    traits: {
      riskTolerance: { type: Number, min: 0, max: 100, default: 50 },     // 0=risk-averse, 100=bold
      technicalDepth: { type: Number, min: 0, max: 100, default: 50 },    // 0=non-tech, 100=highly technical
      marketAwareness: { type: Number, min: 0, max: 100, default: 50 },   // market understanding
      executionFocus: { type: Number, min: 0, max: 100, default: 50 },    // idea vs execution mindset
      originalityScore: { type: Number, min: 0, max: 100, default: 50 },  // uniqueness of ideas
      clarityScore: { type: Number, min: 0, max: 100, default: 50 }       // how clearly they communicate
    },
    gaps: [String],           // e.g. ["lacks market sizing", "ignores competition"]
    strengths: [String],      // e.g. ["strong technical vision", "user-empathy"]
    suggestions: [String],    // personalized recommendations
    topThemes: [String],      // recurring idea themes
    analysisVersion: { type: Number, default: 0 },
    lastAnalyzed: Date
  }
}, {
  timestamps: true // adds createdAt, updatedAt automatically
});

// --- Hash password before saving ---
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// --- Compare password ---
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// --- Never return password in JSON ---
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerifyToken;
  delete obj.passwordResetToken;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
