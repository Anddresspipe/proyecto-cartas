-- Esquema relacional (3FN) - Sistema Digital de Juego de Cartas - Entregable 2, seccion 2.2
-- PostgreSQL 16

CREATE TABLE regla_juego (
  codigo      VARCHAR(30) PRIMARY KEY,                 -- CLASICA_4_3_3 | APUNTADO_101
  nombre      VARCHAR(60) NOT NULL,
  acumulativa BOOLEAN     NOT NULL
);

CREATE TABLE sala (
  id            UUID PRIMARY KEY,
  codigo_acceso VARCHAR(8)  NOT NULL UNIQUE,
  creada_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jugador (
  id         UUID PRIMARY KEY,
  sala_id    UUID        NOT NULL REFERENCES sala(id),
  alias      VARCHAR(30) NOT NULL,
  token_hash CHAR(64)    NOT NULL,
  es_admin   BOOLEAN     NOT NULL DEFAULT false,
  UNIQUE (sala_id, alias)
);
CREATE UNIQUE INDEX uq_admin_sala ON jugador (sala_id) WHERE es_admin;

CREATE TABLE partida (
  id                  UUID PRIMARY KEY,
  sala_id             UUID        NOT NULL REFERENCES sala(id),
  regla_codigo        VARCHAR(30) NOT NULL REFERENCES regla_juego(codigo),
  partida_anterior_id UUID REFERENCES partida(id),     -- CU-04: continua de una partida clasica
  estado              VARCHAR(12) NOT NULL CHECK (estado IN ('EN_ESPERA','EN_JUEGO','FINALIZADA')),
  iniciada_en         TIMESTAMPTZ,
  finalizada_en       TIMESTAMPTZ,
  version             INT NOT NULL DEFAULT 0            -- bloqueo optimista
);
CREATE INDEX ix_partida_sala ON partida (sala_id);

CREATE TABLE participacion (
  id              UUID PRIMARY KEY,
  partida_id      UUID        NOT NULL REFERENCES partida(id),
  jugador_id      UUID        NOT NULL REFERENCES jugador(id),
  orden_turno     SMALLINT    NOT NULL,
  estado          VARCHAR(10) NOT NULL CHECK (estado IN ('ACTIVO','ELIMINADO','ABANDONO')),
  puntaje_inicial INT         NOT NULL DEFAULT 0,       -- CU-04: ultima ronda clasica
  UNIQUE (partida_id, jugador_id),
  UNIQUE (partida_id, orden_turno)
);
CREATE INDEX ix_participacion_jugador ON participacion (jugador_id);

CREATE TABLE ronda (
  id          UUID PRIMARY KEY,
  partida_id  UUID        NOT NULL REFERENCES partida(id),
  numero      SMALLINT    NOT NULL,
  estado      VARCHAR(10) NOT NULL CHECK (estado IN ('EN_CURSO','CERRADA')),
  cerrada_por UUID REFERENCES participacion(id),
  iniciada_en TIMESTAMPTZ NOT NULL,
  cerrada_en  TIMESTAMPTZ,
  UNIQUE (partida_id, numero),
  CHECK ((estado = 'CERRADA') = (cerrada_por IS NOT NULL AND cerrada_en IS NOT NULL))
);
CREATE UNIQUE INDEX uq_ronda_abierta ON ronda (partida_id) WHERE estado = 'EN_CURSO';

CREATE TABLE mano_jugador (
  id               UUID PRIMARY KEY,
  ronda_id         UUID NOT NULL REFERENCES ronda(id),
  participacion_id UUID NOT NULL REFERENCES participacion(id),
  UNIQUE (ronda_id, participacion_id)
);

CREATE TABLE mano_carta (
  mano_id   UUID       NOT NULL REFERENCES mano_jugador(id),
  posicion  SMALLINT   NOT NULL,
  palo      CHAR(1)    NOT NULL CHECK (palo IN ('C','D','T','P')),
  valor     VARCHAR(2) NOT NULL CHECK (valor IN ('A','2','3','4','5','6','7','8','9','10','J','Q','K')),
  es_suelta BOOLEAN    NOT NULL,                        -- no forma parte de terna/cuarta
  PRIMARY KEY (mano_id, posicion),
  UNIQUE (mano_id, palo, valor)
);

CREATE TABLE turno_jugada (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ronda_id         UUID        NOT NULL REFERENCES ronda(id),
  participacion_id UUID        NOT NULL REFERENCES participacion(id),
  secuencia        INT         NOT NULL,
  accion           VARCHAR(12) NOT NULL CHECK (accion IN ('ROBAR_MAZO','ROBAR_POZO','DESCARTAR','CERRAR')),
  palo             CHAR(1),
  valor            VARCHAR(2),
  valida           BOOLEAN     NOT NULL,
  registrada_en    TIMESTAMPTZ NOT NULL,
  UNIQUE (ronda_id, secuencia)
);
CREATE INDEX ix_turno_participacion ON turno_jugada (participacion_id);

CREATE TABLE puntaje_acumulado (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ronda_id         UUID    NOT NULL REFERENCES ronda(id),
  participacion_id UUID    NOT NULL REFERENCES participacion(id),
  delta            INT     NOT NULL,                    -- -penalizacion, o +10 al ganador de ronda
  acumulado        INT     NOT NULL,
  ganador_ronda    BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (ronda_id, participacion_id)
);
CREATE UNIQUE INDEX uq_ganador_ronda ON puntaje_acumulado (ronda_id) WHERE ganador_ronda;

-- Marcador vigente por participacion (modalidades acumulativas)
CREATE VIEW v_marcador AS
SELECT p.partida_id, p.id AS participacion_id, j.alias, p.estado,
       p.puntaje_inicial + COALESCE(SUM(pa.delta), 0) AS puntaje
FROM participacion p
JOIN jugador j ON j.id = p.jugador_id
LEFT JOIN puntaje_acumulado pa ON pa.participacion_id = p.id
GROUP BY p.partida_id, p.id, j.alias, p.estado, p.puntaje_inicial;

-- Invariante de la desnormalizacion controlada: debe devolver 0 filas
CREATE VIEW v_violaciones_acumulado AS
SELECT *
FROM (
  SELECT pa.participacion_id, r.partida_id, r.numero, pa.acumulado,
         p.puntaje_inicial + SUM(pa.delta) OVER (PARTITION BY pa.participacion_id ORDER BY r.numero) AS esperado,
         rj.acumulativa
  FROM puntaje_acumulado pa
  JOIN ronda r ON r.id = pa.ronda_id
  JOIN participacion p ON p.id = pa.participacion_id
  JOIN partida pt ON pt.id = r.partida_id
  JOIN regla_juego rj ON rj.codigo = pt.regla_codigo
) t
WHERE acumulativa AND acumulado <> esperado;

INSERT INTO regla_juego (codigo, nombre, acumulativa) VALUES
  ('CLASICA_4_3_3', 'Clasica 4-3-3', false),
  ('APUNTADO_101',  'Apuntado 101',  true);
