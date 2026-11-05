import 'tsarch/dist/jest';
import { filesOfProject } from 'tsarch';

/**
 * NOTA TSArch: inFolder('x') se traduce a la expresion .*\/x\/.*, aplicada a rutas como
 * 'src/lobby/servicio/LobbyService.ts' (sin barra inicial). Por eso se usan rutas relativas al
 * modulo ('lobby/controlador') y NO 'src/lobby/controlador', que no coincidiria con ningun archivo
 * y haria pasar la regla en vacio. Los tests de control (abajo) comprueban que cada selector
 * encuentra archivos reales.
 */
const MODULOS = ['lobby', 'partidas'] as const;

describe('Fitness functions de arquitectura (Entregable 2, seccion 5)', () => {
  it('FF-01: controladores no acceden a repositorios ni al motor de reglas', async () => {
    for (const m of MODULOS) {
      const aRepos = filesOfProject().inFolder(`${m}/controlador`)
        .shouldNot().dependOnFiles().inFolder(`${m}/repositorio`);
      await expect(aRepos).toPassAsync();
      const aMotor = filesOfProject().inFolder(`${m}/controlador`)
        .shouldNot().dependOnFiles().inFolder('motor-reglas');
      await expect(aMotor).toPassAsync();
    }
  });

  it('FF-02: motor-reglas es independiente del resto del backend', async () => {
    for (const destino of ['lobby', 'partidas', 'compartido']) {
      const regla = filesOfProject().inFolder('motor-reglas')
        .shouldNot().dependOnFiles().inFolder(destino);
      await expect(regla).toPassAsync();
    }
  });

  it('FF-03: las reglas de juego no se dependen entre si', async () => {
    const clasicaApuntado = filesOfProject().matchingPattern('.*ReglaClasicaCuartaTerna\\.ts')
      .shouldNot().dependOnFiles().matchingPattern('.*ReglaApuntado101\\.ts');
    const apuntadoClasica = filesOfProject().matchingPattern('.*ReglaApuntado101\\.ts')
      .shouldNot().dependOnFiles().matchingPattern('.*ReglaClasicaCuartaTerna\\.ts');
    await expect(clasicaApuntado).toPassAsync();
    await expect(apuntadoClasica).toPassAsync();
  });

  it('FF-05: lobby y partidas se comunican solo por interfaces de servicio', async () => {
    const prohibidos: Array<[string, string]> = [
      ['lobby', 'partidas/repositorio'],
      ['lobby', 'partidas/controlador'],
      ['lobby', 'partidas/modelo'],
      ['partidas', 'lobby'], // dependencia unidireccional: lobby -> partidas
    ];
    for (const [origen, destino] of prohibidos) {
      const regla = filesOfProject().inFolder(origen).shouldNot().dependOnFiles().inFolder(destino);
      await expect(regla).toPassAsync();
    }
    const aImplementacion = filesOfProject().inFolder('lobby')
      .shouldNot().dependOnFiles().matchingPattern('.*partidas/servicio/PartidaService\\.ts');
    await expect(aImplementacion).toPassAsync();
  });

  it('FF-06: sin ciclos y compartido sin logica de dominio', async () => {
    await expect(filesOfProject().matchingPattern('src/.*').should().beFreeOfCycles()).toPassAsync();
    for (const m of ['lobby', 'partidas', 'motor-reglas']) {
      const regla = filesOfProject().inFolder('compartido').shouldNot().dependOnFiles().inFolder(m);
      await expect(regla).toPassAsync();
    }
  });
});

/** Controles negativos: dependencias que SI existen deben ser detectadas (los selectores no estan vacios). */
describe('Controles de las fitness functions (evitan reglas vacias)', () => {
  const debeDetectar = async (origen: string, destino: string) => {
    const regla = filesOfProject().inFolder(origen).shouldNot().dependOnFiles().inFolder(destino);
    await expect(regla).not.toPassAsync();
  };
  it('detecta partidas/servicio -> motor-reglas', () => debeDetectar('partidas/servicio', 'motor-reglas'));
  it('detecta partidas/controlador -> partidas/servicio', () => debeDetectar('partidas/controlador', 'partidas/servicio'));
  it('detecta lobby/servicio -> partidas/servicio', () => debeDetectar('lobby/servicio', 'partidas/servicio'));
  it('detecta lobby/controlador -> lobby/servicio', () => debeDetectar('lobby/controlador', 'lobby/servicio'));
  it('detecta motor-reglas -> motor-reglas (el selector encuentra archivos)', () => debeDetectar('motor-reglas', 'motor-reglas'));
});
