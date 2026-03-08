const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');
require('dotenv').config();

async function signup(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = uuidv4();

  db.run(
    'INSERT INTO users (email, password, name, verification_token) VALUES (?, ?, ?, ?)',
    [email, hashedPassword, name, verificationToken],
    async function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: 'Error creating account' });
      }

      try {
        await sendVerificationEmail(email, verificationToken);
        res.status(201).json({ 
          message: 'Account created successfully. Please check your email to verify your account.',
          userId: this.lastID 
        });
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
        res.status(201).json({ 
          message: 'Account created but verification email failed to send. Please contact support.',
          userId: this.lastID 
        });
      }
    }
  );
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified === 1
      }
    });
  });
}

async function verifyEmail(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Verification token required' });
  }

  db.run(
    'UPDATE users SET email_verified = 1, verification_token = NULL WHERE verification_token = ?',
    [token],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      res.json({ message: 'Email verified successfully' });
    }
  );
}

async function requestPasswordReset(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    db.run(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id],
      async (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        try {
          await sendPasswordResetEmail(email, resetToken);
          res.json({ message: 'If the email exists, a reset link has been sent' });
        } catch (emailErr) {
          console.error('Email sending failed:', emailErr);
          res.status(500).json({ error: 'Failed to send reset email' });
        }
      }
    );
  });
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  const currentTime = Math.floor(Date.now() / 1000);

  db.get(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?',
    [token, currentTime],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.run(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [hashedPassword, user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ message: 'Password reset successful' });
        }
      );
    }
  );
}

async function getProfile(req, res) {
  db.get('SELECT id, email, name, email_verified, created_at FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified === 1,
        createdAt: user.created_at
      }
    });
  });
}

module.exports = {
  signup,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getProfile
};