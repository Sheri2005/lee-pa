import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import {
  NivelMalla,
  ParametrosPlanificacion,
} from '../../../core/models/parametros-planificacion.model';
import { Planificacion } from '../../../core/models/planificacion.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { ParametrosPlanificacionComponent } from './parametros-planificacion.component';

describe('ParametrosPlanificacionComponent', () => {
  const obtenerParametros = vi.fn();
  const obtenerMallaPorNiveles = vi.fn();
  const guardarParametros = vi.fn();

  const planificacion: Planificacion = {
    id: 3,
    carrera: { id: 7, codigo: 'ARQ', nombre: 'Arquitectura' },
    facultad: { id: 2, codigo: 'FARQ', nombre: 'Facultad de Arquitectura' },
    periodo: { id: 8, codigo: '2027-1', nombre: 'Primer período 2027', tipo: 'ORDINARIO' },
    malla: { id: 6, codigo: 'M-2022', nombre: 'Malla 2022', anioInicio: 2022 },
    estado: 'BORRADOR',
  };

  const niveles: NivelMalla[] = [1, 2, 3].map((nivel) => ({
    nivel,
    materias: [
      { codigo: `M-${nivel}01`, nombre: `Materia ${nivel}A`, horasSemanales: 4 },
      { codigo: `M-${nivel}02`, nombre: `Materia ${nivel}B`, horasSemanales: 6 },
    ],
  }));

  const guardados: ParametrosPlanificacion = {
    nivelesOfertados: [1, 2],
    cupoMaximoParalelo: 30,
    minimoEstudiantesAbrir: 12,
  };

  beforeEach(() => {
    obtenerParametros.mockReset().mockReturnValue(of(guardados));
    obtenerMallaPorNiveles.mockReset().mockReturnValue(of(niveles));
    guardarParametros
      .mockReset()
      .mockImplementation((_id: number, p: ParametrosPlanificacion) => of(p));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PlanificacionService,
          useValue: { obtenerParametros, obtenerMallaPorNiveles, guardarParametros },
        },
      ],
    });
  });

  async function estabilizar(fixture: ReturnType<typeof TestBed.createComponent>) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function crear(p: Planificacion = planificacion) {
    const fixture = TestBed.createComponent(ParametrosPlanificacionComponent);
    fixture.componentRef.setInput('planificacion', p);
    await estabilizar(fixture);
    return fixture;
  }

  const casillas = (host: HTMLElement) =>
    Array.from(host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
  const campos = (host: HTMLElement) =>
    Array.from(host.querySelectorAll<HTMLInputElement>('input[type="number"]'));
  const botonGuardar = (host: HTMLElement) =>
    host.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  function escribir(input: HTMLInputElement, valor: string) {
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  it('muestra la carga y consulta parámetros y malla de la planificación', async () => {
    obtenerParametros.mockReturnValue(new Subject<ParametrosPlanificacion>());
    const fixture = await crear();
    expect(fixture.nativeElement.querySelector('app-spinner-carga')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(obtenerParametros).toHaveBeenCalledWith(3);
    expect(obtenerMallaPorNiveles).toHaveBeenCalledWith(6);
  });

  it('carga los valores guardados: niveles marcados, cupo y mínimo', async () => {
    const host: HTMLElement = (await crear()).nativeElement;
    expect(casillas(host).map((c) => c.checked)).toEqual([true, true, false]);
    expect(campos(host).map((c) => c.value)).toEqual(['30', '12']);
    expect(host.textContent).toContain('2 niveles');
    expect(host.textContent).toContain('4 materias');
    expect(host.textContent).toContain('20 h/sem');
    expect(botonGuardar(host).disabled).toBe(true); // sin cambios
  });

  it('valida: al menos un nivel, enteros positivos y mínimo ≤ cupo', async () => {
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    const c = fixture.componentInstance;

    c.quitarTodos();
    await estabilizar(fixture);
    expect(host.textContent).toContain('Selecciona al menos un nivel');
    expect(botonGuardar(host).disabled).toBe(true);

    c.elegirTodos();
    escribir(campos(host)[1], '40'); // mínimo mayor que el cupo (30)
    await estabilizar(fixture);
    expect(host.textContent).toContain('no puede superar el cupo máximo');
    expect(botonGuardar(host).disabled).toBe(true);

    escribir(campos(host)[0], '3.5');
    await estabilizar(fixture);
    expect(host.textContent).toContain('Ingresa un número entero');
    escribir(campos(host)[0], '0');
    await estabilizar(fixture);
    expect(host.textContent).toContain('El cupo debe estar entre 1 y 100');
    expect(c.valido()).toBe(false);
  });

  it('guarda los cambios, emite `parametrosChange` y queda sin cambios pendientes', async () => {
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    const emitido = vi.fn();
    fixture.componentInstance.parametrosChange.subscribe(emitido);

    casillas(host)[2].click(); // agrega el nivel 3
    escribir(campos(host)[0], '35');
    await estabilizar(fixture);
    expect(botonGuardar(host).disabled).toBe(false);
    expect(host.textContent).toContain('Hay cambios sin guardar');

    botonGuardar(host).click();
    await estabilizar(fixture);
    expect(guardarParametros).toHaveBeenCalledWith(3, {
      nivelesOfertados: [1, 2, 3],
      cupoMaximoParalelo: 35,
      minimoEstudiantesAbrir: 12,
    });
    expect(emitido).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain('Parámetros guardados');
    expect(botonGuardar(host).disabled).toBe(true);
  });

  it('muestra el error de guardado sin emitir', async () => {
    guardarParametros.mockReturnValue(throwError(() => new Error('No disponible')));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    const emitido = vi.fn();
    fixture.componentInstance.parametrosChange.subscribe(emitido);
    escribir(campos(host)[0], '33');
    await estabilizar(fixture);
    botonGuardar(host).click();
    await estabilizar(fixture);
    expect(host.textContent).toContain('No disponible');
    expect(emitido).not.toHaveBeenCalled();
    expect(fixture.componentInstance.guardando()).toBe(false);
    expect(botonGuardar(host).disabled).toBe(false); // se puede reintentar
  });

  it('es de solo lectura cuando la planificación no admite cambios', async () => {
    const host: HTMLElement = (await crear({ ...planificacion, estado: 'APROBADA' })).nativeElement;
    expect(host.textContent).toContain('solo lectura');
    expect(casillas(host).every((c) => c.disabled)).toBe(true);
    expect(campos(host).every((c) => c.disabled)).toBe(true);
    expect(host.querySelector('button[type="submit"]')).toBeNull();
  });

  it('permite reintentar después de un error de carga', async () => {
    obtenerParametros
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValueOnce(of(guardados));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    host.querySelector<HTMLButtonElement>('[role="alert"] + button')!.click();
    await estabilizar(fixture);
    expect(host.querySelector('form')).not.toBeNull();
    expect(obtenerParametros).toHaveBeenCalledTimes(2);
  });

  it('recarga los datos cuando cambia la planificación', async () => {
    const fixture = await crear();
    obtenerParametros.mockReturnValue(
      of({ nivelesOfertados: [3], cupoMaximoParalelo: 25, minimoEstudiantesAbrir: 10 }),
    );
    fixture.componentRef.setInput('planificacion', { ...planificacion, id: 4 });
    await estabilizar(fixture);
    expect(obtenerParametros).toHaveBeenLastCalledWith(4);
    const host: HTMLElement = fixture.nativeElement;
    expect(casillas(host).map((c) => c.checked)).toEqual([false, false, true]);
    expect(campos(host).map((c) => c.value)).toEqual(['25', '10']);
  });
});
