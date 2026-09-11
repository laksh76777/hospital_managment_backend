import express from 'express';
import { registerUser, getMe, registerValidationSchema } from '../controllers/authController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// POST /api/auth/register - Validated registration route (creates or matches MongoDB User doc)
router.post('/register', validate(registerValidationSchema), registerUser);

// GET /api/auth/me - Returns the logged-in user's profile including role
router.get('/me', verifyToken, getMe);

export default router;
