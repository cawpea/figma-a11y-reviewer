const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = [
  // グローバル無視設定
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/logs/**',
      '**/*.log',
      '**/debug-*.json',
      '**/.env',
      '**/.env.*',
      '**/.DS_Store',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.js',
      '!eslint.config.js',
      '!.prettierrc.js',
    ],
  },
  // TypeScriptファイル用の設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // TypeScript推奨ルール
      ...tseslint.configs.recommended.rules,

      // 未使用変数の検出
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': [
        'error',
        {
          // PreactのJSX変換に必要な 'h' を無視
          varsIgnorePattern: '^h$',
        },
      ],
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_|^h$',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // import文の自動ソート（resolverなしのシンプル設定）
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // TypeScript設定
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Preactの 'h' をグローバル変数として認識
      'no-undef': 'off',
    },
    settings: {
      react: {
        pragma: 'h',
      },
    },
  },
];
