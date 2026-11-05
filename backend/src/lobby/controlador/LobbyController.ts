import { ILobbyService } from '../servicio/ILobbyService';

/** Controlador REST: valida formato de entrada y delega. */
export class LobbyController {
  constructor(private readonly servicio: ILobbyService) {}

  async postSala(cuerpo: { alias: string }) {
    if (!cuerpo.alias || cuerpo.alias.length > 30) throw new Error('Alias invalido');
    return this.servicio.crearSala(cuerpo.alias);
  }

  async postUnirse(codigo: string, cuerpo: { alias: string }) {
    return this.servicio.unirse(codigo, cuerpo.alias);
  }
}
