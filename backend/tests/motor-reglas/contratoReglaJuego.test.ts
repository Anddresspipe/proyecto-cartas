import { crearRegistroPorDefecto } from '../../src/motor-reglas/registroPorDefecto';
import { Mano } from '../../src/motor-reglas/modelo/Mano';

const reglas = crearRegistroPorDefecto().todas().map((r) => [r.getCodigo(), r] as const);

describe.each(reglas)('Contrato ReglaJuego: %s', (_codigo, regla) => {
  it('rechaza una mano vacia', () => {
    expect(regla.validarCierre(Mano.desde('')).esValido()).toBe(false);
  });
  it('no penaliza una mano vacia', () => {
    expect(regla.calcularPenalizacion(Mano.desde(''))).toBe(0);
  });
  it('un puntaje no puede eliminar y dar la victoria a la vez', () => {
    for (const p of [-101, -1, 0, 51, 200]) {
      expect(regla.debeEliminar(p) && regla.haGanado(p)).toBe(false);
    }
  });
  it('reparte 10 cartas', () => {
    expect(regla.getCartasPorMano()).toBe(10);
  });
});
