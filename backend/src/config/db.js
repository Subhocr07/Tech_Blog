import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  const dbUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_management_db';

  try {
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});
