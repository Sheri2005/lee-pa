import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

export interface OpcionFiltroReporte {
  id: string;
  nombre: string;
}

export interface OpcionCarreraReporte extends OpcionFiltroReporte {
  facultadId: string;
}

export interface FiltrosReporte {
  facultadId: string | null;
  carreraId: string | null;
  periodoId: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
}

@Component({
  selector: 'app-filtros-reporte',
  standalone: true,
  templateUrl: './filtros-reporte.html',
})
export class FiltrosReporteComponent implements OnChanges {
  @Input() facultades: readonly OpcionFiltroReporte[] = [];
  @Input() carreras: readonly OpcionCarreraReporte[] = [];
  @Input() periodos: readonly OpcionFiltroReporte[] = [];

  @Output() filtrosAplicados = new EventEmitter<FiltrosReporte>();

  filtros: FiltrosReporte = {
    facultadId: null,
    carreraId: null,
    periodoId: null,
    fechaInicio: null,
    fechaFin: null,
  };
  intentoAplicar = false;

  ngOnChanges(_changes: SimpleChanges): void {
    if (
      this.filtros.facultadId &&
      !this.facultades.some(
        (facultad) => facultad.id === this.filtros.facultadId,
      )
    ) {
      this.filtros = { ...this.filtros, facultadId: null, carreraId: null };
      return;
    }

    if (
      this.filtros.carreraId &&
      !this.carrerasDisponibles.some(
        (carrera) => carrera.id === this.filtros.carreraId,
      )
    ) {
      this.filtros = { ...this.filtros, carreraId: null };
    }
  }

  get carrerasDisponibles(): readonly OpcionCarreraReporte[] {
    if (!this.filtros.facultadId) {
      return [];
    }

    return this.carreras.filter(
      (carrera) => carrera.facultadId === this.filtros.facultadId,
    );
  }

  get carreraDeshabilitada(): boolean {
    return this.carrerasDisponibles.length === 0;
  }

  get rangoFechasInvalido(): boolean {
    const { fechaInicio, fechaFin } = this.filtros;

    return Boolean(
      this.intentoAplicar &&
        fechaInicio &&
        fechaFin &&
        fechaInicio > fechaFin,
    );
  }

  alCambiarFacultad(event: Event): void {
    const facultadId = (event.target as HTMLSelectElement).value || null;
    this.filtros = { ...this.filtros, facultadId, carreraId: null };
  }

  alCambiarCarrera(event: Event): void {
    const carreraId = (event.target as HTMLSelectElement).value || null;
    this.filtros = { ...this.filtros, carreraId };
  }

  alCambiarPeriodo(event: Event): void {
    const periodoId = (event.target as HTMLSelectElement).value || null;
    this.filtros = { ...this.filtros, periodoId };
  }

  alCambiarFechaInicio(event: Event): void {
    const fechaInicio = (event.target as HTMLInputElement).value || null;
    this.filtros = { ...this.filtros, fechaInicio };
  }

  alCambiarFechaFin(event: Event): void {
    const fechaFin = (event.target as HTMLInputElement).value || null;
    this.filtros = { ...this.filtros, fechaFin };
  }

  aplicarFiltros(event: Event): void {
    event.preventDefault();
    this.intentoAplicar = true;

    if (this.rangoFechasInvalido) {
      return;
    }

    this.filtrosAplicados.emit({ ...this.filtros });
  }

  limpiarFiltros(): void {
    this.intentoAplicar = false;
    this.filtros = {
      facultadId: null,
      carreraId: null,
      periodoId: null,
      fechaInicio: null,
      fechaFin: null,
    };
    this.filtrosAplicados.emit({ ...this.filtros });
  }
}
