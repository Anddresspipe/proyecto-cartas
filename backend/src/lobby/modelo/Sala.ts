export interface Jugador { id: string; alias: string; esAdmin: boolean }
export interface Sala { id: string; codigoAcceso: string; jugadores: Jugador[] }
