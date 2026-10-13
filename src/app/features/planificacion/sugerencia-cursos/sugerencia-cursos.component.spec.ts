import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { CursoPlanificado } from '../../../core/models/curso-planificado.model';
import { CursoSugerido, SugerenciaCursos } from '../../../core/models/sugerencia.model';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { SugerenciaService } from '../../../core/services/sugerencia.service';
import { SugerenciaCursosComponent } from './sugerencia-cursos.component';

describe('SugerenciaCursosComponent', () => {
  const obtenerSugerencia = vi.fn();
  const materiasAgregables = vi.fn();
  const aceptarCurso = vi.fn();
  const anularCurso = vi.fn();
  const reactivarCurso = vi.fn();
  const cambiarParalelos = vi.fn();
  const agregarCursoManual = vi.fn();
  const abrir = vi.fn();
  const obtenerMateriasAPlanificar = vi.fn();

  function curso(
    id: number,
    codigo: string,
    nombre: string,
    extra: Partial<CursoPlanificado> = {},
  ): CursoPlanificado {
    return {
      id,
      planificacionId: 1,
      materia: { id: id * 10, codigo, nombre },
      mallaMateriaId: 20,
      nivel: 2,
      origen: 'SUGERIDO',
      esCompartida: false,
      estado: 'SUGERIDO',
      justificacion: [{ etiqueta: 'Nivel 2 de la malla vigente', cumple: true }],
      horasSemanales: 6,
      estudiantesEstimados: 62,
      demandaHistorica: 58,
      paralelosSugeridos: 2,
      cupoMaximo: 35,
      ...extra,
    };
  }

  function sugerido(c: CursoPlanificado, paralelosDecididos = c.paralelosSugeridos): CursoSugerido {
    return { curso: c, paralelosDecididos };
  }

  /** Desordenado a propósito: el componente debe ordenar por nivel y código. */
  function datos(extra: Partial<SugerenciaCursos> = {}): SugerenciaCursos {
    return {
      planificacionId: 1,
      estado: 'BORRADOR',
      parametros: { cupoMaximo: 35, minimoApertura: 10, nivelesOfertados: [1, 2, 3] },
      cursos: [
        sugerido(curso(2, 'ICO-210', 'Estructuras de Datos')),
        sugerido(
          curso(1, 'ICO-101', 'Introducción a la Computación', {
            nivel: 1,
            estudiantesEstimados: 80,
            paralelosSugeridos: 3,
          }),
          3,
        ),
      ],
      excluidas: [
        { codigo: 'ICO-450', nombre: 'Redes', nivel: 5, motivo: 'NIVEL_NO_OFERTADO' },
        {
          codigo: 'MAT-201',
          nombre: 'Cálculo Diferencial',
          nivel: 2,
          motivo: 'COMPARTIDA',
          carreraResponsable: 'Ingeniería Industrial',
        },
      ],
      ...extra,
    };
  }

  beforeEach(() => {
    for (const espia of [
      obtenerSugerencia,
      materiasAgregables,
      aceptarCurso,
      anularCurso,
      reactivarCurso,
      cambiarParalelos,
      agregarCursoManual,
      abrir,
      obtenerMateriasAPlanificar,
    ]) {
      espia.mockReset();
    }
    abrir.mockResolvedValue(true);
    materiasAgregables.mockReturnValue(of([]));
    obtenerMateriasAPlanificar.mockReturnValue(of({ carreraId: 5, materias: [] }));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SugerenciaService,
          useValue: {
            obtenerSugerencia,
            materiasAgregables,
            aceptarCurso,
            anularCurso,
            reactivarCurso,
            cambiarParalelos,
            agregarCursoManual,
          },
        },
        { provide: ConfirmacionService, useValue: { abrir } },
        { provide: PlanificacionService, useValue: { obtenerMateriasAPlanificar } },
      ],
    });
  });

  async function crear(planificacionId = 1) {
    const fixture = TestBed.createComponent(SugerenciaCursosComponent);
    fixture.componentRef.setInput('planificacionId', planificacionId);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const texto = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  const boton = (fixture: { nativeElement: HTMLElement }, exacto: string) =>
    [...fixture.nativeElement.querySelectorAll('button')].find(
      (b) => texto(b) === exacto,
    ) as HTMLButtonElement;

  it('muestra carga mientras corren las reglas', async () => {
    obtenerSugerencia.mockReturnValue(new Subject<SugerenciaCursos>());
    const fixture = await crear();
    expect(texto(fixture.nativeElement)).toContain('Corriendo las reglas de sugerencia');
    expect(obtenerSugerencia).toHaveBeenCalledWith(1);
  });

  it('ordena por nivel y muestra parámetros, totales y justificación', async () => {
    obtenerSugerencia.mockReturnValue(of(datos()));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;

    const codigos = [...host.querySelectorAll('tbody tr td:first-child')].map(texto);
    expect(codigos).toEqual(['ICO-101', 'ICO-210']);
    expect(texto(host)).toContain('Cupo máximo 35 · mínimo para abrir 10 · niveles ofertados 1, 2, 3');
    // ninguno aceptado todavía, así que no hay paralelos a aperturar
    expect(texto(host)).toContain('0 de 2 cursos aceptados · 0 paralelos a aperturar');
    expect(host.querySelectorAll('app-justificacion-regla')).toHaveLength(2);
    expect(host.querySelectorAll('tbody input[type="number"]')).toHaveLength(2);
  });

  it('acepta un curso y avisa al padre con los cursos actualizados', async () => {
    obtenerSugerencia.mockReturnValue(of(datos()));
    const aceptados = datos({
      cursos: [sugerido(curso(1, 'ICO-101', 'Intro', { nivel: 1, estado: 'ACEPTADO' }), 3)],
    });
    aceptarCurso.mockReturnValue(of(aceptados));

    const fixture = await crear();
    const emitidos: CursoSugerido[][] = [];
    fixture.componentInstance.cursosChange.subscribe((v) => emitidos.push(v));

    obtenerSugerencia.mockReturnValue(of(aceptados));
    boton(fixture, 'Aceptar').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // la tabla está ordenada por nivel, así que el primer "Aceptar" es el de ICO-101 (id 1)
    expect(aceptarCurso).toHaveBeenCalledWith(1, 1);
    expect(emitidos).toHaveLength(1);
    expect(texto(fixture.nativeElement)).toContain('1 de 1 cursos aceptados · 3 paralelos');
  });

  it('pide confirmación antes de anular y respeta la cancelación', async () => {
    obtenerSugerencia.mockReturnValue(of(datos()));
    anularCurso.mockReturnValue(of(datos()));
    abrir.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const fixture = await crear();

    boton(fixture, 'Anular').click();
    await fixture.whenStable();
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(anularCurso).not.toHaveBeenCalled();

    boton(fixture, 'Anular').click();
    await fixture.whenStable();
    expect(anularCurso).toHaveBeenCalled();
  });

  it('ofrece reactivar un curso anulado en vez de aceptarlo', async () => {
    obtenerSugerencia.mockReturnValue(
      of(datos({ cursos: [sugerido(curso(1, 'ICO-101', 'Intro', { estado: 'ANULADO' }))] })),
    );
    reactivarCurso.mockReturnValue(of(datos()));
    const fixture = await crear();

    expect(boton(fixture, 'Aceptar')).toBeUndefined();
    expect(texto(fixture.nativeElement)).toContain('Anulado');
    // un curso anulado no deja editar sus paralelos
    expect(fixture.nativeElement.querySelector('tbody input[type="number"]')).toBeNull();

    boton(fixture, 'Reactivar').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(reactivarCurso).toHaveBeenCalledWith(1, 1);
  });

  it('guarda un número de paralelos válido y rechaza el inválido', async () => {
    obtenerSugerencia.mockReturnValue(of(datos()));
    cambiarParalelos.mockReturnValue(of(datos()));
    const fixture = await crear();

    const entradas = [
      ...fixture.nativeElement.querySelectorAll('tbody input[type="number"]'),
    ] as HTMLInputElement[];
    entradas[0].value = '4';
    entradas[0].dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(cambiarParalelos).toHaveBeenCalledWith(1, 1, 4);

    cambiarParalelos.mockClear();
    const otra = fixture.nativeElement.querySelector(
      'tbody input[type="number"]',
    ) as HTMLInputElement;
    otra.value = '99';
    otra.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(cambiarParalelos).not.toHaveBeenCalled();
    expect(texto(fixture.nativeElement.querySelector('[role="alert"]'))).toContain(
      'debe estar entre 1 y 26',
    );
  });

  it('agrega un curso manual con materia, paralelos y motivo', async () => {
    obtenerSugerencia.mockReturnValue(of(datos()));
    materiasAgregables.mockReturnValue(
      of([
        {
          id: 160,
          codigo: 'ICO-520',
          nombre: 'Infraestructura',
          carreraResponsableId: 5,
          carreraResponsable: 'Computación',
        },
      ]),
    );
    agregarCursoManual.mockReturnValue(of(datos()));
    const fixture = await crear();

    boton(fixture, '+ Agregar curso manual').click();
    fixture.detectChanges();

    const motivo = fixture.nativeElement.querySelector('#motivo-manual') as HTMLInputElement;
    motivo.value = 'Pedido de la coordinación';
    boton(fixture, 'Agregar curso').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(agregarCursoManual).toHaveBeenCalledWith(1, 160, 1, 'Pedido de la coordinación');
    expect(texto(fixture.nativeElement)).toContain('origen MANUAL');
    expect(fixture.nativeElement.querySelector('#motivo-manual')).toBeNull();
  });

  it('explica por qué quedaron materias fuera de la sugerencia', async () => {
    obtenerSugerencia.mockReturnValue(of(datos()));
    const fixture = await crear();
    const detalle = fixture.nativeElement.querySelector('details');

    expect(texto(detalle)).toContain('2 materia(s) quedaron fuera');
    expect(texto(detalle)).toContain('el nivel 5 no se oferta en este período');
    expect(texto(detalle)).toContain('la apertura Ingeniería Industrial');
  });

  it('queda en solo lectura si la planificación no está en borrador (HU G2-06)', async () => {
    obtenerSugerencia.mockReturnValue(of(datos({ estado: 'PENDIENTE' })));
    materiasAgregables.mockReturnValue(of([{ id: 160, codigo: 'ICO-520', nombre: 'X' }]));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;

    expect(texto(host)).toContain('ya no está en borrador');
    expect(host.querySelector('tbody input[type="number"]')).toBeNull();
    expect(boton(fixture, 'Aceptar')).toBeUndefined();
    expect(boton(fixture, 'Anular')).toBeUndefined();
    expect(boton(fixture, '+ Agregar curso manual')).toBeUndefined();
    expect(texto(host)).toContain('Sin acciones');
  });

  it('muestra las materias a planificar (C2-07) solo cuando se piden', async () => {
    obtenerSugerencia.mockReturnValue(of(datos()));
    const fixture = await crear();

    expect(fixture.nativeElement.querySelector('app-materias-a-planificar')).toBeNull();
    boton(fixture, 'Ver las materias a planificar').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-materias-a-planificar')).not.toBeNull();
    expect(obtenerMateriasAPlanificar).toHaveBeenCalledWith(1);
  });

  it('muestra el estado vacío cuando las reglas no sugieren cursos', async () => {
    obtenerSugerencia.mockReturnValue(of(datos({ cursos: [], excluidas: [] })));
    const fixture = await crear(3);
    expect(fixture.nativeElement.querySelector('app-estado-vacio')).not.toBeNull();
    expect(texto(fixture.nativeElement)).toContain('no sugirieron ningún curso');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('permite reintentar cuando la carga falla', async () => {
    obtenerSugerencia
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValueOnce(of(datos()));
    const fixture = await crear();
    expect(texto(fixture.nativeElement.querySelector('[role="alert"]'))).toContain(
      'No se pudo cargar la sugerencia',
    );

    boton(fixture, 'Reintentar').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(texto(fixture.nativeElement)).toContain('ICO-101');
    expect(obtenerSugerencia).toHaveBeenCalledTimes(2);
  });

  it('descarta la respuesta de la planificación anterior cuando cambia la entrada', async () => {
    const anterior = new Subject<SugerenciaCursos>();
    const actual = new Subject<SugerenciaCursos>();
    obtenerSugerencia.mockReturnValueOnce(anterior).mockReturnValueOnce(actual);
    const fixture = await crear();

    fixture.componentRef.setInput('planificacionId', 2);
    fixture.detectChanges();
    await fixture.whenStable();

    anterior.next(datos());
    fixture.detectChanges();
    expect(texto(fixture.nativeElement)).not.toContain('ICO-101');

    actual.next(datos({ cursos: [], excluidas: [] }));
    fixture.detectChanges();
    expect(texto(fixture.nativeElement)).toContain('no sugirieron ningún curso');
    expect(obtenerSugerencia).toHaveBeenLastCalledWith(2);
  });
});
