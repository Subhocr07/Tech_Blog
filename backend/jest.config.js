export default {
  testEnvironment: 'node',
  transform: {},
  setupFilesAfterEnv: ['./src/tests/setup.js'],
  testTimeout: 30000,
  verbose: true,
  testMatch: ['**/src/tests/**/*.test.js'],
};
