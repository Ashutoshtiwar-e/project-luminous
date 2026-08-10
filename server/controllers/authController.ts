import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'super-secret-key-for-dev');
if (process.env.NODE_ENV === 'production' && !JWT_SECRET) throw new Error("JWT_SECRET missing in production");

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const email = req.body.email?.toLowerCase();
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    
    const db = await getDb();
    const users = db.collection('users');
    
    const existing = await users.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(400).json({ error: 'Username or email already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, email, password: hashedPassword, savedBooks: [], joinedCommunities: [] };
    const result = await users.insertOne(newUser);
    
    const token = jwt.sign({ _id: result.insertedId, username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    res.json({ user: { _id: result.insertedId, username, email, savedBooks: [], joinedCommunities: [] } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase();
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const db = await getDb();
    const users = db.collection('users');
    const user = await users.findOne({ email });
    
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    const { password: _, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass });
  } catch (err) {
    res.status(500).json({ error: 'Auth failed' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token', {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ success: true });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPass } = user;
    res.json(userWithoutPass);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailService';

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const db = await getDb();
    const users = db.collection('users');
    const user = await users.findOne({ email });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await users.updateOne(
      { email },
      { $set: { resetPasswordToken: resetToken, resetPasswordExpires } }
    );

    const baseUrl = process.env.APP_URL || process.env.PUBLIC_URL;
    if (!baseUrl) {
      console.error('APP_URL environment variable is not set. Cannot build password reset URL.');
      return res.status(500).json({ error: 'Failed to process forgot password request' });
    }
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (mailErr) {
      console.error('Failed to send email:', mailErr);
      // Still return success to prevent email enumeration
    }
    
    res.json({ message: 'If that email is registered, a reset link has been sent.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword } }
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'New password is required' });

    const db = await getDb();
    const users = db.collection('users');
    
    const user = await users.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await users.updateOne(
      { _id: user._id },
      { 
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
      }
    );

    res.json({ message: 'Password has been updated successfully.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
