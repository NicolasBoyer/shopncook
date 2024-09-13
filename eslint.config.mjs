import tsParser from '@typescript-eslint/parser'
import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
    eslint.configs.recommended,
    ...tsEslint.configs.recommended,
    eslintConfigPrettier,
    {
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },

        rules: {
            'linebreak-style': ['error', 'unix'],
            quotes: ['error', 'single'],
            semi: ['error', 'never'],

            '@typescript-eslint/explicit-function-return-type': ['error', {
                allowTypedFunctionExpressions: false,
            }],
        },
    },
]
