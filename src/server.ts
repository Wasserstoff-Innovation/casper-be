import express from 'express';
import dotenv from 'dotenv';
import connectMongoDB from './config/mongodb';
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
    // Connect to MongoDB
    await connectMongoDB();

    app.use(cors());
    app.use(express.json());
    app.use("/api", router);

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port} in ${env} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();