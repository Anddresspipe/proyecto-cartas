# Juego de Cartas - Entregable 2

Monolito modular (TypeScript/Node) con patron Strategy para las reglas, PostgreSQL y fitness functions.

## Estructura
- `backend/src/` modulos `lobby`, `partidas`, `motor-reglas`, `compartido` (ADR-01).
- `backend/tests/architecture/` fitness functions con TSArch (FF-01 a FF-06) y controles.
- `backend/db/migrations/001_esquema.sql` esquema relacional 3FN.
- `docs/adrs/` ADR-01 a ADR-05. `docs/modelos/` diagramas en PNG y sus fuentes editables en `docs/modelos/drawio/` (draw.io), ejemplo trazable SQL.

## Ejecutar
```bash
cd backend
npm ci
npm run lint && npm run build
npm test                       # sin BD: las pruebas de PostgreSQL se omiten
# con PostgreSQL 16:
psql "$DATABASE_URL" -f db/migrations/001_esquema.sql
DATABASE_URL=postgres://cartas:cartas@localhost:5432/cartas npm test
bash scripts/verificar-fitness.sh   # prueba de mutacion: inyecta 8 violaciones y exige que fallen
```
