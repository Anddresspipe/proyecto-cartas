import { crearRegistroPorDefecto } from './motor-reglas/registroPorDefecto';
import { MotorLogicaJuego } from './motor-reglas/MotorLogicaJuego';
import { BusEventos } from './partidas/servicio/BusEventos';
import { PartidaService } from './partidas/servicio/PartidaService';
import { PartidaRepositoryEnMemoria } from './partidas/repositorio/PartidaRepository';
import { PartidaGateway } from './partidas/controlador/PartidaGateway';
import { UsuarioRepositoryEnMemoria } from './lobby/repositorio/UsuarioRepository';
import { LobbyService } from './lobby/servicio/LobbyService';
import { LobbyController } from './lobby/controlador/LobbyController';

/** Composicion: unico lugar que conoce todas las piezas e inyecta dependencias (ADR-01). */
export function componer() {
  const motor = new MotorLogicaJuego(crearRegistroPorDefecto());
  const bus = new BusEventos();
  const partidas = new PartidaService(motor, new PartidaRepositoryEnMemoria(), bus);
  const gateway = new PartidaGateway(partidas);
  bus.suscribirNotificador(gateway); // INotificadorEventos implementado por el gateway
  const lobby = new LobbyController(new LobbyService(new UsuarioRepositoryEnMemoria(), partidas));
  return { gateway, lobby, partidas, bus };
}
