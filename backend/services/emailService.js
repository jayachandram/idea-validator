const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const emailTemplates = {
  verify: (name, url) => ({
    subject: 'Verify your Idea Validator account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0f;color:#e8e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#e8c547;padding:24px 32px">
          <h1 style="margin:0;color:#0a0a0f;font-size:1.4rem">💡 Idea Validator</h1>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 12px">Hey ${name}, welcome! 👋</h2>
          <p style="color:#a0a0c0;line-height:1.6">You're one click away from getting brutal, honest feedback on your startup ideas.</p>
          <a href="${url}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#e8c547;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:bold">Verify My Email</a>
          <p style="color:#6a6a8a;font-size:0.8rem">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
        </div>
      </div>
    `
  }),
  resetPassword: (name, url) => ({
    subject: 'Reset your Idea Validator password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0f;color:#e8e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#ff6b35;padding:24px 32px">
          <h1 style="margin:0;color:#fff;font-size:1.4rem">🔐 Password Reset</h1>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 12px">Hi ${name},</h2>
          <p style="color:#a0a0c0;line-height:1.6">We received a request to reset your password.</p>
          <a href="${url}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#ff6b35;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Reset Password</a>
          <p style="color:#6a6a8a;font-size:0.8rem">This link expires in 1 hour. If you didn't request this, your account is safe.</p>
        </div>
      </div>
    `
  })
};

const sendEmail = async (to, templateName, ...args) => {
  const transporter = createTransporter();
  const template = emailTemplates[templateName](...args);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: template.subject,
    html: template.html
  });
};

module.exports = { sendEmail };
