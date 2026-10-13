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
import {
  REPORTE_MATERIAS_COMPARTIDAS_SOURCE,
} from './reporte-materias-compartidas.data-source';
import {
  type CatalogosReporteMateriasCompartidas,
  type ConsultaReporteMateriasCompartidas,
  type FilaMateriaCompartida,
  resumirMateriasCompartidas,
} from './reporte-materias-compartidas.models';

export type EstadoReporteMateriasCompartidas =
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
  selector: 'app-reporte-materias-compartidas',
  standalone: true,
  imports: [FiltrosReporteComponent, TarjetaIndicadorComponent, BotonExportarComponent],
  templateUrl: './reporte-materias-compartidas.html',
})
export class ReporteMateriasCompartidasComponent implements OnInit {
  private readonly dataSource = inject(REPORTE_MATERIAS_COMPARTIDAS_SOURCE, {
    optional: true,
  });
  private readonly destroyRef = inject(DestroyRef);
  private readonly consultas$ = new Subject<ConsultaReporteMateriasCompartidas>();

  readonly columnasExportacion: readonly ColumnaExportacion[] = [
    { clave: 'materia', encabezado: 'Materia' },
    { clave: 'carreraResponsable', encabezado: 'Carrera responsable' },
    { clave: 'carreraDependiente', encabezado: 'Carrera dependiente' },
    { clave: 'cuposSolicitados', encabezado: 'Cupos solicitados' },
  ];

  estado: EstadoReporteMateriasCompartidas = 'cargando';
  catalogos: CatalogosReporteMateriasCompartidas | null = null;
  filas: readonly FilaMateriaCompartida[] = [];
  filtrosAplicados: FiltrosReporte = { ...FILTROS_VACIOS };
  materiaIdSeleccionada: string | null = null;
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

  get resumen(): ReturnType<typeof resumirMateriasCompartidas> {
    return resumirMateriasCompartidas(this.filas);
  }

  aplicarFiltros(filtros: FiltrosReporte): void {
    this.filtrosAplicados = { ...filtros };
    this.consultar();
  }

  cambiarMateria(materiaId: string | null): void {
    this.materiaIdSeleccionada = materiaId;
    this.consultar();
  }

  claveFila(fila: FilaMateriaCompartida): string {
    return JSON.stringify([fila.materiaId, fila.carreraDependienteId]);
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
          this.materiaIdSeleccionada = null;
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
      materiaId: this.materiaIdSeleccionada,
    });
  }
}
