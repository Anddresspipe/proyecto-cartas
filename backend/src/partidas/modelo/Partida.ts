export type EstadoPartida = 'EN_ESPERA' | 'EN_JUEGO' | 'FINALIZADA';

export interface PartidaEnMemoria {
  id: string;
  reglaCodigo: string;
  estado: EstadoPartida;
  version: number;
  rondaNumero: number;
  acumulados: Map<string, number>;
  eliminados: Set<string>;
}

export interface CierreRonda {
  partidaId: string;
  rondaNumero: number;
  cerradaPor: string;
  deltas: Map<string, number>;
  acumulados: Map<string, number>;
  eliminados: string[];
  ganadorPartida: string | null;
  versionEsperada: number;
  conservaHistorial: boolean;
}
