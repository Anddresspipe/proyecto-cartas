# ADR-05: Decisiones síncronas en memoria y notificaciones por eventos locales

**Estado:** Accepted.

## Contexto
El descarte de una carta o el cambio de turno debe verse casi de inmediato en todos los clientes (Responsiveness), con servidor autoritativo (Security) y orden determinista de las jugadas. Alternativas: (1) todo síncrono, con llamadas directas del servicio al gateway; (2) todo por eventos, incluidos los comandos; (3) híbrido. Un broker externo queda fuera de alcance (Feasibility). Se descarta (1) porque el servicio dependería del gateway (ciclo que evita `INotificadorEventos`) y (2) porque un comando asíncrono no da respuesta inmediata ni orden garantizado.

## Decisión
Alternativa (3). Decisión síncrona: `PartidaGateway → PartidaService → MotorLogicaJuego → PartidaRepository`, por interfaces y con una cola FIFO por partida que ejecuta una acción a la vez. Cada cierre lleva la ronda esperada: de dos cierres simultáneos se aplica el primero y el segundo recibe `RONDA_YA_CERRADA`.

Notificación por eventos locales: tras aplicar la acción en memoria (y tras el COMMIT en los cierres), `PartidaService` publica en `BusEventos`, en orden, `CartaDescartada`, `TurnoCambiado`, `RondaCerrada`, `JugadorEliminado` o `PartidaFinalizada`, según corresponda. Si Ana descarta, tras validar y aplicar la acción se publican `CartaDescartada` y `TurnoCambiado`, y los demás clientes los reciben en ese orden. El gateway (`INotificadorEventos`) se suscribe y envía a cada cliente solo su vista; log y métricas también. Los eventos no validan ni mutan estado y no se persisten.

## Consecuencias
Positivas: latencia mínima; orden determinista; el error de un suscriptor se aísla con try/catch y no revierte la jugada; se agregan suscriptores sin modificar el orquestador.

Negativas: la publicación es síncrona dentro del turno, así que los suscriptores deben ser no bloqueantes (el gateway solo encola el mensaje); los eventos en vuelo se pierden si cae el proceso (el cliente se resincroniza al reconectar); el bus local no escala a varias instancias (se reemplazaría por un broker tras el mismo puerto); el flujo implícito es menos visible.

## Cumplimiento
Automatizado: (a) `cierreRonda.test.ts`: `RondaCerrada` se publica solo tras guardar, un cierre inválido no guarda ni notifica, dos cierres simultáneos dan un éxito y un `RONDA_YA_CERRADA`, y un suscriptor con excepción no altera el estado ni a los demás (el orden de `CartaDescartada` y `TurnoCambiado` se probará al implementar el descarte); (b) FF-02: `motor-reglas` no importa el bus ni módulos de dominio. Manual: todo canal nuevo declara en el pull request si es decisión (síncrona) o notificación (evento).

Autor: [nombre del autor]. Fecha de aprobación: pendiente. Revisor: Fernán Alonso Villa Garzón.
