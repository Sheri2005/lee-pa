import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { routes } from '../../../app.routes';
import { PERIODOS_MOCK } from '../../../shared/mocks/periodos.mock';
import { Periodo, PeriodoDatos } from '../../../shared/models/periodo.model';
import { PeriodoService } from '../../../shared/services/periodo.service';
import { PeriodosListaComponent } from './periodos-lista';

describe('PeriodosListaComponent', () => {
  /** Servicio falso con estado: lo que se crea o edita aparece en el siguiente `listar`. */
  function servicioFalso(inicial: Periodo[] = PERIODOS_MOCK) {
    let datos = [...inicial];
    return {
      listar: vi.fn(() => of([...datos])),
      crear: vi.fn((d: PeriodoDatos) => {
        const nuevo = { ...d, id: 99 };
        datos = [...datos, nuevo];
        return of(nuevo);
      }),
      actualizar: vi.fn((id: number, d: PeriodoDatos) => {
        const editado = { ...d, id };
        datos = datos.map((p) => (p.id === id ? editado : p));
        return of(editado);
      }),
    };
  }

  async function crear(servicio: unknown = servicioFalso()) {
    await TestBed.configureTestingModule({
      imports: [PeriodosListaComponent],
      providers: [{ provide: PeriodoService, useValue: servicio }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PeriodosListaComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const filas = () =>
      Array.from(el.querySelectorAll('tbody tr')).map((tr) =>
        Array.from(tr.querySelectorAll('td'))
          .slice(0, 6)
          .map((td) => td.textContent?.replace(/\s+/g, ' ').trim()),
      );
    const boton = (texto: string) =>
      Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as
        HTMLButtonElement | undefined;
    const pulsar = async (b: HTMLButtonElement | undefined) => {
      b!.click();
      await fixture.whenStable();
    };
    const escribir = async (nombre: string, valor: string) => {
      const c = el.querySelector(`[formControlName="${nombre}"]`) as HTMLInputElement;
      c.value = valor;
      c.dispatchEvent(new Event(c.tagName === 'SELECT' ? 'change' : 'input'));
      await fixture.whenStable();
    };
    const enviar = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { fixture, el, filas, boton, pulsar, escribir, enviar };
  }

  it('muestra el título y una fila por período', async () => {
    const { el, filas } = await crear();
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Períodos académicos');
    expect(filas()).toHaveLength(PERIODOS_MOCK.length);
  });

  it('muestra tipo, fechas y estado de cada período', async () => {
    const { filas } = await crear();
    const activo = filas().find((f) => f[0] === '2026-2')!;
    expect(activo).toEqual([
      '2026-2',
      'Segundo período ordinario 2026',
      'Ordinario',
      '07/09/2026',
      '15/01/2027',
      'Activo',
    ]);
    expect(filas().find((f) => f[0] === '2027-1')![5]).toBe('En planificación');
    expect(filas().find((f) => f[0] === '2026-1')![5]).toBe('Cerrado');
  });

  it('ordena los más recientes primero', async () => {
    const { filas } = await crear();
    expect(filas().map((f) => f[0])).toEqual(['2027-1', '2026-E', '2026-2', '2026-1']);
  });

  it('avisa cuando no hay períodos', async () => {
    const { el } = await crear(servicioFalso([]));
    expect(el.textContent).toContain('Todavía no hay períodos registrados');
    expect(el.querySelector('table')).toBeNull();
  });

  it('avisa si no se pudieron cargar', async () => {
    const { el } = await crear({ listar: () => throwError(() => new Error('falla')) });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
  });

  describe('crear y editar', () => {
    it('el formulario está cerrado al entrar y "Nuevo período" lo abre vacío', async () => {
      const { el, boton, pulsar } = await crear();
      expect(el.querySelector('app-periodo-form')).toBeNull();
      await pulsar(boton('Nuevo período'));
      expect(el.querySelector('app-periodo-form h2')?.textContent?.trim()).toBe('Nuevo período');
    });

    it('"Editar" abre el formulario con los datos del período', async () => {
      const { el, pulsar } = await crear();
      const editar = el.querySelector('[aria-label="Editar período 2026-2"]') as HTMLButtonElement;
      await pulsar(editar);
      expect(el.querySelector('app-periodo-form h2')?.textContent?.trim()).toBe(
        'Editar período 2026-2',
      );
      expect((el.querySelector('[formControlName="nombre"]') as HTMLInputElement).value).toBe(
        'Segundo período ordinario 2026',
      );
    });

    it('"Cancelar" cierra el formulario sin guardar', async () => {
      const servicio = servicioFalso();
      const { el, boton, pulsar } = await crear(servicio);
      await pulsar(boton('Nuevo período'));
      await pulsar(boton('Cancelar'));
      expect(el.querySelector('app-periodo-form')).toBeNull();
      expect(servicio.crear).not.toHaveBeenCalled();
    });

    it('al guardar un período nuevo lo crea, cierra el formulario y lo muestra en la tabla', async () => {
      const servicio = servicioFalso();
      const { el, filas, boton, pulsar, escribir, enviar } = await crear(servicio);
      await pulsar(boton('Nuevo período'));
      await escribir('codigo', '2027-2');
      await escribir('nombre', 'Segundo período ordinario 2027');
      await escribir('fechaInicio', '2027-09-06');
      await escribir('fechaFin', '2028-01-14');
      await enviar();

      expect(servicio.crear).toHaveBeenCalledOnce();
      expect(el.querySelector('app-periodo-form')).toBeNull();
      expect(el.querySelector('[role="status"]')?.textContent).toContain('Período guardado');
      expect(filas().map((f) => f[0])).toContain('2027-2');
    });

    it('al guardar una edición actualiza ese período por su id', async () => {
      const servicio = servicioFalso();
      const { el, filas, pulsar, escribir, enviar } = await crear(servicio);
      await pulsar(el.querySelector('[aria-label="Editar período 2027-1"]') as HTMLButtonElement);
      await escribir('estado', 'ACTIVO');
      await enviar();

      expect(servicio.actualizar).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ estado: 'ACTIVO' }),
      );
      expect(servicio.crear).not.toHaveBeenCalled();
      expect(filas().find((f) => f[0] === '2027-1')![5]).toBe('Activo');
    });

    it('si falla el guardado avisa y deja el formulario abierto', async () => {
      const servicio = {
        ...servicioFalso(),
        crear: vi.fn(() => throwError(() => new Error('falla'))),
      };
      const { el, boton, pulsar, escribir, enviar } = await crear(servicio);
      await pulsar(boton('Nuevo período'));
      await escribir('codigo', '2027-2');
      await escribir('nombre', 'Otro');
      await escribir('fechaInicio', '2027-09-06');
      await escribir('fechaFin', '2028-01-14');
      await enviar();

      expect(el.textContent).toContain('No se pudo guardar el período');
      expect(el.querySelector('app-periodo-form')).not.toBeNull();
    });
  });

  it('la ruta /gestion/periodos muestra la página', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: PeriodoService, useValue: servicioFalso() }],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/gestion/periodos');
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent?.trim()).toBe(
      'Períodos académicos',
    );
  });
});
