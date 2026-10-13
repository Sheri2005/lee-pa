import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, Subject, switchMap } from 'rxjs';

import {
  FiltrosReporteComponent,
  type FiltrosReporte,
} from '../../../shared/components/filtros-reporte';
import { TarjetaIndicadorComponent } from '../../../shared/components/tarjeta-indicador/tarjeta-indicador';
import {
  BotonExportarComponent,
  type ColumnaExportacion,
} from '../../../shared/components/boton-exportar/boton-exportar';
import { REPORTE_CARGA_DOCENTE_SOURCE } from './reporte-carga-docente.data-source';
import {
  type CatalogosReporteCargaDocente,
  type ConsultaReporteCargaDocente,
  type FilaCargaDocente,
  porcentajeCargaDocente,
  resumirCargaDocente,
} from './reporte-carga-docente.models';

export type EstadoReporteCargaDocente =
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
  selector: 'app-reporte-carga-docente',
  standalone: true,
  imports: [
    DecimalPipe,
    FiltrosReporteComponent,
    TarjetaIndicadorComponent,
    BotonExportarComponent,
  ],
  templateUrl: './reporte-carga-docente.html',
})
export class ReporteCargaDocenteComponent implements OnInit {
  private readonly dataSource = inject(REPORTE_CARGA_DOCENTE_SOURCE, {
    optional: true,
  });
  private readonly destroyRef = inject(DestroyRef);
  private readonly consultas$ = new Subject<ConsultaReporteCargaDocente>();

  readonly columnasExportacion: readonly ColumnaExportacion[] = [
    { clave: 'docente', encabezado: 'Docente' },
    { clave: 'horasAsignadas', encabezado: 'Horas asignadas' },
    { clave: 'cargaMaxima', encabezado: 'Carga máxima' },
    { clave: 'porcentajeCarga', encabezado: 'Carga (%)' },
    { clave: 'estadoCarga', encabezado: 'Estado' },
  ];

  estado: EstadoReporteCargaDocente = 'cargando';
  catalogos: CatalogosReporteCargaDocente | null = null;
  filas: readonly FilaCargaDocente[] = [];
  filtrosAplicados: FiltrosReporte = { ...FILTROS_VACIOS };
  docenteIdSeleccionado: string | null = null;
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

  get resumen(): ReturnType<typeof resumirCargaDocente> {
    return resumirCargaDocente(this.filas);
  }

  get filasSobrecargadas(): readonly FilaCargaDocente[] {
    return this.filas.filter(
      (fila) => fila.horasAsignadas > fila.cargaMaxima,
    );
  }

  get filasExportacion(): readonly (FilaCargaDocente & {
    porcentajeCarga: number | string;
    estadoCarga: string;
  })[] {
    return this.filas.map((fila) => ({
      ...fila,
      porcentajeCarga: porcentajeCargaDocente(fila) ?? 'No definida',
      estadoCarga:
        fila.horasAsignadas > fila.cargaMaxima ? 'Sobrecarga' : 'Dentro del límite',
    }));
  }

  porcentaje(fila: FilaCargaDocente): number | null {
    return porcentajeCargaDocente(fila);
  }

  estaSobrecargado(fila: FilaCargaDocente): boolean {
    return fila.horasAsignadas > fila.cargaMaxima;
  }

  aplicarFiltros(filtros: FiltrosReporte): void {
    this.filtrosAplicados = { ...filtros };
    this.consultar();
  }

  cambiarDocente(docenteId: string | null): void {
    this.docenteIdSeleccionado = docenteId;
    this.consultar();
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
          this.docenteIdSeleccionado = null;
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
      docenteId: this.docenteIdSeleccionado,
    });
  }
}
