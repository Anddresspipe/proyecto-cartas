import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  // FF-04: complejidad ciclomatica maxima 10 en todo el codigo fuente
  { files: ['src/**/*.ts'], rules: { complexity: ['error', { max: 10 }] } },
  // El motor de reglas ademas limita el tamano de las funciones
  {
    files: ['src/motor-reglas/**/*.ts'],
    rules: { complexity: ['error', { max: 10 }], 'max-lines-per-function': ['warn', 60] },
  },
  // ADR-03: prohibido ramificar por modalidad fuera de motor-reglas
  {
    files: ['src/lobby/**/*.ts', 'src/partidas/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'Literal[value=/^(CLASICA_4_3_3|APUNTADO_101)$/]',
        message: 'Prohibidos los condicionales por modalidad fuera de motor-reglas (ADR-03)',
      }],
    },
  },
  // ADR-04: el cliente de PostgreSQL solo puede importarse desde repositorios y compartido
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/repositorio/**', 'src/compartido/**'],
    rules: { 'no-restricted-imports': ['error', { paths: ['pg'] }] },
  },
);
