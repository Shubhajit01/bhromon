//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  ...tanstackConfig,
  reactHooks.configs.flat['recommended-latest'],
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^(?!.*\\u0000)react(?:$|/)', '^(?!.*\\u0000)react-dom(?:$|/)'],
            [
              '^react(?:\\u0000$|/.*\\u0000$)',
              '^react-dom(?:\\u0000$|/.*\\u0000$)',
            ],
            ['^(?!.*\\u0000)@tanstack/'],
            ['^@tanstack/.*\\u0000$'],
            ['^(?!.*\\u0000)@?\\w'],
            ['^@?\\w.*\\u0000$'],
            ['^(?!.*\\u0000)#/'],
            ['^#/.*\\u0000$'],
            ['^(?!.*\\u0000)\\.'],
            ['^\\..*\\u0000$'],
            ['^.*[&]enhanced$', '^.*\\?url(?:\\u0000)?$'],
          ],
        },
      ],
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/routeTree.gen.ts',
      'worker-configuration.d.ts',
    ],
  },
];
