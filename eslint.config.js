import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // dist — build изход; list-tables.js и sync-local-db.js — локални скриптове извън git (.gitignore)
  { ignores: ['dist', 'list-tables.js', 'sync-local-db.js'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // ^m$ — `m` от motion/react се ползва като <m.div>; без eslint-plugin-react линтът не го вижда.
      // argsIgnorePattern — същото за компоненти, подадени като пропс: ({ icon: Icon }) → <Icon />.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|^m$', argsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Конфигурационни файлове, които се изпълняват в Node (не в браузъра)
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
]
