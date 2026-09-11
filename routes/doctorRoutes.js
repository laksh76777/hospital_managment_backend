import express from 'express';
import {
  getDoctors,
  getDoctorById,
  getMyDoctorSchedule,
  updateMyDoctorSchedule,
  updateAvailabilityValidationSchema,
} from '../controllers/doctorController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkRole } from '../middleware/checkRole.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// GET /api/doctors/me/schedule - Doctor's own availability schedule (Protected)
router.get('/me/schedule', verifyToken, checkRole('doctor', 'admin'), getMyDoctorSchedule);

// PUT /api/doctors/me/schedule - Update doctor's own availability schedule (Protected)
router.put(
  '/me/schedule',
  verifyToken,
  checkRole('doctor', 'admin'),
  validate(updateAvailabilityValidationSchema),
  updateMyDoctorSchedule
);

// GET /api/doctors - List all doctors, supports ?specialization= query filter (Public)
router.get('/', getDoctors);

// GET /api/doctors/:id - Single doctor profile with weekly availability template (Public)
router.get('/:id', getDoctorById);

export default router;
