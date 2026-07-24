import js from '@eslint/js';
import globals from 'globals';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

const toWarnings = (rules = {}) =>
  Object.fromEntries(
    Object.entries(rules).map(([name, config]) => {
      if (config === 'off' || config === 0) return [name, config];
      if (Array.isArray(config)) return [name, ['warn', ...config.slice(1)]];
      return [name, 'warn'];
    }),
  );

const tsParserOptions = {
  tsconfigRootDir: import.meta.dirname,
};

const typeAwareParserOptions = {
  ...tsParserOptions,
  project: './frontend/tsconfig.json',
};

const noUnusedVars = [
  'warn',
  {
    argsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
    ignoreRestSiblings: true,
    varsIgnorePattern: '^_',
  },
];

const preferBarrelImports = [
  'warn',
  {
    patterns: [
      {
        group: [
          '@battle/*/*',
          '@data/maps/*',
          '@data/moves/*',
          '@data/pokemon/*',
          '@data/trainers/*',
          '@managers/*',
          '@managers/*/*',
          '@systems/*/*',
          '@ui/*/*',
        ],
        message: 'Prefer public barrel exports where available; this warning is report-only.',
      },
    ],
  },
];

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'temp/**',
      'test-results/**',
      'tests/playwright-report/**',
      'frontend/public/assets/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: toWarnings(js.configs.recommended.rules),
  },
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: typeAwareParserOptions,
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
      'no-restricted-imports': preferBarrelImports,
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-vars': noUnusedVars,
    },
  },
  {
    files: [
      'scripts/**/*.{js,mjs}',
      'frontend/scripts/**/*.{js,mjs}',
      'frontend/plugins/**/*.js',
      '*.mjs',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      sourceType: 'module',
    },
    rules: {
      'prefer-const': 'warn',
    },
  },
  {
    files: [
      'scripts/**/*.ts',
      'frontend/scripts/**/*.ts',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: tsParserOptions,
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-vars': noUnusedVars,
    },
  },
  {
    files: ['frontend/vite.config.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: tsParserOptions,
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      sourceType: 'module',
    },
    rules: {
      'no-undef': 'off',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['frontend/public/sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.es2024,
      },
      sourceType: 'module',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: tsParserOptions,
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-vars': noUnusedVars,
    },
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: tsParserOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
        ...globals.es2024,
      },
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
      'no-restricted-imports': preferBarrelImports,
      '@typescript-eslint/no-unused-vars': noUnusedVars,
    },
  },
  {
    files: ['tests/e2e/**/*.ts', 'tests/fuzz/**/*.ts'],
    languageOptions: playwright.configs['flat/recommended'].languageOptions,
    plugins: playwright.configs['flat/recommended'].plugins,
    rules: toWarnings(playwright.configs['flat/recommended'].rules),
  },
];
