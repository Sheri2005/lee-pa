/** C2-09 · G2 · G2-06. Diálogo hijo de app-sugerencia-cursos (C2-08). */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subscription, catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import {
  ContextoCursoManual,
  CursoManual,
  MAX_MOTIVO_CURSO_MANUAL,
} from '../../../core/models/curso-manual.model';
import { Materia } from '../../../core/models/materia.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { SelectorMateriaComponent } from '../../../shared/components/selector-materia/selector-materia';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';

interface Solicitud {
  id: number;
  intento: number;
}
type Vista =
  | { tipo: 'cargando'; solicitud: Solicitud | null }
  | { tipo: 'error'; solicitud: Solicitud }
  | { tipo: 'listo'; solicitud: Solicitud; contexto: ContextoCursoManual };

let siguienteId = 0;

@Component({
  selector: 'app-curso-manual-form',
  imports: [ReactiveFormsModule, SelectorMateriaComponent, SpinnerCargaComponent],
  templateUrl: './curso-manual-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CursoManualFormComponent {
  readonly planificacionId = input.required<number>();
  /** Se emite con el registro guardado; el padre refresca su listado y desmonta el diálogo. */
  readonly guardar = output<CursoManual>();
  readonly cancelar = output<void>();
  private readonly servicio = inject(PlanificacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private readonly intento = signal(0);
  private guardado?: Subscription;
  private readonly terminado = signal(false);
  readonly prefijo = `curso-manual-${siguienteId++}`;
  readonly maxMotivo = MAX_MOTIVO_CURSO_MANUAL;
  readonly seleccionada = signal<Materia | null>(null);
  readonly guardando = signal(false);
  readonly errorGuardado = signal('');
  readonly enviado = signal(false);

  readonly form = new FormGroup({
    materiaId: new FormControl<number | null>(null, Validators.required),
    numeroParalelos: new FormControl<number | null>(1, [
      Validators.required,
      (c) => (Number.isSafeInteger(c.value) && c.value > 0 ? null : { enteroPositivo: true }),
    ]),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [
        (c) =>
          typeof c.value === 'string' && c.value.trim().length > 0 ? null : { requerido: true },
        Validators.maxLength(MAX_MOTIVO_CURSO_MANUAL),
      ],
    }),
  });
  private readonly valores = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private readonly solicitud = computed(() => ({
    id: this.planificacionId(),
    intento: this.intento(),
  }));
  private readonly respuesta = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) =>
        defer(() => this.servicio.obtenerContextoCursoManual(solicitud.id)).pipe(
          map((contexto): Vista => ({ tipo: 'listo', solicitud, contexto })),
          catchError(() => of<Vista>({ tipo: 'error', solicitud })),
          startWith<Vista>({ tipo: 'cargando', solicitud }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando', solicitud: null } as Vista },
  );

  readonly vista = computed<Vista>(() => {
    const solicitud = this.solicitud();
    const respuesta = this.respuesta();
    return respuesta.solicitud === solicitud ? respuesta : { tipo: 'cargando', solicitud };
  });
  readonly editable = computed(() => {
    const v = this.vista();
    return (
      v.tipo === 'listo' && ['BORRADOR', 'CON_CAMBIOS'].includes(v.contexto.planificacion.estado)
    );
  });
  readonly duplicada = computed(() => {
    const v = this.vista();
    return (
      v.tipo === 'listo' &&
      v.contexto.cursosManuales.some((c) => c.materiaId === this.seleccionada()?.id)
    );
  });
  readonly puedeGuardar = computed(() => {
    this.valores();
    return (
      this.editable() &&
      !!this.seleccionada() &&
      this.form.valid &&
      !this.duplicada() &&
      !this.guardando() &&
      !this.terminado()
    );
  });

  constructor() {
    afterNextRender(() => {
      const el = this.dialogo().nativeElement;
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    });
    effect(() => {
      this.planificacionId();
      untracked(() => {
        this.guardado?.unsubscribe();
        this.guardando.set(false);
        this.terminado.set(false);
        this.seleccionada.set(null);
        this.form.reset({ materiaId: null, numeroParalelos: 1, motivo: '' });
        this.enviado.set(false);
        this.errorGuardado.set('');
      });
    });
  }

  seleccionarMateria(materia: Materia): void {
    const v = this.vista();
    if (v.tipo !== 'listo' || !this.editable() || this.guardando() || this.terminado()) return;
    if (materia.carreraResponsableId !== v.contexto.planificacion.carrera.id) {
      this.errorGuardado.set('Solo la carrera responsable puede abrir esta materia.');
      return;
    }
    this.seleccionada.set({ ...materia });
    this.form.controls.materiaId.setValue(materia.id);
    this.errorGuardado.set('');
  }

  cambiarMateria(): void {
    if (this.guardando() || this.terminado()) return;
    this.seleccionada.set(null);
    this.form.controls.materiaId.setValue(null);
    this.errorGuardado.set('');
  }

  guardarCurso(): void {
    this.enviado.set(true);
    this.form.markAllAsTouched();
    if (!this.puedeGuardar()) return;
    const id = this.planificacionId();
    const { materiaId, numeroParalelos, motivo } = this.form.getRawValue();
    if (materiaId === null || numeroParalelos === null) return;
    this.guardando.set(true);
    this.errorGuardado.set('');
    this.guardado = defer(() =>
      this.servicio.agregarCursoManual(id, {
        materiaId,
        numeroParalelos,
        motivo: motivo.trim(),
      }),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (curso) => {
          if (this.planificacionId() !== id) return;
          this.guardando.set(false);
          this.terminado.set(true);
          this.guardar.emit(curso);
        },
        error: (error: unknown) => {
          if (this.planificacionId() !== id) return;
          this.guardando.set(false);
          this.errorGuardado.set(
            error instanceof Error ? error.message : 'No se pudo agregar el curso.',
          );
        },
      });
  }

  reintentar(): void {
    this.intento.update((n) => n + 1);
  }

  solicitarCancelacion(): void {
    if (this.guardando() || this.terminado()) return;
    this.terminado.set(true);
    this.cancelar.emit();
  }

  alPresionarEsc(evento: Event): void {
    evento.preventDefault();
    this.solicitarCancelacion();
  }

  alClickFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.solicitarCancelacion();
  }
}
