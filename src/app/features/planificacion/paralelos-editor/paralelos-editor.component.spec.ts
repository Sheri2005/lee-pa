import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { CursoPlanificado } from '../../../core/models/curso-planificado.model';
import { Paralelo } from '../../../core/models/paralelo.model';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { ParaleloService } from '../../../core/services/paralelo.service';
import { ParalelosEditorComponent } from './paralelos-editor.component';

describe('ParalelosEditorComponent', () => {
  const listarPorCurso = vi.fn();
  const agregar = vi.fn();
  const actualizar = vi.fn();
  const eliminar = vi.fn();
  const abrir = vi.fn();

  const RECURSOS = [
    { id: 1, nombre: 'Proyector' },
    { id: 2, nombre: 'Computadores' },
  ];

  const MATERIA = { id: 145, codigo: 'ICO-305', nombre: 'Programación Orientada a Objetos' };

  function curso(extra: Partial<CursoPlanificado> = {}): CursoPlanificado {
    return {
      id: 11,
      planificacionId: 1,
      materia: MATERIA,
      mallaMateriaId: 90,
      nivel: 3,
      origen: 'SUGERIDO',
      esCompartida: false,
      estado: 'ACEPTADO',
      justificacion: [{ etiqueta: 'Nivel 3 ofertado', cumple: true }],
      horasSemanales: 6,
      estudiantesEstimados: 62,
      demandaHistorica: 55,
      paralelosSugeridos: 2,
      cupoMaximo: 35,
      ...extra,
    };
  }

  function paralelo(id: number, codigo: string, extra: Partial<Paralelo> = {}): Paralelo {
    return {
      id,
      cursoPlanificadoId: 11,
      codigo,
      cupo: 35,
      horasSemanales: 6,
      tipoEspacioRequerido: 'LABORATORIO',
      materia: MATERIA,
      docente: null,
      estadoDocente: 'SIN_ASIGNAR',
      recursos: [],
      ...extra,
    };
  }

  beforeEach(() => {
    for (const espia of [listarPorCurso, agregar, actualizar, eliminar, abrir]) espia.mockReset();
    abrir.mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ParaleloService,
          useValue: {
            listarPorCurso,
            agregar,
            actualizar,
            eliminar,
            recursosDisponibles: () => RECURSOS,
          },
        },
        { provide: ConfirmacionService, useValue: { abrir } },
      ],
    });
  });

  async function crear(datosCurso = curso(), editable = true) {
    const fixture = TestBed.createComponent(ParalelosEditorComponent);
    fixture.componentRef.setInput('cursoPlanificado', datosCurso);
    fixture.componentRef.setInput('editable', editable);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const texto = (host: HTMLElement) => host.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  it('muestra carga mientras espera los paralelos del curso', async () => {
    listarPorCurso.mockReturnValue(new Subject<Paralelo[]>());
    const fixture = await crear();
    expect(texto(fixture.nativeElement)).toContain('Cargando paralelos');
    expect(listarPorCurso).toHaveBeenCalledWith(11);
  });

  it('lista una tarjeta por paralelo con el cupo total ofertado', async () => {
    listarPorCurso.mockReturnValue(
      of([paralelo(1, 'A'), paralelo(2, 'B', { cupo: 30, recursos: RECURSOS })]),
    );
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelectorAll('app-tarjeta-paralelo')).toHaveLength(2);
    expect(texto(host)).toContain('2 paralelo(s) · 65 cupos en total');
    expect(texto(host)).toContain('6 h/sem según la malla');
    expect(texto(host)).toContain('Proyector, Computadores');
  });

  it('avisa cuántos cupos faltan para los estudiantes estimados', async () => {
    listarPorCurso.mockReturnValue(of([paralelo(1, 'A')]));
    const fixture = await crear();
    // 62 estimados - 35 de cupo = 27 faltantes, y las reglas sugerían 2 paralelos
    expect(texto(fixture.nativeElement)).toContain('Faltan 27 cupos');
    expect(texto(fixture.nativeElement)).toContain('Las reglas sugirieron 2');
  });

  it('agrega un paralelo y avisa al padre con la lista nueva', async () => {
    const lista = [paralelo(1, 'A')];
    listarPorCurso.mockReturnValue(of(lista));
    const nueva = [...lista, paralelo(2, 'B')];
    agregar.mockReturnValue(of(nueva));

    const fixture = await crear();
    const emitidos: Paralelo[][] = [];
    fixture.componentInstance.paralelosChange.subscribe((v) => emitidos.push(v));

    listarPorCurso.mockReturnValue(of(nueva));
    const boton = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLElement).textContent?.includes('Agregar paralelo'),
    ) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(agregar).toHaveBeenCalledWith(expect.objectContaining({ id: 11 }));
    expect(emitidos).toHaveLength(1);
    expect(emitidos[0]).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('app-tarjeta-paralelo')).toHaveLength(2);
  });

  it('rechaza un cupo fuera de rango sin llamar al servicio', async () => {
    listarPorCurso.mockReturnValue(of([paralelo(1, 'A')]));
    const fixture = await crear();

    const input = fixture.nativeElement.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;
    input.value = '0';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(actualizar).not.toHaveBeenCalled();
    expect(texto(fixture.nativeElement)).toContain('debe ser un número entre 1 y 500');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('guarda el cupo nuevo y el tipo de espacio elegido', async () => {
    listarPorCurso.mockReturnValue(of([paralelo(1, 'A')]));
    actualizar.mockReturnValue(of([paralelo(1, 'A', { cupo: 40 })]));
    const fixture = await crear();

    const input = fixture.nativeElement.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;
    input.value = '40';
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(actualizar).toHaveBeenCalledWith(1, { cupo: 40 });

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'AUDITORIO';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(actualizar).toHaveBeenCalledWith(1, { tipoEspacioRequerido: 'AUDITORIO' });
  });

  it('marca un recurso requerido y lo envía completo', async () => {
    listarPorCurso.mockReturnValue(of([paralelo(1, 'A')]));
    actualizar.mockReturnValue(of([paralelo(1, 'A', { recursos: [RECURSOS[0]] })]));
    const fixture = await crear();

    const casilla = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    casilla.checked = true;
    casilla.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(actualizar).toHaveBeenCalledWith(1, { recursos: [RECURSOS[0]] });
  });

  it('solo elimina el paralelo si se confirma el diálogo', async () => {
    listarPorCurso.mockReturnValue(of([paralelo(1, 'A'), paralelo(2, 'B')]));
    eliminar.mockReturnValue(of([paralelo(1, 'A')]));
    abrir.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const fixture = await crear();

    const botonEliminar = () =>
      [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
        (b as HTMLElement).textContent?.includes('Eliminar paralelo B'),
      ) as HTMLButtonElement;

    botonEliminar().click();
    await fixture.whenStable();
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(eliminar).not.toHaveBeenCalled();

    botonEliminar().click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(eliminar).toHaveBeenCalledWith(2);
  });

  it('no permite aperturar paralelos de una materia compartida', async () => {
    listarPorCurso.mockReturnValue(of([]));
    const fixture = await crear(curso({ esCompartida: true }));
    const host: HTMLElement = fixture.nativeElement;

    expect(texto(host)).toContain('Materia compartida');
    expect(texto(host)).toContain('los apertura la carrera responsable');
    expect(
      [...host.querySelectorAll('button')].some((b) =>
        (b as HTMLElement).textContent?.includes('Agregar paralelo'),
      ),
    ).toBe(false);
    expect(texto(host)).toContain('todavía no abrió paralelos');
  });

  it('queda en solo lectura cuando editable es false', async () => {
    listarPorCurso.mockReturnValue(of([paralelo(1, 'A')]));
    const fixture = await crear(curso(), false);
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('input')).toBeNull();
    expect(host.querySelector('select')).toBeNull();
    expect(texto(host)).toContain('ya no está en borrador');
    expect(host.querySelectorAll('app-tarjeta-paralelo')).toHaveLength(1);
  });

  it('permite reintentar cuando la carga falla', async () => {
    listarPorCurso
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValueOnce(of([paralelo(1, 'A')]));
    const fixture = await crear();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    const boton = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLElement).textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-tarjeta-paralelo')).toHaveLength(1);
    expect(listarPorCurso).toHaveBeenCalledTimes(2);
  });

  it('descarta la respuesta del curso anterior cuando cambia la entrada', async () => {
    const anterior = new Subject<Paralelo[]>();
    const actual = new Subject<Paralelo[]>();
    listarPorCurso.mockReturnValueOnce(anterior).mockReturnValueOnce(actual);
    const fixture = await crear();

    fixture.componentRef.setInput('cursoPlanificado', curso({ id: 12 }));
    fixture.detectChanges();
    await fixture.whenStable();

    anterior.next([paralelo(1, 'A')]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-tarjeta-paralelo')).toBeNull();

    actual.next([]);
    fixture.detectChanges();
    expect(texto(fixture.nativeElement)).toContain('no tiene paralelos');
    expect(listarPorCurso).toHaveBeenLastCalledWith(12);
  });
});
