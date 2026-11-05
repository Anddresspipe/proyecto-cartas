import { Mano } from '../modelo/Mano';
import { ReglaJuego } from './ReglaJuego';
import { ResultadoValidacion } from '../evaluacion/ResultadoValidacion';
import { minimoPuntosSueltos, particionar } from '../evaluacion/EvaluadorCombinaciones';

/** Clasica 4-3-3: una cuarta, dos ternas y una carta de descarte (mano de 11 al cerrar). */
export class ReglaClasicaCuartaTerna implements ReglaJuego {
  getCodigo(): string { return 'CLASICA_4_3_3'; }
  getCartasPorMano(): number { return 10; }

  validarCierre(mano: Mano): ResultadoValidacion {
    if (mano.cartas.length !== this.getCartasPorMano() + 1) {
      return new ResultadoValidacion(false, 'Para cerrar necesitas 11 cartas: 10 en combinaciones y 1 para descartar.');
    }
    const particion = particionar(mano.cartas, [4, 3, 3]);
    if (!particion) {
      return new ResultadoValidacion(false, 'La mano no tiene una cuarta y dos ternas validas.');
    }
    return new ResultadoValidacion(true, 'Cierre valido.', 0, particion.grupos);
  }

  calcularPenalizacion(mano: Mano): number { return minimoPuntosSueltos(mano.cartas); }
  debeEliminar(): boolean { return false; }
  haGanado(): boolean { return false; }
  conservaHistorial(): boolean { return false; }
}
