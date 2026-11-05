export interface Config { puerto: number; urlBaseDatos: string; timeoutTurnoSegundos: number }

export function cargarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    puerto: Number(env.PORT ?? 3000),
    urlBaseDatos: env.DATABASE_URL ?? 'postgres://localhost:5432/cartas',
    timeoutTurnoSegundos: Number(env.TIMEOUT_TURNO ?? 60),
  };
}
