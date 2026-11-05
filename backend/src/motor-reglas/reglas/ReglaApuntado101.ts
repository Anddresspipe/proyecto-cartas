import { Mano } from '../modelo/Mano';
import { ReglaJuego } from './ReglaJuego';
import { ResultadoValidacion } from '../evaluacion/ResultadoValidacion';
import { minimoPuntosSueltos, particionar } from '../evaluacion/EvaluadorCombinaciones';

const SOBRANTE_MAXIMO = 5;
const UMBRAL_ELIMINACION = -101;
const UMBRAL_VICTORIA = 51;

/** Apuntado 101: tres ternas y un sobrante estrictamente menor a 5 puntos. */
export class ReglaApuntado101 implements ReglaJuego {
  getCodigo(): string { return 'APUNTADO_101'; }
  getCartasPorMano(): number { return 10; }

  validarCierre(mano: Mano): ResultadoValidacion {
    if (mano.cartas.length !== this.getCartasPorMano() + 1) {
      return new ResultadoValidacion(false, 'Para cerrar necesitas 11 cartas: 9 en ternas, 1 sobrante y 1 para descartar.');
    }
    const particion = particionar(mano.cartas, [3, 3, 3]);
    if (!particion) {
      return new ResultadoValidacion(false, 'La mano no tiene tres ternas validas.');
    }
    // De las dos cartas restantes se descarta la de mayor valor; la otra es el sobrante.
    const sobrante = Math.min(...particion.sobrantes.map((c) => c.puntos()));
    if (sobrante >= SOBRANTE_MAXIMO) {
      return new ResultadoValidacion(false, 'El sobrante suma ' + sobrante + ' puntos y debe ser menor a 5.', sobrante);
    }
    return new ResultadoValidacion(true, 'Cierre valido.', sobrante, particion.grupos);
  }

  calcularPenalizacion(mano: Mano): number { return minimoPuntosSueltos(mano.cartas); }
  debeEliminar(puntajeAcumulado: number): boolean { return puntajeAcumulado <= UMBRAL_ELIMINACION; }
  haGanado(puntajeAcumulado: number): boolean { return puntajeAcumulado >= UMBRAL_VICTORIA; }
  conservaHistorial(): boolean { return true; }
}
