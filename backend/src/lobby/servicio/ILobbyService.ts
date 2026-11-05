import { Sala } from '../modelo/Sala';

export interface ILobbyService {
  crearSala(aliasAdmin: string): Promise<Sala>;
  unirse(codigo: string, alias: string): Promise<Sala>;
  iniciarPartida(codigo: string, reglaCodigo: string): Promise<string>;
}
