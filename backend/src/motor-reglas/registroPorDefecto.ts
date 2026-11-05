import { RegistroReglas } from './RegistroReglas';
import { ReglaClasicaCuartaTerna } from './reglas/ReglaClasicaCuartaTerna';
import { ReglaApuntado101 } from './reglas/ReglaApuntado101';

/**
 * UNICO lugar donde se enumeran las modalidades (ADR-03).
 * Agregar una variante = una linea aqui + un archivo en reglas/ + una fila en regla_juego.
 */
export function crearRegistroPorDefecto(): RegistroReglas {
  const registro = new RegistroReglas();
  registro.registrar(new ReglaClasicaCuartaTerna());
  registro.registrar(new ReglaApuntado101());
  return registro;
}
