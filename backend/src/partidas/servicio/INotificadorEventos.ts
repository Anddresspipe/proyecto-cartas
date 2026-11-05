export type EventoDominio =
  | { tipo: 'TurnoCambiado'; partidaId: string; jugadorId: string }
  | { tipo: 'RondaCerrada'; partidaId: string; rondaNumero: number; deltas: Record<string, number> }
  | { tipo: 'JugadorEliminado'; partidaId: string; jugadorId: string }
  | { tipo: 'PartidaFinalizada'; partidaId: string; ganadorId: string };

/** Puerto de salida (Entregable 1): lo implementa el gateway WebSocket. */
export interface INotificadorEventos {
  notificar(evento: EventoDominio): void;
}
