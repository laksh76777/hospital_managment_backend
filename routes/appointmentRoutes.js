import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import checkRole from '../middleware/checkRole.js';
import validate from '../middleware/validate.js';
import {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
  getBookedSlots,
  bookAppointmentValidationSchema,
  updateStatusValidationSchema,
  cancelAppointmentValidationSchema,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Public route to check reserved slots for doctor and date
router.get('/booked-slots', getBookedSlots);

// Patient endpoints
// POST /api/appointments (patient only)
router.post(
  '/',
  verifyToken,
  checkRole('patient', 'admin'),
  validate(bookAppointmentValidationSchema),
  bookAppointment
);

// GET /api/appointments/my (patient only)
router.get(
  '/my',
  verifyToken,
  checkRole('patient', 'admin'),
  getMyAppointments
);

// PATCH /api/appointments/:id/cancel (patient only)
router.patch(
  '/:id/cancel',
  verifyToken,
  checkRole('patient', 'admin'),
  validate(cancelAppointmentValidationSchema),
  cancelAppointment
);

// Doctor endpoints
// GET /api/appointments/doctor (doctor only)
router.get(
  '/doctor',
  verifyToken,
  checkRole('doctor', 'admin'),
  getDoctorAppointments
);

// PATCH /api/appointments/:id/status (doctor only)
router.patch(
  '/:id/status',
  verifyToken,
  checkRole('doctor', 'admin'),
  validate(updateStatusValidationSchema),
  updateAppointmentStatus
);

export default router;
