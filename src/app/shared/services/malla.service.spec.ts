import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MALLAS_MOCK } from '../mocks/mallas.mock';
import { MallaService } from './malla.service';

describe('MallaService', () => {
  let servicio: MallaService;

  beforeEach(() => {
    vi.useFakeTimers();
    servicio = TestBed.inject(MallaService);
  });

  afterEach(() => vi.useRealTimers());

  /** Espera los 300 ms simulados del servicio y devuelve el resultado. */
  async function esperar<T>(observable: Parameters<typeof firstValueFrom<T>>[0]) {
    const resultado = firstValueFrom(observable);
    await vi.advanceTimersByTimeAsync(300);
    return resultado;
  }

  it('listar devuelve las mallas con su carrera y su vigencia', async () => {
    const mallas = await esperar(servicio.listar());
    expect(mallas).toEqual(MALLAS_MOCK);
    for (const malla of mallas) {
      expect(typeof malla.carreraId).toBe('number');
      expect(typeof malla.vigente).toBe('boolean');
    }
  });

  it('una carrera puede tener una malla vigente y otra que ya no lo está', async () => {
    const deComputacion = (await esperar(servicio.listar())).filter((m) => m.carreraId === 5);
    expect(deComputacion.map((m) => [m.codigo, m.vigente])).toEqual([
      ['M-COMP-2024', true],
      ['M-COMP-2019', false],
    ]);
  });

  it('crear asigna el siguiente id, la carrera indicada y la deja vigente', async () => {
    const creada = await esperar(
      servicio.crear({ codigo: 'M-IND-2027', nombre: 'Malla 2027', anioInicio: 2027 }, 6),
    );
    expect(creada).toEqual({
      id: 7,
      codigo: 'M-IND-2027',
      nombre: 'Malla 2027',
      anioInicio: 2027,
      carreraId: 6,
      vigente: true,
    });
    expect((await esperar(servicio.listar())).map((m) => m.id)).toContain(7);
  });

  it('actualizar cambia código, nombre y año, y conserva la carrera y la vigencia', async () => {
    const actualizada = await esperar(
      servicio.actualizar(6, {
        codigo: 'M-COMP-2019B',
        nombre: 'Malla 2019 rev.',
        anioInicio: 2020,
      }),
    );
    expect(actualizada).toEqual({
      id: 6,
      codigo: 'M-COMP-2019B',
      nombre: 'Malla 2019 rev.',
      anioInicio: 2020,
      carreraId: 5,
      vigente: false,
    });
    const guardada = (await esperar(servicio.listar())).find((m) => m.id === 6);
    expect(guardada).toEqual(actualizada);
  });

  it('actualizar una malla que no existe falla', async () => {
    await expect(
      firstValueFrom(servicio.actualizar(999, { codigo: 'X', nombre: 'X', anioInicio: 2024 })),
    ).rejects.toThrow('No existe la malla 999.');
  });

  it('listarNiveles devuelve 1..n según la malla, y vacío si no existe', async () => {
    expect(await esperar(servicio.listarNiveles(3))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(await esperar(servicio.listarNiveles(999))).toEqual([]);
  });
});
