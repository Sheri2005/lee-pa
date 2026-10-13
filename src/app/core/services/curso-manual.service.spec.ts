import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { MateriaService } from '../../shared/services/materia.service';
import { Materia } from '../../shared/models/materia.model';
import { PLANIFICACIONES_MOCK } from '../mocks/planificaciones.mock';
import { SolicitudCursoManual } from '../models/curso-manual.model';
import { PlanificacionService } from './planificacion.service';

describe('PlanificacionService · C2-09', () => {
  const propia: Materia = {
    id: 7,
    codigo: 'ARQ-110',
    nombre: 'Taller de Diseño I',
    carreraResponsableId: 7,
    carreraResponsable: 'Arquitectura',
    mallaIds: [],
  };
  const listar = vi.fn();
  const solicitud = (): SolicitudCursoManual => ({
    materiaId: 7,
    numeroParalelos: 2,
    motivo: '  Demanda extraordinaria  ',
  });
  const servicio = () => TestBed.inject(PlanificacionService);

  beforeEach(() => {
    listar.mockReset().mockReturnValue(of([propia]));
    TestBed.configureTestingModule({
      providers: [{ provide: MateriaService, useValue: { listar } }],
    });
  });

  it('guarda usando el catálogo G1, admite materia fuera de malla y conserva el motivo normalizado', async () => {
    const curso = await firstValueFrom(servicio().agregarCursoManual(3, solicitud()));
    expect(curso).toMatchObject({
      planificacionId: 3,
      materiaId: 7,
      numeroParalelos: 2,
      motivo: 'Demanda extraordinaria',
      origen: 'MANUAL',
    });
    expect(listar).toHaveBeenCalledWith({ carreraResponsableId: 7 });
    const contexto = await firstValueFrom(servicio().obtenerContextoCursoManual(3));
    expect(contexto.cursosManuales).toEqual([curso]);
    curso.materia.nombre = 'Alterado';
    contexto.cursosManuales[0].numeroParalelos = 999;
    const fresco = await firstValueFrom(servicio().obtenerContextoCursoManual(3));
    expect(fresco.cursosManuales[0].materia.nombre).toBe(propia.nombre);
    expect(fresco.cursosManuales[0].numeroParalelos).toBe(2);
  });

  it.each([0, -1, 1.5, NaN, 999])('rechaza planificación inválida %s', async (id) => {
    await expect(firstValueFrom(servicio().agregarCursoManual(id, solicitud()))).rejects.toThrow();
    await expect(firstValueFrom(servicio().obtenerContextoCursoManual(id))).rejects.toThrow();
  });

  it.each([1, 2, 4])('rechaza planificación no editable %s', async (id) => {
    await expect(firstValueFrom(servicio().agregarCursoManual(id, solicitud()))).rejects.toThrow(
      'no admite',
    );
    expect(listar).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rechaza número de paralelos %s',
    async (numeroParalelos) => {
      await expect(
        firstValueFrom(servicio().agregarCursoManual(3, { ...solicitud(), numeroParalelos })),
      ).rejects.toThrow('entero');
    },
  );

  it.each(['', '   ', 'x'.repeat(501)])('rechaza motivo inválido', async (motivo) => {
    await expect(
      firstValueFrom(servicio().agregarCursoManual(3, { ...solicitud(), motivo })),
    ).rejects.toThrow('motivo');
  });

  it('admite motivo de 500 caracteres y rechaza materia desconocida o de otra carrera', async () => {
    await expect(
      firstValueFrom(servicio().agregarCursoManual(3, { ...solicitud(), materiaId: 999 })),
    ).rejects.toThrow('materia');
    listar.mockReturnValue(of([{ ...propia, carreraResponsableId: 5 }]));
    await expect(firstValueFrom(servicio().agregarCursoManual(3, solicitud()))).rejects.toThrow(
      'materia',
    );
    listar.mockReturnValue(of([propia]));
    expect(
      (
        await firstValueFrom(
          servicio().agregarCursoManual(3, { ...solicitud(), motivo: 'x'.repeat(500) }),
        )
      ).motivo.length,
    ).toBe(500);
  });

  it('revalida duplicados incluso con dos consultas pendientes del catálogo', async () => {
    const catalogo = new Subject<Materia[]>();
    listar.mockReturnValue(catalogo);
    const primero = firstValueFrom(servicio().agregarCursoManual(3, solicitud()));
    const segundo = firstValueFrom(servicio().agregarCursoManual(3, solicitud()));
    const resultados = Promise.allSettled([primero, segundo]);
    catalogo.next([propia]);
    expect((await resultados).map((r) => r.status)).toEqual(['fulfilled', 'rejected']);
  });

  it('revalida el estado al escribir y no guarda si se aprobó mientras consultaba', async () => {
    const plan = PLANIFICACIONES_MOCK.find((p) => p.id === 3)!;
    const anterior = plan.estado;
    const catalogo = new Subject<Materia[]>();
    listar.mockReturnValue(catalogo);
    try {
      const respuesta = firstValueFrom(servicio().agregarCursoManual(3, solicitud()));
      const comprobacion = expect(respuesta).rejects.toThrow('no admite');
      plan.estado = 'APROBADA';
      catalogo.next([propia]);
      await comprobacion;
    } finally {
      plan.estado = anterior;
    }
  });

  it('permite CON_CAMBIOS y captura la solicitud sin compartir objetos mutables', async () => {
    const plan = PLANIFICACIONES_MOCK.find((p) => p.id === 3)!;
    const anterior = plan.estado;
    try {
      plan.estado = 'CON_CAMBIOS';
      const datos = solicitud();
      const operacion = servicio().agregarCursoManual(3, datos);
      datos.numeroParalelos = 99;
      expect((await firstValueFrom(operacion)).numeroParalelos).toBe(2);
    } finally {
      plan.estado = anterior;
    }
  });

  it('no guarda si falla el catálogo ni si se cancela antes de recibirlo', async () => {
    listar.mockReturnValue(throwError(() => new Error('Sin conexión')));
    await expect(firstValueFrom(servicio().agregarCursoManual(3, solicitud()))).rejects.toThrow(
      'Sin conexión',
    );
    const catalogo = new Subject<Materia[]>();
    listar.mockReturnValue(catalogo);
    const sub = servicio().agregarCursoManual(3, solicitud()).subscribe();
    sub.unsubscribe();
    catalogo.next([propia]);
    expect((await firstValueFrom(servicio().obtenerContextoCursoManual(3))).cursosManuales).toEqual(
      [],
    );
  });
});
