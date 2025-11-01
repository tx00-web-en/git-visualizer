module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/workspace'],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: ['workspace/js/**/*.js'],
  setupFilesAfterEnv: ['<rootDir>/workspace/test/setupTests.js']
};
