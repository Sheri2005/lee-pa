/**
 * app-planificaciones-lista · C2-01 · Página (/planificacion)
 * Grupo dueño: G2 · Planificación (responsable: Raúl Garay). HU: G2-01.
 * Lista las planificaciones por carrera y período con su estado, filtros por facultad,
 * carrera, período y estado, y la acción "Nueva planificación".
 * Ejemplo de uso y piezas pendientes de otros grupos en README.md (misma carpeta).
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import { EstadoPlanificacion, Planificacion } from '../../../core/models/planificacion.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';
import { PlanificacionNuevaComponent } from '../planificacion-nueva/planificacion-nueva.component';

interface Opcion {
  id: number;
  etiqueta: string;
}

type EstadoLista =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'listo'; items: Planificacion[] };

let siguienteId = 0;

const ESTADOS: EstadoPlanificacion[] = [
  'BORRADOR',
  'PENDIENTE',
  'APROBADA',
  'RECHAZADA',
  'CON_CAMBIOS',
];

const ETIQUETAS_ESTADO: Record<EstadoPlanificacion, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CON_CAMBIOS: 'Con cambios',
};

// EDITAR (C5-08): cuando G5 publique app-estado-badge, borrar este mapa y usar el badge.
// Clases completas (no armadas con texto dinámico) para que Tailwind las detecte.
const CLASES_ESTADO: Record<EstadoPlanificacion, string> = {
  BORRADOR: 'border-border bg-muted text-text-secondary',
  PENDIENTE: 'border-accent-gold/40 bg-accent-gold/10 text-primary-dark',
  APROBADA: 'border-primary bg-primary text-white',
  RECHAZADA: 'border-wine-deep bg-wine-deep text-white',
  CON_CAMBIOS: 'border-accent/40 bg-accent/10 text-accent',
};

/** Opciones sin repetir (una carrera aparece en varias planificaciones), ordenadas por texto. */
function opcionesUnicas(
  items: Planificacion[],
  obtener: (p: Planificacion) => Opcion,
  descendente = false,
): Opcion[] {
  const porId = new Map<number, Opcion>();
  for (const p of items) {
    const opcion = obtener(p);
    porId.set(opcion.id, opcion);
  }
  const orden = [...porId.values()].sort((a, b) =>
    a.etiqueta.localeCompare(b.etiqueta, 'es', { numeric: true }),
  );
  return descendente ? orden.reverse() : orden;
}

/** "" (opción "Todas") → null; "5" → 5. */
function numeroONulo(valor: string): number | null {
  const numero = Number(valor);
  return valor !== '' && Number.isInteger(numero) ? numero : null;
}

@Component({
  selector: 'app-planificaciones-lista',
  imports: [RouterLink, EstadoVacioComponent, SpinnerCargaComponent, PlanificacionNuevaComponent],
  templateUrl: './planificaciones-lista.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PlanificacionesListaComponent {
  private readonly servicio = inject(PlanificacionService);

  readonly idFacultad = `plan-lista-facultad-${siguienteId}`;
  readonly idCarrera = `plan-lista-carrera-${siguienteId}`;
  readonly idPeriodo = `plan-lista-periodo-${siguienteId}`;
  readonly idEstado = `plan-lista-estado-${siguienteId++}`;

  readonly estados = ESTADOS.map((valor) => ({ valor, etiqueta: ETIQUETAS_ESTADO[valor] }));

  // Filtros. EDITAR (C1-22, C1-25, C1-28, C5-09): al usar los selectores reales, se actualizan
  // desde sus salidas, p. ej. (facultadChange)="facultadId.set($event?.id ?? null)".
  readonly facultadId = signal<number | null>(null);
  readonly carreraId = signal<number | null>(null);
  readonly periodoId = signal<number | null>(null);
  readonly estadoFiltro = signal<EstadoPlanificacion | null>(null);

  /** Muestra el diálogo app-planificacion-nueva (C2-02). */
  readonly nuevaAbierta = signal(false);

  private readonly intento = signal(0);

  readonly vista = toSignal(
    toObservable(this.intento).pipe(
      switchMap(() =>
        defer(() => this.servicio.listar()).pipe(
          map((items): EstadoLista => ({ tipo: 'listo', items })),
          catchError(() => of<EstadoLista>({ tipo: 'error' })),
          startWith<EstadoLista>({ tipo: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando' } as EstadoLista },
  );

  private readonly todas = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.items : [];
  });

  // EDITAR (C1-22, C1-25, C1-28): estas opciones salen de los datos cargados; los selectores
  // reales traerán las suyas desde su propio servicio.
  readonly opcionesFacultad = computed(() =>
    opcionesUnicas(this.todas(), (p) => ({ id: p.facultad.id, etiqueta: p.facultad.nombre })),
  );
  readonly opcionesCarrera = computed(() =>
    opcionesUnicas(this.todas(), (p) => ({ id: p.carrera.id, etiqueta: p.carrera.nombre })),
  );
  readonly opcionesPeriodo = computed(() =>
    opcionesUnicas(this.todas(), (p) => ({ id: p.periodo.id, etiqueta: p.periodo.codigo }), true),
  );

  readonly planificacionesVisibles = computed(() => {
    const facultad = this.facultadId();
    const carrera = this.carreraId();
    const periodo = this.periodoId();
    const estado = this.estadoFiltro();
    return this.todas().filter(
      (p) =>
        (facultad === null || p.facultad.id === facultad) &&
        (carrera === null || p.carrera.id === carrera) &&
        (periodo === null || p.periodo.id === periodo) &&
        (estado === null || p.estado === estado),
    );
  });

  readonly hayFiltros = computed(
    () =>
      this.facultadId() !== null ||
      this.carreraId() !== null ||
      this.periodoId() !== null ||
      this.estadoFiltro() !== null,
  );

  alCambiarFacultad(valor: string): void {
    this.facultadId.set(numeroONulo(valor));
  }

  alCambiarCarrera(valor: string): void {
    this.carreraId.set(numeroONulo(valor));
  }

  alCambiarPeriodo(valor: string): void {
    this.periodoId.set(numeroONulo(valor));
  }

  alCambiarEstado(valor: string): void {
    this.estadoFiltro.set(ESTADOS.find((estado) => estado === valor) ?? null);
  }

  limpiarFiltros(): void {
    this.facultadId.set(null);
    this.carreraId.set(null);
    this.periodoId.set(null);
    this.estadoFiltro.set(null);
  }

  /** Vuelve a pedir las planificaciones (reintento tras un error o recarga tras crear una). */
  recargar(): void {
    this.intento.update((valor) => valor + 1);
  }

  abrirNueva(): void {
    this.nuevaAbierta.set(true);
  }

  cerrarNueva(): void {
    this.nuevaAbierta.set(false);
  }

  etiquetaEstado(estado: EstadoPlanificacion): string {
    return ETIQUETAS_ESTADO[estado];
  }

  claseEstado(estado: EstadoPlanificacion): string {
    return CLASES_ESTADO[estado];
  }
}
