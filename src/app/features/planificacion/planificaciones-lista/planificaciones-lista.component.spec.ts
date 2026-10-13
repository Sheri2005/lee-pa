import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { PLANIFICACIONES_MOCK } from '../../../core/mocks/planificaciones.mock';
import { Planificacion } from '../../../core/models/planificacion.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { PlanificacionNuevaComponent } from '../planificacion-nueva/planificacion-nueva.component';
import { PlanificacionesListaComponent } from './planificaciones-lista.component';

describe('PlanificacionesListaComponent', () => {
  const listar = vi.fn();
  const obtenerCatalogoNueva = vi.fn();

  beforeEach(() => {
    listar.mockReset();
    obtenerCatalogoNueva.mockReset().mockReturnValue(of({ carreras: [], periodos: [], existentes: [] }));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: PlanificacionService, useValue: { listar, obtenerCatalogoNueva } }],
    });
  });

  async function estabilizar(fixture: ReturnType<typeof TestBed.createComponent>) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function crear() {
    const fixture = TestBed.createComponent(PlanificacionesListaComponent);
    await estabilizar(fixture);
    return fixture;
  }

  function filas(host: HTMLElement): HTMLTableRowElement[] {
    return Array.from(host.querySelectorAll<HTMLTableRowElement>('tbody tr'));
  }

  it('muestra el esqueleto de carga y bloquea los filtros mientras espera', async () => {
    listar.mockReturnValue(new Subject<Planificacion[]>());
    const host: HTMLElement = (await crear()).nativeElement;
    expect(host.querySelector('app-spinner-carga')).not.toBeNull();
    expect(host.querySelector('table')).toBeNull();
    expect(host.querySelector<HTMLSelectElement>('select')!.disabled).toBe(true);
  });

  it('pinta una fila por planificación con carrera, facultad, período, malla y estado', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const host: HTMLElement = (await crear()).nativeElement;
    expect(filas(host)).toHaveLength(PLANIFICACIONES_MOCK.length);
    const primera = filas(host)[0].textContent ?? '';
    expect(primera).toContain('Ingeniería en Computación');
    expect(primera).toContain('2027-1');
    expect(primera).toContain('Malla 2024 (2024)');
    expect(primera).toContain('Aprobada');
  });

  it('ofrece cada facultad, carrera y período una sola vez', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const host: HTMLElement = (await crear()).nativeElement;
    const selects = host.querySelectorAll('select');
    expect(selects[0].querySelectorAll('option')).toHaveLength(3); // Todas + 2 facultades
    const etiquetas = Array.from(host.querySelectorAll('label')).map((l) => l.textContent!.trim());
    expect(etiquetas).toEqual(['Facultad', 'Carrera', 'Período', 'Estado']);
    expect(selects[1].querySelectorAll('option')).toHaveLength(4); // Todas + 3 carreras
    expect(selects[2].querySelectorAll('option')).toHaveLength(3); // Todos + 2 períodos
  });

  it('filtra por facultad al cambiar el selector', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    const select = host.querySelector<HTMLSelectElement>('select')!;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    await estabilizar(fixture);
    expect(filas(host)).toHaveLength(1);
    expect(filas(host)[0].textContent).toContain('Arquitectura');
  });

  it('combina carrera, período y estado', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const fixture = await crear();
    const c = fixture.componentInstance;
    c.alCambiarCarrera('5');
    expect(c.planificacionesVisibles()).toHaveLength(2);
    c.alCambiarPeriodo('9');
    expect(c.planificacionesVisibles().map((p) => p.id)).toEqual([4]);
    c.alCambiarEstado('PENDIENTE');
    expect(c.planificacionesVisibles()).toHaveLength(0);
  });

  it('ignora valores inválidos de los filtros', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const c = (await crear()).componentInstance;
    c.alCambiarEstado('INVENTADO');
    c.alCambiarFacultad('abc');
    expect(c.hayFiltros()).toBe(false);
  });

  it('muestra el vacío con filtros y permite limpiarlos', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    fixture.componentInstance.alCambiarCarrera('7');
    fixture.componentInstance.alCambiarEstado('APROBADA');
    await estabilizar(fixture);
    expect(host.textContent).toContain('No hay planificaciones que coincidan');
    host.querySelector<HTMLButtonElement>('app-estado-vacio button')!.click();
    await estabilizar(fixture);
    expect(fixture.componentInstance.hayFiltros()).toBe(false);
    expect(filas(host)).toHaveLength(PLANIFICACIONES_MOCK.length);
  });

  it('muestra un mensaje distinto cuando no existe ninguna planificación', async () => {
    listar.mockReturnValue(of([]));
    const host: HTMLElement = (await crear()).nativeElement;
    expect(host.textContent).toContain('Todavía no hay planificaciones');
  });

  it('permite reintentar después de un error', async () => {
    listar
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValueOnce(of(PLANIFICACIONES_MOCK));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    host.querySelector<HTMLButtonElement>('[role="alert"] + button')!.click();
    await estabilizar(fixture);
    expect(filas(host)).toHaveLength(PLANIFICACIONES_MOCK.length);
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('enlaza cada fila con el detalle /planificacion/:id', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const host: HTMLElement = (await crear()).nativeElement;
    const enlace = filas(host)[1].querySelector<HTMLAnchorElement>('a')!;
    expect(enlace.getAttribute('href')).toBe('/planificacion/2');
  });

  it('abre y cierra el diálogo de "Nueva planificación"', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    const boton = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent!.includes('Nueva planificación'),
    )!;
    boton.click();
    await estabilizar(fixture);
    expect(host.querySelector('app-planificacion-nueva')).not.toBeNull();
    fixture.componentInstance.cerrarNueva();
    await estabilizar(fixture);
    expect(host.querySelector('app-planificacion-nueva')).toBeNull();
  });

  it('al crear una planificación cierra el diálogo y recarga el listado', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const fixture = await crear();
    fixture.componentInstance.abrirNueva();
    await estabilizar(fixture);
    const llamadas = listar.mock.calls.length;
    const dialogo = fixture.debugElement.query(By.directive(PlanificacionNuevaComponent));
    (dialogo.componentInstance as PlanificacionNuevaComponent).creada.emit(PLANIFICACIONES_MOCK[0]);
    await estabilizar(fixture);
    expect(fixture.nativeElement.querySelector('app-planificacion-nueva')).toBeNull();
    expect(listar.mock.calls.length).toBe(llamadas + 1);
  });

  it('cierra el diálogo al cancelarlo sin recargar el listado', async () => {
    listar.mockReturnValue(of(PLANIFICACIONES_MOCK));
    const fixture = await crear();
    fixture.componentInstance.abrirNueva();
    await estabilizar(fixture);
    const llamadas = listar.mock.calls.length;
    const dialogo = fixture.debugElement.query(By.directive(PlanificacionNuevaComponent));
    (dialogo.componentInstance as PlanificacionNuevaComponent).cancelada.emit();
    await estabilizar(fixture);
    expect(fixture.nativeElement.querySelector('app-planificacion-nueva')).toBeNull();
    expect(listar.mock.calls.length).toBe(llamadas);
  });
});
