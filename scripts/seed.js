import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

// Setup environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Prompt for confirmation in CLI
function confirmPrompt(question) {
  return new Promise((resolve) => {
    // If running in CI or with --force / -y flag or non-interactive
    if (
      process.argv.includes('--force') ||
      process.argv.includes('-y') ||
      process.argv.includes('-f') ||
      process.env.CI ||
      !process.stdin.isTTY
    ) {
      console.log(`${question} (Auto-confirmed via flag/environment)`);
      return resolve(true);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

// 6 Specialized Indian Hospital Doctors (Sanjeevani Multi-Speciality Hospital, Noida)
const DOCTORS_SEED_DATA = [
  {
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@healthdesk.org',
    specialization: 'Cardiologist',
    department: 'Cardiology',
    experience: 18,
    fees: 1200,
    rating: 4.9,
    availability: [
      {
        day: 'Mon',
        slots: [{ time: '09:30 AM' }, { time: '10:30 AM' }, { time: '11:30 AM' }, { time: '02:00 PM' }, { time: '03:30 PM' }, { time: '04:30 PM' }],
      },
      {
        day: 'Wed',
        slots: [{ time: '09:30 AM' }, { time: '10:30 AM' }, { time: '11:30 AM' }, { time: '02:00 PM' }, { time: '03:30 PM' }],
      },
      {
        day: 'Fri',
        slots: [{ time: '10:00 AM' }, { time: '11:00 AM' }, { time: '02:30 PM' }, { time: '04:00 PM' }],
      },
      {
        day: 'Sat',
        slots: [{ time: '09:00 AM' }, { time: '10:00 AM' }, { time: '11:00 AM' }],
      },
    ],
  },
  {
    name: 'Dr. Priya Nair',
    email: 'priya.nair@healthdesk.org',
    specialization: 'Orthopaedic Surgeon',
    department: 'Orthopaedics',
    experience: 14,
    fees: 1000,
    rating: 4.8,
    availability: [
      {
        day: 'Mon',
        slots: [{ time: '10:00 AM' }, { time: '11:00 AM' }, { time: '12:00 PM' }, { time: '02:30 PM' }, { time: '03:30 PM' }],
      },
      {
        day: 'Tue',
        slots: [{ time: '10:00 AM' }, { time: '11:30 AM' }, { time: '02:00 PM' }, { time: '04:00 PM' }],
      },
      {
        day: 'Thu',
        slots: [{ time: '09:30 AM' }, { time: '11:00 AM' }, { time: '02:30 PM' }, { time: '03:30 PM' }],
      },
      {
        day: 'Sat',
        slots: [{ time: '10:00 AM' }, { time: '11:30 AM' }, { time: '01:00 PM' }],
      },
    ],
  },
  {
    name: 'Dr. Amitav Sen',
    email: 'amitav.sen@healthdesk.org',
    specialization: 'Neurologist',
    department: 'Neurology',
    experience: 16,
    fees: 1500,
    rating: 4.9,
    availability: [
      {
        day: 'Tue',
        slots: [{ time: '09:00 AM' }, { time: '10:30 AM' }, { time: '12:00 PM' }, { time: '03:00 PM' }, { time: '04:00 PM' }],
      },
      {
        day: 'Wed',
        slots: [{ time: '10:00 AM' }, { time: '11:30 AM' }, { time: '02:00 PM' }, { time: '03:30 PM' }],
      },
      {
        day: 'Fri',
        slots: [{ time: '09:30 AM' }, { time: '11:00 AM' }, { time: '02:30 PM' }, { time: '04:30 PM' }],
      },
      {
        day: 'Sun',
        slots: [{ time: '10:00 AM' }, { time: '11:30 AM' }],
      },
    ],
  },
  {
    name: 'Dr. Sunita Deshmukh',
    email: 'sunita.deshmukh@healthdesk.org',
    specialization: 'Senior Paediatrician',
    department: 'Paediatrics',
    experience: 12,
    fees: 800,
    rating: 4.9,
    availability: [
      {
        day: 'Mon',
        slots: [{ time: '09:00 AM' }, { time: '10:00 AM' }, { time: '11:00 AM' }, { time: '04:00 PM' }, { time: '05:00 PM' }],
      },
      {
        day: 'Tue',
        slots: [{ time: '09:00 AM' }, { time: '10:00 AM' }, { time: '11:30 AM' }, { time: '04:30 PM' }],
      },
      {
        day: 'Wed',
        slots: [{ time: '09:00 AM' }, { time: '10:30 AM' }, { time: '03:30 PM' }, { time: '05:00 PM' }],
      },
      {
        day: 'Thu',
        slots: [{ time: '09:00 AM' }, { time: '10:00 AM' }, { time: '11:00 AM' }, { time: '04:00 PM' }],
      },
      {
        day: 'Fri',
        slots: [{ time: '09:00 AM' }, { time: '10:00 AM' }, { time: '11:00 AM' }, { time: '04:00 PM' }],
      },
      {
        day: 'Sat',
        slots: [{ time: '09:00 AM' }, { time: '10:30 AM' }, { time: '12:00 PM' }],
      },
    ],
  },
  {
    name: 'Dr. Vikramaditya Rathore',
    email: 'vikram.rathore@healthdesk.org',
    specialization: 'Dermatologist & Cosmetologist',
    department: 'Dermatology',
    experience: 10,
    fees: 900,
    rating: 4.7,
    availability: [
      {
        day: 'Wed',
        slots: [{ time: '11:00 AM' }, { time: '12:00 PM' }, { time: '02:00 PM' }, { time: '03:30 PM' }, { time: '05:00 PM' }],
      },
      {
        day: 'Thu',
        slots: [{ time: '11:00 AM' }, { time: '12:30 PM' }, { time: '02:30 PM' }, { time: '04:30 PM' }],
      },
      {
        day: 'Fri',
        slots: [{ time: '11:00 AM' }, { time: '01:00 PM' }, { time: '03:00 PM' }, { time: '05:00 PM' }],
      },
      {
        day: 'Sat',
        slots: [{ time: '10:00 AM' }, { time: '11:30 AM' }, { time: '01:00 PM' }, { time: '02:30 PM' }],
      },
      {
        day: 'Sun',
        slots: [{ time: '11:00 AM' }, { time: '12:30 PM' }],
      },
    ],
  },
  {
    name: 'Dr. Ananya Mukherjee',
    email: 'ananya.mukherjee@healthdesk.org',
    specialization: 'Consultant Physician & Diabetologist',
    department: 'General Medicine',
    experience: 15,
    fees: 750,
    rating: 4.8,
    availability: [
      {
        day: 'Mon',
        slots: [{ time: '08:30 AM' }, { time: '09:30 AM' }, { time: '10:30 AM' }, { time: '11:30 AM' }, { time: '02:00 PM' }, { time: '03:00 PM' }],
      },
      {
        day: 'Tue',
        slots: [{ time: '08:30 AM' }, { time: '09:30 AM' }, { time: '10:30 AM' }, { time: '02:00 PM' }, { time: '03:30 PM' }],
      },
      {
        day: 'Wed',
        slots: [{ time: '08:30 AM' }, { time: '09:30 AM' }, { time: '11:00 AM' }, { time: '02:00 PM' }, { time: '03:00 PM' }],
      },
      {
        day: 'Thu',
        slots: [{ time: '08:30 AM' }, { time: '09:30 AM' }, { time: '10:30 AM' }, { time: '02:00 PM' }, { time: '04:00 PM' }],
      },
      {
        day: 'Fri',
        slots: [{ time: '08:30 AM' }, { time: '09:30 AM' }, { time: '10:30 AM' }, { time: '11:30 AM' }, { time: '02:00 PM' }],
      },
    ],
  },
];

async function seedDatabase() {
  console.log('\n==================================================================');
  console.log('   HealthDesk — Sanjeevani Hospital Database Seeder (MongoDB)     ');
  console.log('==================================================================\n');

  const confirmed = await confirmPrompt(
    '⚠️  WARNING: This will replace doctors and sample appointments with clean seed data.\nProceed with database seeding? (y/N): '
  );

  if (!confirmed) {
    console.log('\n[Seeder] Operation aborted by user. No data was modified.');
    process.exit(0);
  }

  // Connect to MongoDB
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    console.error('[Error] Could not connect to MongoDB database. Please ensure MONGO_URI is active.');
    process.exit(1);
  }

  try {
    console.log('\n[1/5] Syncing database indexes...');
    await Doctor.syncIndexes();
    await Appointment.syncIndexes();
    await User.syncIndexes();

    console.log('[2/5] Cleaning existing appointments & doctor faculty data...');
    await Appointment.deleteMany({});
    await Doctor.deleteMany({});

    console.log('[3/5] Provisioning patient test accounts...');
    // Seed sample patient
    const patientUser = await User.findOneAndUpdate(
      { email: 'patient@healthdesk.org' },
      {
        firebaseUID: 'patient_rohan_kapoor_101',
        name: 'Rohan Kapoor',
        email: 'patient@healthdesk.org',
        role: 'patient',
        phone: '+91 98111 22334',
        mustChangePassword: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Seed second sample patient
    const patientUser2 = await User.findOneAndUpdate(
      { email: 'meera.iyer@healthdesk.org' },
      {
        firebaseUID: 'patient_meera_iyer_102',
        name: 'Meera Iyer',
        email: 'meera.iyer@healthdesk.org',
        role: 'patient',
        phone: '+91 97222 33445',
        mustChangePassword: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[3/5] Patients ready: ${patientUser.name}, ${patientUser2.name}`);

    console.log('[4/5] Seeding 6 specialized hospital physicians with weekly templates...');
    const insertedDoctors = [];

    for (const docData of DOCTORS_SEED_DATA) {
      // Upsert doctor user account
      const docUser = await User.findOneAndUpdate(
        { email: docData.email },
        {
          firebaseUID: `doc_${Buffer.from(docData.email).toString('hex').slice(0, 16)}`,
          name: docData.name,
          email: docData.email,
          role: 'doctor',
          phone: '+91 98990 00111',
          mustChangePassword: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Create Doctor profile
      const doctor = await Doctor.create({
        userRef: docUser._id,
        name: docData.name,
        specialization: docData.specialization,
        department: docData.department,
        experience: docData.experience,
        fees: docData.fees,
        rating: docData.rating,
        availability: docData.availability,
      });

      insertedDoctors.push(doctor);
      console.log(`  ✓ ${doctor.name} — ${doctor.department} (${doctor.specialization})`);
    }

    console.log('\n[5/5] Seeding realistic sample patient consultation bookings...');
    const now = new Date();

    // Helper to get next occurrence of a specific weekday index (0=Sun, 1=Mon, ..., 6=Sat)
    function getNextDateForDay(dayOffset) {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    const sampleAppointments = [
      {
        patientRef: patientUser._id,
        doctorRef: insertedDoctors[0]._id, // Dr. Rajesh Sharma (Cardiology)
        appointmentDate: getNextDateForDay(1),
        time: '10:30 AM',
        status: 'confirmed',
        notes: 'Routine quarterly lipid profile & hypertension management review',
        patientName: patientUser.name,
        patientEmail: patientUser.email,
        patientPhone: patientUser.phone,
      },
      {
        patientRef: patientUser2._id,
        doctorRef: insertedDoctors[1]._id, // Dr. Priya Nair (Orthopaedics)
        appointmentDate: getNextDateForDay(2),
        time: '11:00 AM',
        status: 'pending',
        notes: 'Persistent right knee joint pain after morning brisk walking',
        patientName: patientUser2.name,
        patientEmail: patientUser2.email,
        patientPhone: patientUser2.phone,
      },
      {
        patientRef: patientUser._id,
        doctorRef: insertedDoctors[3]._id, // Dr. Sunita Deshmukh (Paediatrics)
        appointmentDate: getNextDateForDay(3),
        time: '09:00 AM',
        status: 'confirmed',
        notes: 'Paediatric wellness checkup and MMR vaccination schedule',
        patientName: patientUser.name,
        patientEmail: patientUser.email,
        patientPhone: patientUser.phone,
      },
      {
        patientRef: patientUser2._id,
        doctorRef: insertedDoctors[5]._id, // Dr. Ananya Mukherjee (General Medicine)
        appointmentDate: getNextDateForDay(0), // Today
        time: '09:30 AM',
        status: 'completed',
        notes: 'Seasonal viral fever followup and HbA1c diabetic monitoring',
        patientName: patientUser2.name,
        patientEmail: patientUser2.email,
        patientPhone: patientUser2.phone,
      },
    ];

    for (const apptData of sampleAppointments) {
      await Appointment.create(apptData);
    }

    console.log(`  ✓ Seeded ${sampleAppointments.length} sample appointments with verified indexes.`);

    console.log('\n==================================================================');
    console.log('   DATABASE SEEDING COMPLETED SUCCESSFULLY!                      ');
    console.log('==================================================================');
    console.log(`   Hospital:     Sanjeevani Multi-Speciality Hospital, Noida`);
    console.log(`   Doctors:      ${insertedDoctors.length} Specialists Seeded`);
    console.log(`   Patients:     2 Patient Accounts Ready`);
    console.log(`   Appointments: ${sampleAppointments.length} Consultations Scheduled`);
    console.log('==================================================================\n');
  } catch (err) {
    console.error('[Seeder Error] Failed to seed database:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection disconnected.');
    process.exit(0);
  }
}

seedDatabase().catch((err) => {
  console.error('[Fatal Seeder Error]:', err);
  process.exit(1);
});
