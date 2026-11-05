import { Carta } from '../modelo/Carta';

export type Grupo = readonly Carta[];
export interface Particion { grupos: Grupo[]; sobrantes: Carta[] }

const mismoValor = (g: Grupo): boolean => g.every((c) => c.valor === g[0].valor);
const mismoPalo = (g: Grupo): boolean => g.every((c) => c.palo === g[0].palo);
const palosDistintos = (g: Grupo): boolean => new Set(g.map((c) => c.palo)).size === g.length;

function consecutivos(rangos: number[]): boolean {
  const ordenados = [...rangos].sort((a, b) => a - b);
  return ordenados.every((r, i) => i === 0 || r === ordenados[i - 1] + 1);
}

/** Tres o cuatro cartas del mismo valor sin repetir pinta. */
export function esTrio(g: Grupo): boolean {
  return g.length >= 3 && g.length <= 4 && mismoValor(g) && palosDistintos(g);
}

/** Tres o mas cartas consecutivas de la misma pinta (el As puede ir al inicio o al final). */
export function esEscalera(g: Grupo): boolean {
  if (g.length < 3 || !mismoPalo(g)) return false;
  const bajos = g.map((c) => c.rango());
  const altos = bajos.map((r) => (r === 1 ? 14 : r));
  return consecutivos(bajos) || consecutivos(altos);
}

export const esTerna = (g: Grupo): boolean => g.length === 3 && (esTrio(g) || esEscalera(g));
export const esCuarta = (g: Grupo): boolean => g.length === 4 && (esTrio(g) || esEscalera(g));

function* combinaciones<T>(items: readonly T[], k: number, inicio = 0, actual: T[] = []): Generator<T[]> {
  if (actual.length === k) {
    yield [...actual];
    return;
  }
  for (let i = inicio; i < items.length; i++) {
    actual.push(items[i]);
    yield* combinaciones(items, k, i + 1, actual);
    actual.pop();
  }
}

const sinUsadas = (cartas: readonly Carta[], usadas: Grupo): Carta[] => cartas.filter((c) => !usadas.includes(c));
const validaPara = (tam: number) => (tam === 4 ? esCuarta : esTerna);

/**
 * Busca una particion de las cartas en grupos validos de los tamanos pedidos (ej. [4, 3, 3]).
 * Las cartas que no entran en ningun grupo quedan como sobrantes.
 */
export function particionar(cartas: readonly Carta[], tamanos: readonly number[]): Particion | null {
  if (tamanos.length === 0) return { grupos: [], sobrantes: [...cartas] };
  const [tam, ...resto] = tamanos;
  for (const grupo of combinaciones(cartas, tam)) {
    if (!validaPara(tam)(grupo)) continue;
    const sub = particionar(sinUsadas(cartas, grupo), resto);
    if (sub) return { grupos: [grupo, ...sub.grupos], sobrantes: sub.sobrantes };
  }
  return null;
}

/** Minimo de puntos sueltos que puede dejar una mano al organizar sus combinaciones. */
export function minimoPuntosSueltos(cartas: readonly Carta[]): number {
  if (cartas.length === 0) return 0;
  const [primera, ...resto] = cartas;
  let mejor = primera.puntos() + minimoPuntosSueltos(resto);
  for (const tam of [3, 4]) {
    for (const parcial of combinaciones(resto, tam - 1)) {
      const grupo = [primera, ...parcial];
      if (validaPara(tam)(grupo)) mejor = Math.min(mejor, minimoPuntosSueltos(sinUsadas(resto, grupo)));
    }
  }
  return mejor;
}
