export type Palo = 'C' | 'D' | 'T' | 'P'; // Corazones, Diamantes, Treboles, Picas
export type Valor = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export const ORDEN_VALORES: readonly Valor[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PALOS: readonly string[] = ['C', 'D', 'T', 'P'];

// SUPUESTO A CONFIRMAR POR EL EQUIPO (riesgo R1): valor en puntos del As.
export const PUNTOS_AS = 1;

export class Carta {
  constructor(readonly palo: Palo, readonly valor: Valor) {}

  /** Rango 1..13 (A=1, K=13). */
  rango(): number {
    return ORDEN_VALORES.indexOf(this.valor) + 1;
  }

  puntos(): number {
    if (this.valor === 'A') return PUNTOS_AS;
    return Math.min(this.rango(), 10);
  }

  /** Crea una carta desde un codigo como '7C' o '10D'. */
  static desde(codigo: string): Carta {
    const palo = codigo.slice(-1);
    const valor = codigo.slice(0, -1);
    if (!PALOS.includes(palo) || !ORDEN_VALORES.includes(valor as Valor)) {
      throw new Error('Carta invalida: ' + codigo);
    }
    return new Carta(palo as Palo, valor as Valor);
  }
}
