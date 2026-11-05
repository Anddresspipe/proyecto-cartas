# ADR-02: Desacoplar las reglas de victoria mediante el patron Strategy

**Estado:** Accepted (Entregable 1; desarrollado en ADR-03)

## Contexto
Dos modalidades (Clasica 4-3-3 y Apuntado 101), paso de una a otra en la misma sala (CU-04) y variantes futuras. Alternativas: (1) if/switch por modalidad en `PartidaService`; (2) Microkernel/Plug-in; (3) Strategy dentro de `motor-reglas`.

## Decision
Alternativa (3). Interfaz `ReglaJuego` con una implementacion por modalidad; `PartidaService` solo invoca a `MotorLogicaJuego`. El cambio de modalidad crea una nueva `Partida` con otra regla. El motor recibe solo objetos de su modelo o valores simples.

## Consecuencias
Positivas: agregar una modalidad no modifica `lobby` ni `partidas`; la deteccion de combinaciones se reutiliza; `motor-reglas` conserva Ce = 0. Negativas: una capa de indireccion; redespliegue para agregar modalidades; si una variante necesita operaciones nuevas hay que ampliar la interfaz (ampliada en el Entregable 2 con `getCodigo`, `haGanado` y `conservaHistorial`).

## Cumplimiento
Prueba de contrato por regla, FF-03 y regla ESLint contra condicionales por modalidad.

Autores: equipo. Aprobacion: pendiente. Revisor: Fernan Alonso Villa Garzon.
