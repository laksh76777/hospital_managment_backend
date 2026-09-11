import admin from 'firebase-admin';

let firebaseAdminInitialized = false;

try {
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Support raw JSON string or parsed object
      const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseAdminInitialized = true;
      console.log('[Firebase Admin] Successfully initialized with service account JSON.');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle escaped newlines in environment variable
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      firebaseAdminInitialized = true;
      console.log('[Firebase Admin] Successfully initialized with environment credentials.');
    } else {
      console.warn(
        '[Firebase Admin] Note: Service account credentials not provided in environment variables ' +
        '(FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY). ' +
        'Set up .env to verify production Firebase ID tokens.'
      );
    }
  } else {
    firebaseAdminInitialized = true;
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization warning:', error.message);
}

export { admin, firebaseAdminInitialized };
export default admin;
