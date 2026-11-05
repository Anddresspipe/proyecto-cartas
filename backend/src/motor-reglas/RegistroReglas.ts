import { ReglaJuego } from './reglas/ReglaJuego';

export interface IRegistroReglas {
  registrar(regla: ReglaJuego): void;
  obtener(codigo: string): ReglaJuego;
  todas(): ReglaJuego[];
}

export class RegistroReglas implements IRegistroReglas {
  private reglas = new Map<string, ReglaJuego>();

  registrar(regla: ReglaJuego): void {
    if (this.reglas.has(regla.getCodigo())) throw new Error('Regla duplicada: ' + regla.getCodigo());
    this.reglas.set(regla.getCodigo(), regla);
  }

  obtener(codigo: string): ReglaJuego {
    const regla = this.reglas.get(codigo);
    if (!regla) throw new Error('Regla no registrada: ' + codigo);
    return regla;
  }

  todas(): ReglaJuego[] { return [...this.reglas.values()]; }
}
