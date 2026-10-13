import {
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, Subject, switchMap } from 'rxjs';

import {
  FiltrosReporteComponent,
  type FiltrosReporte,
} from '../../../shared/components/filtros-reporte';
import {
  TarjetaIndicadorComponent,
} from '../../../shared/components/tarjeta-indicador/tarjeta-indicador';
import { GraficoComponent } from '../../../shared/components/grafico';
import {
  BotonExportarComponent,
  type ColumnaExportacion,
} from '../../../shared/components/boton-exportar/boton-exportar';
import {
  REPORTE_CURSOS_PARALELOS_SOURCE,
} from './reporte-cursos-paralelos.data-source';
import {
  type CatalogosCursosParalelos,
  type ConsultaCursosParalelos,
  type FilaCursosParalelos,
  resumirReporteCursosParalelos,
} from './reporte-cursos-paralelos.models';

export type EstadoReporteCursosParalelos =
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
  selector: 'app-reporte-cursos-paralelos',
  standalone: true,
  imports: [
    FiltrosReporteComponent,
    TarjetaIndicadorComponent,
    GraficoComponent,
    BotonExportarComponent,
  ],
  templateUrl: './reporte-cursos-paralelos.html',
})
export class ReporteCursosParalelosComponent implements OnInit {
  private readonly dataSource = inject(REPORTE_CURSOS_PARALELOS_SOURCE, {
    optional: true,
  });
  private readonly destroyRef = inject(DestroyRef);
  private readonly consultas$ = new Subject<ConsultaCursosParalelos>();

  readonly columnasExportacion: readonly ColumnaExportacion[] = [
    { clave: 'facultad', encabezado: 'Facultad' },
    { clave: 'carrera', encabezado: 'Carrera' },
    { clave: 'periodo', encabezado: 'Período' },
    { clave: 'nivel', encabezado: 'Nivel' },
    { clave: 'cursos', encabezado: 'Cursos aperturados' },
    { clave: 'paralelos', encabezado: 'Paralelos aperturados' },
  ];

  estado: EstadoReporteCursosParalelos = 'cargando';
  catalogos: CatalogosCursosParalelos | null = null;
  filas: readonly FilaCursosParalelos[] = [];
  filtrosAplicados: FiltrosReporte = { ...FILTROS_VACIOS };
  nivelesSeleccionados: number[] = [];
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

  get resumen(): ReturnType<typeof resumirReporteCursosParalelos> {
    return resumirReporteCursosParalelos(this.filas);
  }

  get mallaIdSeleccionada(): string | null {
    const carreraId = this.filtrosAplicados.carreraId;

    return carreraId && this.catalogos
      ? (this.catalogos.mallaIdPorCarreraId[carreraId] ?? null)
      : null;
  }

  get nivelesDisponibles(): readonly number[] {
    const mallaId = this.mallaIdSeleccionada;

    return mallaId && this.catalogos
      ? (this.catalogos.nivelesPorMallaId[mallaId] ?? [])
      : [];
  }

  aplicarFiltros(filtros: FiltrosReporte): void {
    const mallaAnterior = this.mallaParaCarrera(this.filtrosAplicados.carreraId);
    const mallaNueva = this.mallaParaCarrera(filtros.carreraId);

    if (mallaAnterior !== mallaNueva) {
      this.nivelesSeleccionados = [];
    }

    this.filtrosAplicados = { ...filtros };
    this.consultar();
  }

  cambiarNiveles(niveles: readonly number[]): void {
    const disponibles = new Set(this.nivelesDisponibles);
    this.nivelesSeleccionados = [...new Set(niveles)]
      .filter((nivel) => disponibles.has(nivel))
      .sort((a, b) => a - b);

    this.consultar();
  }

  alternarNivel(nivel: number, event: Event): void {
    const seleccionado = (event.target as HTMLInputElement).checked;
    const niveles = seleccionado
      ? [...this.nivelesSeleccionados, nivel]
      : this.nivelesSeleccionados.filter((actual) => actual !== nivel);

    this.cambiarNiveles(niveles);
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
          this.nivelesSeleccionados = [];
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
      niveles: [...this.nivelesSeleccionados],
    });
  }

  private mallaParaCarrera(carreraId: string | null): string | null {
    return carreraId && this.catalogos
      ? (this.catalogos.mallaIdPorCarreraId[carreraId] ?? null)
      : null;
  }
}
