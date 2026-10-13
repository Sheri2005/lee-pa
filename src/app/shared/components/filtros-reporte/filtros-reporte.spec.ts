import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  FiltrosReporte,
  FiltrosReporteComponent,
  OpcionCarreraReporte,
  OpcionFiltroReporte,
} from './filtros-reporte';

describe('FiltrosReporteComponent', () => {
  let fixture: ComponentFixture<FiltrosReporteComponent>;
  let component: FiltrosReporteComponent;
  let emittedFilters: FiltrosReporte[];

  const facultades: OpcionFiltroReporte[] = [
    { id: 'fac-ingenieria', nombre: 'Ingeniería' },
    { id: 'fac-salud', nombre: 'Ciencias de la Salud' },
    { id: 'fac-sin-carreras', nombre: 'Facultad sin carreras' },
  ];

  const carreras: OpcionCarreraReporte[] = [
    {
      id: 'car-sistemas',
      nombre: 'Ingeniería en Sistemas',
      facultadId: 'fac-ingenieria',
    },
    {
      id: 'car-industrial',
      nombre: 'Ingeniería Industrial',
      facultadId: 'fac-ingenieria',
    },
    {
      id: 'car-enfermeria',
      nombre: 'Enfermería',
      facultadId: 'fac-salud',
    },
  ];

  const periodos: OpcionFiltroReporte[] = [
    { id: 'per-2026-1', nombre: '2026 - Ciclo 1' },
    { id: 'per-2026-2', nombre: '2026 - Ciclo 2' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltrosReporteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FiltrosReporteComponent);
    component = fixture.componentInstance;
    emittedFilters = [];

    fixture.componentRef.setInput('facultades', facultades);
    fixture.componentRef.setInput('carreras', carreras);
    fixture.componentRef.setInput('periodos', periodos);
    component.filtrosAplicados.subscribe((filters) =>
      emittedFilters.push(filters),
    );

    fixture.detectChanges();
  });

  function seleccionar(id: string, value: string): void {
    const select = fixture.nativeElement.querySelector(
      `#${id}`,
    ) as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  function ingresarFecha(id: string, value: string): void {
    const input = fixture.nativeElement.querySelector(
      `#${id}`,
    ) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function aplicar(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
  }

  it('emite los criterios seleccionados al aplicar los filtros', () => {
    seleccionar('facultadId', 'fac-ingenieria');
    seleccionar('carreraId', 'car-sistemas');
    seleccionar('periodoId', 'per-2026-1');
    ingresarFecha('fechaInicio', '2026-09-01');
    ingresarFecha('fechaFin', '2026-12-15');

    aplicar();

    expect(emittedFilters).toEqual([
      {
        facultadId: 'fac-ingenieria',
        carreraId: 'car-sistemas',
        periodoId: 'per-2026-1',
        fechaInicio: '2026-09-01',
        fechaFin: '2026-12-15',
      },
    ]);
  });

  it('muestra solamente las carreras pertenecientes a la facultad elegida', () => {
    seleccionar('facultadId', 'fac-ingenieria');

    const options = Array.from(
      (fixture.nativeElement.querySelector('#carreraId') as HTMLSelectElement)
        .options,
    ).map((option) => option.value);

    expect(options).toEqual(['', 'car-sistemas', 'car-industrial']);
  });

  it('borra la carrera seleccionada al cambiar de facultad', () => {
    seleccionar('facultadId', 'fac-ingenieria');
    seleccionar('carreraId', 'car-sistemas');
    seleccionar('facultadId', 'fac-salud');

    expect(
      (fixture.nativeElement.querySelector('#carreraId') as HTMLSelectElement)
        .value,
    ).toBe('');

    aplicar();

    expect(emittedFilters[0].carreraId).toBeNull();
    expect(
      Array.from(
        (fixture.nativeElement.querySelector('#carreraId') as HTMLSelectElement)
          .options,
      ).map((option) => option.value),
    ).toEqual(['', 'car-enfermeria']);
  });

  it('borra facultad y carrera si el catálogo deja de incluir la facultad elegida', () => {
    seleccionar('facultadId', 'fac-ingenieria');
    seleccionar('carreraId', 'car-sistemas');

    fixture.componentRef.setInput('facultades', [facultades[1]]);
    fixture.detectChanges();
    aplicar();

    expect(emittedFilters).toEqual([
      {
        facultadId: null,
        carreraId: null,
        periodoId: null,
        fechaInicio: null,
        fechaFin: null,
      },
    ]);
  });

  it('deshabilita la carrera si no hay facultad o no hay carreras disponibles', () => {
    const careerSelect = fixture.nativeElement.querySelector(
      '#carreraId',
    ) as HTMLSelectElement;
    expect(careerSelect.disabled).toBe(true);

    seleccionar('facultadId', 'fac-sin-carreras');

    expect(careerSelect.disabled).toBe(true);
  });

  it('no emite y muestra un error accesible si la fecha inicial supera la final', () => {
    ingresarFecha('fechaInicio', '2026-12-15');
    ingresarFecha('fechaFin', '2026-09-01');

    aplicar();

    expect(emittedFilters).toHaveLength(0);
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
    ).toContain('La fecha inicial no puede ser posterior a la fecha final.');
  });

  it.each([
    ['fechaInicio', '2026-09-01', 'fechaInicio'],
    ['fechaFin', '2026-12-15', 'fechaFin'],
  ])('permite aplicar un rango con solo %s definido', (inputId, value, field) => {
    ingresarFecha(inputId, value);

    aplicar();

    expect(emittedFilters).toEqual([
      {
        facultadId: null,
        carreraId: null,
        periodoId: null,
        fechaInicio: field === 'fechaInicio' ? value : null,
        fechaFin: field === 'fechaFin' ? value : null,
      },
    ]);
  });

  it('limpia el formulario y emite todos los filtros como null', () => {
    seleccionar('facultadId', 'fac-ingenieria');
    seleccionar('carreraId', 'car-sistemas');
    seleccionar('periodoId', 'per-2026-1');
    ingresarFecha('fechaInicio', '2026-09-01');
    ingresarFecha('fechaFin', '2026-12-15');

    (fixture.nativeElement.querySelector('#limpiar-filtros') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(emittedFilters).toEqual([
      {
        facultadId: null,
        carreraId: null,
        periodoId: null,
        fechaInicio: null,
        fechaFin: null,
      },
    ]);
    expect(
      (fixture.nativeElement.querySelector('#facultadId') as HTMLSelectElement)
        .value,
    ).toBe('');
  });
});
