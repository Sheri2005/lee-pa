import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import type { FiltrosReporte } from '../../../shared/components/filtros-reporte';
import {
  REPORTE_MATERIAS_COMPARTIDAS_SOURCE,
  type ReporteMateriasCompartidasDataSource,
} from './reporte-materias-compartidas.data-source';
import {
  type CatalogosReporteMateriasCompartidas,
  type FilaMateriaCompartida,
} from './reporte-materias-compartidas.models';
import { ReporteMateriasCompartidasComponent } from './reporte-materias-compartidas';

const FILTROS_VACIOS: FiltrosReporte = {
  facultadId: null,
  carreraId: null,
  periodoId: null,
  fechaInicio: null,
  fechaFin: null,
};

const CATALOGOS: CatalogosReporteMateriasCompartidas = {
  facultades: [],
  carreras: [],
  periodos: [],
  materias: [
    { id: 'mat-1', nombre: 'Matemática' },
    { id: 'mat-2', nombre: 'Física' },
  ],
};

const FILA: FilaMateriaCompartida = {
  materiaId: 'mat-1',
  materia: 'Matemática',
  carreraResponsableId: 'car-sis',
  carreraResponsable: 'Sistemas',
  carreraDependienteId: 'car-ind',
  carreraDependiente: 'Industrial',
  cuposSolicitados: 20,
};

describe('ReporteMateriasCompartidasComponent', () => {
  let fixture: ComponentFixture<ReporteMateriasCompartidasComponent>;
  let component: ReporteMateriasCompartidasComponent;
  let source: ReporteMateriasCompartidasDataSource;

  beforeEach(async () => {
    source = {
      cargarCatalogos: vi.fn().mockReturnValue(of(CATALOGOS)),
      consultar: vi.fn().mockReturnValue(of([FILA])),
    };

    await TestBed.configureTestingModule({
      imports: [ReporteMateriasCompartidasComponent],
      providers: [
        { provide: REPORTE_MATERIAS_COMPARTIDAS_SOURCE, useValue: source },
      ],
    })
      .overrideComponent(ReporteMateriasCompartidasComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ReporteMateriasCompartidasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('muestra servicio pendiente si no hay proveedor', () => {
    TestBed.overrideProvider(REPORTE_MATERIAS_COMPARTIDAS_SOURCE, {
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
      materiaId: null,
    });
    expect(component.filas).toEqual([FILA]);
    expect(component.estado).toBe('cargado');
  });

  it('envía los filtros y la materia seleccionada al proveedor', () => {
    crearComponente();
    component.aplicarFiltros({ ...FILTROS_VACIOS, periodoId: 'per-1' });
    component.cambiarMateria('mat-2');

    expect(source.consultar).toHaveBeenLastCalledWith({
      filtros: { ...FILTROS_VACIOS, periodoId: 'per-1' },
      materiaId: 'mat-2',
    });
  });

  it('permite reintentar una consulta fallida', () => {
    source.consultar = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('No disponible')))
      .mockReturnValue(of([FILA]));
    crearComponente();
    expect(component.estado).toBe('error');

    component.reintentar();

    expect(component.estado).toBe('cargado');
    expect(component.filas).toEqual([FILA]);
  });

  it('muestra el estado vacío cuando la respuesta no contiene filas', () => {
    source.consultar = vi.fn().mockReturnValue(of([]));
    crearComponente();

    expect(component.estado).toBe('vacio');
    expect(component.filas).toEqual([]);
    expect(component.resumen.totalCuposSolicitados).toBe(0);
  });
});
