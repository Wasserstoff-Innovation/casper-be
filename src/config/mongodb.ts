import mongoose from 'mongoose';
import { envConfigs } from './envConfig';

// MongoDB connection
const connectMongoDB = async (): Promise<typeof mongoose> => {
  try {
    const mongoURI = envConfigs.dburl; // Reusing DATABASE_URL for MongoDB connection string

    const conn = await mongoose.connect(mongoURI, {
      // Modern MongoDB driver options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔒 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error: any) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectMongoDB;
export { mongoose };
