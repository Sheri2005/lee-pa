/**
 * app-materias-compartidas · C2-17 · Hijo de app-planificacion-detalle
 * Grupo dueño: G2 · Planificación (responsable: Paula Martillo). HU: G2-08.
 *
 * Vista de la carrera dependiente: las materias compartidas de su malla, qué carrera es la
 * responsable, si esa carrera ya las planificó y qué paralelos abrió. Si todavía no las
 * planificó, lo advierte; si ya hay paralelos, permite solicitar cupos en ellos.
 * Aquí nunca se aperturan paralelos: eso le toca a la carrera responsable.
 *
 * Reutiliza C2-20 (indicador de materia compartida), C2-25 (estado vacío) y C2-26 (spinner).
 * Piezas pendientes de otros grupos y ejemplo de uso en README.md (misma carpeta).
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import {
  EstadoResponsable,
  EstadoSolicitudCupo,
  ListadoMateriasCompartidas,
  MateriaCompartida,
} from '../../../core/models/materia-compartida.model';
import {
  MAXIMO_CUPOS_SOLICITUD,
  SolicitudCupoService,
} from '../../../core/services/solicitud-cupo.service';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { IndicadorMateriaCompartidaComponent } from '../../../shared/components/indicador-materia-compartida/indicador-materia-compartida.component';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';

interface Solicitud {
  planificacionId: number;
  intento: number;
}

type EstadoListado =
  | { tipo: 'cargando'; solicitud: Solicitud | null }
  | { tipo: 'error'; solicitud: Solicitud }
  | { tipo: 'listo'; solicitud: Solicitud; datos: ListadoMateriasCompartidas };

/** Texto del estado de la planificación de la carrera responsable. */
const ETIQUETAS_ESTADO: Record<EstadoResponsable, string> = {
  NO_PLANIFICADA: 'Sin planificar',
  EN_BORRADOR: 'En borrador',
  PLANIFICADA: 'Planificada',
};

/** Texto del estado de una solicitud de cupos ya registrada. */
const ETIQUETAS_SOLICITUD: Record<EstadoSolicitudCupo, string> = {
  PENDIENTE: 'pendiente',
  ACEPTADA: 'aceptada',
  RECHAZADA: 'rechazada',
};

/**
 * Clases completas por estado (no armadas con texto dinámico) para que Tailwind las detecte.
 * EDITAR (C5-08): reemplazar por app-estado-badge cuando G5 lo publique.
 */
const CLASES_ESTADO: Record<EstadoResponsable, string> = {
  NO_PLANIFICADA:
    'inline-flex items-center gap-1 rounded-full border border-accent/40 bg-muted px-2.5 py-0.5 text-xs font-medium text-accent',
  EN_BORRADOR:
    'inline-flex items-center gap-1 rounded-full border border-accent-gold/40 bg-accent-gold/10 px-2.5 py-0.5 text-xs font-medium text-primary-dark',
  PLANIFICADA:
    'inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-primary',
};

@Component({
  selector: 'app-materias-compartidas',
  imports: [IndicadorMateriaCompartidaComponent, EstadoVacioComponent, SpinnerCargaComponent],
  templateUrl: './materias-compartidas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class MateriasCompartidasComponent {
  readonly planificacionId = input.required<number>();

  private readonly servicio = inject(SolicitudCupoService);
  private readonly intento = signal(0);
  private readonly solicitud = computed<Solicitud>(() => ({
    planificacionId: this.planificacionId(),
    intento: this.intento(),
  }));

  /** Materia cuyo formulario de solicitud está abierto (id de la materia) o null. */
  readonly materiaAbierta = signal<number | null>(null);
  readonly enviando = signal(false);
  readonly errorAccion = signal<string | null>(null);
  readonly ultimoAviso = signal<string | null>(null);

  readonly etiquetasEstado = ETIQUETAS_ESTADO;
  readonly etiquetasSolicitud = ETIQUETAS_SOLICITUD;
  readonly clasesEstado = CLASES_ESTADO;
  readonly maximoCupos = MAXIMO_CUPOS_SOLICITUD;

  private readonly respuesta = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) =>
        defer(() => this.servicio.listarMateriasCompartidas(solicitud.planificacionId)).pipe(
          map((datos): EstadoListado => ({ tipo: 'listo', solicitud, datos })),
          catchError(() => of<EstadoListado>({ tipo: 'error', solicitud })),
          startWith<EstadoListado>({ tipo: 'cargando', solicitud }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando', solicitud: null } as EstadoListado },
  );

  /** Evita mostrar las materias de la planificación anterior mientras llega la nueva. */
  readonly vista = computed<EstadoListado>(() => {
    const solicitud = this.solicitud();
    const respuesta = this.respuesta();
    return respuesta.solicitud === solicitud ? respuesta : { tipo: 'cargando', solicitud };
  });

  readonly carreraId = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.datos.carreraId : undefined;
  });

  readonly carreraNombre = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.datos.carreraNombre : '';
  });

  readonly materias = computed<MateriaCompartida[]>(() => {
    const vista = this.vista();
    if (vista.tipo !== 'listo') return [];
    return [...vista.datos.materias].sort(
      (a, b) =>
        (a.nivel ?? Number.MAX_SAFE_INTEGER) - (b.nivel ?? Number.MAX_SAFE_INTEGER) ||
        a.materia.codigo.localeCompare(b.materia.codigo, 'es', { numeric: true }),
    );
  });

  /** Materias cuya carrera responsable todavía no las planificó (advertencia de la HU G2-08). */
  readonly sinPlanificar = computed(() =>
    this.materias().filter((m) => m.estadoResponsable !== 'PLANIFICADA'),
  );

  /** Se puede pedir cupos solo si ya está planificada y tiene algún paralelo con espacio. */
  puedeSolicitar(materia: MateriaCompartida): boolean {
    return (
      materia.estadoResponsable === 'PLANIFICADA' &&
      materia.paralelosAbiertos.some((p) => p.cuposDisponibles > 0)
    );
  }

  cuposSolicitados(materia: MateriaCompartida): number {
    return this.servicio.cuposSolicitados(materia);
  }

  /** Cupos que todavía le faltan a la carrera dependiente para sus estudiantes estimados. */
  cuposFaltantes(materia: MateriaCompartida): number {
    return Math.max(materia.estudiantesEstimados - this.cuposSolicitados(materia), 0);
  }

  /** Valor con el que se prellena el formulario: lo que falta, sin pasarse del paralelo. */
  cuposSugeridos(materia: MateriaCompartida): number {
    const disponibles = Math.max(0, ...materia.paralelosAbiertos.map((p) => p.cuposDisponibles));
    return Math.max(Math.min(this.cuposFaltantes(materia), disponibles), 1);
  }

  paralelosConCupo(materia: MateriaCompartida) {
    return materia.paralelosAbiertos.filter((p) => p.cuposDisponibles > 0);
  }

  abrirFormulario(materia: MateriaCompartida): void {
    this.errorAccion.set(null);
    this.ultimoAviso.set(null);
    this.materiaAbierta.set(materia.materia.id);
  }

  cerrarFormulario(): void {
    this.materiaAbierta.set(null);
  }

  /** Envía la solicitud de cupos en el paralelo elegido (HU G2-08). */
  solicitar(materia: MateriaCompartida, paraleloId: string, cupos: string): void {
    const id = Number(paraleloId);
    const cantidad = Number(cupos);
    if (!id) {
      this.errorAccion.set('Elige el paralelo en el que quieres los cupos.');
      return;
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      this.errorAccion.set('Indica cuántos cupos necesitas (un número mayor que cero).');
      return;
    }
    this.enviando.set(true);
    this.errorAccion.set(null);
    this.servicio
      .solicitarCupos(this.planificacionId(), materia.materia.id, id, cantidad)
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.materiaAbierta.set(null);
          this.ultimoAviso.set(
            `Solicitud enviada: ${cantidad} cupos en ${materia.materia.codigo}. Queda pendiente de que ${materia.materia.carreraResponsable} la acepte.`,
          );
          this.intento.update((valor) => valor + 1);
        },
        error: (error: Error) => {
          this.enviando.set(false);
          this.errorAccion.set(error.message || 'No se pudo registrar la solicitud.');
        },
      });
  }

  reintentar(): void {
    this.errorAccion.set(null);
    this.intento.update((valor) => valor + 1);
  }
}
