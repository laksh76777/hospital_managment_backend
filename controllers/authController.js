import mongoose from 'mongoose';
import { z } from 'zod';
import User from '../models/User.js';

// Zod validation schema for user registration
export const registerValidationSchema = z.object({
  firebaseUID: z.string().min(1, 'firebaseUID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email address is required'),
  role: z.enum(['patient', 'doctor', 'admin']).optional().default('patient'),
  phone: z.string().optional(),
});

// In-memory user cache fallback in case MongoDB connection is pending/transient
const memoryUsers = new Map();

/**
 * @desc    Register or ensure MongoDB user doc exists for given firebaseUID
 * @route   POST /api/auth/register
 * @access  Public / Client with Firebase UID
 */
export const registerUser = async (req, res, next) => {
  try {
    const { firebaseUID, name, email, role, phone } = req.body;

    const emailLower = (email || '').trim().toLowerCase();
    const isOwnerEmail = emailLower === 'abc@gmail.com';
    const assignedRole = isOwnerEmail ? 'admin' : (role && ['patient', 'doctor', 'admin'].includes(role) ? role : 'patient');
    const userName = isOwnerEmail ? 'Hospital Admin' : (name || (email ? email.split('@')[0] : 'Patient User'));

    // Check if MongoDB is connected (readyState === 1)
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      // Find existing user by firebaseUID or email
      let user = await User.findOne({
        $or: [{ firebaseUID }, { email }],
      });

      if (user) {
        // Update firebaseUID if it matched by email
        let updated = false;
        if (!user.firebaseUID || user.firebaseUID !== firebaseUID) {
          user.firebaseUID = firebaseUID;
          updated = true;
        }
        if (isOwnerEmail && user.role !== 'admin') {
          user.role = 'admin';
          updated = true;
        }
        if (phone && (!user.phone || user.phone !== phone)) {
          user.phone = phone;
          updated = true;
        }
        if (updated) {
          await user.save();
        }

        const userData = {
          id: user._id,
          firebaseUID: user.firebaseUID,
          name: user.name,
          email: user.email,
          role: isOwnerEmail ? 'admin' : user.role,
          phone: user.phone || '',
          mustChangePassword: !!user.mustChangePassword,
          createdAt: user.createdAt,
        };

        return res.status(200).json({
          success: true,
          data: userData,
          user: userData,
          message: 'User profile already registered',
        });
      }

      // Create new user document
      user = await User.create({
        firebaseUID,
        name: userName,
        email,
        role: assignedRole,
        phone: phone || '',
        mustChangePassword: false,
      });

      const userData = {
        id: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        mustChangePassword: !!user.mustChangePassword,
        createdAt: user.createdAt,
      };

      return res.status(201).json({
        success: true,
        data: userData,
        user: userData,
        message: 'User registered successfully',
      });
    } else {
      // Memory fallback when MongoDB is not running locally
      let cached = memoryUsers.get(firebaseUID);
      if (!cached) {
        cached = {
          id: 'mem_' + Date.now(),
          firebaseUID,
          name: userName,
          email,
          role: assignedRole,
          phone: phone || '',
          mustChangePassword: false,
          createdAt: new Date(),
        };
        memoryUsers.set(firebaseUID, cached);
      } else if (isOwnerEmail) {
        cached.role = 'admin';
      }

      return res.status(201).json({
        success: true,
        data: cached,
        user: cached,
        message: 'User registered successfully',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user profile from MongoDB
 * @route   GET /api/auth/me
 * @access  Protected (Requires Firebase ID Token)
 */
export const getMe = async (req, res, next) => {
  try {
    const firebaseUID = req.user?.uid;
    const tokenEmail = req.user?.email;
    const tokenName = req.user?.name;

    if (!firebaseUID) {
      return res.status(401).json({
        success: false,
        message: 'User identifier not found in authorization token',
      });
    }

    const emailLower = (tokenEmail || '').trim().toLowerCase();
    const isOwnerEmail = emailLower === 'abc@gmail.com';
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      let user = await User.findOne({
        $or: [{ firebaseUID }, { email: tokenEmail }],
      });

      if (!user && tokenEmail) {
        // Automatically provision user profile if not yet created
        user = await User.create({
          firebaseUID,
          name: tokenName || tokenEmail.split('@')[0],
          email: tokenEmail,
          role: isOwnerEmail ? 'admin' : 'patient',
          mustChangePassword: false,
        });
      }

      const effectiveRole = isOwnerEmail ? 'admin' : (user?.role || req.user.role || 'patient');

      const userData = {
        id: user?._id || 'user_' + firebaseUID,
        firebaseUID: user?.firebaseUID || firebaseUID,
        name: user?.name || tokenName || tokenEmail?.split('@')[0] || 'User',
        email: user?.email || tokenEmail,
        role: effectiveRole,
        phone: user?.phone || '',
        mustChangePassword: !!user?.mustChangePassword,
        createdAt: user?.createdAt || new Date(),
      };

      return res.status(200).json({
        success: true,
        data: userData,
        user: userData,
      });
    } else {
      // Memory fallback
      let cached = memoryUsers.get(firebaseUID);
      if (!cached) {
        cached = {
          id: 'mem_' + Date.now(),
          firebaseUID,
          name: tokenName || (tokenEmail ? tokenEmail.split('@')[0] : 'User'),
          email: tokenEmail || 'user@healthdesk.local',
          role: isOwnerEmail ? 'admin' : 'patient',
          phone: '',
          mustChangePassword: false,
          createdAt: new Date(),
        };
        memoryUsers.set(firebaseUID, cached);
      }

      return res.status(200).json({
        success: true,
        data: cached,
        user: cached,
      });
    }
  } catch (error) {
    next(error);
  }
};
