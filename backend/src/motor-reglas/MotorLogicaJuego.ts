import { Mano } from './modelo/Mano';
import { IRegistroReglas } from './RegistroReglas';
import { ResultadoValidacion } from './evaluacion/ResultadoValidacion';

export interface LiquidacionJugador { delta: number; acumulado: number; eliminado: boolean; ganadorPartida: boolean }
export interface Liquidacion { porJugador: Map<string, LiquidacionJugador>; conservaHistorial: boolean }

export interface IMotorLogica {
  validarCierre(codigoRegla: string, mano: Mano): ResultadoValidacion;
  liquidarRonda(
    codigoRegla: string,
    cierraId: string,
    manos: ReadonlyMap<string, Mano>,
    acumuladosPrevios: ReadonlyMap<string, number>,
  ): Liquidacion;
}

const PUNTOS_GANADOR_RONDA = 10;

/** Funcion pura: no muta estado ni toca red o base de datos (paso 2 de la seccion 2.4). */
export class MotorLogicaJuego implements IMotorLogica {
  constructor(private readonly registro: IRegistroReglas) {}

  validarCierre(codigoRegla: string, mano: Mano): ResultadoValidacion {
    return this.registro.obtener(codigoRegla).validarCierre(mano);
  }

  liquidarRonda(
    codigoRegla: string,
    cierraId: string,
    manos: ReadonlyMap<string, Mano>,
    acumuladosPrevios: ReadonlyMap<string, number>,
  ): Liquidacion {
    const regla = this.registro.obtener(codigoRegla);
    const porJugador = new Map<string, LiquidacionJugador>();
    for (const [jugadorId, mano] of manos) {
      const delta = jugadorId === cierraId ? PUNTOS_GANADOR_RONDA : -regla.calcularPenalizacion(mano);
      const base = regla.conservaHistorial() ? acumuladosPrevios.get(jugadorId) ?? 0 : 0;
      const acumulado = base + delta;
      porJugador.set(jugadorId, {
        delta,
        acumulado,
        eliminado: regla.debeEliminar(acumulado),
        ganadorPartida: regla.haGanado(acumulado),
      });
    }
    return { porJugador, conservaHistorial: regla.conservaHistorial() };
  }
}
