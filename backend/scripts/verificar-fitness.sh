#!/bin/bash
# Prueba de mutacion: inyecta una violacion, comprueba que la fitness function FALLA, y revierte.
cd "$(dirname "$0")/.."
run_arch() { npx jest tests/architecture -t "$1" >/tmp/out.txt 2>&1; [ $? -ne 0 ] && echo "FALLA (correcto)" || echo "PASA (incorrecto)"; }
run_lint() { npx eslint src >/tmp/out.txt 2>&1; [ $? -ne 0 ] && echo "FALLA (correcto)" || echo "PASA (incorrecto)"; }

echo "M1 controlador importa repositorio -> FF-01"
cp src/partidas/controlador/PartidaGateway.ts /tmp/bk.ts
sed -i "1i import { PartidaRepositoryEnMemoria } from '../repositorio/PartidaRepository'; export const _x = PartidaRepositoryEnMemoria;" src/partidas/controlador/PartidaGateway.ts
run_arch "FF-01"; cp /tmp/bk.ts src/partidas/controlador/PartidaGateway.ts

echo "M2 motor-reglas importa compartido -> FF-02"
cp src/motor-reglas/MotorLogicaJuego.ts /tmp/bk.ts
sed -i "1i import { cargarConfig } from '../compartido/config/Config'; export const _y = cargarConfig;" src/motor-reglas/MotorLogicaJuego.ts
run_arch "FF-02"; cp /tmp/bk.ts src/motor-reglas/MotorLogicaJuego.ts

echo "M3 ReglaApuntado101 importa ReglaClasicaCuartaTerna -> FF-03"
cp src/motor-reglas/reglas/ReglaApuntado101.ts /tmp/bk.ts
sed -i "1i import { ReglaClasicaCuartaTerna } from './ReglaClasicaCuartaTerna'; export const _z = ReglaClasicaCuartaTerna;" src/motor-reglas/reglas/ReglaApuntado101.ts
run_arch "FF-03"; cp /tmp/bk.ts src/motor-reglas/reglas/ReglaApuntado101.ts

echo "M4 lobby importa PartidaService concreto -> FF-05"
cp src/lobby/servicio/LobbyService.ts /tmp/bk.ts
sed -i "1i import { PartidaService } from '../../partidas/servicio/PartidaService'; export const _w = PartidaService;" src/lobby/servicio/LobbyService.ts
run_arch "FF-05"; cp /tmp/bk.ts src/lobby/servicio/LobbyService.ts

echo "M5 ciclo entre archivos de partidas -> FF-06"
cp src/partidas/servicio/BusEventos.ts /tmp/bk.ts
sed -i "1i import { ColaPorPartida } from './ColaPorPartida'; export const _c = ColaPorPartida;" src/partidas/servicio/BusEventos.ts
cp src/partidas/servicio/ColaPorPartida.ts /tmp/bk2.ts
sed -i "1i import { BusEventos } from './BusEventos'; export const _b = BusEventos;" src/partidas/servicio/ColaPorPartida.ts
run_arch "FF-06"; cp /tmp/bk.ts src/partidas/servicio/BusEventos.ts; cp /tmp/bk2.ts src/partidas/servicio/ColaPorPartida.ts

echo "M6 metodo con complejidad ciclomatica 12 en el motor -> FF-04"
cat > src/motor-reglas/evaluacion/Malo.ts <<'TS'
export function malo(a: number): number {
  if (a === 1) return 1; if (a === 2) return 2; if (a === 3) return 3; if (a === 4) return 4;
  if (a === 5) return 5; if (a === 6) return 6; if (a === 7) return 7; if (a === 8) return 8;
  if (a === 9) return 9; if (a === 10) return 10; if (a === 11) return 11; return 0;
}
TS
run_lint; rm src/motor-reglas/evaluacion/Malo.ts

echo "M7 literal de modalidad en PartidaService -> ADR-03"
cp src/partidas/servicio/PartidaService.ts /tmp/bk.ts
sed -i "1i export const _m = 'APUNTADO_101';" src/partidas/servicio/PartidaService.ts
run_lint; cp /tmp/bk.ts src/partidas/servicio/PartidaService.ts

echo "M8 importar pg desde un controlador -> ADR-04"
cp src/lobby/controlador/LobbyController.ts /tmp/bk.ts
sed -i "1i // @ts-ignore\nimport { Pool } from 'pg'; export const _p = Pool;" src/lobby/controlador/LobbyController.ts
run_lint; cp /tmp/bk.ts src/lobby/controlador/LobbyController.ts

echo "--- verificacion final: todo limpio ---"
npx jest 2>&1 | grep -E "^Tests:"; npx eslint src && echo "lint OK"
