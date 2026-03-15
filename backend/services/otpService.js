const twilio = require('twilio');
const { cache } = require('../config/redis');

const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured. See .env.example');
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

/**
 * Generate and send OTP via SMS
 * OTPs are stored in Redis with 10-minute TTL
 */
const sendOTP = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const key = `otp:${phone}`;
  const attemptsKey = `otp_attempts:${phone}`;

  // Rate limit: max 3 OTPs per 10 minutes
  const attempts = (await cache.get(attemptsKey)) || 0;
  if (attempts >= 3) {
    throw new Error('Too many OTP requests. Please wait 10 minutes.');
  }

  await cache.set(key, { otp, verified: false }, 600); // 10 min TTL
  await cache.set(attemptsKey, attempts + 1, 600);

  const client = getClient();
  await client.messages.create({
    body: `Your Idea Validator OTP is: ${otp}. Valid for 10 minutes. Do not share this.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });

  return { success: true, message: `OTP sent to ${phone}` };
};

/**
 * Verify OTP
 */
const verifyOTP = async (phone, otp) => {
  const key = `otp:${phone}`;
  const stored = await cache.get(key);

  if (!stored) throw new Error('OTP expired or not found. Please request a new one.');
  if (stored.otp !== otp) throw new Error('Invalid OTP.');
  if (stored.verified) throw new Error('OTP already used.');

  // Mark as used
  await cache.set(key, { ...stored, verified: true }, 60); // keep for 60s then expire
  await cache.del(`otp_attempts:${phone}`);

  return true;
};

module.exports = { sendOTP, verifyOTP };
