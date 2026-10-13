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
import { REPORTE_OCUPACION_SOURCE } from './reporte-ocupacion.data-source';
import {
  type CatalogosReporteOcupacion,
  type CeldaOcupacionSemanal,
  type ConsultaReporteOcupacion,
  type DiaSemana,
  type FilaOcupacion,
  type OpcionEspacioOcupacion,
  type ResultadoReporteOcupacion,
  resumirReporteOcupacion,
} from './reporte-ocupacion.models';

export type EstadoReporteOcupacion =
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

const DIAS_SEMANA: readonly { id: DiaSemana; nombre: string }[] = [
  { id: 'lunes', nombre: 'Lunes' },
  { id: 'martes', nombre: 'Martes' },
  { id: 'miercoles', nombre: 'Miércoles' },
  { id: 'jueves', nombre: 'Jueves' },
  { id: 'viernes', nombre: 'Viernes' },
  { id: 'sabado', nombre: 'Sábado' },
  { id: 'domingo', nombre: 'Domingo' },
];

@Component({
  selector: 'app-reporte-ocupacion',
  standalone: true,
  imports: [
    DecimalPipe,
    FiltrosReporteComponent,
    GraficoComponent,
    TarjetaIndicadorComponent,
    BotonExportarComponent,
  ],
  templateUrl: './reporte-ocupacion.html',
})
export class ReporteOcupacionComponent implements OnInit {
  private readonly dataSource = inject(REPORTE_OCUPACION_SOURCE, {
    optional: true,
  });
  private readonly destroyRef = inject(DestroyRef);
  private readonly consultas$ = new Subject<ConsultaReporteOcupacion>();

  readonly diasSemana = DIAS_SEMANA;
  readonly columnasExportacion: readonly ColumnaExportacion[] = [
    { clave: 'edificio', encabezado: 'Edificio' },
    { clave: 'espacio', encabezado: 'Espacio' },
    { clave: 'franjasOcupadas', encabezado: 'Franjas ocupadas' },
    { clave: 'franjasDisponibles', encabezado: 'Franjas disponibles' },
    { clave: 'porcentajeOcupacion', encabezado: 'Ocupación (%)' },
  ];

  estado: EstadoReporteOcupacion = 'cargando';
  catalogos: CatalogosReporteOcupacion | null = null;
  resultado: ResultadoReporteOcupacion = { filas: [], grillaSemanal: [] };
  filtrosAplicados: FiltrosReporte = { ...FILTROS_VACIOS };
  edificioIdSeleccionado: string | null = null;
  espacioIdSeleccionado: string | null = null;
  franjaIdSeleccionada: string | null = null;
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
      .subscribe((resultado) => {
        this.resultado = resultado;
        this.estado = resultado.filas.length > 0 ? 'cargado' : 'vacio';
      });

    this.cargarCatalogos();
  }

  get filas(): readonly FilaOcupacion[] {
    return this.resultado.filas;
  }

  get filasExportacion(): readonly (FilaOcupacion & { porcentajeOcupacion: number })[] {
    return this.filas.map((fila) => ({
      ...fila,
      porcentajeOcupacion:
        fila.franjasDisponibles === 0
          ? 0
          : (fila.franjasOcupadas / fila.franjasDisponibles) * 100,
    }));
  }

  get grillaSemanal(): readonly CeldaOcupacionSemanal[] {
    if (!this.espacioIdSeleccionado) {
      return [];
    }

    return this.resultado.grillaSemanal.filter(
      (celda) => celda.espacioId === this.espacioIdSeleccionado,
    );
  }

  get espaciosDisponibles(): readonly OpcionEspacioOcupacion[] {
    if (!this.catalogos) {
      return [];
    }

    return this.edificioIdSeleccionado
      ? this.catalogos.espacios.filter(
          (espacio) => espacio.edificioId === this.edificioIdSeleccionado,
        )
      : this.catalogos.espacios;
  }

  get franjasVisibles(): readonly CatalogosReporteOcupacion['franjas'][number][] {
    if (!this.catalogos) {
      return [];
    }

    return this.franjaIdSeleccionada
      ? this.catalogos.franjas.filter(
          (franja) => franja.id === this.franjaIdSeleccionada,
        )
      : this.catalogos.franjas;
  }

  get resumen(): ReturnType<typeof resumirReporteOcupacion> {
    return resumirReporteOcupacion(this.filas);
  }

  get seriesGrafico(): GraficoSerie[] {
    return [
      {
        nombre: 'Ocupación (%)',
        valores: this.resumen.porcentajesPorEspacio,
      },
    ];
  }

  aplicarFiltros(filtros: FiltrosReporte): void {
    this.filtrosAplicados = { ...filtros };
    this.consultar();
  }

  cambiarEdificio(edificioId: string | null): void {
    this.edificioIdSeleccionado = edificioId;

    if (
      this.espacioIdSeleccionado &&
      !this.espaciosDisponibles.some(
        (espacio) => espacio.id === this.espacioIdSeleccionado,
      )
    ) {
      this.espacioIdSeleccionado = null;
    }

    this.consultar();
  }

  cambiarEspacio(espacioId: string | null): void {
    this.espacioIdSeleccionado = espacioId;
    this.consultar();
  }

  cambiarFranja(franjaId: string | null): void {
    this.franjaIdSeleccionada = franjaId;
    this.consultar();
  }

  celdaEn(dia: DiaSemana, franjaId: string): CeldaOcupacionSemanal | undefined {
    return this.grillaSemanal.find(
      (celda) => celda.dia === dia && celda.franjaId === franjaId,
    );
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
          this.edificioIdSeleccionado = null;
          this.espacioIdSeleccionado = null;
          this.franjaIdSeleccionada = null;
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
      edificioId: this.edificioIdSeleccionado,
      espacioId: this.espacioIdSeleccionado,
      franjaId: this.franjaIdSeleccionada,
    });
  }
}
