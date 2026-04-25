// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/**
 * Regla Clean Architecture: impide que un módulo importe las entrañas
 * (infrastructure/application) de otro módulo. El consumo cross-módulo
 * debe pasar por el barrel público (`@/modules/<name>`).
 *
 * Dentro del mismo módulo está permitido usar imports relativos
 * (`../../infrastructure/...`), que no matchean estos patrones absolutos.
 */
const crossModuleBoundaryRule = [
  'error',
  {
    patterns: [
      {
        group: [
          '@/modules/*/infrastructure',
          '@/modules/*/infrastructure/*',
          '@/modules/*/infrastructure/**',
          '@/modules/*/application',
          '@/modules/*/application/*',
          '@/modules/*/application/**',
        ],
        message:
          'Prohibido: importa el módulo vía su barrel público (ej. @/modules/debts) en vez de tocar infrastructure/application directamente.',
      },
    ],
  },
];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'skills/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': crossModuleBoundaryRule,
    },
  },
]);
