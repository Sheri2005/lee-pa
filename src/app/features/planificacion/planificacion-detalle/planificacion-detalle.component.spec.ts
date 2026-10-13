import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { ParametrosPlanificacion } from '../../../core/models/parametros-planificacion.model';
import { Planificacion } from '../../../core/models/planificacion.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { AsignacionDocentesComponent } from '../asignacion-docentes/asignacion-docentes.component';
import { ParametrosPlanificacionComponent } from '../parametros-planificacion/parametros-planificacion.component';
import { PlanificacionDetalleComponent } from './planificacion-detalle.component';

// Dobles de los hijos: aquí solo se prueba el contenedor (rutas, pasos y estados).
@Component({
  selector: 'app-parametros-planificacion',
  template: '<p>stub-parametros {{ planificacion().id }}</p>',
})
class ParametrosStubComponent {
  readonly planificacion = input.required<Planificacion>();
  readonly parametrosChange = output<ParametrosPlanificacion>();
}

@Component({
  selector: 'app-asignacion-docentes',
  template: '<p>stub-asignacion {{ planificacionId() }}</p>',
})
class AsignacionStubComponent {
  readonly planificacionId = input.required<number>();
}

describe('PlanificacionDetalleComponent', () => {
  const obtenerPorId = vi.fn();

  const base: Planificacion = {
    id: 3,
    carrera: { id: 7, codigo: 'ARQ', nombre: 'Arquitectura' },
    facultad: { id: 2, codigo: 'FARQ', nombre: 'Facultad de Arquitectura' },
    periodo: { id: 8, codigo: '2027-1', nombre: 'Primer período 2027', tipo: 'ORDINARIO' },
    malla: { id: 6, codigo: 'M-2022', nombre: 'Malla 2022', anioInicio: 2022 },
    estado: 'BORRADOR',
  };

  beforeEach(() => {
    obtenerPorId.mockReset().mockImplementation((id: number) => of({ ...base, id }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'planificacion/:id', component: PlanificacionDetalleComponent }]),
        { provide: PlanificacionService, useValue: { obtenerPorId } },
      ],
    });
    TestBed.overrideComponent(PlanificacionDetalleComponent, {
      remove: { imports: [ParametrosPlanificacionComponent, AsignacionDocentesComponent] },
      add: { imports: [ParametrosStubComponent, AsignacionStubComponent] },
    });
  });

  async function abrir(url: string) {
    const harness = await RouterTestingHarness.create();
    const componente = await harness.navigateByUrl(url, PlanificacionDetalleComponent);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return { harness, componente, host: harness.routeNativeElement as HTMLElement };
  }

  const pestanas = (host: HTMLElement) =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const boton = (host: HTMLElement, texto: string) =>
    Array.from(host.querySelectorAll('button')).find((b) => b.textContent!.includes(texto))!;

  it('carga la planificación de la ruta y muestra su encabezado (C2-04)', async () => {
    const { host } = await abrir('/planificacion/3');
    expect(obtenerPorId).toHaveBeenCalledWith(3);
    expect(host.querySelector('app-planificacion-encabezado')!.textContent).toContain(
      'Arquitectura',
    );
    expect(host.textContent).toContain('Malla 2022');
  });

  it('muestra los siete pasos en el orden del catálogo y empieza en Parámetros', async () => {
    const { host } = await abrir('/planificacion/3');
    expect(pestanas(host).map((t) => t.textContent!.replace(/\s+/g, ' ').trim())).toEqual([
      '1.Parámetros',
      '2.Estudiantes estimados',
      '3.Cursos sugeridos',
      '4.Paralelos',
      '5.Docentes',
      '6.Materias compartidas',
      '7.Enviar a aprobación',
    ]);
    expect(pestanas(host)[0].getAttribute('aria-selected')).toBe('true');
    expect(host.querySelector('app-parametros-planificacion')!.textContent).toContain(
      'stub-parametros 3',
    );
  });

  it('navega con Siguiente/Anterior y monta Docentes con el id de la planificación', async () => {
    const { harness, host } = await abrir('/planificacion/3');
    expect(boton(host, 'Anterior').disabled).toBe(true);
    for (let i = 0; i < 4; i++) {
      boton(host, 'Siguiente').click();
      harness.detectChanges();
    }
    expect(host.textContent).toContain('Paso 5 de 7');
    expect(host.querySelector('app-asignacion-docentes')!.textContent).toContain(
      'stub-asignacion 3',
    );
    expect(host.querySelector('app-parametros-planificacion')).toBeNull();

    for (let i = 0; i < 2; i++) {
      boton(host, 'Siguiente').click();
      harness.detectChanges();
    }
    expect(boton(host, 'Siguiente').disabled).toBe(true);
    expect(host.textContent).toContain('app-boton-enviar-aprobacion');
  });

  it('cambia de paso con las pestañas y con el teclado', async () => {
    const { harness, host } = await abrir('/planificacion/3');
    pestanas(host)[1].click();
    harness.detectChanges();
    expect(pestanas(host)[1].getAttribute('aria-selected')).toBe('true');
    expect(host.textContent).toContain('app-estudiantes-estimados');

    pestanas(host)[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    harness.detectChanges();
    expect(pestanas(host)[2].getAttribute('aria-selected')).toBe('true');
    pestanas(host)[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    harness.detectChanges();
    expect(pestanas(host)[6].getAttribute('aria-selected')).toBe('true');
    pestanas(host)[6].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    harness.detectChanges();
    expect(pestanas(host)[0].getAttribute('aria-selected')).toBe('true'); // vuelve al inicio
  });

  it('muestra la carga mientras espera la respuesta', async () => {
    obtenerPorId.mockReturnValue(new Subject<Planificacion>());
    const { host } = await abrir('/planificacion/3');
    expect(host.querySelector('app-spinner-carga')).not.toBeNull();
    expect(host.querySelector('[role="tablist"]')).toBeNull();
  });

  it('muestra error con reintento cuando no se encuentra la planificación', async () => {
    obtenerPorId
      .mockReturnValueOnce(throwError(() => new Error('No encontrada')))
      .mockReturnValueOnce(of({ ...base, id: 999 }));
    const { harness, host } = await abrir('/planificacion/999');
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('No se encontró');
    boton(host, 'Reintentar').click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(host.querySelector('[role="tablist"]')).not.toBeNull();
    expect(obtenerPorId).toHaveBeenCalledTimes(2);
  });

  it('rechaza un id inválido sin consultar al servicio', async () => {
    const { host } = await abrir('/planificacion/abc');
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('no es válido');
    expect(host.textContent).not.toContain('Reintentar');
    expect(obtenerPorId).not.toHaveBeenCalled();
  });

  it('avisa que es de solo lectura cuando la planificación no admite cambios', async () => {
    obtenerPorId.mockReturnValue(of({ ...base, estado: 'APROBADA' }));
    const { host } = await abrir('/planificacion/1');
    expect(host.textContent).toContain('solo lectura');
  });

  it('no muestra el aviso de solo lectura en una planificación editable', async () => {
    const { host } = await abrir('/planificacion/3');
    expect(host.textContent).not.toContain('solo lectura');
  });

  it('al abrir otra planificación recarga y vuelve al primer paso', async () => {
    const { harness, host } = await abrir('/planificacion/3');
    pestanas(host)[4].click();
    harness.detectChanges();
    expect(pestanas(host)[4].getAttribute('aria-selected')).toBe('true');

    await harness.navigateByUrl('/planificacion/4', PlanificacionDetalleComponent);
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(obtenerPorId).toHaveBeenLastCalledWith(4);
    expect(pestanas(host)[0].getAttribute('aria-selected')).toBe('true');
    expect(host.querySelector('app-parametros-planificacion')!.textContent).toContain(
      'stub-parametros 4',
    );
  });

  it('enlaza de vuelta al listado', async () => {
    const { host } = await abrir('/planificacion/3');
    expect(host.querySelector('a')!.getAttribute('href')).toBe('/planificacion');
  });
});
