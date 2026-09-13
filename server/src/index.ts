import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import studyRoutes from './routes/study';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables from server root or repo root if present
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup for local development
app.use(cors({
  origin: true, // Allow frontend dev server requests
  methods: ['GET', 'POST'],
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', studyRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
});

// Centralized error handler (must be last middleware)
app.use(errorHandler);

// Start server (only when executed directly as a standalone process, not when imported as a serverless module)
const isDirectExecution = typeof require !== 'undefined' && require.main === module;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL && isDirectExecution) {
  app.listen(PORT, () => {
    console.log(`[StudyFlow Server] Running on http://localhost:${PORT}`);
    console.log(`[StudyFlow Server] Health check available at http://localhost:${PORT}/api/health`);
  });
}

export default app;
