import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import logger from './config/logger';
import router from './routes';
import cors from 'cors';
import passport from './config/passport';
dotenv.config();

const app = express();
app.use(passport.initialize());
const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';

// Test database connection when server starts
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await connectDB();

    if (!isConnected) {
      logger.error('Failed to connect to database. Server may not function properly.');
    }
app.use(cors());
app.use(express.json());
app.use("/api", router);

    app.listen(port, () => {
      console.log(`Server running on port ${port} in ${env} mode`);
      console.log(`Database: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();