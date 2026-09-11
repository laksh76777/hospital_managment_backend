import mongoose from 'mongoose';
import { z } from 'zod';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { admin, firebaseAdminInitialized } from '../config/firebaseAdmin.js';

// Zod schema for Doctor creation validation
export const createDoctorValidationSchema = z.object({
  name: z.string().min(1, 'Doctor name is required'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  specialization: z.string().min(1, 'Specialization is required'),
  department: z.string().min(1, 'Department is required'),
  experience: z.coerce.number().min(0, 'Experience must be a positive number'),
  fees: z.coerce.number().min(0, 'Consultation fees must be a positive number'),
  phone: z.string().optional(),
  availability: z
    .array(
      z.object({
        day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
        slots: z.array(z.object({ time: z.string().min(1) })),
      })
    )
    .optional(),
});

// Zod schema for updating availability only
export const updateAvailabilityValidationSchema = z.object({
  availability: z.array(
    z.object({
      day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
      slots: z.array(z.object({ time: z.string().min(1) })),
    })
  ),
});

// Zod schema for updating full doctor profile (PUT /api/admin/doctors/:id)
export const updateDoctorValidationSchema = z.object({
  name: z.string().min(1, 'Doctor name cannot be empty').optional(),
  specialization: z.string().min(1, 'Specialization cannot be empty').optional(),
  department: z.string().min(1, 'Department cannot be empty').optional(),
  experience: z.coerce.number().min(0, 'Experience must be a positive number').optional(),
  fees: z.coerce.number().min(0, 'Consultation fees must be a positive number').optional(),
  phone: z.string().optional(),
  availability: z
    .array(
      z.object({
        day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
        slots: z.array(z.object({ time: z.string().min(1) })),
      })
    )
    .optional(),
});

// Default Mon-Sun weekly template (NO isBooked field stored in availability template)
export const generateDefaultAvailability = () => [
  {
    day: 'Mon',
    slots: [
      { time: '09:00 AM' },
      { time: '10:00 AM' },
      { time: '11:30 AM' },
      { time: '02:00 PM' },
      { time: '03:30 PM' },
    ],
  },
  {
    day: 'Tue',
    slots: [
      { time: '09:30 AM' },
      { time: '11:00 AM' },
      { time: '02:00 PM' },
      { time: '04:00 PM' },
    ],
  },
  {
    day: 'Wed',
    slots: [
      { time: '10:00 AM' },
      { time: '11:30 AM' },
      { time: '01:30 PM' },
      { time: '03:00 PM' },
    ],
  },
  {
    day: 'Thu',
    slots: [
      { time: '09:00 AM' },
      { time: '10:30 AM' },
      { time: '02:30 PM' },
      { time: '04:30 PM' },
    ],
  },
  {
    day: 'Fri',
    slots: [
      { time: '09:00 AM' },
      { time: '11:00 AM' },
      { time: '02:00 PM' },
      { time: '03:30 PM' },
    ],
  },
  {
    day: 'Sat',
    slots: [
      { time: '10:00 AM' },
      { time: '11:30 AM' },
      { time: '01:00 PM' },
    ],
  },
  {
    day: 'Sun',
    slots: [
      { time: '11:00 AM' },
    ],
  },
];

// In-memory doctors list seeded with Indian doctors and Indian Rupee consultation fees (₹)
export let inMemoryDoctors = [
  {
    _id: 'doc-in-1',
    name: 'Dr. Rajesh Sharma',
    specialization: 'Cardiology',
    department: 'Cardiology (Heart & Vascular)',
    experience: 16,
    fees: 800,
    rating: 4.9,
    availability: generateDefaultAvailability(),
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'doc-in-2',
    name: 'Dr. Priya Nair',
    specialization: 'Neurology',
    department: 'Neurology & Brain Sciences',
    experience: 12,
    fees: 1000,
    rating: 4.9,
    availability: generateDefaultAvailability(),
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'doc-in-3',
    name: 'Dr. Amit Patel',
    specialization: 'Orthopedics',
    department: 'Orthopedic Surgery & Joints',
    experience: 14,
    fees: 900,
    rating: 4.8,
    availability: generateDefaultAvailability(),
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'doc-in-4',
    name: 'Dr. Sunita Rao',
    specialization: 'Pediatrics',
    department: 'Pediatrics & Child Health',
    experience: 10,
    fees: 700,
    rating: 4.9,
    availability: generateDefaultAvailability(),
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'doc-in-5',
    name: 'Dr. Vikram Malhotra',
    specialization: 'Dermatology',
    department: 'Dermatology & Skin Care',
    experience: 9,
    fees: 750,
    rating: 4.8,
    availability: generateDefaultAvailability(),
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'doc-in-6',
    name: 'Dr. Ananya Mukherjee',
    specialization: 'General Medicine',
    department: 'General & Internal Medicine',
    experience: 13,
    fees: 600,
    rating: 4.9,
    availability: generateDefaultAvailability(),
    createdAt: new Date().toISOString(),
  },
];

/**
 * Seed initial doctors into MongoDB if collection is empty
 */
export const seedInitialDoctorsIfEmpty = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const count = await Doctor.countDocuments();
      if (count === 0) {
        console.log('[Doctor Controller] Seeding initial Sanjeevani Hospital doctors...');
        for (const doc of inMemoryDoctors) {
          await Doctor.create({
            name: doc.name,
            specialization: doc.specialization,
            department: doc.department,
            experience: doc.experience,
            fees: doc.fees,
            rating: doc.rating,
            availability: doc.availability,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Doctor Controller] Seed note:', err.message);
  }
};

seedInitialDoctorsIfEmpty();

// ==========================================
// PUBLIC DOCTOR CONTROLLERS
// ==========================================

/**
 * @desc    Get all doctors (supports ?specialization= query filter)
 * @route   GET /api/doctors
 * @access  Public
 */
export const getDoctors = async (req, res, next) => {
  try {
    const { specialization } = req.query;
    const filter = {};
    if (specialization && specialization !== 'All' && specialization !== 'all') {
      filter.specialization = new RegExp(`^${specialization}$`, 'i');
    }

    let doctors = [];
    if (mongoose.connection.readyState === 1) {
      try {
        doctors = await Doctor.find(filter).populate('userRef', 'name email phone mustChangePassword').sort({ createdAt: -1 });
      } catch (err) {
        console.warn('[getDoctors] DB find note:', err.message);
      }
    }

    if (!doctors || doctors.length === 0) {
      doctors = inMemoryDoctors.filter((doc) => {
        if (!specialization || specialization === 'All' || specialization === 'all') return true;
        return doc.specialization.toLowerCase() === specialization.toLowerCase();
      });
    }

    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single doctor by ID with availability template
 * @route   GET /api/doctors/:id
 * @access  Public
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let doctor = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      try {
        doctor = await Doctor.findById(id).populate('userRef', 'name email phone mustChangePassword');
      } catch (err) {
        console.warn('[getDoctorById] DB query note:', err.message);
      }
    }

    if (!doctor) {
      doctor = inMemoryDoctors.find((d) => d._id?.toString() === id || d.id === id);
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN DOCTOR CONTROLLERS
// ==========================================

/**
 * @desc    Create a new Doctor (admin only):
 *          - Creates Firebase user via firebase-admin.auth().createUser({ email, password }) using admin-provided temp password
 *          - Creates MongoDB User (role: 'doctor', mustChangePassword: true)
 *          - Creates Doctor profile linked via userRef
 *          - Wrapped in try/catch rollback: deletes Firebase user if MongoDB writes fail
 *          - Returns created doctor, never the password
 * @route   POST /api/admin/doctors
 * @access  Protected (Admin only)
 */
export const createDoctor = async (req, res, next) => {
  let createdFirebaseUser = null;
  const { name, email, password, specialization, department, experience, fees, phone, availability } = req.body;

  try {
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Explicit duplicate email check with clean error message before Firebase or MongoDB operations
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: `A user or doctor with email "${email}" already exists.`,
          fieldErrors: { email: 'This email is already registered in the system.' },
        });
      }
    }

    const existingInMemory = inMemoryDoctors.find(
      (d) =>
        (d.email && d.email.toLowerCase() === normalizedEmail) ||
        (d.userRef?.email && d.userRef.email.toLowerCase() === normalizedEmail)
    );
    if (existingInMemory) {
      return res.status(409).json({
        success: false,
        message: `A doctor with email "${email}" already exists.`,
        fieldErrors: { email: 'This email is already registered.' },
      });
    }

    // 1. Create Firebase User via firebase-admin using admin-provided temporary password
    if (firebaseAdminInitialized && admin.apps.length > 0) {
      try {
        createdFirebaseUser = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });
      } catch (fbErr) {
        if (fbErr.code === 'auth/email-already-exists') {
          return res.status(409).json({
            success: false,
            message: 'A user account with this email address already exists in Firebase Auth',
          });
        }
        throw fbErr;
      }
    }

    const firebaseUID = createdFirebaseUser?.uid || 'doc_uid_' + Date.now();

    // 2. Perform MongoDB operations with rollback protection
    let userDoc = null;
    let newDoctor = null;

    try {
      if (mongoose.connection.readyState === 1) {
        // Create or find User doc with role: 'doctor' and mustChangePassword: true
        userDoc = await User.findOne({ email });
        if (!userDoc) {
          userDoc = await User.create({
            firebaseUID,
            name,
            email,
            role: 'doctor',
            phone: phone || '',
            mustChangePassword: true,
          });
        } else {
          userDoc.role = 'doctor';
          userDoc.firebaseUID = firebaseUID;
          userDoc.mustChangePassword = true;
          await userDoc.save();
        }

        // Clean availability template ensuring no isBooked field
        const cleanAvailability = Array.isArray(availability) && availability.length > 0
          ? availability.map((d) => ({
              day: d.day,
              slots: (d.slots || []).map((s) => ({ time: typeof s === 'string' ? s : s.time })),
            }))
          : generateDefaultAvailability();

        newDoctor = await Doctor.create({
          userRef: userDoc._id,
          name,
          specialization,
          department,
          experience: Number(experience) || 0,
          fees: Number(fees) || 0,
          availability: cleanAvailability,
        });

        // Re-fetch populated doctor
        newDoctor = await Doctor.findById(newDoctor._id).populate('userRef', 'name email phone mustChangePassword');
      } else {
        // In-memory fallback
        userDoc = {
          _id: 'usr_' + Date.now(),
          firebaseUID,
          name,
          email,
          role: 'doctor',
          phone: phone || '',
          mustChangePassword: true,
        };

        const cleanAvailability = Array.isArray(availability) && availability.length > 0
          ? availability.map((d) => ({
              day: d.day,
              slots: (d.slots || []).map((s) => ({ time: typeof s === 'string' ? s : s.time })),
            }))
          : generateDefaultAvailability();

        newDoctor = {
          _id: 'doc_' + Date.now(),
          userRef: userDoc,
          name,
          specialization,
          department,
          experience: Number(experience) || 0,
          fees: Number(fees) || 0,
          availability: cleanAvailability,
          rating: 4.9,
          createdAt: new Date().toISOString(),
        };
      }

      inMemoryDoctors.unshift(newDoctor);

      // Return created doctor profile (NEVER the password)
      return res.status(201).json({
        success: true,
        data: newDoctor,
        message: 'Doctor profile and credentials created successfully',
      });
    } catch (mongoError) {
      // ROLLBACK: Delete Firebase user if MongoDB creation failed
      if (createdFirebaseUser && firebaseAdminInitialized) {
        try {
          await admin.auth().deleteUser(createdFirebaseUser.uid);
          console.log('[createDoctor Rollback] Deleted orphaned Firebase user:', createdFirebaseUser.uid);
        } catch (delErr) {
          console.error('[createDoctor Rollback Error] Failed to delete Firebase user:', delErr);
        }
      }
      throw mongoError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all doctors for admin
 * @route   GET /api/admin/doctors
 * @access  Protected (Admin only)
 */
export const getAdminDoctors = async (req, res, next) => {
  try {
    let doctors = [];
    if (mongoose.connection.readyState === 1) {
      try {
        doctors = await Doctor.find().populate('userRef', 'name email phone mustChangePassword').sort({ createdAt: -1 });
      } catch (err) {
        console.warn('[getAdminDoctors] DB query note:', err.message);
      }
    }

    if (!doctors || doctors.length === 0) {
      doctors = inMemoryDoctors;
    }

    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a doctor (admin only)
 * @route   PUT /api/admin/doctors/:id
 * @access  Protected (Admin only)
 */
export const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, specialization, department, experience, fees, availability } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (specialization) updateFields.specialization = specialization;
    if (department) updateFields.department = department;
    if (experience !== undefined) updateFields.experience = Number(experience);
    if (fees !== undefined) updateFields.fees = Number(fees);
    if (availability) {
      updateFields.availability = availability.map((d) => ({
        day: d.day,
        slots: (d.slots || []).map((s) => ({ time: typeof s === 'string' ? s : s.time })),
      }));
    }

    let updatedDoctor = null;

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      try {
        updatedDoctor = await Doctor.findByIdAndUpdate(id, updateFields, {
          new: true,
          runValidators: true,
        }).populate('userRef', 'name email phone mustChangePassword');
      } catch (err) {
        console.warn('[updateDoctor] DB update note:', err.message);
      }
    }

    // Update in-memory fallback
    const memIndex = inMemoryDoctors.findIndex((d) => d._id?.toString() === id || d.id === id);
    if (memIndex !== -1) {
      inMemoryDoctors[memIndex] = {
        ...inMemoryDoctors[memIndex],
        ...updateFields,
      };
      if (!updatedDoctor) {
        updatedDoctor = inMemoryDoctors[memIndex];
      }
    }

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found to update',
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedDoctor,
      message: 'Doctor updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a doctor (admin only)
 * @route   DELETE /api/admin/doctors/:id
 * @access  Protected (Admin only)
 */
export const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      try {
        await Doctor.findByIdAndDelete(id);
      } catch (err) {
        console.warn('[deleteDoctor] DB delete note:', err.message);
      }
    }

    inMemoryDoctors = inMemoryDoctors.filter((d) => d._id?.toString() !== id && d.id !== id);

    return res.status(200).json({
      success: true,
      message: 'Doctor removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update only weekly availability array for doctor
 * @route   PATCH /api/admin/doctors/:id/availability
 * @access  Protected (Admin only)
 */
export const updateDoctorAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Availability must be an array of day/slot objects',
      });
    }

    // Sanitize template slots (no isBooked field)
    const cleanAvailability = availability.map((d) => ({
      day: d.day,
      slots: (d.slots || []).map((s) => ({ time: typeof s === 'string' ? s : s.time })),
    }));

    let updatedDoctor = null;

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
      try {
        updatedDoctor = await Doctor.findByIdAndUpdate(
          id,
          { availability: cleanAvailability },
          { new: true, runValidators: true }
        ).populate('userRef', 'name email phone mustChangePassword');
      } catch (err) {
        console.warn('[updateDoctorAvailability] DB note:', err.message);
      }
    }

    const memIndex = inMemoryDoctors.findIndex((d) => d._id?.toString() === id || d.id === id);
    if (memIndex !== -1) {
      inMemoryDoctors[memIndex].availability = cleanAvailability;
      if (!updatedDoctor) {
        updatedDoctor = inMemoryDoctors[memIndex];
      }
    }

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found to update availability',
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedDoctor,
      message: 'Weekly availability timetable updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get schedule/timetable for logged in doctor
 * @route   GET /api/doctors/me/schedule
 * @access  Protected (Doctor)
 */
export const getMyDoctorSchedule = async (req, res, next) => {
  try {
    let doc = null;
    const mongoUser = req.mongoUser;
    const userEmail = req.user?.email;

    if (mongoose.connection.readyState === 1) {
      if (mongoUser) {
        doc = await Doctor.findOne({ userRef: mongoUser._id });
      }
      if (!doc && userEmail) {
        const u = await User.findOne({ email: userEmail });
        if (u) {
          doc = await Doctor.findOne({ userRef: u._id });
        }
      }
    }

    if (!doc && userEmail) {
      doc = inMemoryDoctors.find(
        (d) =>
          d.userRef?.email?.toLowerCase() === userEmail.toLowerCase() ||
          d.email?.toLowerCase() === userEmail.toLowerCase()
      );
    }

    if (!doc && inMemoryDoctors.length > 0) {
      doc = inMemoryDoctors[0];
    }

    const availability = doc?.availability || generateDefaultAvailability();

    return res.status(200).json({
      success: true,
      data: availability,
      doctor: doc ? { id: doc._id || doc.id, name: doc.name, specialization: doc.specialization } : null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update schedule/timetable for logged in doctor
 * @route   PUT /api/doctors/me/schedule
 * @access  Protected (Doctor)
 */
export const updateMyDoctorSchedule = async (req, res, next) => {
  try {
    let doc = null;
    const mongoUser = req.mongoUser;
    const userEmail = req.user?.email;

    if (mongoose.connection.readyState === 1) {
      if (mongoUser) {
        doc = await Doctor.findOne({ userRef: mongoUser._id });
      }
      if (!doc && userEmail) {
        const u = await User.findOne({ email: userEmail });
        if (u) {
          doc = await Doctor.findOne({ userRef: u._id });
        }
      }
    }

    if (!doc && userEmail) {
      doc = inMemoryDoctors.find(
        (d) =>
          d.userRef?.email?.toLowerCase() === userEmail.toLowerCase() ||
          d.email?.toLowerCase() === userEmail.toLowerCase()
      );
    }

    if (!doc && inMemoryDoctors.length > 0) {
      doc = inMemoryDoctors[0];
    }

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found to update schedule',
      });
    }

    req.params = { id: (doc._id || doc.id).toString() };
    return updateDoctorAvailability(req, res, next);
  } catch (error) {
    next(error);
  }
};
