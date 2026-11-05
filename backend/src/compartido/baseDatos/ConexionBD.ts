/** Infraestructura comun: sin logica de negocio (ADR-01). El cliente pg se instancia solo aqui. */
export interface IConexionBD {
  transaccion<T>(trabajo: (consulta: (sql: string, params?: unknown[]) => Promise<unknown[]>) => Promise<T>): Promise<T>;
}
