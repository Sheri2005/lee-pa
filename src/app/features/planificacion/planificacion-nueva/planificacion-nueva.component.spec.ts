import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { CatalogoNuevaPlanificacion } from '../../../core/models/nueva-planificacion.model';
import { Planificacion } from '../../../core/models/planificacion.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { PlanificacionNuevaComponent } from './planificacion-nueva.component';

describe('PlanificacionNuevaComponent', () => {
  const obtenerCatalogoNueva = vi.fn();
  const crear = vi.fn();

  const FING = { id: 1, codigo: 'FING', nombre: 'Facultad de Ingeniería' };
  const FARQ = { id: 2, codigo: 'FARQ', nombre: 'Facultad de Arquitectura' };

  const catalogo: CatalogoNuevaPlanificacion = {
    carreras: [
      {
        id: 5,
        codigo: 'ICO',
        nombre: 'Ingeniería en Computación',
        facultad: FING,
        malla: { id: 3, codigo: 'M-2024', nombre: 'Malla 2024', anioInicio: 2024 },
      },
      {
        id: 7,
        codigo: 'ARQ',
        nombre: 'Arquitectura',
        facultad: FARQ,
        malla: { id: 6, codigo: 'M-2022', nombre: 'Malla 2022', anioInicio: 2022 },
      },
    ],
    periodos: [
      { id: 9, codigo: '2027-2', nombre: 'Segundo período 2027', tipo: 'ORDINARIO' },
      { id: 8, codigo: '2027-1', nombre: 'Primer período 2027', tipo: 'ORDINARIO' },
    ],
    existentes: [{ carreraId: 5, periodoId: 8 }],
  };

  const creada: Planificacion = {
    id: 10,
    carrera: { id: 7, codigo: 'ARQ', nombre: 'Arquitectura' },
    facultad: FARQ,
    periodo: { id: 9, codigo: '2027-2', nombre: 'Segundo período 2027', tipo: 'ORDINARIO' },
    malla: { id: 6, codigo: 'M-2022', nombre: 'Malla 2022', anioInicio: 2022 },
    estado: 'BORRADOR',
  };

  beforeEach(() => {
    obtenerCatalogoNueva.mockReset().mockReturnValue(of(catalogo));
    crear.mockReset().mockReturnValue(of(creada));
    TestBed.configureTestingModule({
      providers: [{ provide: PlanificacionService, useValue: { obtenerCatalogoNueva, crear } }],
    });
  });

  async function estabilizar(fixture: ReturnType<typeof TestBed.createComponent>) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(PlanificacionNuevaComponent);
    await estabilizar(fixture);
    return fixture;
  }

  function elegir(host: HTMLElement, indiceSelect: number, valor: string) {
    const select = host.querySelectorAll('select')[indiceSelect];
    select.value = valor;
    select.dispatchEvent(new Event('change'));
  }

  const botonCrear = (host: HTMLElement) =>
    Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent!.includes('Crear planificación'),
    )!;

  it('muestra la carga y luego las carreras y períodos', async () => {
    obtenerCatalogoNueva.mockReturnValue(new Subject<CatalogoNuevaPlanificacion>());
    const cargando = await crearComponente();
    expect(cargando.nativeElement.querySelector('app-spinner-carga')).not.toBeNull();
    expect(cargando.nativeElement.querySelector('select')).toBeNull();

    obtenerCatalogoNueva.mockReturnValue(of(catalogo));
    const host: HTMLElement = (await crearComponente()).nativeElement;
    const selects = host.querySelectorAll('select');
    expect(selects[0].querySelectorAll('option')).toHaveLength(3); // placeholder + 2 carreras
    expect(selects[1].querySelectorAll('option')).toHaveLength(3); // placeholder + 2 períodos
    expect(botonCrear(host).disabled).toBe(true);
  });

  it('muestra la facultad heredada y la malla vigente al elegir la carrera', async () => {
    const fixture = await crearComponente();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('dl')!.textContent).not.toContain('Facultad de Ingeniería');
    elegir(host, 0, '5');
    await estabilizar(fixture);
    const datos = host.querySelector('dl')!.textContent!;
    expect(datos).toContain('Facultad de Ingeniería');
    expect(datos).toContain('Malla 2024 (2024)');
  });

  it('impide duplicar la combinación carrera + período', async () => {
    const fixture = await crearComponente();
    const host: HTMLElement = fixture.nativeElement;
    elegir(host, 0, '5');
    elegir(host, 1, '8');
    await estabilizar(fixture);
    expect(host.querySelector('[role="alert"]')!.textContent).toContain(
      'Ya existe una planificación',
    );
    expect(botonCrear(host).disabled).toBe(true);
    fixture.componentInstance.crear();
    expect(crear).not.toHaveBeenCalled();

    elegir(host, 1, '9'); // otro período para la misma carrera
    await estabilizar(fixture);
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(botonCrear(host).disabled).toBe(false);
  });

  it('crea la planificación y la emite por `creada`', async () => {
    const fixture = await crearComponente();
    const emitido = vi.fn();
    fixture.componentInstance.creada.subscribe(emitido);
    const host: HTMLElement = fixture.nativeElement;
    elegir(host, 0, '7');
    elegir(host, 1, '9');
    await estabilizar(fixture);
    botonCrear(host).click();
    await estabilizar(fixture);
    expect(crear).toHaveBeenCalledWith({ carreraId: 7, periodoId: 9 });
    expect(emitido).toHaveBeenCalledTimes(1);
    expect(emitido).toHaveBeenCalledWith(creada);
  });

  it('muestra el error de guardado sin emitir `creada`', async () => {
    crear.mockReturnValue(
      throwError(() => new Error('Ya existe una planificación para esa carrera.')),
    );
    const fixture = await crearComponente();
    const emitido = vi.fn();
    fixture.componentInstance.creada.subscribe(emitido);
    const host: HTMLElement = fixture.nativeElement;
    elegir(host, 0, '7');
    elegir(host, 1, '9');
    await estabilizar(fixture);
    botonCrear(host).click();
    await estabilizar(fixture);
    expect(host.textContent).toContain('Ya existe una planificación para esa carrera.');
    expect(emitido).not.toHaveBeenCalled();
    expect(fixture.componentInstance.guardando()).toBe(false);
  });

  it('emite `cancelada` al cancelar, con Esc o al hacer clic en el fondo', async () => {
    const fixture = await crearComponente();
    const cancelada = vi.fn();
    fixture.componentInstance.cancelada.subscribe(cancelada);
    const host: HTMLElement = fixture.nativeElement;
    Array.from(host.querySelectorAll('button'))
      .find((b) => b.textContent!.includes('Cancelar'))!
      .click();
    host.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }));
    host.querySelector('dialog')!.click(); // el destino es el propio <dialog> = fondo
    expect(cancelada).toHaveBeenCalledTimes(3);
  });

  it('permite reintentar si falla la carga del catálogo', async () => {
    obtenerCatalogoNueva
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValueOnce(of(catalogo));
    const fixture = await crearComponente();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    Array.from(host.querySelectorAll('button'))
      .find((b) => b.textContent!.includes('Reintentar'))!
      .click();
    await estabilizar(fixture);
    expect(host.querySelectorAll('select')).toHaveLength(2);
    expect(obtenerCatalogoNueva).toHaveBeenCalledTimes(2);
  });
});
