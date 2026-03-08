const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"X∞ Smart Locator" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - X∞ Smart Locator',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 10px;">
        <h1 style="color: #ffffff; text-align: center; font-size: 32px; margin-bottom: 20px;">X∞ Smart Locator</h1>
        <div style="background: #ffffff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email</h2>
          <p style="color: #666; line-height: 1.6;">Welcome to X∞! Please click the button below to verify your email address and activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"X∞ Smart Locator" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset - X∞ Smart Locator',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 10px;">
        <h1 style="color: #ffffff; text-align: center; font-size: 32px; margin-bottom: 20px;">X∞ Smart Locator</h1>
        <div style="background: #ffffff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};