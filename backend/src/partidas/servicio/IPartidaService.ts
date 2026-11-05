export interface ResultadoCierre { valido: boolean; mensaje: string }

export interface IPartidaService {
  crearPartida(partidaId: string, reglaCodigo: string, jugadores: string[]): void;
  /**
   * rondaEsperada: numero de ronda que el cliente cree estar cerrando; si ya cambio, se rechaza (idempotencia).
   * manos: jugadorId -> cartas como codigos ('AC 2C 3C ...').
   */
  cerrarRonda(partidaId: string, jugadorId: string, rondaEsperada: number, manos: Record<string, string>): Promise<ResultadoCierre>;
}
