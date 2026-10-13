import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ParametrosPlanificacion } from '../models/sugerencia.model';
import {
  SugerenciaService,
  calcularParalelosSugeridos,
  construirJustificacion,
} from './sugerencia.service';
import { SemillaCurso } from '../mocks/sugerencia.mock';

describe('Reglas de sugerencia (HU G2-05)', () => {
  const parametros: ParametrosPlanificacion = {
    cupoMaximo: 35,
    minimoApertura: 10,
    nivelesOfertados: [1, 2, 3, 4],
  };

  it.each([
    [80, 3], // 80 / 35 = 2,28 → 3
    [70, 2], // exacto: 70 / 35 = 2
    [62, 2],
    [35, 1],
    [10, 1], // justo el mínimo
  ])('con %i estimados sugiere %i paralelos (división hacia arriba)', (estimados, esperados) => {
    expect(calcularParalelosSugeridos(estimados, parametros)).toBe(esperados);
  });

  it.each([9, 1, 0])('no sugiere paralelos con %i estimados: no alcanza el mínimo', (estimados) => {
    expect(calcularParalelosSugeridos(estimados, parametros)).toBe(0);
  });

  function semilla(extra: Partial<SemillaCurso> = {}): SemillaCurso {
    return {
      materia: {
        id: 141,
        codigo: 'ICO-210',
        nombre: 'Estructuras de Datos',
        carreraResponsableId: 5,
        carreraResponsable: 'Ingeniería en Computación',
      },
      nivel: 2,
      mallaMateriaId: 20,
      horasSemanales: 6,
      estudiantesEstimados: 62,
      demandaHistorica: 58,
      esCompartida: false,
      ...extra,
    };
  }

  it('justifica la sugerencia con nivel, mínimo, cálculo y demanda histórica', () => {
    const criterios = construirJustificacion(semilla(), parametros, 2);
    expect(criterios.map((c) => c.etiqueta)).toEqual([
      'Nivel 2 de la malla vigente',
      'Mínimo para abrir: 10',
      'Paralelos sugeridos',
      'Demanda histórica',
    ]);
    expect(criterios[0].cumple).toBe(true);
    expect(criterios[1].cumple).toBe(true);
    expect(criterios[2].valor).toBe('62 ÷ cupo 35 → 2');
  });

  it('marca como no cumplido el nivel que no se oferta y el mínimo que no se alcanza', () => {
    const criterios = construirJustificacion(
      semilla({ nivel: 5, estudiantesEstimados: 8, demandaHistorica: null }),
      parametros,
      0,
    );
    expect(criterios[0].cumple).toBe(false);
    expect(criterios[1].cumple).toBe(false);
    expect(criterios[2].valor).toBe('no alcanza el mínimo');
    // sin período anterior no se muestra la demanda histórica
    expect(criterios.some((c) => c.etiqueta === 'Demanda histórica')).toBe(false);
  });

  it('indica cuando la materia está fuera de la malla vigente', () => {
    const criterios = construirJustificacion(semilla({ nivel: null }), parametros, 2);
    expect(criterios[0]).toEqual({
      etiqueta: 'Fuera de la malla vigente',
      valor: 'la carrera es responsable',
    });
  });
});

describe('SugerenciaService', () => {
  let servicio: SugerenciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SugerenciaService] });
    servicio = TestBed.inject(SugerenciaService);
  });

  it('sugiere solo las materias de niveles ofertados y deja fuera las compartidas', async () => {
    const sugerencia = await firstValueFrom(servicio.obtenerSugerencia(1));

    expect(sugerencia.estado).toBe('BORRADOR');
    expect(sugerencia.cursos.map((c) => c.curso.materia.codigo).sort()).toEqual([
      'ICO-101',
      'ICO-210',
      'ICO-305',
      'ICO-402',
    ]);

    const motivos = Object.fromEntries(sugerencia.excluidas.map((e) => [e.codigo, e.motivo]));
    expect(motivos).toEqual({ 'ICO-450': 'NIVEL_NO_OFERTADO', 'MAT-201': 'COMPARTIDA' });
    expect(sugerencia.excluidas.find((e) => e.codigo === 'MAT-201')?.carreraResponsable).toBe(
      'Ingeniería Industrial',
    );
  });

  it('calcula los paralelos de cada curso y deja en 0 el que no alcanza el mínimo', async () => {
    const sugerencia = await firstValueFrom(servicio.obtenerSugerencia(1));
    const porCodigo = Object.fromEntries(
      sugerencia.cursos.map((c) => [c.curso.materia.codigo, c.paralelosDecididos]),
    );
    // cupo 35, mínimo 10: 80→3, 62→2, 35→1, 7→0
    expect(porCodigo).toEqual({ 'ICO-101': 3, 'ICO-210': 2, 'ICO-305': 1, 'ICO-402': 0 });
    expect(sugerencia.cursos.every((c) => c.curso.origen === 'SUGERIDO')).toBe(true);
    expect(sugerencia.cursos.every((c) => c.curso.estado === 'SUGERIDO')).toBe(true);
  });

  it('aceptar un curso sin paralelos lo deja al menos con uno', async () => {
    const inicial = await firstValueFrom(servicio.obtenerSugerencia(1));
    const sinParalelos = inicial.cursos.find((c) => c.paralelosDecididos === 0)!;

    const despues = await firstValueFrom(servicio.aceptarCurso(1, sinParalelos.curso.id));
    const actualizado = despues.cursos.find((c) => c.curso.id === sinParalelos.curso.id)!;
    expect(actualizado.curso.estado).toBe('ACEPTADO');
    expect(actualizado.paralelosDecididos).toBe(1);
  });

  it('anular y reactivar cambian el estado del curso', async () => {
    const inicial = await firstValueFrom(servicio.obtenerSugerencia(1));
    const id = inicial.cursos[0].curso.id;

    let sugerencia = await firstValueFrom(servicio.anularCurso(1, id));
    expect(sugerencia.cursos.find((c) => c.curso.id === id)!.curso.estado).toBe('ANULADO');

    sugerencia = await firstValueFrom(servicio.reactivarCurso(1, id));
    expect(sugerencia.cursos.find((c) => c.curso.id === id)!.curso.estado).toBe('SUGERIDO');
  });

  it('cambiar el número de paralelos acepta el curso y rechaza valores inválidos', async () => {
    const inicial = await firstValueFrom(servicio.obtenerSugerencia(1));
    const id = inicial.cursos[0].curso.id;

    const sugerencia = await firstValueFrom(servicio.cambiarParalelos(1, id, 5));
    const curso = sugerencia.cursos.find((c) => c.curso.id === id)!;
    expect(curso.paralelosDecididos).toBe(5);
    expect(curso.curso.estado).toBe('ACEPTADO');
    // el número sugerido por las reglas se conserva como referencia
    expect(curso.curso.paralelosSugeridos).toBe(3);

    await expect(firstValueFrom(servicio.cambiarParalelos(1, id, 0))).rejects.toThrow(
      'entre 1 y 26',
    );
  });

  it('agrega un curso manual con su motivo y lo marca como MANUAL', async () => {
    const agregables = await firstValueFrom(servicio.materiasAgregables(1));
    expect(agregables.map((m) => m.codigo)).toEqual(['ICO-520', 'ICO-610']);

    const sugerencia = await firstValueFrom(
      servicio.agregarCursoManual(1, agregables[0].id, 2, 'Pedido de la coordinación'),
    );
    const manual = sugerencia.cursos.find((c) => c.curso.materia.codigo === 'ICO-520')!;
    expect(manual.curso.origen).toBe('MANUAL');
    expect(manual.curso.estado).toBe('ACEPTADO');
    expect(manual.paralelosDecididos).toBe(2);
    expect(manual.curso.motivoManual).toBe('Pedido de la coordinación');
    expect(manual.curso.justificacion[0]).toEqual({
      etiqueta: 'Agregado manualmente',
      valor: 'Pedido de la coordinación',
    });

    // ya no se puede volver a agregar la misma materia
    const restantes = await firstValueFrom(servicio.materiasAgregables(1));
    expect(restantes.map((m) => m.codigo)).toEqual(['ICO-610']);
  });

  it('exige el motivo al agregar un curso manual', async () => {
    const agregables = await firstValueFrom(servicio.materiasAgregables(1));
    await expect(
      firstValueFrom(servicio.agregarCursoManual(1, agregables[0].id, 1, '   ')),
    ).rejects.toThrow('motivo');
  });

  it('no permite cambios si la planificación ya no está en borrador (HU G2-06)', async () => {
    const sugerencia = await firstValueFrom(servicio.obtenerSugerencia(2));
    expect(sugerencia.estado).toBe('PENDIENTE');
    const id = sugerencia.cursos[0].curso.id;

    await expect(firstValueFrom(servicio.anularCurso(2, id))).rejects.toThrow('borrador');
    await expect(firstValueFrom(servicio.cambiarParalelos(2, id, 2))).rejects.toThrow('borrador');
    await expect(firstValueFrom(servicio.agregarCursoManual(2, 160, 1, 'x'))).rejects.toThrow(
      'borrador',
    );
  });

  it('distingue una planificación sin cursos de una que no existe', async () => {
    const vacia = await firstValueFrom(servicio.obtenerSugerencia(3));
    expect(vacia.cursos).toEqual([]);
    expect(vacia.excluidas).toEqual([]);

    await expect(firstValueFrom(servicio.obtenerSugerencia(99))).rejects.toThrow('no encontrada');
  });

  it('no deja que el consumidor modifique el estado interno del servicio', async () => {
    const sugerencia = await firstValueFrom(servicio.obtenerSugerencia(1));
    sugerencia.cursos[0].curso.estado = 'ANULADO';
    sugerencia.cursos[0].curso.justificacion.length = 0;
    sugerencia.parametros.cupoMaximo = 1;

    const otra = await firstValueFrom(servicio.obtenerSugerencia(1));
    expect(otra.cursos[0].curso.estado).toBe('SUGERIDO');
    expect(otra.cursos[0].curso.justificacion.length).toBeGreaterThan(0);
    expect(otra.parametros.cupoMaximo).toBe(35);
  });
});
