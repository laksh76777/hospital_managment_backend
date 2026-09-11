import mongoose from 'mongoose';

/**
 * Connect to MongoDB database using connection string from MONGODB_URI or MONGO_URI
 */
const connectDB = async () => {
  let mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthdesk';

  // Ensure database name is included if raw cluster URL was provided
  if (mongoURI.startsWith('mongodb+srv://') && !mongoURI.includes('.net/')) {
    mongoURI = mongoURI.replace('.net', '.net/healthdesk?retryWrites=true&w=majority');
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Atlas connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] MongoDB connection warning: ${error.message}`);
    console.warn('[Database] Running with memory cache fallback for active sessions.');
    return null;
  }
};

export default connectDB;
