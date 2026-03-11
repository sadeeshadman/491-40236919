import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/app/page.tsx',
    '<rootDir>/src/app/[slug]/page.tsx',
    '<rootDir>/src/app/report-generator/page.tsx',
    '<rootDir>/src/app/report-generator/[id]/page.tsx',
    '<rootDir>/src/app/api/auth/[...nextauth]/route.ts',
    '<rootDir>/src/auth.ts',
    '<rootDir>/src/components/home/**/*.tsx',
    '<rootDir>/src/components/layout/SiteHeader.tsx',
    '<rootDir>/src/components/modals/**/*.tsx',
    '<rootDir>/src/components/report-generator/**/*.tsx',
    '<rootDir>/src/components/services/**/*.tsx',
    '<rootDir>/src/lib/auth/user-repository.ts',
    '<rootDir>/src/lib/api.ts',
    '<rootDir>/src/lib/db/mongodb.ts',
    '<rootDir>/src/lib/services.ts',
    '<rootDir>/src/middleware.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default createJestConfig(customJestConfig);
