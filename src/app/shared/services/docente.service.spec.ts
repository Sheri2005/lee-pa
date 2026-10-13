import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DOCENTES_MOCK } from '../mocks/docentes.mock';
import { MATERIAS_MOCK } from '../mocks/materias.mock';
import { DocenteService } from './docente.service';

describe('DocenteService', () => {
  let servicio: DocenteService;

  beforeEach(() => {
    vi.useFakeTimers();
    servicio = TestBed.inject(DocenteService);
  });

  afterEach(() => vi.useRealTimers());

  async function listar(filtros?: Parameters<DocenteService['listar']>[0]) {
    const resultado = firstValueFrom(servicio.listar(filtros));
    await vi.advanceTimersByTimeAsync(300);
    return resultado;
  }

  it('sin filtros devuelve todos los docentes', async () => {
    expect(await listar()).toEqual(DOCENTES_MOCK);
  });

  it('con materiaId devuelve solo los docentes habilitados para esa materia', async () => {
    const habilitados = await listar({ materiaId: 4 });
    expect(habilitados.map((d) => d.nombre)).toEqual(['Cedeño Loor Pablo', 'Delgado Ponce Sofía']);
    expect(habilitados.every((d) => d.materiaIds.includes(4))).toBe(true);
  });

  it('una materia sin docentes habilitados devuelve una lista vacía', async () => {
    expect(await listar({ materiaId: 999 })).toEqual([]);
  });

  it('listarMaterias devuelve las materias para las que el docente está habilitado', async () => {
    const resultado = firstValueFrom(servicio.listarMaterias(1));
    await vi.advanceTimersByTimeAsync(300);
    expect((await resultado).map((m) => m.codigo)).toEqual(['MAT-101', 'MAT-102', 'EST-201']);
    expect(await resultado).toEqual(MATERIAS_MOCK.filter((m) => [1, 2, 5].includes(m.id)));
  });

  it('listarMaterias de un docente que no existe devuelve una lista vacía', async () => {
    const resultado = firstValueFrom(servicio.listarMaterias(999));
    await vi.advanceTimersByTimeAsync(300);
    expect(await resultado).toEqual([]);
  });

  it('cada docente trae identificación y carga máxima', async () => {
    for (const docente of await listar()) {
      expect(docente.identificacion).toMatch(/^\d{10}$/);
      expect(docente.cargaMaxima).toBeGreaterThan(0);
    }
  });
});