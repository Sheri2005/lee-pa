import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import type { FiltrosReporte } from '../../../shared/components/filtros-reporte';
import {
  REPORTE_OCUPACION_SOURCE,
  type ReporteOcupacionDataSource,
} from './reporte-ocupacion.data-source';
import {
  type CatalogosReporteOcupacion,
  type ResultadoReporteOcupacion,
} from './reporte-ocupacion.models';
import { ReporteOcupacionComponent } from './reporte-ocupacion';

const FILTROS_VACIOS: FiltrosReporte = {
  facultadId: null,
  carreraId: null,
  periodoId: null,
  fechaInicio: null,
  fechaFin: null,
};

const CATALOGOS: CatalogosReporteOcupacion = {
  facultades: [],
  carreras: [],
  periodos: [],
  edificios: [
    { id: 'ed-a', nombre: 'Edificio A' },
    { id: 'ed-b', nombre: 'Edificio B' },
  ],
  espacios: [
    { id: 'au-1', nombre: 'Aula 1', edificioId: 'ed-a' },
    { id: 'au-2', nombre: 'Aula 2', edificioId: 'ed-a' },
    { id: 'lab-1', nombre: 'Laboratorio 1', edificioId: 'ed-b' },
  ],
  franjas: [{ id: 'f-1', nombre: '07:00–08:00' }],
};

const RESULTADO_VACIO: ResultadoReporteOcupacion = {
  filas: [],
  grillaSemanal: [],
};

describe('ReporteOcupacionComponent', () => {
  let fixture: ComponentFixture<ReporteOcupacionComponent>;
  let component: ReporteOcupacionComponent;
  let source: ReporteOcupacionDataSource;

  beforeEach(async () => {
    source = {
      cargarCatalogos: vi.fn().mockReturnValue(of(CATALOGOS)),
      consultar: vi.fn().mockReturnValue(of(RESULTADO_VACIO)),
    };

    await TestBed.configureTestingModule({
      imports: [ReporteOcupacionComponent],
      providers: [{ provide: REPORTE_OCUPACION_SOURCE, useValue: source }],
    })
      .overrideComponent(ReporteOcupacionComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ReporteOcupacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('mantiene el estado pendiente si todavía no existe proveedor', () => {
    TestBed.overrideProvider(REPORTE_OCUPACION_SOURCE, { useValue: null });
    crearComponente();

    expect(component.estado).toBe('servicioPendiente');
    expect(source.cargarCatalogos).not.toHaveBeenCalled();
  });

  it('carga catálogos y consulta inicialmente sin filtros ni selectores', () => {
    crearComponente();

    expect(source.cargarCatalogos).toHaveBeenCalledOnce();
    expect(source.consultar).toHaveBeenCalledWith({
      filtros: FILTROS_VACIOS,
      edificioId: null,
      espacioId: null,
      franjaId: null,
    });
    expect(component.catalogos).toEqual(CATALOGOS);
    expect(component.estado).toBe('vacio');
  });

  it('filtra espacios por edificio y envía la selección al proveedor', () => {
    crearComponente();
    component.cambiarEdificio('ed-a');
    component.cambiarEspacio('au-2');
    component.cambiarFranja('f-1');

    expect(component.espaciosDisponibles).toEqual(CATALOGOS.espacios.slice(0, 2));
    expect(source.consultar).toHaveBeenLastCalledWith({
      filtros: FILTROS_VACIOS,
      edificioId: 'ed-a',
      espacioId: 'au-2',
      franjaId: 'f-1',
    });
  });

  it('limpia el espacio al cambiar a un edificio que no lo contiene', () => {
    crearComponente();
    component.cambiarEdificio('ed-a');
    component.cambiarEspacio('au-1');
    component.cambiarEdificio('ed-b');

    expect(component.espacioIdSeleccionado).toBeNull();
    expect(source.consultar).toHaveBeenLastCalledWith({
      filtros: FILTROS_VACIOS,
      edificioId: 'ed-b',
      espacioId: null,
      franjaId: null,
    });
  });

  it('distingue celdas con datos y limita la grilla a la franja seleccionada', () => {
    source.consultar = vi.fn().mockReturnValue(
      of({
        filas: [],
        grillaSemanal: [
          {
            espacioId: 'au-1',
            dia: 'lunes' as const,
            franjaId: 'f-1',
            ocupado: true,
            detalle: 'Clase de prueba',
          },
        ],
      }),
    );
    crearComponente();
    component.cambiarEspacio('au-1');
    component.cambiarFranja('f-1');

    expect(component.celdaEn('lunes', 'f-1')?.ocupado).toBe(true);
    expect(component.celdaEn('martes', 'f-1')).toBeUndefined();
    expect(component.franjasVisibles).toEqual(CATALOGOS.franjas);
    expect(source.consultar).toHaveBeenLastCalledWith({
      filtros: FILTROS_VACIOS,
      edificioId: null,
      espacioId: 'au-1',
      franjaId: 'f-1',
    });
  });

  it('permite reintentar una consulta fallida', () => {
    source.consultar = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('No disponible')))
      .mockReturnValue(of(RESULTADO_VACIO));
    crearComponente();
    expect(component.estado).toBe('error');

    component.reintentar();

    expect(component.estado).toBe('vacio');
    expect(source.consultar).toHaveBeenCalledTimes(2);
  });
});
