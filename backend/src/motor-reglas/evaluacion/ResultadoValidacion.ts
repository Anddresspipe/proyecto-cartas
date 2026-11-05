import { Carta } from '../modelo/Carta';

export class ResultadoValidacion {
  constructor(
    private readonly valido: boolean,
    private readonly mensaje: string,
    private readonly puntosSueltos: number = 0,
    private readonly combinaciones: readonly (readonly Carta[])[] = [],
  ) {}

  esValido(): boolean { return this.valido; }
  getMensaje(): string { return this.mensaje; }
  getPuntosSueltos(): number { return this.puntosSueltos; }
  getCombinaciones(): readonly (readonly Carta[])[] { return this.combinaciones; }
}
