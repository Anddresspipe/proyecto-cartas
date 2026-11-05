import { EventoDominio, INotificadorEventos } from './INotificadorEventos';

type Suscriptor = (evento: EventoDominio) => void;

/** Bus local (ADR-05): un suscriptor con error no afecta a los demas ni al estado. */
export class BusEventos {
  private suscriptores: Suscriptor[] = [];

  suscribir(suscriptor: Suscriptor): void { this.suscriptores.push(suscriptor); }
  suscribirNotificador(n: INotificadorEventos): void { this.suscribir((e) => n.notificar(e)); }

  publicar(evento: EventoDominio): void {
    for (const s of this.suscriptores) {
      try {
        s(evento);
      } catch (error) {
        console.error('Suscriptor fallo (aislado):', error);
      }
    }
  }
}
