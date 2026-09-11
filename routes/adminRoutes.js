import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkRole } from '../middleware/checkRole.js';
import { validate } from '../middleware/validate.js';
import {
  createDoctor,
  getAdminDoctors,
  updateDoctor,
  deleteDoctor,
  updateDoctorAvailability,
  createDoctorValidationSchema,
  updateAvailabilityValidationSchema,
  updateDoctorValidationSchema,
} from '../controllers/doctorController.js';
import {
  getAdminAppointments,
  getAdminStats,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Enforce authentication and Admin role for all admin routes
router.use(verifyToken, checkRole('admin'));

// Admin Doctor Management
// POST /api/admin/doctors - Create doctor with Firebase Auth + Mongo User + Doctor profile
// GET /api/admin/doctors - List all doctors
router.route('/doctors')
  .post(validate(createDoctorValidationSchema), createDoctor)
  .get(getAdminDoctors);

// PATCH /api/admin/doctors/:id/availability - Updates just the weekly availability array
router.patch('/doctors/:id/availability', validate(updateAvailabilityValidationSchema), updateDoctorAvailability);

// PUT /api/admin/doctors/:id - Update doctor profile
// DELETE /api/admin/doctors/:id - Delete doctor
router.route('/doctors/:id')
  .put(validate(updateDoctorValidationSchema), updateDoctor)
  .delete(deleteDoctor);

// Admin Appointments & Analytics
// GET /api/admin/appointments - Hospital-wide appointments with status/date filters
router.get('/appointments', getAdminAppointments);

// GET /api/admin/stats - Hospital summary statistics (total patients, doctors, appointments)
router.get('/stats', getAdminStats);

export default router;
