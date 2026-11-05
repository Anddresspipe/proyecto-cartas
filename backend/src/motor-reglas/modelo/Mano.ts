import { Carta } from './Carta';

export class Mano {
  constructor(readonly cartas: readonly Carta[]) {}

  /** Crea una mano desde codigos separados por espacio: 'AC 2C 3C 7D'. */
  static desde(codigos: string): Mano {
    const lista = codigos.trim() === '' ? [] : codigos.trim().split(/\s+/);
    return new Mano(lista.map((c) => Carta.desde(c)));
  }
}
