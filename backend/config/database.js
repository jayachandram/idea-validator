const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      // These are the recommended production settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

    // Create indexes for performance
    await createIndexes();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  const db = mongoose.connection.db;
  // Text index for searching chat history
  await db.collection('chatsessions').createIndex({ 'messages.content': 'text', title: 'text' });
  // TTL index: auto-delete unverified accounts after 24h
  await db.collection('users').createIndex(
    { emailVerifyExpires: 1 },
    { expireAfterSeconds: 0, partialFilterExpression: { emailVerified: false } }
  );
  console.log('✅ DB indexes ensured');
};

module.exports = connectDB;
