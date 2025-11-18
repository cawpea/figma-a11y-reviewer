const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = [
  // グローバル無視設定
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.js',
      '!eslint.config.js',
      '!.prettierrc.js',
    ],
  },
  // TypeScriptファイル用の設定
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
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
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
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
    },
  },
];
