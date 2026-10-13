import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PLANIFICACIONES_MOCK } from '../mocks/planificaciones.mock';
import { PlanificacionService } from './planificacion.service';

describe('PlanificacionService · C2-02, C2-03 y C2-05', () => {
  const total = PLANIFICACIONES_MOCK.length;
  const editable = () =>
    PLANIFICACIONES_MOCK.find((p) => ['BORRADOR', 'CON_CAMBIOS'].includes(p.estado))!;

  const servicio = () => TestBed.inject(PlanificacionService);

  // `crear` agrega al mock compartido: se restaura para no contaminar otras pruebas del archivo.
  afterEach(() => PLANIFICACIONES_MOCK.splice(total));

  it('obtenerPorId devuelve una copia y falla con un id inexistente', async () => {
    const primera = PLANIFICACIONES_MOCK[0];
    const copia = await firstValueFrom(servicio().obtenerPorId(primera.id));
    expect(copia).toEqual(primera);
    copia.carrera.nombre = 'Modificado';
    expect(PLANIFICACIONES_MOCK[0].carrera.nombre).not.toBe('Modificado');
    await expect(firstValueFrom(servicio().obtenerPorId(999999))).rejects.toThrow('no encontrada');
  });

  it('el catálogo ofrece carreras con facultad y malla, períodos y combinaciones existentes', async () => {
    const catalogo = await firstValueFrom(servicio().obtenerCatalogoNueva());
    const ids = (lista: { id: number }[]) => lista.map((x) => x.id).sort();
    expect(ids(catalogo.carreras)).toEqual(
      [...new Set(PLANIFICACIONES_MOCK.map((p) => p.carrera.id))].sort(),
    );
    expect(ids(catalogo.periodos)).toEqual(
      [...new Set(PLANIFICACIONES_MOCK.map((p) => p.periodo.id))].sort(),
    );
    expect(catalogo.existentes).toHaveLength(total);
    for (const c of catalogo.carreras) {
      expect(c.facultad.id).toBeGreaterThan(0);
      expect(c.malla.id).toBeGreaterThan(0);
    }
  });

  it('crea una planificación en BORRADOR, la hace visible y rechaza repetirla', async () => {
    const s = servicio();
    const catalogo = await firstValueFrom(s.obtenerCatalogoNueva());
    const libre = catalogo.carreras
      .flatMap((c) => catalogo.periodos.map((p) => ({ carreraId: c.id, periodoId: p.id })))
      .find(
        (x) =>
          !catalogo.existentes.some(
            (e) => e.carreraId === x.carreraId && e.periodoId === x.periodoId,
          ),
      );
    expect(libre).toBeDefined(); // el mock debe dejar al menos una combinación libre

    const nueva = await firstValueFrom(s.crear(libre!));
    expect(nueva.estado).toBe('BORRADOR');
    expect(nueva.id).toBeGreaterThan(
      Math.max(...PLANIFICACIONES_MOCK.slice(0, total).map((p) => p.id)),
    );
    expect(nueva.carrera.id).toBe(libre!.carreraId);
    expect(nueva.periodo.id).toBe(libre!.periodoId);
    expect((await firstValueFrom(s.listar())).some((p) => p.id === nueva.id)).toBe(true);
    expect((await firstValueFrom(s.obtenerPorId(nueva.id))).id).toBe(nueva.id);

    await expect(firstValueFrom(s.crear(libre!))).rejects.toThrow('Ya existe');
    await expect(
      firstValueFrom(s.crear({ carreraId: 999999, periodoId: libre!.periodoId })),
    ).rejects.toThrow('no existe');
  });

  it('guarda y devuelve parámetros ordenados, y no admite datos inválidos', async () => {
    const s = servicio();
    const id = editable().id;
    const valor = {
      nivelesOfertados: [3, 1, 3, 2],
      cupoMaximoParalelo: 30,
      minimoEstudiantesAbrir: 10,
    };
    const guardado = await firstValueFrom(s.guardarParametros(id, valor));
    expect(guardado.nivelesOfertados).toEqual([1, 2, 3]);
    expect(await firstValueFrom(s.obtenerParametros(id))).toEqual(guardado);

    await expect(
      firstValueFrom(s.guardarParametros(id, { ...valor, nivelesOfertados: [] })),
    ).rejects.toThrow('nivel');
    await expect(
      firstValueFrom(s.guardarParametros(id, { ...valor, cupoMaximoParalelo: 0 })),
    ).rejects.toThrow('cupo');
    await expect(
      firstValueFrom(s.guardarParametros(id, { ...valor, minimoEstudiantesAbrir: 31 })),
    ).rejects.toThrow('mínimo');
    await expect(firstValueFrom(s.guardarParametros(999999, valor))).rejects.toThrow('inexistente');
  });

  it('no permite guardar parámetros en una planificación que no admite cambios', async () => {
    const bloqueada = PLANIFICACIONES_MOCK.find(
      (p) => !['BORRADOR', 'CON_CAMBIOS'].includes(p.estado),
    )!;
    await expect(
      firstValueFrom(
        servicio().guardarParametros(bloqueada.id, {
          nivelesOfertados: [1],
          cupoMaximoParalelo: 30,
          minimoEstudiantesAbrir: 10,
        }),
      ),
    ).rejects.toThrow('no admite');
  });

  it('devuelve valores por defecto cuando no hay parámetros guardados y la malla por niveles', async () => {
    const s = servicio();
    const sinGuardar = await firstValueFrom(s.obtenerParametros(999999));
    expect(sinGuardar.nivelesOfertados).toEqual([]);
    expect(sinGuardar.cupoMaximoParalelo).toBeGreaterThan(0);
    const malla = await firstValueFrom(s.obtenerMallaPorNiveles(1));
    expect(malla.length).toBeGreaterThan(0);
    expect(malla[0].materias.length).toBeGreaterThan(0);
    await expect(firstValueFrom(s.obtenerMallaPorNiveles(0))).rejects.toThrow('inválida');
  });
});
