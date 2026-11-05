# ADR-01: Monolito modular particionado por dominio, con capas internas por modulo

**Estado:** Accepted (Entregable 1)

## Contexto
El backend puede organizarse en primer nivel por funcion tecnica (controladores, servicios, repositorios) o por capacidad de negocio. El principal driver es Configurability/Extensibility y la fuente de cambio son las reglas del juego. Un equipo de cuatro personas, un semestre, un solo despliegue (Feasibility).

## Decision
Monolito modular particionado por dominio; cada modulo con capas Controlador-Servicio-Repositorio. Modulos: `lobby`, `partidas`, `motor-reglas` (solo logica de dominio), `compartido` (solo infraestructura). Cada modulo expone una interfaz de servicio como unica puerta de entrada. `INotificadorEventos` evita el ciclo entre `PartidaGateway` y `PartidaService`. Reglas: las capas no se saltan, la logica de reglas nunca vive en controladores, los modulos se comunican solo por interfaces de servicio.

## Consecuencias
Positivas: alta cohesion por capacidad, cambios de reglas aislados, estructura uniforme, modulos probables por separado. Negativas: mas carpetas e interfaces; `compartido` puede degenerar en contenedor generico (Entity Trap).

## Cumplimiento
Automatizado: fitness functions FF-01, FF-02, FF-05 y FF-06 (`backend/tests/architecture`, TSArch; sustituyen a la propuesta original con dependency-cruiser). Manual: revision de pull requests.

Autores: equipo. Aprobacion: pendiente. Revisor: Fernan Alonso Villa Garzon.
