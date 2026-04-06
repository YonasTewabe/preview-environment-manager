import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const unusedVarsOptions = {
  varsIgnorePattern: '^[A-Z_]',
  argsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
  destructuredArrayIgnorePattern: '^_',
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', unusedVarsOptions],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/contexts/**/*.{js,jsx}', 'src/main.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['vite.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': ['error', unusedVarsOptions],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['server/**/*.js'],
    ignores: ['server/config/config.js', 'server/seeders/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': ['error', unusedVarsOptions],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['server/config/config.js', 'server/seeders/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'commonjs' },
    },
    rules: {
      'no-unused-vars': ['error', unusedVarsOptions],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
])
