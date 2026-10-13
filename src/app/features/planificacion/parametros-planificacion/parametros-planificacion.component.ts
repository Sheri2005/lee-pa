/**
 * app-parametros-planificacion · C2-05 · Hijo (formulario) de app-planificacion-detalle
 * Grupo dueño: G2 · Planificación (responsable: Raúl Garay). HU: G2-03.
 * Configura los parámetros de la planificación: niveles a ofertar (con vista de la malla),
 * cupo máximo por paralelo y mínimo de estudiantes para abrir un paralelo.
 * Ejemplo de uso y piezas pendientes de otros grupos en README.md (misma carpeta).
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, defer, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { EstadoPlanificacion, Planificacion } from '../../../core/models/planificacion.model';
import {
  NivelMalla,
  ParametrosPlanificacion,
} from '../../../core/models/parametros-planificacion.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';

interface Solicitud {
  planificacionId: number;
  mallaId: number;
  intento: number;
}

type Vista =
  | { tipo: 'cargando'; solicitud: Solicitud | null }
  | { tipo: 'error'; solicitud: Solicitud }
  | {
      tipo: 'listo';
      solicitud: Solicitud;
      parametros: ParametrosPlanificacion;
      niveles: NivelMalla[];
    };

let siguienteId = 0;

/** Mismo criterio que usa C2-13: solo BORRADOR y CON_CAMBIOS admiten cambios (acordar con el equipo). */
const ESTADOS_EDITABLES: EstadoPlanificacion[] = ['BORRADOR', 'CON_CAMBIOS'];

/** Tope del prototipo para el cupo por paralelo; acordar el valor real con el negocio. */
export const CUPO_MAXIMO_PERMITIDO = 100;

/** "35" → 35; "", "3.5", "-2", "abc" → null. */
function entero(texto: string): number | null {
  const limpio = texto.trim();
  return /^\d+$/.test(limpio) ? Number(limpio) : null;
}

@Component({
  selector: 'app-parametros-planificacion',
  imports: [SpinnerCargaComponent],
  templateUrl: './parametros-planificacion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ParametrosPlanificacionComponent {
  /** Planificación a configurar. */
  readonly planificacion = input.required<Planificacion>();
  /** Se emite con los parámetros ya guardados (después de que el servicio confirma). */
  readonly parametrosChange = output<ParametrosPlanificacion>();

  private readonly servicio = inject(PlanificacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly intento = signal(0);

  readonly idCupo = `par-plan-cupo-${siguienteId}`;
  readonly idMinimo = `par-plan-minimo-${siguienteId++}`;
  readonly cupoMaximoPermitido = CUPO_MAXIMO_PERMITIDO;

  private readonly solicitud = computed<Solicitud>(() => ({
    planificacionId: this.planificacion().id,
    mallaId: this.planificacion().malla.id,
    intento: this.intento(),
  }));

  private readonly respuesta = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) =>
        defer(() =>
          forkJoin({
            parametros: this.servicio.obtenerParametros(solicitud.planificacionId),
            niveles: this.servicio.obtenerMallaPorNiveles(solicitud.mallaId),
          }),
        ).pipe(
          map((datos): Vista => ({ tipo: 'listo', solicitud, ...datos })),
          catchError(() => of<Vista>({ tipo: 'error', solicitud })),
          startWith<Vista>({ tipo: 'cargando', solicitud }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando', solicitud: null } as Vista },
  );

  /** Evita mostrar parámetros de la planificación anterior mientras llega la nueva respuesta. */
  readonly vista = computed<Vista>(() => {
    const solicitud = this.solicitud();
    const respuesta = this.respuesta();
    return respuesta.solicitud === solicitud ? respuesta : { tipo: 'cargando', solicitud };
  });

  readonly editable = computed(() => ESTADOS_EDITABLES.includes(this.planificacion().estado));

  /** Último valor guardado: base para saber si hay cambios sin guardar. */
  readonly guardado = linkedSignal<ParametrosPlanificacion | null>(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.parametros : null;
  });

  // Valores del formulario: se reinician cada vez que llega una respuesta nueva.
  readonly nivelesElegidos = linkedSignal<number[]>(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? [...vista.parametros.nivelesOfertados] : [];
  });
  readonly cupoTexto = linkedSignal<string>(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? String(vista.parametros.cupoMaximoParalelo) : '';
  });
  readonly minimoTexto = linkedSignal<string>(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? String(vista.parametros.minimoEstudiantesAbrir) : '';
  });

  readonly guardando = linkedSignal<boolean>(() => {
    this.solicitud();
    return false;
  });
  readonly mensaje = linkedSignal<string>(() => {
    this.solicitud();
    return '';
  });
  readonly errorGuardado = linkedSignal<string>(() => {
    this.solicitud();
    return '';
  });

  private readonly cupo = computed(() => entero(this.cupoTexto()));
  private readonly minimo = computed(() => entero(this.minimoTexto()));

  readonly niveles = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.niveles : [];
  });

  readonly errorNiveles = computed(() =>
    this.nivelesElegidos().length ? '' : 'Selecciona al menos un nivel a ofertar.',
  );

  readonly errorCupo = computed(() => {
    const cupo = this.cupo();
    if (cupo === null) return 'Ingresa un número entero.';
    if (cupo < 1 || cupo > CUPO_MAXIMO_PERMITIDO) {
      return `El cupo debe estar entre 1 y ${CUPO_MAXIMO_PERMITIDO}.`;
    }
    return '';
  });

  readonly errorMinimo = computed(() => {
    const minimo = this.minimo();
    const cupo = this.cupo();
    if (minimo === null) return 'Ingresa un número entero.';
    if (minimo < 1) return 'El mínimo debe ser al menos 1.';
    if (cupo !== null && minimo > cupo) {
      return 'El mínimo para abrir no puede superar el cupo máximo.';
    }
    return '';
  });

  readonly valido = computed(
    () => !this.errorNiveles() && !this.errorCupo() && !this.errorMinimo(),
  );

  /** Parámetros que se enviarían al guardar; null si el formulario tiene errores. */
  private readonly valorActual = computed<ParametrosPlanificacion | null>(() => {
    const cupo = this.cupo();
    const minimo = this.minimo();
    if (!this.valido() || cupo === null || minimo === null) return null;
    return {
      nivelesOfertados: [...this.nivelesElegidos()].sort((a, b) => a - b),
      cupoMaximoParalelo: cupo,
      minimoEstudiantesAbrir: minimo,
    };
  });

  readonly hayCambios = computed(() => {
    const base = this.guardado();
    const nivelesActuales = [...this.nivelesElegidos()].sort((a, b) => a - b);
    if (!base) return false;
    return (
      nivelesActuales.join(',') !== [...base.nivelesOfertados].sort((a, b) => a - b).join(',') ||
      this.cupoTexto().trim() !== String(base.cupoMaximoParalelo) ||
      this.minimoTexto().trim() !== String(base.minimoEstudiantesAbrir)
    );
  });

  readonly puedeGuardar = computed(
    () => this.editable() && this.valido() && this.hayCambios() && !this.guardando(),
  );

  /** Materias y horas de los niveles elegidos (resumen de lo que se ofertaría). */
  readonly resumen = computed(() => {
    const elegidos = this.nivelesElegidos();
    const materias = this.niveles()
      .filter((n) => elegidos.includes(n.nivel))
      .flatMap((n) => n.materias);
    return {
      niveles: elegidos.length,
      materias: materias.length,
      horas: materias.reduce((total, m) => total + m.horasSemanales, 0),
    };
  });

  estaElegido(nivel: number): boolean {
    return this.nivelesElegidos().includes(nivel);
  }

  /** EDITAR (G1): cuando exista app-selector-nivel, este método lo reemplaza su salida (nivelesChange). */
  alternarNivel(nivel: number): void {
    if (!this.editable() || this.guardando()) return;
    this.nivelesElegidos.update((actuales) =>
      actuales.includes(nivel) ? actuales.filter((n) => n !== nivel) : [...actuales, nivel],
    );
    this.mensaje.set('');
  }

  elegirTodos(): void {
    if (!this.editable() || this.guardando()) return;
    this.nivelesElegidos.set(this.niveles().map((n) => n.nivel));
    this.mensaje.set('');
  }

  quitarTodos(): void {
    if (!this.editable() || this.guardando()) return;
    this.nivelesElegidos.set([]);
    this.mensaje.set('');
  }

  alCambiarCupo(valor: string): void {
    this.cupoTexto.set(valor);
    this.mensaje.set('');
  }

  alCambiarMinimo(valor: string): void {
    this.minimoTexto.set(valor);
    this.mensaje.set('');
  }

  reintentar(): void {
    this.intento.update((n) => n + 1);
  }

  guardar(): void {
    const valor = this.valorActual();
    if (!valor || !this.puedeGuardar()) return;
    const id = this.planificacion().id;
    this.guardando.set(true);
    this.errorGuardado.set('');
    this.mensaje.set('');
    this.servicio
      .guardarParametros(id, valor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (guardado) => {
          // Si el padre cambió de planificación mientras se guardaba, no se pisa la vista nueva.
          if (this.planificacion().id !== id) return;
          this.guardado.set(guardado);
          this.nivelesElegidos.set([...guardado.nivelesOfertados]);
          this.cupoTexto.set(String(guardado.cupoMaximoParalelo));
          this.minimoTexto.set(String(guardado.minimoEstudiantesAbrir));
          this.mensaje.set('Parámetros guardados.');
          this.parametrosChange.emit(guardado);
        },
        error: (error: unknown) => {
          if (this.planificacion().id !== id) return;
          this.guardando.set(false);
          this.errorGuardado.set(
            error instanceof Error ? error.message : 'No se pudieron guardar los parámetros.',
          );
        },
        complete: () => {
          if (this.planificacion().id === id) this.guardando.set(false);
        },
      });
  }
}
