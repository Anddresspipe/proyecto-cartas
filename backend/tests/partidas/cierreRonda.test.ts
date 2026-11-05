import { crearRegistroPorDefecto } from '../../src/motor-reglas/registroPorDefecto';
import { MotorLogicaJuego } from '../../src/motor-reglas/MotorLogicaJuego';
import { BusEventos } from '../../src/partidas/servicio/BusEventos';
import { PartidaService } from '../../src/partidas/servicio/PartidaService';
import { PartidaRepositoryEnMemoria } from '../../src/partidas/repositorio/PartidaRepository';
import { EventoDominio } from '../../src/partidas/servicio/INotificadorEventos';

const GANADORA = '4C 5C 6C 7C 9D 9T 9P 2D 3D 4D KT';
const RIVAL = '2C 5D 9T 4P 8D'; // 5 cartas sueltas: 2+5+9+4+8 = 28

function montar() {
  const repo = new PartidaRepositoryEnMemoria();
  const bus = new BusEventos();
  const eventos: EventoDominio[] = [];
  bus.suscribir((e) => eventos.push(e));
  const servicio = new PartidaService(new MotorLogicaJuego(crearRegistroPorDefecto()), repo, bus);
  servicio.crearPartida('p1', 'CLASICA_4_3_3', ['ana', 'beto']);
  return { repo, eventos, servicio };
}

describe('Cierre de ronda (seccion 2.4)', () => {
  it('cierre valido: guarda una sola vez y publica RondaCerrada despues de guardar', async () => {
    const { repo, eventos, servicio } = montar();
    const r = await servicio.cerrarRonda('p1', 'ana', 1, { ana: GANADORA, beto: RIVAL });
    expect(r.valido).toBe(true);
    expect(repo.cierres).toHaveLength(1);
    expect(repo.cierres[0].deltas.get('ana')).toBe(10);
    expect(repo.cierres[0].deltas.get('beto')).toBe(-28);
    expect(eventos.map((e) => e.tipo)).toEqual(['RondaCerrada']);
  });

  it('cierre invalido: no guarda ni notifica y devuelve el motivo', async () => {
    const { repo, eventos, servicio } = montar();
    const r = await servicio.cerrarRonda('p1', 'ana', 1, { ana: RIVAL, beto: RIVAL });
    expect(r.valido).toBe(false);
    expect(repo.cierres).toHaveLength(0);
    expect(eventos).toHaveLength(0);
  });

  it('dos cierres simultaneos de la misma ronda: se aplica el primero y el segundo recibe RONDA_YA_CERRADA', async () => {
    const { repo, servicio } = montar();
    const [a, b] = await Promise.all([
      servicio.cerrarRonda('p1', 'ana', 1, { ana: GANADORA, beto: RIVAL }),
      servicio.cerrarRonda('p1', 'beto', 1, { ana: RIVAL, beto: GANADORA }),
    ]);
    expect(repo.cierres.filter((c) => c.rondaNumero === 1)).toHaveLength(1);
    expect([a.valido, b.valido]).toEqual([true, false]);
    expect(b.mensaje).toBe('RONDA_YA_CERRADA');
  });

  it('un suscriptor que lanza excepcion no altera el estado ni a los demas', async () => {
    const repo = new PartidaRepositoryEnMemoria();
    const bus = new BusEventos();
    const recibidos: string[] = [];
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    bus.suscribir(() => { throw new Error('boom'); });
    bus.suscribir((e) => recibidos.push(e.tipo));
    const servicio = new PartidaService(new MotorLogicaJuego(crearRegistroPorDefecto()), repo, bus);
    servicio.crearPartida('p1', 'CLASICA_4_3_3', ['ana', 'beto']);
    const r = await servicio.cerrarRonda('p1', 'ana', 1, { ana: GANADORA, beto: RIVAL });
    expect(r.valido).toBe(true);
    expect(recibidos).toEqual(['RondaCerrada']);
  });
});
