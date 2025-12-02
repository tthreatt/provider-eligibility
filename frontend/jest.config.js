module.exports = {
  projects: [
    {
      displayName: "api",
      testEnvironment: "node",
      testMatch: [
        "**/api/**/__tests__/**/*.ts",
        "**/api/**/__tests__/**/*.tsx",
      ],
      setupFiles: ["./jest.setup.js"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": [
          "babel-jest",
          {
            presets: [
              ["@babel/preset-env", { targets: { node: "current" } }],
              "@babel/preset-typescript",
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
          },
        ],
      },
    },
    {
      displayName: "components",
      testEnvironment: "jsdom",
      testMatch: [
        "**/components/**/__tests__/**/*.ts",
        "**/components/**/__tests__/**/*.tsx",
        "**/utils/**/__tests__/**/*.ts",
        "**/utils/**/__tests__/**/*.tsx",
      ],
      setupFilesAfterEnv: ["@testing-library/jest-dom"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": [
          "babel-jest",
          {
            presets: [
              ["@babel/preset-env", { targets: { node: "current" } }],
              "@babel/preset-typescript",
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
          },
        ],
      },
    },
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
