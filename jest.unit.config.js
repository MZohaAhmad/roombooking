module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/health.test.js", "**/tests/routes.test.js"],
  setupFilesAfterEnv: ["./tests/jest.setup.js"],
  testTimeout: 15000,
};
