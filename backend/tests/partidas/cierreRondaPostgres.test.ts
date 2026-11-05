import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { PartidaRepositoryPostgres } from '../../src/partidas/repositorio/PartidaRepositoryPostgres';
import { CierreRonda } from '../../src/partidas/modelo/Partida';

const url = process.env.DATABASE_URL;
const describeSiHayBD = url ? describe : describe.skip;

describeSiHayBD('Persistencia del cierre de ronda sobre PostgreSQL (ADR-04)', () => {
  const pool = new Pool({ connectionString: url });
  const repo = new PartidaRepositoryPostgres(pool);
  afterAll(() => pool.end());

  async function sembrar(regla: string) {
    const sala = randomUUID(), partida = randomUUID(), ronda = randomUUID();
    const jugadores = [randomUUID(), randomUUID(), randomUUID()];
    await pool.query('INSERT INTO sala (id, codigo_acceso) VALUES ($1, $2)', [sala, sala.slice(0, 8)]);
    await pool.query("INSERT INTO partida (id, sala_id, regla_codigo, estado) VALUES ($1, $2, $3, 'EN_JUEGO')", [partida, sala, regla]);
    for (const [i, j] of jugadores.entries()) {
      await pool.query('INSERT INTO jugador (id, sala_id, alias, token_hash) VALUES ($1, $2, $3, $4)', [j, sala, 'j' + i, 'x'.repeat(64)]);
      await pool.query("INSERT INTO participacion (id, partida_id, jugador_id, orden_turno, estado) VALUES ($1, $2, $3, $4, 'ACTIVO')", [randomUUID(), partida, j, i + 1]);
    }
    await pool.query("INSERT INTO ronda (id, partida_id, numero, estado, iniciada_en) VALUES ($1, $2, 1, 'EN_CURSO', now())", [ronda, partida]);
    return { partida, jugadores };
  }

  const cierre = (partida: string, js: string[], cierra: string, ronda = 1, acumPrevio = 0, conserva = true): CierreRonda => ({
    partidaId: partida, rondaNumero: ronda, cerradaPor: cierra, versionEsperada: ronda - 1, conservaHistorial: conserva,
    deltas: new Map(js.map((j) => [j, j === cierra ? 10 : -20])),
    acumulados: new Map(js.map((j) => [j, acumPrevio + (j === cierra ? 10 : -20)])),
    eliminados: [], ganadorPartida: null,
  });

  it('dos cierres concurrentes de la misma ronda: exactamente uno tiene exito', async () => {
    const { partida, jugadores } = await sembrar('APUNTADO_101');
    const resultados = await Promise.allSettled([
      repo.guardarCierreRonda(cierre(partida, jugadores, jugadores[0])),
      repo.guardarCierreRonda(cierre(partida, jugadores, jugadores[1])),
    ]);
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rechazo = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(['VERSION_OBSOLETA', 'RONDA_YA_CERRADA']).toContain(rechazo.reason.message);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM puntaje_acumulado pa JOIN ronda r ON r.id = pa.ronda_id WHERE r.partida_id = $1', [partida]);
    expect(rows[0].n).toBe(3); // todos los puntajes de UN solo cierre, nunca parciales ni duplicados
  });

  it('invariante: acumulado = puntaje_inicial + suma de deltas (vista sin violaciones)', async () => {
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM v_violaciones_acumulado');
    expect(rows[0].n).toBe(0);
  });

  it('Clasica conserva solo la ultima ronda de puntajes', async () => {
    const { partida, jugadores } = await sembrar('CLASICA_4_3_3');
    await repo.guardarCierreRonda(cierre(partida, jugadores, jugadores[0], 1, 0, false));
    await pool.query("INSERT INTO ronda (id, partida_id, numero, estado, iniciada_en) VALUES ($1, $2, 2, 'EN_CURSO', now())", [randomUUID(), partida]);
    await repo.guardarCierreRonda(cierre(partida, jugadores, jugadores[1], 2, 0, false));
    const { rows } = await pool.query('SELECT r.numero FROM puntaje_acumulado pa JOIN ronda r ON r.id = pa.ronda_id WHERE r.partida_id = $1 GROUP BY r.numero', [partida]);
    expect(rows.map((r) => r.numero)).toEqual([2]);
  });

  it('el indice parcial impide dos rondas abiertas en la misma partida', async () => {
    const { partida } = await sembrar('APUNTADO_101');
    await expect(
      pool.query("INSERT INTO ronda (id, partida_id, numero, estado, iniciada_en) VALUES ($1, $2, 2, 'EN_CURSO', now())", [randomUUID(), partida]),
    ).rejects.toThrow();
  });
});
