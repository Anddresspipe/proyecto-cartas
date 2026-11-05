import { randomUUID } from 'crypto';
import { IPartidaService } from '../../partidas/servicio/IPartidaService';
import { IUsuarioRepository } from '../repositorio/UsuarioRepository';
import { Sala } from '../modelo/Sala';
import { ILobbyService } from './ILobbyService';

/** Lobby solo conoce la interfaz IPartidaService (nunca su implementacion ni sus repositorios). */
export class LobbyService implements ILobbyService {
  constructor(private readonly usuarios: IUsuarioRepository, private readonly partidas: IPartidaService) {}

  async crearSala(aliasAdmin: string): Promise<Sala> {
    const sala: Sala = {
      id: randomUUID(),
      codigoAcceso: randomUUID().slice(0, 6).toUpperCase(),
      jugadores: [{ id: randomUUID(), alias: aliasAdmin, esAdmin: true }],
    };
    await this.usuarios.guardarSala(sala);
    return sala;
  }

  async unirse(codigo: string, alias: string): Promise<Sala> {
    const sala = await this.usuarios.buscarPorCodigo(codigo);
    if (!sala) throw new Error('Sala inexistente');
    if (sala.jugadores.some((j) => j.alias === alias)) throw new Error('Alias en uso');
    sala.jugadores.push({ id: randomUUID(), alias, esAdmin: false });
    await this.usuarios.guardarSala(sala);
    return sala;
  }

  async iniciarPartida(codigo: string, reglaCodigo: string): Promise<string> {
    const sala = await this.usuarios.buscarPorCodigo(codigo);
    if (!sala || sala.jugadores.length < 2) throw new Error('Se requieren al menos 2 jugadores');
    const partidaId = randomUUID();
    this.partidas.crearPartida(partidaId, reglaCodigo, sala.jugadores.map((j) => j.id));
    return partidaId;
  }
}
