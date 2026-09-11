import express from 'express';
import authRoutes from './authRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// Base health / status route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'HealthDesk Hospital Management API' });
});

router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/admin', adminRoutes);

export default router;

