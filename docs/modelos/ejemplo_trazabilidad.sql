-- Ejemplo trazable: partida Clasica -> cambio a Apuntado (CU-04) -> dos rondas acumulativas.
-- Ejecutar sobre una BD con 001_esquema.sql aplicado.
BEGIN;
INSERT INTO sala (id, codigo_acceso) VALUES ('00000000-0000-0000-0000-0000000000a1', 'XK7Q2M');
INSERT INTO jugador (id, sala_id, alias, token_hash, es_admin) VALUES
 ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a1','Ana', repeat('a',64), true),
 ('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-0000000000a1','Beto',repeat('b',64), false),
 ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000a1','Caro',repeat('c',64), false);

-- Partida 1: CLASICA, una ronda (Ana cierra; Beto -28; Caro -17)
INSERT INTO partida (id, sala_id, regla_codigo, estado, iniciada_en, finalizada_en, version)
 VALUES ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a1','CLASICA_4_3_3','FINALIZADA', now(), now(), 1);
INSERT INTO participacion (id, partida_id, jugador_id, orden_turno, estado) VALUES
 ('00000000-0000-0000-0000-0000000001a1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-00000000000a',1,'ACTIVO'),
 ('00000000-0000-0000-0000-0000000001b1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-00000000000b',2,'ACTIVO'),
 ('00000000-0000-0000-0000-0000000001c1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-00000000000c',3,'ACTIVO');
INSERT INTO ronda (id, partida_id, numero, estado, cerrada_por, iniciada_en, cerrada_en)
 VALUES ('00000000-0000-0000-0000-0000000002a1','00000000-0000-0000-0000-0000000000b1',1,'CERRADA','00000000-0000-0000-0000-0000000001a1', now(), now());
INSERT INTO puntaje_acumulado (ronda_id, participacion_id, delta, acumulado, ganador_ronda) VALUES
 ('00000000-0000-0000-0000-0000000002a1','00000000-0000-0000-0000-0000000001a1', 10, 10, true),
 ('00000000-0000-0000-0000-0000000002a1','00000000-0000-0000-0000-0000000001b1',-28,-28, false),
 ('00000000-0000-0000-0000-0000000002a1','00000000-0000-0000-0000-0000000001c1',-17,-17, false);

-- Partida 2: APUNTADO_101 continua de la 1 (CU-04): puntaje_inicial = ultima ronda clasica
INSERT INTO partida (id, sala_id, regla_codigo, partida_anterior_id, estado, iniciada_en, version)
 VALUES ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000a1','APUNTADO_101','00000000-0000-0000-0000-0000000000b1','EN_JUEGO', now(), 2);
INSERT INTO participacion (id, partida_id, jugador_id, orden_turno, estado, puntaje_inicial) VALUES
 ('00000000-0000-0000-0000-0000000001a2','00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-00000000000a',1,'ACTIVO', 10),
 ('00000000-0000-0000-0000-0000000001b2','00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-00000000000b',2,'ACTIVO',-28),
 ('00000000-0000-0000-0000-0000000001c2','00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-00000000000c',3,'ACTIVO',-17);
-- Ronda 1 (cierra Beto): Ana -12, Beto +10, Caro -23
INSERT INTO ronda (id, partida_id, numero, estado, cerrada_por, iniciada_en, cerrada_en)
 VALUES ('00000000-0000-0000-0000-0000000002b1','00000000-0000-0000-0000-0000000000b2',1,'CERRADA','00000000-0000-0000-0000-0000000001b2', now(), now());
INSERT INTO puntaje_acumulado (ronda_id, participacion_id, delta, acumulado, ganador_ronda) VALUES
 ('00000000-0000-0000-0000-0000000002b1','00000000-0000-0000-0000-0000000001a2',-12,-2, false),
 ('00000000-0000-0000-0000-0000000002b1','00000000-0000-0000-0000-0000000001b2', 10,-18, true),
 ('00000000-0000-0000-0000-0000000002b1','00000000-0000-0000-0000-0000000001c2',-23,-40, false);
-- Ronda 2 (cierra Ana): Ana +10, Beto -30, Caro -21
INSERT INTO ronda (id, partida_id, numero, estado, cerrada_por, iniciada_en, cerrada_en)
 VALUES ('00000000-0000-0000-0000-0000000002b2','00000000-0000-0000-0000-0000000000b2',2,'CERRADA','00000000-0000-0000-0000-0000000001a2', now(), now());
INSERT INTO puntaje_acumulado (ronda_id, participacion_id, delta, acumulado, ganador_ronda) VALUES
 ('00000000-0000-0000-0000-0000000002b2','00000000-0000-0000-0000-0000000001a2', 10,  8, true),
 ('00000000-0000-0000-0000-0000000002b2','00000000-0000-0000-0000-0000000001b2',-30,-48, false),
 ('00000000-0000-0000-0000-0000000002b2','00000000-0000-0000-0000-0000000001c2',-21,-61, false);
COMMIT;

-- Consultas de verificacion
SELECT alias, puntaje, estado FROM v_marcador WHERE partida_id = '00000000-0000-0000-0000-0000000000b2' ORDER BY alias;
SELECT j.alias, r.numero AS ronda, pa.delta, pa.acumulado, pa.ganador_ronda
  FROM puntaje_acumulado pa JOIN ronda r ON r.id = pa.ronda_id
  JOIN participacion p ON p.id = pa.participacion_id JOIN jugador j ON j.id = p.jugador_id
 WHERE r.partida_id = '00000000-0000-0000-0000-0000000000b2' ORDER BY r.numero, j.alias;
SELECT count(*) AS violaciones_invariante FROM v_violaciones_acumulado;
