/**
 * app-planificacion-detalle · C2-03 · Página (/planificacion/:id)
 * Grupo dueño: G2 · Planificación (responsable: Raúl Garay). HU: G2-03.
 * Contenedor con pasos: Parámetros → Estudiantes estimados → Cursos sugeridos → Paralelos →
 * Docentes → Materias compartidas → Enviar a aprobación. Muestra el estado y la trazabilidad.
 * Ejemplo de uso y piezas pendientes de otros grupos en README.md (misma carpeta).
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import { ParametrosPlanificacion } from '../../../core/models/parametros-planificacion.model';
import { EstadoPlanificacion, Planificacion } from '../../../core/models/planificacion.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { PlanificacionEncabezadoComponent } from '../../../shared/components/planificacion-encabezado/planificacion-encabezado.component';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';
import { AsignacionDocentesComponent } from '../asignacion-docentes/asignacion-docentes.component';
import { ParametrosPlanificacionComponent } from '../parametros-planificacion/parametros-planificacion.component';

export type PasoId =
  'parametros' | 'estudiantes' | 'cursos' | 'paralelos' | 'docentes' | 'compartidas' | 'aprobacion';

interface Paso {
  id: PasoId;
  etiqueta: string;
}

/** Orden de los pasos según el catálogo (C2-03). */
export const PASOS: readonly Paso[] = [
  { id: 'parametros', etiqueta: 'Parámetros' },
  { id: 'estudiantes', etiqueta: 'Estudiantes estimados' },
  { id: 'cursos', etiqueta: 'Cursos sugeridos' },
  { id: 'paralelos', etiqueta: 'Paralelos' },
  { id: 'docentes', etiqueta: 'Docentes' },
  { id: 'compartidas', etiqueta: 'Materias compartidas' },
  { id: 'aprobacion', etiqueta: 'Enviar a aprobación' },
];

interface Solicitud {
  id: number | null;
  intento: number;
}

type Vista =
  | { tipo: 'cargando'; solicitud: Solicitud | null }
  | { tipo: 'error'; solicitud: Solicitud; motivo: 'invalido' | 'carga' }
  | { tipo: 'listo'; solicitud: Solicitud; planificacion: Planificacion };

/** Mismo criterio que C2-13 y C2-05: solo BORRADOR y CON_CAMBIOS admiten cambios. */
const ESTADOS_EDITABLES: EstadoPlanificacion[] = ['BORRADOR', 'CON_CAMBIOS'];

let siguienteId = 0;

@Component({
  selector: 'app-planificacion-detalle',
  imports: [
    RouterLink,
    SpinnerCargaComponent,
    PlanificacionEncabezadoComponent,
    ParametrosPlanificacionComponent,
    AsignacionDocentesComponent,
  ],
  templateUrl: './planificacion-detalle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PlanificacionDetalleComponent {
  private readonly servicio = inject(PlanificacionService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly intento = signal(0);

  private readonly prefijoId = `plan-detalle-${siguienteId++}`;
  readonly pasos = PASOS;

  /** Id de la ruta `/planificacion/:id`; null si no es un entero positivo. */
  private readonly idRuta = toSignal(this.ruta.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.ruta.snapshot.paramMap.get('id'),
  });
  readonly planificacionId = computed<number | null>(() => {
    const numero = Number(this.idRuta());
    return this.idRuta() !== null && Number.isSafeInteger(numero) && numero > 0 ? numero : null;
  });

  private readonly solicitud = computed<Solicitud>(() => ({
    id: this.planificacionId(),
    intento: this.intento(),
  }));

  private readonly respuesta = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) => {
        if (solicitud.id === null) {
          return of<Vista>({ tipo: 'error', solicitud, motivo: 'invalido' });
        }
        const id = solicitud.id;
        return defer(() => this.servicio.obtenerPorId(id)).pipe(
          map((planificacion): Vista => ({ tipo: 'listo', solicitud, planificacion })),
          catchError(() => of<Vista>({ tipo: 'error', solicitud, motivo: 'carga' })),
          startWith<Vista>({ tipo: 'cargando', solicitud }),
        );
      }),
    ),
    { initialValue: { tipo: 'cargando', solicitud: null } as Vista },
  );

  /** Evita mostrar la planificación anterior mientras llega la de la nueva ruta. */
  readonly vista = computed<Vista>(() => {
    const solicitud = this.solicitud();
    const respuesta = this.respuesta();
    return respuesta.solicitud === solicitud ? respuesta : { tipo: 'cargando', solicitud };
  });

  /** Paso visible; vuelve a "Parámetros" al abrir otra planificación. */
  readonly pasoActivo = linkedSignal<PasoId>(() => {
    this.planificacionId();
    return 'parametros';
  });

  readonly indiceActivo = computed(() => PASOS.findIndex((p) => p.id === this.pasoActivo()));
  readonly esPrimero = computed(() => this.indiceActivo() === 0);
  readonly esUltimo = computed(() => this.indiceActivo() === PASOS.length - 1);

  /**
   * Últimos parámetros guardados en esta sesión (los emite C2-05). Quedan listos para pasarlos a
   * los pasos siguientes cuando existan. EDITAR (C2-06, C2-08, paralelos-editor): ver plantilla.
   */
  readonly parametrosVigentes = signal<ParametrosPlanificacion | null>(null);

  readonly editable = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' && ESTADOS_EDITABLES.includes(vista.planificacion.estado);
  });

  idTab(paso: PasoId): string {
    return `${this.prefijoId}-tab-${paso}`;
  }

  idPanel(paso: PasoId): string {
    return `${this.prefijoId}-panel-${paso}`;
  }

  irAPaso(paso: PasoId): void {
    this.pasoActivo.set(paso);
  }

  anterior(): void {
    const i = this.indiceActivo();
    if (i > 0) this.pasoActivo.set(PASOS[i - 1].id);
  }

  siguiente(): void {
    const i = this.indiceActivo();
    if (i < PASOS.length - 1) this.pasoActivo.set(PASOS[i + 1].id);
  }

  /** Navegación por teclado del patrón de pestañas (flechas, Inicio y Fin). */
  alTeclear(evento: KeyboardEvent): void {
    const ultimo = PASOS.length - 1;
    const actual = this.indiceActivo();
    const destino =
      evento.key === 'ArrowRight'
        ? (actual + 1) % PASOS.length
        : evento.key === 'ArrowLeft'
          ? (actual - 1 + PASOS.length) % PASOS.length
          : evento.key === 'Home'
            ? 0
            : evento.key === 'End'
              ? ultimo
              : null;
    if (destino === null) return;
    evento.preventDefault();
    this.pasoActivo.set(PASOS[destino].id);
    const pestanas = (
      evento.currentTarget as HTMLElement
    ).parentElement?.querySelectorAll<HTMLElement>('[role="tab"]');
    pestanas?.[destino]?.focus();
  }

  alCambiarParametros(parametros: ParametrosPlanificacion): void {
    this.parametrosVigentes.set(parametros);
  }

  reintentar(): void {
    this.intento.update((n) => n + 1);
  }
}
