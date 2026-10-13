/**
 * app-planificacion-nueva · C2-02 · Diálogo (modal) usado por app-planificaciones-lista
 * Grupo dueño: G2 · Planificación (responsable: Raúl Garay). HU: G2-01.
 * Crea una planificación: se elige carrera y período; se muestran la facultad heredada de la
 * carrera y la malla vigente; no permite repetir la combinación carrera + período.
 * Ejemplo de uso y piezas pendientes de otros grupos en README.md (misma carpeta).
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import { CatalogoNuevaPlanificacion } from '../../../core/models/nueva-planificacion.model';
import { Planificacion } from '../../../core/models/planificacion.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';

type EstadoCatalogo =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'listo'; catalogo: CatalogoNuevaPlanificacion };

let siguienteId = 0;

/** "" → null; "5" → 5. */
function numeroONulo(valor: string): number | null {
  const numero = Number(valor);
  return valor !== '' && Number.isInteger(numero) ? numero : null;
}

@Component({
  selector: 'app-planificacion-nueva',
  imports: [SpinnerCargaComponent],
  templateUrl: './planificacion-nueva.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanificacionNuevaComponent {
  /** Se emite con la planificación ya creada (contrato de C2-02). */
  readonly creada = output<Planificacion>();
  /**
   * Se emite al cancelar (botón, Esc o clic en el fondo). No está en el contrato original del
   * catálogo, pero el padre necesita saber cuándo cerrar el diálogo sin crear nada.
   */
  readonly cancelada = output<void>();

  private readonly servicio = inject(PlanificacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private readonly intento = signal(0);

  readonly idTitulo = `plan-nueva-titulo-${siguienteId}`;
  readonly idCarrera = `plan-nueva-carrera-${siguienteId}`;
  readonly idPeriodo = `plan-nueva-periodo-${siguienteId}`;
  readonly idDuplicada = `plan-nueva-duplicada-${siguienteId++}`;

  readonly carreraId = signal<number | null>(null);
  readonly periodoId = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly errorGuardado = signal('');

  readonly vista = toSignal(
    toObservable(this.intento).pipe(
      switchMap(() =>
        defer(() => this.servicio.obtenerCatalogoNueva()).pipe(
          map((catalogo): EstadoCatalogo => ({ tipo: 'listo', catalogo })),
          catchError(() => of<EstadoCatalogo>({ tipo: 'error' })),
          startWith<EstadoCatalogo>({ tipo: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando' } as EstadoCatalogo },
  );

  private readonly catalogo = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.catalogo : null;
  });

  readonly carreras = computed(() => this.catalogo()?.carreras ?? []);
  readonly periodos = computed(() => this.catalogo()?.periodos ?? []);

  readonly carreraElegida = computed(
    () => this.carreras().find((c) => c.id === this.carreraId()) ?? null,
  );

  /** Facultad que hereda la planificación: la de la carrera elegida. */
  readonly facultad = computed(() => this.carreraElegida()?.facultad ?? null);
  /** Malla vigente de la carrera elegida. */
  readonly malla = computed(() => this.carreraElegida()?.malla ?? null);

  /** Ya existe una planificación con esta carrera y este período. */
  readonly duplicada = computed(() => {
    const carrera = this.carreraId();
    const periodo = this.periodoId();
    if (carrera === null || periodo === null) return false;
    return (
      this.catalogo()?.existentes.some((e) => e.carreraId === carrera && e.periodoId === periodo) ??
      false
    );
  });

  readonly puedeCrear = computed(
    () =>
      this.carreraId() !== null &&
      this.periodoId() !== null &&
      !this.duplicada() &&
      !this.guardando(),
  );

  constructor() {
    // showModal() solo existe con la plantilla ya renderizada; el respaldo cubre entornos sin soporte.
    afterNextRender(() => {
      const el = this.dialogo().nativeElement;
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    });
  }

  /** EDITAR (C1-25): lo reemplaza la salida de app-selector-carrera. */
  alCambiarCarrera(valor: string): void {
    this.carreraId.set(numeroONulo(valor));
    this.errorGuardado.set('');
  }

  /** EDITAR (C1-28): lo reemplaza la salida de app-selector-periodo. */
  alCambiarPeriodo(valor: string): void {
    this.periodoId.set(numeroONulo(valor));
    this.errorGuardado.set('');
  }

  reintentar(): void {
    this.intento.update((n) => n + 1);
  }

  crear(): void {
    const carreraId = this.carreraId();
    const periodoId = this.periodoId();
    if (!this.puedeCrear() || carreraId === null || periodoId === null) return;
    this.guardando.set(true);
    this.errorGuardado.set('');
    this.servicio
      .crear({ carreraId, periodoId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (planificacion) => {
          this.guardando.set(false);
          this.creada.emit(planificacion);
        },
        error: (error: unknown) => {
          this.guardando.set(false);
          this.errorGuardado.set(
            error instanceof Error ? error.message : 'No se pudo crear la planificación.',
          );
        },
      });
  }

  cancelar(): void {
    if (this.guardando()) return;
    this.cancelada.emit();
  }

  /** Esc: se evita el cierre nativo para que el padre decida (desmonta el componente). */
  alPresionarEsc(evento: Event): void {
    evento.preventDefault();
    this.cancelar();
  }

  /** Si el clic cae en el propio <dialog> (no en su contenido), fue en el fondo oscuro. */
  alClickFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.cancelar();
  }
}
