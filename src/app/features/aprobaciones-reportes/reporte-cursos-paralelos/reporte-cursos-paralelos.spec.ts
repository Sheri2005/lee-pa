import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import type { FiltrosReporte } from '../../../shared/components/filtros-reporte';
import {
  REPORTE_CURSOS_PARALELOS_SOURCE,
  type ReporteCursosParalelosDataSource,
} from './reporte-cursos-paralelos.data-source';
import {
  type CatalogosCursosParalelos,
  type FilaCursosParalelos,
} from './reporte-cursos-paralelos.models';
import { ReporteCursosParalelosComponent } from './reporte-cursos-paralelos';

const CATALOGOS: CatalogosCursosParalelos = {
  facultades: [{ id: 'fac-ing', nombre: 'Ingeniería' }],
  carreras: [
    { id: 'car-sis', nombre: 'Sistemas', facultadId: 'fac-ing' },
    { id: 'car-ind', nombre: 'Industrial', facultadId: 'fac-ing' },
  ],
  periodos: [{ id: 'per-1', nombre: '2026 - Ciclo 1' }],
  mallaIdPorCarreraId: { 'car-sis': 'malla-sis' },
  nivelesPorMallaId: { 'malla-sis': [1, 2, 3] },
};

const FILTROS_VACIOS: FiltrosReporte = {
  facultadId: null,
  carreraId: null,
  periodoId: null,
  fechaInicio: null,
  fechaFin: null,
};

const FILTROS_SISTEMAS: FiltrosReporte = {
  ...FILTROS_VACIOS,
  facultadId: 'fac-ing',
  carreraId: 'car-sis',
  periodoId: 'per-1',
};

const FILA_SISTEMAS: FilaCursosParalelos = {
  facultadId: 'fac-ing',
  facultad: 'Ingeniería',
  carreraId: 'car-sis',
  carrera: 'Sistemas',
  periodoId: 'per-1',
  periodo: '2026 - Ciclo 1',
  nivel: 1,
  cursos: 4,
  paralelos: 7,
};

const FILA_INDUSTRIAL: FilaCursosParalelos = {
  ...FILA_SISTEMAS,
  carreraId: 'car-ind',
  carrera: 'Industrial',
  cursos: 2,
  paralelos: 3,
};

describe('ReporteCursosParalelosComponent', () => {
  let fixture: ComponentFixture<ReporteCursosParalelosComponent>;
  let component: ReporteCursosParalelosComponent;
  let source: ReporteCursosParalelosDataSource;

  beforeEach(async () => {
    source = {
      cargarCatalogos: vi.fn().mockReturnValue(of(CATALOGOS)),
      consultar: vi.fn().mockReturnValue(of([FILA_SISTEMAS])),
    };

    await TestBed.configureTestingModule({
      imports: [ReporteCursosParalelosComponent],
      providers: [
        { provide: REPORTE_CURSOS_PARALELOS_SOURCE, useValue: source },
      ],
    })
      .overrideComponent(ReporteCursosParalelosComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ReporteCursosParalelosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('muestra el estado pendiente si no hay proveedor de datos', () => {
    TestBed.overrideProvider(REPORTE_CURSOS_PARALELOS_SOURCE, {
      useValue: null,
    });
    crearComponente();

    expect(component.estado).toBe('servicioPendiente');
    expect(source.cargarCatalogos).not.toHaveBeenCalled();
  });

  it('carga catálogos y consulta inicialmente sin filtros', () => {
    crearComponente();

    expect(source.cargarCatalogos).toHaveBeenCalledOnce();
    expect(source.consultar).toHaveBeenCalledWith({
      filtros: FILTROS_VACIOS,
      niveles: [],
    });
    expect(component.catalogos).toEqual(CATALOGOS);
    expect(component.estado).toBe('cargado');
  });

  it('envía los filtros y niveles seleccionados al proveedor', () => {
    crearComponente();

    component.aplicarFiltros(FILTROS_SISTEMAS);
    component.cambiarNiveles([1, 3]);

    expect(source.consultar).toHaveBeenLastCalledWith({
      filtros: FILTROS_SISTEMAS,
      niveles: [1, 3],
    });
  });

  it('limpia los niveles al cambiar a una carrera con otra malla', () => {
    crearComponente();
    component.aplicarFiltros(FILTROS_SISTEMAS);
    component.cambiarNiveles([1]);

    component.aplicarFiltros({
      ...FILTROS_SISTEMAS,
      carreraId: 'car-ind',
    });

    expect(component.nivelesSeleccionados).toEqual([]);
    expect(source.consultar).toHaveBeenLastCalledWith({
      filtros: { ...FILTROS_SISTEMAS, carreraId: 'car-ind' },
      niveles: [],
    });
  });

  it('muestra estado vacío con totales cero y filas vacías', () => {
    source.consultar = vi.fn().mockReturnValue(of([]));
    crearComponente();

    expect(component.estado).toBe('vacio');
    expect(component.filas).toEqual([]);
    expect(component.resumen.totalCursos).toBe(0);
    expect(component.resumen.totalParalelos).toBe(0);
  });

  it('permite reintentar una consulta fallida con los mismos filtros', () => {
    source.consultar = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('API no disponible')))
      .mockReturnValue(of([FILA_SISTEMAS]));
    crearComponente();
    expect(component.estado).toBe('error');

    component.reintentar();

    expect(component.estado).toBe('cargado');
    expect(source.consultar).toHaveBeenCalledTimes(2);
    expect(component.filas).toEqual([FILA_SISTEMAS]);
  });

  it('ignora la respuesta anterior si ya inició una consulta más reciente', () => {
    const respuestaAnterior = new Subject<readonly FilaCursosParalelos[]>();
    const respuestaActual = new Subject<readonly FilaCursosParalelos[]>();
    source.consultar = vi
      .fn()
      .mockReturnValueOnce(respuestaAnterior)
      .mockReturnValueOnce(respuestaActual);
    crearComponente();

    component.aplicarFiltros(FILTROS_SISTEMAS);
    respuestaActual.next([FILA_SISTEMAS]);
    respuestaAnterior.next([FILA_INDUSTRIAL]);

    expect(component.filas).toEqual([FILA_SISTEMAS]);
  });

  it('muestra error de catálogos y permite volver a cargarlos', () => {
    source.cargarCatalogos = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('Catálogos no disponibles')))
      .mockReturnValue(of(CATALOGOS));
    crearComponente();
    expect(component.estado).toBe('error');
    expect(source.consultar).not.toHaveBeenCalled();

    component.reintentar();

    expect(source.cargarCatalogos).toHaveBeenCalledTimes(2);
    expect(component.estado).toBe('cargado');
  });
});
