const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connection event listeners for robust health monitoring
    mongoose.connection.on('connected', () => {
      console.log('💚 MongoDB Connection established successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected! Mongoose will attempt to reconnect...');
    });

    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/krishna-event-erp', {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
