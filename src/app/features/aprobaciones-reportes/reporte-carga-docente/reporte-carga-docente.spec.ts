import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import type { FiltrosReporte } from '../../../shared/components/filtros-reporte';
import {
  REPORTE_CARGA_DOCENTE_SOURCE,
  type ReporteCargaDocenteDataSource,
} from './reporte-carga-docente.data-source';
import {
  type CatalogosReporteCargaDocente,
  type FilaCargaDocente,
} from './reporte-carga-docente.models';
import { ReporteCargaDocenteComponent } from './reporte-carga-docente';

const FILTROS_VACIOS: FiltrosReporte = {
  facultadId: null,
  carreraId: null,
  periodoId: null,
  fechaInicio: null,
  fechaFin: null,
};

const CATALOGOS: CatalogosReporteCargaDocente = {
  facultades: [],
  carreras: [],
  periodos: [],
  docentes: [
    { id: 'doc-1', nombre: 'Ana Pérez' },
    { id: 'doc-2', nombre: 'Luis Mora' },
  ],
};

const FILA_DOCENTE: FilaCargaDocente = {
  docenteId: 'doc-1',
  docente: 'Ana Pérez',
  horasAsignadas: 20,
  cargaMaxima: 18,
};

describe('ReporteCargaDocenteComponent', () => {
  let fixture: ComponentFixture<ReporteCargaDocenteComponent>;
  let component: ReporteCargaDocenteComponent;
  let source: ReporteCargaDocenteDataSource;

  beforeEach(async () => {
    source = {
      cargarCatalogos: vi.fn().mockReturnValue(of(CATALOGOS)),
      consultar: vi.fn().mockReturnValue(of([FILA_DOCENTE])),
    };

    await TestBed.configureTestingModule({
      imports: [ReporteCargaDocenteComponent],
      providers: [{ provide: REPORTE_CARGA_DOCENTE_SOURCE, useValue: source }],
    })
      .overrideComponent(ReporteCargaDocenteComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ReporteCargaDocenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('muestra servicio pendiente cuando no existe proveedor', () => {
    TestBed.overrideProvider(REPORTE_CARGA_DOCENTE_SOURCE, { useValue: null });
    crearComponente();

    expect(component.estado).toBe('servicioPendiente');
    expect(source.cargarCatalogos).not.toHaveBeenCalled();
  });

  it('carga catálogos y ejecuta una consulta inicial sin filtros', () => {
    crearComponente();

    expect(source.cargarCatalogos).toHaveBeenCalledOnce();
    expect(source.consultar).toHaveBeenCalledWith({
      filtros: FILTROS_VACIOS,
      docenteId: null,
    });
    expect(component.filas).toEqual([FILA_DOCENTE]);
    expect(component.estado).toBe('cargado');
  });

  it('envía al proveedor los filtros y el docente seleccionado', () => {
    crearComponente();
    component.aplicarFiltros({ ...FILTROS_VACIOS, periodoId: 'per-1' });
    component.cambiarDocente('doc-2');

    expect(source.consultar).toHaveBeenLastCalledWith({
      filtros: { ...FILTROS_VACIOS, periodoId: 'per-1' },
      docenteId: 'doc-2',
    });
  });

  it('marca docentes con carga excedida y permite reintentar errores', () => {
    source.consultar = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('No disponible')))
      .mockReturnValue(of([FILA_DOCENTE]));
    crearComponente();
    expect(component.estado).toBe('error');

    component.reintentar();

    expect(component.estado).toBe('cargado');
    expect(component.filasSobrecargadas).toEqual([FILA_DOCENTE]);
    expect(source.consultar).toHaveBeenCalledTimes(2);
  });

  it('representa la respuesta vacía sin conservar filas previas', () => {
    source.consultar = vi.fn().mockReturnValue(of([]));
    crearComponente();

    expect(component.estado).toBe('vacio');
    expect(component.filas).toEqual([]);
  });
});
