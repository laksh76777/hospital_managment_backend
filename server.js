import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Logging middleware
app.use(morgan('dev'));

// CORS and Body parser middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Primary server status route required by instructions:
// Express returns "Server is running"
app.get('/api', (req, res) => {
  res.json({ message: 'Server is running', status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Mount API routes
app.use('/api', apiRoutes);

// Fallback error handlers
app.use(notFound);
app.use(errorHandler);

if (!process.env.AIS_EMBEDDED && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[HealthDesk Server] Running on http://localhost:${PORT}`);
  });
}

export default app;

