import js from '@eslint/js'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'
import jest from 'eslint-plugin-jest'
import testingLibrary from 'eslint-plugin-testing-library'

export default defineConfig([
  globalIgnores([
    'dist/**',
    '.output/**',
    'coverage/**',
    'node_modules/**',
    'src/routeTree.gen.ts',
    '.betterer.ts',
    'test-results/**',
    'playwright-report/**',
    'blob-report/**',
  ]),

  // Node/config/tooling files
  {
    files: ['**/*.{js,mjs,cjs}'],

    extends: [
      js.configs.recommended,
    ],

    languageOptions: {
      globals: globals.node,
    },

    rules: {
      'no-debugger': 'error',
    },
  },

  // Application TypeScript
  {
    files: ['**/*.{ts,tsx}'],

    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
    ],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // React accessibility
  {
    files: ['**/*.tsx'],
  
    extends: [
      jsxA11y.configs.recommended,
    ],
  },

  // Tests
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
    ],

    extends: [
      jest.configs['flat/recommended'],
      testingLibrary.configs['flat/react'],
    ],

    rules: {
      // A skipped acceptance test must not make CI look green.
      'jest/no-disabled-tests': 'error',
      'jest/no-focused-tests': 'error',

      // Don't leave screen.debug(), etc. committed.
      'testing-library/no-debugging-utils': 'error',
    },
  },
])