/** Serializa las acciones de cada partida: una a la vez, en orden de llegada (seccion 2.4, nivel 1). */
export class ColaPorPartida {
  private colas = new Map<string, Promise<unknown>>();

  ejecutar<T>(partidaId: string, trabajo: () => Promise<T>): Promise<T> {
    const anterior = this.colas.get(partidaId) ?? Promise.resolve();
    const siguiente = anterior.then(trabajo, trabajo);
    this.colas.set(partidaId, siguiente.catch(() => undefined));
    return siguiente;
  }
}
