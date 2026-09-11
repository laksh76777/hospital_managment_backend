/**
 * Centralized Express error-handling middleware for HealthDesk
 * Catches thrown errors, Mongoose/MongoDB errors (duplicate key 11000, cast errors, validation errors),
 * and Zod validation errors, returning a standardized response:
 * { success: false, message: "..." }
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  let fieldErrors = err.fieldErrors || null;

  // 1. MongoDB Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const keyPattern = err.keyPattern || {};
    const keyValue = err.keyValue || {};

    // Specific check for appointment slot unique compound index: { doctorRef: 1, appointmentDate: 1, time: 1 }
    if (keyPattern.doctorRef && keyPattern.appointmentDate && keyPattern.time) {
      message = 'This appointment slot has already been booked. Please select another available consultation slot.';
      fieldErrors = { slot: 'Selected time slot is already reserved for this date.' };
    } else if (keyPattern.email || keyValue.email) {
      const email = keyValue.email || '';
      message = `An account with email ${email ? `"${email}" ` : ''}is already registered in the system.`;
      fieldErrors = { email: 'This email address is already in use.' };
    } else {
      const field = Object.keys(keyValue)[0] || 'field';
      const val = keyValue[field] || '';
      message = `A record with this ${field} (${val}) already exists.`;
      fieldErrors = { [field]: `Duplicate value: ${val}` };
    }
  }

  // 2. Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    const formattedErrors = [];
    const fields = {};
    Object.keys(err.errors || {}).forEach((key) => {
      const itemMsg = err.errors[key]?.message || 'Invalid value';
      formattedErrors.push({ field: key, message: itemMsg });
      fields[key] = itemMsg;
    });
    fieldErrors = fields;
    message = formattedErrors.map((e) => e.message).join('; ') || 'Database validation failed';
  }

  // 3. Mongoose Cast Error (Invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with identifier: ${err.value}`;
    fieldErrors = { id: 'Invalid identifier format' };
  }

  // 4. Zod Validation Error (if passed directly to next)
  else if (err.name === 'ZodError' && Array.isArray(err.errors)) {
    statusCode = 400;
    const fields = {};
    err.errors.forEach((e) => {
      const fieldPath = e.path.join('.') || '_general';
      if (!fields[fieldPath]) {
        fields[fieldPath] = e.message;
      }
    });
    fieldErrors = fields;
    message = err.errors.map((e) => `${e.path.join('.') ? e.path.join('.') + ': ' : ''}${e.message}`).join('; ');
  }

  // 5. Firebase Auth Specific Errors
  else if (err.code && typeof err.code === 'string' && (err.code.startsWith('auth/') || err.code.includes('auth/'))) {
    statusCode = 400;
    switch (err.code) {
      case 'auth/email-already-exists':
      case 'auth/email-already-in-use':
        statusCode = 409;
        message = 'A user with this email address already exists in authentication records.';
        fieldErrors = { email: 'Email address is already in use.' };
        break;
      case 'auth/invalid-email':
        message = 'The email address provided is not in a valid format.';
        fieldErrors = { email: 'Invalid email address format.' };
        break;
      case 'auth/weak-password':
      case 'auth/invalid-password':
        message = 'Password must meet security requirements (at least 6 characters).';
        fieldErrors = { password: 'Password must be at least 6 characters.' };
        break;
      case 'auth/user-not-found':
        statusCode = 404;
        message = 'No registered user found with this email address.';
        fieldErrors = { email: 'User account not found.' };
        break;
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        statusCode = 401;
        message = 'Incorrect email or password credentials.';
        fieldErrors = { password: 'Authentication failed. Please check your credentials.' };
        break;
      case 'auth/id-token-expired':
        statusCode = 401;
        message = 'Your authentication session has expired. Please sign in again.';
        break;
      case 'auth/id-token-revoked':
        statusCode = 401;
        message = 'Your authentication session was revoked. Please sign in again.';
        break;
      default:
        message = err.message || 'Authentication service error';
    }
  }

  // Log error in non-production or for 500 errors
  if (statusCode >= 500) {
    console.error(`[HealthDesk Server Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(err.errors && Array.isArray(err.errors) ? { errors: err.errors } : {}),
  });
};

/**
 * 404 Route Not Found middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export default errorHandler;
