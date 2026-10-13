/** C2-13 · G2 · G2-10/G2-11. Hijo de app-planificacion-detalle. */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subscription, catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import {
  CambioAsignacion,
  FilaAsignacion,
  PanelAsignacion,
} from '../../../core/models/asignacion-planificacion.model';
import { Docente } from '../../../core/models/asignacion-docente.model';
import { AsignacionDocenteService } from '../../../core/services/asignacion-docente.service';
import { SugerenciaDocenteComponent } from '../sugerencia-docente/sugerencia-docente.component';
import { IndicadorCargaDocenteComponent } from '../../../shared/components/indicador-carga-docente/indicador-carga-docente.component';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';

interface Solicitud {
  id: number;
  revision: number;
  intento: number;
}
type Vista =
  | { tipo: 'cargando'; solicitud: Solicitud | null }
  | { tipo: 'error'; solicitud: Solicitud }
  | { tipo: 'listo'; solicitud: Solicitud; panel: PanelAsignacion };

@Component({
  selector: 'app-asignacion-docentes',
  imports: [
    SugerenciaDocenteComponent,
    IndicadorCargaDocenteComponent,
    SpinnerCargaComponent,
    EstadoVacioComponent,
  ],
  templateUrl: './asignacion-docentes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class AsignacionDocentesComponent {
  readonly planificacionId = input.required<number>();
  readonly asignacionChange = output<CambioAsignacion>();
  private readonly servicio = inject(AsignacionDocenteService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly intento = signal(0);
  private guardado?: Subscription;
  readonly guardando = signal(false);
  readonly mensaje = signal('');
  readonly errorGuardado = signal('');
  readonly paraleloActivo = signal<number | null>(null);
  readonly docenteManualId = signal<number | null>(null);

  private readonly solicitud = computed(() => ({
    id: this.planificacionId(),
    revision: this.servicio.revision(),
    intento: this.intento(),
  }));
  private readonly respuesta = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) =>
        defer(() => this.servicio.listar(solicitud.id)).pipe(
          map((panel): Vista => ({ tipo: 'listo', solicitud, panel })),
          catchError(() => of<Vista>({ tipo: 'error', solicitud })),
          startWith<Vista>({ tipo: 'cargando', solicitud }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando', solicitud: null } as Vista },
  );

  readonly vista = computed<Vista>(() => {
    const respuesta = this.respuesta();
    const solicitud = this.solicitud();
    return respuesta.solicitud === solicitud ? respuesta : { tipo: 'cargando', solicitud };
  });
  readonly filaActiva = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo'
      ? (vista.panel.filas.find((f) => f.paralelo.id === this.paraleloActivo()) ?? null)
      : null;
  });
  readonly opcionManual = computed(
    () =>
      this.filaActiva()?.opcionesManuales.find((d) => d.docente.id === this.docenteManualId()) ??
      null,
  );

  constructor() {
    effect(() => {
      this.planificacionId();
      untracked(() => {
        // Cancelar el timer mock evita una escritura pendiente al abandonar la planificación.
        this.guardado?.unsubscribe();
        this.guardando.set(false);
        this.paraleloActivo.set(null);
        this.docenteManualId.set(null);
        this.mensaje.set('');
        this.errorGuardado.set('');
      });
    });
  }

  reintentar(): void {
    this.intento.update((n) => n + 1);
  }

  abrir(fila: FilaAsignacion): void {
    const vista = this.vista();
    if (vista.tipo !== 'listo' || !vista.panel.editable || this.guardando()) return;
    this.paraleloActivo.set(fila.paralelo.id);
    this.docenteManualId.set(null);
    this.errorGuardado.set('');
    this.mensaje.set('');
  }

  aceptar(fila: FilaAsignacion): void {
    if (fila.paralelo.estadoDocente === 'SUGERIDO' && fila.paralelo.docente) {
      this.guardar(fila.paralelo.id, fila.paralelo.docente.id);
    }
  }

  elegirSugerencia(docente: Docente): void {
    const fila = this.filaActiva();
    if (fila) this.guardar(fila.paralelo.id, docente.id);
  }

  confirmarManual(): void {
    const fila = this.filaActiva();
    const opcion = this.opcionManual();
    if (fila && opcion && opcion.cargaProyectada <= opcion.docente.cargaMaxima) {
      this.guardar(fila.paralelo.id, opcion.docente.id);
    }
  }

  private guardar(paraleloId: number, docenteId: number): void {
    const vista = this.vista();
    if (vista.tipo !== 'listo' || !vista.panel.editable || this.guardando()) return;
    const id = this.planificacionId();
    this.guardando.set(true);
    this.errorGuardado.set('');
    this.mensaje.set('');
    this.guardado = this.servicio
      .confirmar(id, paraleloId, docenteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cambio) => {
          if (this.planificacionId() !== id) return;
          this.paraleloActivo.set(null);
          this.docenteManualId.set(null);
          this.mensaje.set('Asignación confirmada en esta sesión.');
          this.asignacionChange.emit(cambio);
        },
        error: (error: unknown) => {
          if (this.planificacionId() !== id) return;
          this.guardando.set(false);
          this.errorGuardado.set(
            error instanceof Error ? error.message : 'No se pudo confirmar la asignación.',
          );
        },
        complete: () => {
          if (this.planificacionId() === id) this.guardando.set(false);
        },
      });
  }
}
