import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { admin, firebaseAdminInitialized } from '../config/firebaseAdmin.js';
import User from '../models/User.js';

// Setup environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function createAdmin() {
  console.log('\n======================================================');
  console.log('   HealthDesk — Hospital Administrator Provisioning   ');
  console.log('======================================================\n');

  // Connect to MongoDB
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    console.error('[Error] Could not connect to MongoDB database. Please ensure MONGO_URI is set or MongoDB is active.');
    process.exit(1);
  }

  // Parse arguments or environment variables
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || 'admin@healthdesk.org').trim().toLowerCase();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'Admin@123456';
  const name = process.argv[4] || process.env.ADMIN_NAME || 'Hospital Administrator';
  const phone = process.argv[5] || process.env.ADMIN_PHONE || '+91 98765 43210';

  console.log(`[Config] Admin Email:    ${email}`);
  console.log(`[Config] Admin Name:     ${name}`);
  console.log(`[Config] Phone Number:   ${phone}`);
  console.log(`[Config] Auth Provider:  ${firebaseAdminInitialized ? 'Firebase Admin SDK' : 'Local Fallback Identifier'}\n`);

  let firebaseUID = null;

  // 1. Handle Firebase Auth if Firebase Admin is configured
  if (firebaseAdminInitialized) {
    try {
      console.log('[Firebase] Checking for existing user in Firebase Auth...');
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUserByEmail(email);
        console.log(`[Firebase] Existing user found with UID: ${firebaseUser.uid}`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          console.log('[Firebase] Creating new Firebase Auth user account...');
          firebaseUser = await admin.auth().createUser({
            email,
            password,
            displayName: name,
            emailVerified: true,
          });
          console.log(`[Firebase] User created successfully with UID: ${firebaseUser.uid}`);
        } else {
          throw err;
        }
      }

      firebaseUID = firebaseUser.uid;

      // Set custom user claims for Admin RBAC
      await admin.auth().setCustomUserClaims(firebaseUID, { role: 'admin' });
      console.log(`[Firebase] Custom user claims applied: { role: "admin" }`);
    } catch (err) {
      console.warn(`[Firebase Warning] Could not manage Firebase user directly: ${err.message}`);
      firebaseUID = `admin_${Buffer.from(email).toString('hex').slice(0, 20)}`;
      console.log(`[Fallback] Using assigned identifier: ${firebaseUID}`);
    }
  } else {
    firebaseUID = `admin_${Buffer.from(email).toString('hex').slice(0, 20)}`;
    console.log(`[Note] Firebase Admin not initialized. Using local identifier: ${firebaseUID}`);
  }

  // 2. Upsert MongoDB User record
  try {
    const adminUser = await User.findOneAndUpdate(
      { email },
      {
        firebaseUID,
        name,
        email,
        role: 'admin',
        phone,
        mustChangePassword: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('\n------------------------------------------------------');
    console.log('   ADMIN PROVISIONED SUCCESSFULLY');
    console.log('------------------------------------------------------');
    console.log(`   MongoDB ID:    ${adminUser._id}`);
    console.log(`   Firebase UID:  ${adminUser.firebaseUID}`);
    console.log(`   Full Name:     ${adminUser.name}`);
    console.log(`   Email:         ${adminUser.email}`);
    console.log(`   Assigned Role: ${adminUser.role.toUpperCase()}`);
    console.log('------------------------------------------------------');
    console.log('\nYou can now log in at /signin using:');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}\n`);
  } catch (err) {
    console.error('[Error] Failed to upsert admin user record in MongoDB:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection disconnected.');
    process.exit(0);
  }
}

createAdmin().catch((err) => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
