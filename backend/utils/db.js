import mongoose from 'mongoose';

mongoose.set('debug', process.env.NODE_ENV === 'development');

export async function connectDB(retries = 5) {
  try {
    if (mongoose.connection.readyState === 1) return;

    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined');
    }

    await mongoose.connect(uri, {
      // these options are defaults in mongoose 7+, but kept for clarity
      dbName: undefined, // allow database name in the URI
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('MongoDB (mongoose) connected successfully');
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts remaining)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('MongoDB connection failed:', error);
      process.exit(1);
    }
  }
}

// Handle connection errors after initial connection
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});