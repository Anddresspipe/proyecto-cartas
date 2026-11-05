import { Sala } from '../modelo/Sala';

export interface IUsuarioRepository {
  guardarSala(sala: Sala): Promise<void>;
  buscarPorCodigo(codigo: string): Promise<Sala | undefined>;
}

export class UsuarioRepositoryEnMemoria implements IUsuarioRepository {
  private salas = new Map<string, Sala>();
  async guardarSala(sala: Sala): Promise<void> { this.salas.set(sala.codigoAcceso, sala); }
  async buscarPorCodigo(codigo: string): Promise<Sala | undefined> { return this.salas.get(codigo); }
}
