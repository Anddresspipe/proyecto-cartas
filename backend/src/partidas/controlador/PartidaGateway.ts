import { IPartidaService } from '../servicio/IPartidaService';
import { EventoDominio, INotificadorEventos } from '../servicio/INotificadorEventos';

/** Gateway WebSocket: traduce mensajes de red a llamadas de servicio y eventos a mensajes. Sin reglas. */
export class PartidaGateway implements INotificadorEventos {
  readonly enviados: string[] = [];

  constructor(private readonly servicio: IPartidaService) {}

  async alRecibirCerrar(partidaId: string, jugadorId: string, ronda: number, manos: Record<string, string>): Promise<string> {
    const resultado = await this.servicio.cerrarRonda(partidaId, jugadorId, ronda, manos);
    return JSON.stringify(resultado);
  }

  notificar(evento: EventoDominio): void {
    this.enviados.push(JSON.stringify(evento));
  }
}
