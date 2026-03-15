const { createClient } = require('redis');

let client;

const connectRedis = async () => {
  client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

  client.on('error', (err) => console.warn('⚠️  Redis error (non-fatal):', err.message));
  client.on('connect', () => console.log('✅ Redis connected'));

  try {
    await client.connect();
  } catch (err) {
    console.warn('⚠️  Redis unavailable — OTP will use in-memory fallback (not for production)');
    client = null;
  }
};

// In-memory fallback for development without Redis
const memStore = new Map();

const cache = {
  set: async (key, value, ttlSeconds) => {
    if (client) {
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
    } else {
      memStore.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
    }
  },
  get: async (key) => {
    if (client) {
      const val = await client.get(key);
      return val ? JSON.parse(val) : null;
    } else {
      const entry = memStore.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expires) { memStore.delete(key); return null; }
      return entry.value;
    }
  },
  del: async (key) => {
    if (client) await client.del(key);
    else memStore.delete(key);
  }
};

module.exports = { connectRedis, cache };
