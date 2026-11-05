import { IMotorLogica } from '../../motor-reglas/MotorLogicaJuego';
import { Mano } from '../../motor-reglas/modelo/Mano';
import { IPartidaRepository } from '../repositorio/PartidaRepository';
import { CierreRonda, PartidaEnMemoria } from '../modelo/Partida';
import { BusEventos } from './BusEventos';
import { ColaPorPartida } from './ColaPorPartida';
import { IPartidaService, ResultadoCierre } from './IPartidaService';

/** Orquestador: coordina, no decide reglas. Solo conoce IMotorLogica (ADR-02/03). */
export class PartidaService implements IPartidaService {
  private partidas = new Map<string, PartidaEnMemoria>();
  private cola = new ColaPorPartida();

  constructor(
    private readonly motor: IMotorLogica,
    private readonly repositorio: IPartidaRepository,
    private readonly bus: BusEventos,
  ) {}

  crearPartida(partidaId: string, reglaCodigo: string, jugadores: string[]): void {
    this.partidas.set(partidaId, {
      id: partidaId,
      reglaCodigo,
      estado: 'EN_JUEGO',
      version: 0,
      rondaNumero: 1,
      acumulados: new Map(jugadores.map((j) => [j, 0])),
      eliminados: new Set(),
    });
  }

  cerrarRonda(partidaId: string, jugadorId: string, rondaEsperada: number, manos: Record<string, string>): Promise<ResultadoCierre> {
    return this.cola.ejecutar(partidaId, () => this.procesarCierre(partidaId, jugadorId, rondaEsperada, manos));
  }

  private async procesarCierre(
    partidaId: string,
    jugadorId: string,
    rondaEsperada: number,
    manos: Record<string, string>,
  ): Promise<ResultadoCierre> {
    const partida = this.partidas.get(partidaId);
    if (!partida || partida.estado !== 'EN_JUEGO') return { valido: false, mensaje: 'La partida no esta en juego.' };
    if (partida.rondaNumero !== rondaEsperada) return { valido: false, mensaje: 'RONDA_YA_CERRADA' };
    const mapaManos = new Map(Object.entries(manos).map(([id, cartas]) => [id, Mano.desde(cartas)]));
    const validacion = this.motor.validarCierre(partida.reglaCodigo, mapaManos.get(jugadorId) ?? Mano.desde(''));
    if (!validacion.esValido()) return { valido: false, mensaje: validacion.getMensaje() };

    const manosRivales = new Map([...mapaManos].filter(([id]) => id !== jugadorId));
    const liquidacion = this.motor.liquidarRonda(partida.reglaCodigo, jugadorId, new Map([...manosRivales, [jugadorId, Mano.desde('')]]), partida.acumulados);
    const cierre = this.armarCierre(partida, jugadorId, liquidacion.porJugador, liquidacion.conservaHistorial);
    await this.repositorio.guardarCierreRonda(cierre); // si falla, el estado en memoria no cambia
    this.aplicarEnMemoria(partida, cierre);
    this.bus.publicar({ tipo: 'RondaCerrada', partidaId, rondaNumero: cierre.rondaNumero, deltas: Object.fromEntries(cierre.deltas) });
    return { valido: true, mensaje: 'Ronda cerrada.' };
  }

  private armarCierre(
    partida: PartidaEnMemoria,
    cierraId: string,
    liquidacion: Map<string, { delta: number; acumulado: number; eliminado: boolean; ganadorPartida: boolean }>,
    conservaHistorial: boolean,
  ): CierreRonda {
    const entradas = [...liquidacion];
    return {
      partidaId: partida.id,
      rondaNumero: partida.rondaNumero,
      cerradaPor: cierraId,
      deltas: new Map(entradas.map(([id, l]) => [id, l.delta])),
      acumulados: new Map(entradas.map(([id, l]) => [id, l.acumulado])),
      eliminados: entradas.filter(([, l]) => l.eliminado).map(([id]) => id),
      ganadorPartida: entradas.find(([, l]) => l.ganadorPartida)?.[0] ?? null,
      versionEsperada: partida.version,
      conservaHistorial,
    };
  }

  private aplicarEnMemoria(partida: PartidaEnMemoria, cierre: CierreRonda): void {
    partida.acumulados = new Map(cierre.acumulados);
    cierre.eliminados.forEach((id) => partida.eliminados.add(id));
    partida.version += 1;
    partida.rondaNumero += 1;
    if (cierre.ganadorPartida) partida.estado = 'FINALIZADA';
  }
}
