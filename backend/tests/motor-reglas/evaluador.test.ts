import { Carta } from '../../src/motor-reglas/modelo/Carta';
import { Mano } from '../../src/motor-reglas/modelo/Mano';
import { esCuarta, esEscalera, esTerna, esTrio, minimoPuntosSueltos } from '../../src/motor-reglas/evaluacion/EvaluadorCombinaciones';
import { ReglaClasicaCuartaTerna } from '../../src/motor-reglas/reglas/ReglaClasicaCuartaTerna';
import { ReglaApuntado101 } from '../../src/motor-reglas/reglas/ReglaApuntado101';

const g = (codigos: string) => Mano.desde(codigos).cartas;

describe('EvaluadorCombinaciones', () => {
  it('reconoce 4,5,6,7 de corazones como escalera valida (cuarta)', () => {
    expect(esEscalera(g('4C 5C 6C 7C'))).toBe(true);
    expect(esCuarta(g('4C 5C 6C 7C'))).toBe(true);
  });
  it('tres cartas del mismo valor sin repetir pinta forman trio', () => {
    expect(esTrio(g('7C 7D 7T'))).toBe(true);
    expect(esTerna(g('7C 7D 7T'))).toBe(true);
  });
  it('rechaza trio con pinta repetida y escalera de pintas mezcladas', () => {
    expect(esTrio(g('7C 7C 7T'))).toBe(false);
    expect(esEscalera(g('4C 5D 6C'))).toBe(false);
  });
  it('acepta As al inicio y al final de una escalera, pero no como vuelta (Q K A 2)', () => {
    expect(esEscalera(g('AC 2C 3C'))).toBe(true);
    expect(esEscalera(g('QC KC AC'))).toBe(true);
    expect(esEscalera(g('KC AC 2C'))).toBe(false);
  });
  it('calcula puntos sueltos minimos', () => {
    expect(minimoPuntosSueltos(g('4C 5C 6C 9D KT'))).toBe(19);
    expect(minimoPuntosSueltos(g('7C 7D 7T 2P'))).toBe(2);
  });
});

describe('ReglaClasicaCuartaTerna', () => {
  const regla = new ReglaClasicaCuartaTerna();
  it('valida cuarta + 2 ternas + 1 descarte', () => {
    const mano = Mano.desde('4C 5C 6C 7C 9D 9T 9P 2D 3D 4D KT');
    expect(regla.validarCierre(mano).esValido()).toBe(true);
  });
  it('rechaza la mano que no cumple y explica por que', () => {
    const r = regla.validarCierre(Mano.desde('4C 5C 6C 8C 9D 9T 9P 2D 3D 4D KT'));
    expect(r.esValido()).toBe(false);
    expect(r.getMensaje()).toContain('cuarta');
  });
});

describe('ReglaApuntado101', () => {
  const regla = new ReglaApuntado101();
  it('valida 3 ternas con sobrante menor a 5', () => {
    const mano = Mano.desde('4C 5C 6C 9D 9T 9P 2D 3D 4D 2T KT');
    const r = regla.validarCierre(mano);
    expect(r.esValido()).toBe(true);
    expect(r.getPuntosSueltos()).toBe(2);
  });
  it('rechaza si el sobrante es 5 o mas e informa el puntaje exacto', () => {
    const r = regla.validarCierre(Mano.desde('4C 5C 6C 9D 9T 9P 2D 3D 4D 5T KT'));
    expect(r.esValido()).toBe(false);
    expect(r.getPuntosSueltos()).toBe(5);
  });
  it('umbrales -101 y 51', () => {
    expect(regla.debeEliminar(-101)).toBe(true);
    expect(regla.debeEliminar(-100)).toBe(false);
    expect(regla.haGanado(51)).toBe(true);
    expect(Carta.desde('KC').puntos()).toBe(10);
  });
});
