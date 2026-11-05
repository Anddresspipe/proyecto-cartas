# ADR-03: Monolito modular con patrón Strategy y RegistroReglas como mecanismo de extensibilidad de reglas

**Estado:** Accepted (desarrolla y completa ADR-02).

## Contexto
El sistema soporta Clásica 4-3-3 y Apuntado 101 y debe admitir variantes futuras (comodín, Continental, Póker) sin desestabilizar `lobby` ni `partidas` (drivers: Extensibility y Testability). Alternativas: (1) if/switch por modalidad en `PartidaService`; (2) Microkernel con plug-ins dinámicos; (3) Monolito modular con Strategy y registro explícito. Según la sección 1.1, (3) suma 22 puntos frente a 18 (Microkernel) y 16 (Service-Based). Empata con el Microkernel en los drivers, pues ambos aíslan cada regla tras una interfaz; el Microkernel solo aportaría carga sin redespliegue, que no se necesita (las variantes se escriben dentro del propio proyecto), a cambio de cargador y contratos versionados que no se justifican en un semestre (Feasibility). La alternativa (1) obliga a modificar el orquestador con cada variante.

## Decisión
Alternativa (3). Cada modalidad implementa `ReglaJuego` (`getCodigo`, `getCartasPorMano`, `validarCierre`, `calcularPenalizacion`, `debeEliminar`, `haGanado`, `conservaHistorial`) y se registra en `RegistroReglas` desde `motor-reglas/registroPorDefecto.ts` (invocado por `main.ts`). `PartidaService` obtiene la regla por el código de la partida (`regla_codigo`, FK a `regla_juego`) y nunca consulta la modalidad.

Para agregar Continental: (a) crear `motor-reglas/reglas/ReglaContinental.ts` que implemente `ReglaJuego`; (b) una línea de registro en `registroPorDefecto.ts`; (c) una migración que inserte la fila en `regla_juego`; (d) agregar su código al patrón de ESLint y su archivo a FF-03. No se modifican `PartidaService`, `lobby` ni el esquema. Sí se recompila `motor-reglas` y se redespliega el artefacto: se cumple no alterar el orquestador, pero no evitar la recompilación, ventaja propia del Microkernel y límite aceptado (ADR-02). Un Póker con evaluadores distintos requeriría además un evaluador nuevo.

## Consecuencias
Positivas: las reglas cambian en un solo módulo con Ce = 0; pruebas puras por regla; costo mínimo; `registrar` rechaza códigos duplicados y `obtener` lanza «Regla no registrada».

Negativas: sin carga en caliente de reglas de terceros; ampliar `ReglaJuego` (por ejemplo, apuestas) obliga a actualizar todas las implementaciones; si existe la fila en `regla_juego` pero no la implementación, el fallo aparece al usar la regla y no al arrancar (mejora pendiente: verificación al inicio).

## Cumplimiento
Automatizado: (a) `contratoReglaJuego.test.ts` ejecuta los mismos casos sobre cada regla registrada; (b) ESLint `no-restricted-syntax` prohíbe los literales `CLASICA_4_3_3` y `APUNTADO_101` en `lobby` y `partidas` (el patrón crece con cada variante); (c) FF-03: las reglas no dependen entre sí. Manual: checklist de pull request con los pasos (a) a (d).

Autor: [nombre del autor]. Fecha de aprobación: pendiente. Revisor: Fernán Alonso Villa Garzón.
