import { Mano } from '../modelo/Mano';
import { ResultadoValidacion } from '../evaluacion/ResultadoValidacion';

/** Contrato Strategy: una implementacion por modalidad de juego (ADR-02, ADR-03). */
export interface ReglaJuego {
  getCodigo(): string;
  getCartasPorMano(): number;
  validarCierre(mano: Mano): ResultadoValidacion;
  calcularPenalizacion(mano: Mano): number;
  debeEliminar(puntajeAcumulado: number): boolean;
  haGanado(puntajeAcumulado: number): boolean;
  conservaHistorial(): boolean;
}
