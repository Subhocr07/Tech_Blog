import mongoose from 'mongoose';

const TEST_DB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/blog_management_test_db';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_1234567890_super_secure';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_0987654321_super_secure';
process.env.CLIENT_URL = 'http://localhost:5173';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});
