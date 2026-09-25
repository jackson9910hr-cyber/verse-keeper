/** @type {import('jest').Config} */
const moduleNameMapper = { '^@/(.*)$': '<rootDir>/src/$1' };

module.exports = {
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    '!src/domain/**/*.test.ts',
    '!src/domain/**/index.ts',
  ],
  coverageThreshold: {
    './src/domain/': { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
  projects: [
    {
      displayName: 'domain',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/domain/**/*.test.ts', '<rootDir>/scripts/**/*.test.ts'],
      transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
      moduleNameMapper,
    },
    {
      displayName: 'data',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/data/**/*.test.ts', '<rootDir>/src/i18n/**/*.test.ts'],
      transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
      moduleNameMapper,
    },
    {
      displayName: 'ui',
      preset: 'jest-expo/ios',
      testMatch: ['<rootDir>/src/**/*.test.tsx'],
      moduleNameMapper,
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ui.ts'],
    },
  ],
};
