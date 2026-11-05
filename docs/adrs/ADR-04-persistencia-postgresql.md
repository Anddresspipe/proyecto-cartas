# ADR-04: PostgreSQL relacional (3FN) como motor y modelo de persistencia

**Estado:** Accepted.

## Contexto
Se debe persistir salas, jugadores, partidas, manos, bitácora de turnos y el marcador acumulativo a 101 puntos, para partidas atómicas (Clásica) y multironda (Apuntado, encadenadas por CU-04). El cierre de ronda debe ser atómico (2.4). Restricciones: plan gratuito (Feasibility) y conservar el historial (RF10). Alternativas evaluadas en 2.1: (1) SQLite embebida, (2) MongoDB con la partida como documento, (3) PostgreSQL gestionado con topología relacional centralizada.

Resultado de 2.1 (máximo 12): SQLite 11, PostgreSQL 10, MongoDB 9. SQLite queda eliminada por la restricción: su archivo vive en el disco del servidor, que en el hosting gratuito se borra con cada reinicio. PostgreSQL gana el bloque de consistencia (6 frente a 3 de MongoDB); MongoDB gana el de simplicidad (6 frente a 4).

## Decisión
Alternativa (3): PostgreSQL 16 con el esquema en 3FN de 10 tablas de la sección 2.2 (`001_esquema.sql`), accedido solo desde repositorios. El estado caliente vive en memoria y se persiste en una transacción por ronda cerrada que inserta los puntajes de todos los jugadores y actualiza los estados.

La base impone las garantías del juego: `uq_ronda_abierta`, `uq_ganador_ronda`, `uq_admin_sala`, UNIQUE, CHECK, FK y `version` para bloqueo optimista. El marcador es `puntaje_inicial` más la suma de deltas (vista `v_marcador`) y `partida_anterior_id` encadena las partidas de CU-04. Se descarta MongoDB: el marcador cruza varios agregados (sala, partida, ronda, jugador), las garantías pasarían al código y el historial entre partidas exigiría agregaciones.

## Consecuencias
Positivas: integridad declarativa; historial trazable; un modelo único para ambas modalidades; migraciones versionadas.

Negativas: dependencia de un servicio externo y de sus límites gratuitos (riesgo R10); mapeo objeto-relacional manual; evolución del esquema por migración (2.1 la califica «Parcial»); la desnormalización controlada de `puntaje_acumulado.acumulado` exige vigilancia (vista `v_violaciones_acumulado`).

## Cumplimiento
Automatizado: (a) `cierreRondaPostgres.test.ts` sobre PostgreSQL 16: dos cierres concurrentes dan exactamente un éxito, el invariante acumulado = puntaje_inicial + deltas no tiene violaciones, Clásica conserva solo la última ronda y el índice parcial impide dos rondas abiertas; (b) ESLint `no-restricted-imports` prohíbe `pg` fuera de `repositorio/` y `compartido/`; (c) el CI aplica las migraciones sobre una base vacía. Manual: toda tabla nueva se revisa en 3FN.

Autor: [nombre del autor]. Fecha de aprobación: pendiente. Revisor: Fernán Alonso Villa Garzón.
