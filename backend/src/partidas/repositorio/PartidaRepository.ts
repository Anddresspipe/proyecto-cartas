import { CierreRonda } from '../modelo/Partida';

export interface IPartidaRepository {
  /** Una sola transaccion ACID: ronda CERRADA, puntajes de todos, eliminados y bitacora (seccion 2.4). */
  guardarCierreRonda(cierre: CierreRonda): Promise<void>;
}

/** Implementacion en memoria para pruebas; la de produccion usa PostgreSQL (ADR-04). */
export class PartidaRepositoryEnMemoria implements IPartidaRepository {
  readonly cierres: CierreRonda[] = [];

  async guardarCierreRonda(cierre: CierreRonda): Promise<void> {
    const yaCerrada = this.cierres.some(
      (c) => c.partidaId === cierre.partidaId && c.rondaNumero === cierre.rondaNumero,
    );
    if (yaCerrada) throw new Error('RONDA_YA_CERRADA');
    this.cierres.push(cierre);
  }
}
