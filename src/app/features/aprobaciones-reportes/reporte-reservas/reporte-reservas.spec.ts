import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import type { FiltrosReporte } from '../../../shared/components/filtros-reporte';
import {
  REPORTE_RESERVAS_SOURCE,
  type ReporteReservasDataSource,
} from './reporte-reservas.data-source';
import {
  type CatalogosReporteReservas,
  type FilaReservaReporte,
} from './reporte-reservas.models';
import { ReporteReservasComponent } from './reporte-reservas';

const FILTROS_VACIOS: FiltrosReporte = {
  facultadId: null,
  carreraId: null,
  periodoId: null,
  fechaInicio: null,
  fechaFin: null,
};

const CATALOGOS: CatalogosReporteReservas = {
  facultades: [],
  carreras: [],
  periodos: [],
  espacios: [{ id: 'esp-1', nombre: 'Aula 1' }],
};

const FILAS: FilaReservaReporte[] = [
  {
    reservaId: 'res-1',
    fecha: '2026-10-03',
    espacioId: 'esp-1',
    espacio: 'Aula 1',
    solicitante: 'Ana',
    estado: 'Aprobada',
    tiempoAprobacionHoras: 2,
  },
];

describe('ReporteReservasComponent', () => {
  let fixture: ComponentFixture<ReporteReservasComponent>;
  let component: ReporteReservasComponent;
  let source: ReporteReservasDataSource;

  beforeEach(async () => {
    source = {
      cargarCatalogos: vi.fn().mockReturnValue(of(CATALOGOS)),
      consultar: vi.fn().mockReturnValue(of(FILAS)),
    };

    await TestBed.configureTestingModule({
      imports: [ReporteReservasComponent],
      providers: [{ provide: REPORTE_RESERVAS_SOURCE, useValue: source }],
    })
      .overrideComponent(ReporteReservasComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();
  });

  function crearComponente(): void {
    fixture = TestBed.createComponent(ReporteReservasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('muestra servicio pendiente cuando no hay proveedor', () => {
    TestBed.overrideProvider(REPORTE_RESERVAS_SOURCE, { useValue: null });
    crearComponente();

    expect(component.estado).toBe('servicioPendiente');
    expect(source.cargarCatalogos).not.toHaveBeenCalled();
  });

  it('carga resultados del mes actual y catálogos', () => {
    crearComponente();
    const ahora = new Date();

    expect(source.cargarCatalogos).toHaveBeenCalledOnce();
    expect(source.consultar).toHaveBeenCalledWith({
      filtros: FILTROS_VACIOS,
      espacioId: null,
      anio: ahora.getFullYear(),
      mes: ahora.getMonth() + 1,
    });
    expect(component.estado).toBe('cargado');
  });

  it('cambia el mes y el espacio en la consulta', () => {
    crearComponente();
    const ahora = new Date();
    component.cambiarEspacio('esp-1');
    component.mesSiguiente();

    const fechaSiguiente = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
    expect(source.consultar).toHaveBeenLastCalledWith({
      filtros: FILTROS_VACIOS,
      espacioId: 'esp-1',
      anio: fechaSiguiente.getFullYear(),
      mes: fechaSiguiente.getMonth() + 1,
    });
  });

  it('permite reintentar una consulta fallida', () => {
    source.consultar = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('No disponible')))
      .mockReturnValue(of(FILAS));
    crearComponente();
    expect(component.estado).toBe('error');

    component.reintentar();

    expect(component.estado).toBe('cargado');
    expect(component.filas).toEqual(FILAS);
  });

  it('muestra estado vacío con lista sin resultados', () => {
    source.consultar = vi.fn().mockReturnValue(of([]));
    crearComponente();

    expect(component.estado).toBe('vacio');
    expect(component.filas).toEqual([]);
  });
});
