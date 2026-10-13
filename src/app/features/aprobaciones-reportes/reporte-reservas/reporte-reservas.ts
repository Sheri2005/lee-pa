import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, Subject, switchMap } from 'rxjs';

import {
  FiltrosReporteComponent,
  type FiltrosReporte,
} from '../../../shared/components/filtros-reporte';
import { GraficoComponent } from '../../../shared/components/grafico';
import type { GraficoSerie } from '../../../shared/components/grafico';
import { TarjetaIndicadorComponent } from '../../../shared/components/tarjeta-indicador/tarjeta-indicador';
import {
  BotonExportarComponent,
  type ColumnaExportacion,
} from '../../../shared/components/boton-exportar/boton-exportar';
import { REPORTE_RESERVAS_SOURCE } from './reporte-reservas.data-source';
import {
  construirCalendarioMensual,
  type CatalogosReporteReservas,
  type ConsultaReporteReservas,
  type DiaCalendarioReservas,
  type FilaReservaReporte,
  resumirReporteReservas,
} from './reporte-reservas.models';

export type EstadoReporteReservas =
  | 'servicioPendiente'
  | 'cargando'
  | 'error'
  | 'vacio'
  | 'cargado';

const FILTROS_VACIOS: FiltrosReporte = {
  facultadId: null,
  carreraId: null,
  periodoId: null,
  fechaInicio: null,
  fechaFin: null,
};

@Component({
  selector: 'app-reporte-reservas',
  standalone: true,
  imports: [
    DecimalPipe,
    FiltrosReporteComponent,
    GraficoComponent,
    TarjetaIndicadorComponent,
    BotonExportarComponent,
  ],
  templateUrl: './reporte-reservas.html',
})
export class ReporteReservasComponent implements OnInit {
  private readonly dataSource = inject(REPORTE_RESERVAS_SOURCE, {
    optional: true,
  });
  private readonly destroyRef = inject(DestroyRef);
  private readonly consultas$ = new Subject<ConsultaReporteReservas>();
  private readonly hoy = new Date();

  readonly nombresDias = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ];
  readonly columnasExportacion: readonly ColumnaExportacion[] = [
    { clave: 'fecha', encabezado: 'Fecha' },
    { clave: 'espacio', encabezado: 'Espacio' },
    { clave: 'solicitante', encabezado: 'Solicitante' },
    { clave: 'estado', encabezado: 'Estado' },
    { clave: 'tiempoAprobacionHoras', encabezado: 'Tiempo de aprobación (horas)' },
  ];

  estado: EstadoReporteReservas = 'cargando';
  catalogos: CatalogosReporteReservas | null = null;
  filas: readonly FilaReservaReporte[] = [];
  filtrosAplicados: FiltrosReporte = { ...FILTROS_VACIOS };
  espacioIdSeleccionado: string | null = null;
  anio = this.hoy.getFullYear();
  mes = this.hoy.getMonth() + 1;
  mensajeError = '';

  private tipoError: 'catalogos' | 'consulta' = 'catalogos';

  ngOnInit(): void {
    if (!this.dataSource) {
      this.estado = 'servicioPendiente';
      return;
    }

    this.consultas$
      .pipe(
        switchMap((consulta) => {
          this.estado = 'cargando';
          this.mensajeError = '';
          this.tipoError = 'consulta';

          return this.dataSource!.consultar(consulta).pipe(
            catchError(() => {
              this.estado = 'error';
              this.mensajeError = 'No se pudo cargar el reporte. Intenta nuevamente.';
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((filas) => {
        this.filas = filas;
        this.estado = filas.length > 0 ? 'cargado' : 'vacio';
      });

    this.cargarCatalogos();
  }

  get nombreMes(): string {
    return new Intl.DateTimeFormat('es-EC', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(Date.UTC(this.anio, this.mes - 1, 1));
  }

  get espacioSeleccionadoNombre(): string | null {
    return (
      this.catalogos?.espacios.find(
        (espacio) => espacio.id === this.espacioIdSeleccionado,
      )?.nombre ?? null
    );
  }

  get resumen(): ReturnType<typeof resumirReporteReservas> {
    return resumirReporteReservas(this.filas, this.anio, this.mes);
  }

  get calendario(): (DiaCalendarioReservas | null)[] {
    return construirCalendarioMensual(this.anio, this.mes, this.filas);
  }

  get semanasCalendario(): (DiaCalendarioReservas | null)[][] {
    const celdas = this.calendario;
    return Array.from({ length: 6 }, (_, semana) =>
      celdas.slice(semana * 7, semana * 7 + 7),
    );
  }

  get seriesGrafico(): GraficoSerie[] {
    return [
      {
        nombre: 'Reservas',
        valores: this.resumen.reservasPorDia,
      },
    ];
  }

  aplicarFiltros(filtros: FiltrosReporte): void {
    this.filtrosAplicados = { ...filtros };
    this.consultar();
  }

  cambiarEspacio(espacioId: string | null): void {
    this.espacioIdSeleccionado = espacioId;
    this.consultar();
  }

  mesAnterior(): void {
    this.cambiarMes(this.anio, this.mes - 1);
  }

  mesSiguiente(): void {
    this.cambiarMes(this.anio, this.mes + 1);
  }

  reintentar(): void {
    if (!this.dataSource) {
      this.estado = 'servicioPendiente';
      return;
    }

    if (!this.catalogos || this.tipoError === 'catalogos') {
      this.cargarCatalogos();
      return;
    }

    this.consultar();
  }

  private cambiarMes(anio: number, mes: number): void {
    const fecha = new Date(Date.UTC(anio, mes - 1, 1));
    this.anio = fecha.getUTCFullYear();
    this.mes = fecha.getUTCMonth() + 1;
    this.consultar();
  }

  private cargarCatalogos(): void {
    if (!this.dataSource) {
      this.estado = 'servicioPendiente';
      return;
    }

    this.estado = 'cargando';
    this.mensajeError = '';
    this.tipoError = 'catalogos';

    this.dataSource
      .cargarCatalogos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalogos) => {
          this.catalogos = catalogos;
          this.filtrosAplicados = { ...FILTROS_VACIOS };
          this.espacioIdSeleccionado = null;
          this.consultar();
        },
        error: () => {
          this.estado = 'error';
          this.mensajeError = 'No se pudieron cargar los filtros. Intenta nuevamente.';
        },
      });
  }

  private consultar(): void {
    if (!this.dataSource || !this.catalogos) {
      return;
    }

    this.consultas$.next({
      filtros: { ...this.filtrosAplicados },
      espacioId: this.espacioIdSeleccionado,
      anio: this.anio,
      mes: this.mes,
    });
  }
}
