import { Pool, PoolClient } from 'pg';
import { CierreRonda } from '../modelo/Partida';
import { IPartidaRepository } from './PartidaRepository';

/** Cierre de ronda en UNA transaccion ACID (Entregable 2, seccion 2.4 y ADR-04). */
export class PartidaRepositoryPostgres implements IPartidaRepository {
  constructor(private readonly pool: Pool) {}

  async guardarCierreRonda(c: CierreRonda): Promise<void> {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      await this.verificarVersion(cliente, c);
      await this.cerrarRonda(cliente, c);
      await this.insertarPuntajes(cliente, c);
      await this.actualizarEstados(cliente, c);
      await cliente.query('COMMIT');
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  }

  private async verificarVersion(cliente: PoolClient, c: CierreRonda): Promise<void> {
    const r = await cliente.query('SELECT version FROM partida WHERE id = $1 FOR UPDATE', [c.partidaId]);
    if (r.rowCount === 0) throw new Error('PARTIDA_INEXISTENTE');
    if (r.rows[0].version !== c.versionEsperada) throw new Error('VERSION_OBSOLETA');
  }

  private async cerrarRonda(cliente: PoolClient, c: CierreRonda): Promise<void> {
    const r = await cliente.query(
      `UPDATE ronda SET estado = 'CERRADA', cerrada_en = now(),
              cerrada_por = (SELECT id FROM participacion WHERE partida_id = $1 AND jugador_id = $3)
       WHERE partida_id = $1 AND numero = $2 AND estado = 'EN_CURSO'`,
      [c.partidaId, c.rondaNumero, c.cerradaPor],
    );
    if (r.rowCount === 0) throw new Error('RONDA_YA_CERRADA');
  }

  private async insertarPuntajes(cliente: PoolClient, c: CierreRonda): Promise<void> {
    if (!c.conservaHistorial) {
      // Clasica: no hay tracking historico; se conserva solo la ultima ronda (CU-01 paso 7, CU-04)
      await cliente.query(
        `DELETE FROM puntaje_acumulado pa USING ronda r
         WHERE pa.ronda_id = r.id AND r.partida_id = $1 AND r.numero < $2`,
        [c.partidaId, c.rondaNumero],
      );
    }
    for (const [jugadorId, delta] of c.deltas) {
      await cliente.query(
        `INSERT INTO puntaje_acumulado (ronda_id, participacion_id, delta, acumulado, ganador_ronda)
         SELECT r.id, p.id, $3, $4, $5
         FROM ronda r JOIN participacion p ON p.partida_id = r.partida_id AND p.jugador_id = $6
         WHERE r.partida_id = $1 AND r.numero = $2`,
        [c.partidaId, c.rondaNumero, delta, c.acumulados.get(jugadorId), jugadorId === c.cerradaPor, jugadorId],
      );
    }
  }

  private async actualizarEstados(cliente: PoolClient, c: CierreRonda): Promise<void> {
    if (c.eliminados.length > 0) {
      await cliente.query(
        `UPDATE participacion SET estado = 'ELIMINADO' WHERE partida_id = $1 AND jugador_id = ANY($2::uuid[])`,
        [c.partidaId, c.eliminados],
      );
    }
    const estado = c.ganadorPartida ? 'FINALIZADA' : 'EN_JUEGO';
    await cliente.query(
      `UPDATE partida SET version = version + 1, estado = $2::varchar,
              finalizada_en = CASE WHEN $2::varchar = 'FINALIZADA' THEN now() ELSE NULL END
       WHERE id = $1`,
      [c.partidaId, estado],
    );
  }
}
