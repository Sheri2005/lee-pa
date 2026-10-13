import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { DisponibilidadCargada } from '../../../core/models/disponibilidad.model';
import { FranjaHoraria } from '../../../core/models/franja.model';
import { DisponibilidadService } from '../../../core/services/disponibilidad.service';
import { DisponibilidadDocenteComponent } from './disponibilidad-docente.component';

describe('DisponibilidadDocenteComponent', () => {
  const listarPeriodos = vi.fn();
  const listarDocentes = vi.fn();
  const obtenerDisponibilidad = vi.fn();
  const guardar = vi.fn();
  const copiarDelPeriodoAnterior = vi.fn();
  const periodoAnteriorConDatos = vi.fn();

  const ORDINARIO = { id: 1, codigo: '2026-1', nombre: 'Semestre 2026-1', tipo: 'ORDINARIO' as const };
  const ANTERIOR = { id: 3, codigo: '2025-2', nombre: 'Semestre 2025-2', tipo: 'ORDINARIO' as const };
  const TORRES = { id: 7, nombres: 'María Fernanda Torres', cargaMaximaHoras: 20 };
  const ANDRADE = { id: 12, nombres: 'Jorge Andrade', cargaMaximaHoras: 16 };

  /** 2 bloques × 2 días = 4 franjas de 2 horas cada una. */
  const FRANJAS: FranjaHoraria[] = [
    { id: 1, tipoPeriodo: 'ORDINARIO', diaSemana: 'LUNES', horaInicio: '07:00', horaFin: '09:00' },
    { id: 2, tipoPeriodo: 'ORDINARIO', diaSemana: 'MARTES', horaInicio: '07:00', horaFin: '09:00' },
    { id: 3, tipoPeriodo: 'ORDINARIO', diaSemana: 'LUNES', horaInicio: '09:00', horaFin: '11:00' },
    { id: 4, tipoPeriodo: 'ORDINARIO', diaSemana: 'MARTES', horaInicio: '09:00', horaFin: '11:00' },
  ];

  function cargada(franjasDisponibles: number[] = [1], extra: Partial<DisponibilidadCargada> = {}) {
    return {
      periodo: ORDINARIO,
      docente: TORRES,
      franjas: FRANJAS.map((f) => ({ ...f })),
      franjasDisponibles,
      ...extra,
    } satisfies DisponibilidadCargada;
  }

  beforeEach(() => {
    for (const espia of [
      listarPeriodos,
      listarDocentes,
      obtenerDisponibilidad,
      guardar,
      copiarDelPeriodoAnterior,
      periodoAnteriorConDatos,
    ]) {
      espia.mockReset();
    }
    listarPeriodos.mockReturnValue(of([ORDINARIO, ANTERIOR]));
    listarDocentes.mockReturnValue(of([TORRES, ANDRADE]));
    periodoAnteriorConDatos.mockReturnValue(null);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DisponibilidadService,
          useValue: {
            listarPeriodos,
            listarDocentes,
            obtenerDisponibilidad,
            guardar,
            copiarDelPeriodoAnterior,
            periodoAnteriorConDatos,
          },
        },
      ],
    });
  });

  async function crear() {
    const fixture = TestBed.createComponent(DisponibilidadDocenteComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const texto = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  const boton = (fixture: { nativeElement: HTMLElement }, contiene: string) =>
    [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      texto(b).includes(contiene),
    ) as HTMLButtonElement;

  const casillas = (fixture: { nativeElement: HTMLElement }) =>
    [...fixture.nativeElement.querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[];

  it('muestra carga mientras llegan las franjas del período', async () => {
    obtenerDisponibilidad.mockReturnValue(new Subject<DisponibilidadCargada>());
    const fixture = await crear();
    expect(texto(fixture.nativeElement)).toContain('Cargando franjas del período');
    // arranca con el primer período y el primer docente de cada lista
    expect(obtenerDisponibilidad).toHaveBeenCalledWith(7, 1);
  });

  it('arma la matriz con las franjas del tipo de período y marca las guardadas', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([1, 2])));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;

    // 2 columnas de día (lunes y martes: los demás no tienen franjas) y 2 filas de bloque
    expect(host.querySelectorAll('thead th')).toHaveLength(3); // Hora + 2 días
    expect(texto(host.querySelector('thead'))).toContain('Lunes');
    expect(texto(host.querySelector('thead'))).not.toContain('Miércoles');
    expect(host.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(texto(host)).toContain('07:00 – 09:00');

    expect(casillas(fixture)).toHaveLength(4);
    expect(casillas(fixture).filter((c) => c.checked)).toHaveLength(2);
    // 2 franjas de 2 h sobre una carga máxima de 20 h
    expect(texto(host)).toContain('2 franjas');
    expect(texto(host)).toContain('4 h disponibles de una carga máxima de 20 h');
  });

  it('avisa cuando las horas marcadas no alcanzan la carga máxima', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([1])));
    const fixture = await crear();
    expect(texto(fixture.nativeElement.querySelector('[role="note"]'))).toContain(
      'no alcanzan su carga máxima',
    );
  });

  it('marcar una franja deja cambios sin guardar y habilita el botón', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([1])));
    const fixture = await crear();

    expect(boton(fixture, 'Guardar disponibilidad').disabled).toBe(true);

    casillas(fixture)[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(texto(fixture.nativeElement)).toContain('Hay cambios sin guardar');
    expect(boton(fixture, 'Guardar disponibilidad').disabled).toBe(false);
    expect(casillas(fixture).filter((c) => c.checked)).toHaveLength(2);
  });

  it('el encabezado del día marca y desmarca todas sus franjas', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([])));
    const fixture = await crear();

    const lunes = boton(fixture, 'Lunes');
    expect(lunes.getAttribute('aria-pressed')).toBe('false');

    lunes.click();
    fixture.detectChanges();
    // lunes tiene 2 franjas (una por bloque)
    expect(casillas(fixture).filter((c) => c.checked)).toHaveLength(2);
    expect(boton(fixture, 'Lunes').getAttribute('aria-pressed')).toBe('true');

    boton(fixture, 'Lunes').click();
    fixture.detectChanges();
    expect(casillas(fixture).filter((c) => c.checked)).toHaveLength(0);
  });

  it('guarda las franjas marcadas y confirma', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([1])));
    guardar.mockReturnValue(of(cargada([1, 3])));
    const fixture = await crear();

    casillas(fixture)[2].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    boton(fixture, 'Guardar disponibilidad').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(guardar).toHaveBeenCalledWith(7, 1, [1, 3]);
    expect(texto(fixture.nativeElement)).toContain('Disponibilidad guardada: 2 franjas');
    expect(texto(fixture.nativeElement)).not.toContain('Hay cambios sin guardar');
  });

  it('descartar vuelve a la disponibilidad guardada', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([1])));
    const fixture = await crear();

    casillas(fixture)[3].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(casillas(fixture).filter((c) => c.checked)).toHaveLength(2);

    boton(fixture, 'Descartar cambios').click();
    fixture.detectChanges();
    expect(casillas(fixture).filter((c) => c.checked)).toHaveLength(1);
    expect(guardar).not.toHaveBeenCalled();
    expect(texto(fixture.nativeElement)).not.toContain('Hay cambios sin guardar');
  });

  it('copia la disponibilidad de un período anterior del mismo tipo', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([])));
    periodoAnteriorConDatos.mockReturnValue(ANTERIOR);
    // la franja 99 no existe en este tipo de período: se descarta
    copiarDelPeriodoAnterior.mockReturnValue(of([2, 4, 99]));
    const fixture = await crear();

    boton(fixture, 'Copiar de Semestre 2025-2').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(copiarDelPeriodoAnterior).toHaveBeenCalledWith(7, 1);
    expect(texto(fixture.nativeElement)).toContain('Se copiaron 2 franjas');
    expect(casillas(fixture).filter((c) => c.checked)).toHaveLength(2);
    expect(texto(fixture.nativeElement)).toContain('Hay cambios sin guardar');
  });

  it('muestra el motivo cuando no hay un período anterior del que copiar', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([])));
    periodoAnteriorConDatos.mockReturnValue(ANTERIOR);
    copiarDelPeriodoAnterior.mockReturnValue(
      throwError(() => new Error('No tiene disponibilidad registrada en un período anterior.')),
    );
    const fixture = await crear();

    boton(fixture, 'Copiar de').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(texto(fixture.nativeElement.querySelector('[role="alert"]'))).toContain(
      'No tiene disponibilidad registrada',
    );
  });

  it('al cambiar de docente carga su disponibilidad y descarta los cambios del anterior', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([1])));
    const fixture = await crear();

    casillas(fixture)[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(texto(fixture.nativeElement)).toContain('Hay cambios sin guardar');

    obtenerDisponibilidad.mockReturnValue(
      of(cargada([4], { docente: ANDRADE })),
    );
    const selectDocente = fixture.nativeElement.querySelector('#docente') as HTMLSelectElement;
    selectDocente.value = '12';
    selectDocente.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(obtenerDisponibilidad).toHaveBeenLastCalledWith(12, 1);
    expect(texto(fixture.nativeElement)).toContain('Jorge Andrade');
    expect(texto(fixture.nativeElement)).not.toContain('Hay cambios sin guardar');
    expect(casillas(fixture).filter((c) => c.checked)).toHaveLength(1);
  });

  it('permite reintentar cuando la carga falla', async () => {
    obtenerDisponibilidad
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValueOnce(of(cargada([1])));
    const fixture = await crear();
    expect(texto(fixture.nativeElement.querySelector('[role="alert"]'))).toContain(
      'No se pudo cargar la disponibilidad',
    );

    boton(fixture, 'Reintentar').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(casillas(fixture)).toHaveLength(4);
    expect(obtenerDisponibilidad).toHaveBeenCalledTimes(2);
  });

  it('muestra el estado vacío si el tipo de período no tiene franjas', async () => {
    obtenerDisponibilidad.mockReturnValue(of(cargada([], { franjas: [] })));
    const fixture = await crear();
    expect(fixture.nativeElement.querySelector('app-estado-vacio')).not.toBeNull();
    expect(texto(fixture.nativeElement)).toContain('no tiene franjas horarias registradas');
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
  });
});
