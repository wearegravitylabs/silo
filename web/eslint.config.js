import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'

// ─── Architecture boundaries ──────────────────────────────────────────────────
// Imports flow one way: shared (lib, stores, hooks, components) → features → routes → app.
// Features never import each other, and outsiders only import a feature via its index.ts.
const elements = [
  { type: 'app', pattern: 'src/app' },
  { type: 'routes', pattern: 'src/routes' },
  { type: 'feature', pattern: 'src/features/*', capture: ['name'] },
  { type: 'components', pattern: 'src/components' },
  { type: 'hooks', pattern: 'src/hooks' },
  { type: 'lib', pattern: 'src/lib' },
  { type: 'stores', pattern: 'src/stores' },
]

const to = (...types) => ({ to: { element: { types: { anyOf: types } } } })
const SHARED = ['components', 'hooks', 'lib', 'stores']
const FEATURE_INDEX = { to: { element: { type: 'feature', fileInternalPath: 'index.ts' } } }

const boundaryConfig = {
  files: ['src/**/*.{ts,tsx}'],
  plugins: { boundaries },
  settings: {
    'boundaries/elements': elements,
    'boundaries/include': ['src/**/*'],
    'import/resolver': { typescript: { alwaysTryTypes: true } },
  },
  rules: {
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        policies: [
          { from: { element: { type: 'app' } }, allow: to('app', 'routes', ...SHARED) },
          { from: { element: { type: 'routes' } }, allow: to('routes', ...SHARED) },
          // Outside a feature, only its public index.ts may be imported.
          { from: { element: { types: { anyOf: ['app', 'routes'] } } }, allow: FEATURE_INDEX },
          // A feature may import its own files and shared code — never another feature.
          { from: { element: { type: 'feature' } }, allow: to(...SHARED) },
          {
            from: { element: { type: 'feature' } },
            allow: { to: { element: { type: 'feature', captured: { name: '{{ from.element.captured.name }}' } } } },
          },
          { from: { element: { type: 'components' } }, allow: to('components', 'hooks', 'lib') },
          { from: { element: { type: 'hooks' } }, allow: to('hooks', 'lib') },
          { from: { element: { type: 'lib' } }, allow: to('lib', 'stores') },
          { from: { element: { type: 'stores' } }, allow: to('stores') },
        ],
      },
    ],
  },
}

export default [
  { ignores: ['dist', 'node_modules', 'public', 'src/app/route-tree.gen.ts'] },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  boundaryConfig,
]
