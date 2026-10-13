import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { catchError, of } from 'rxjs';
import {
  EstadoPeriodo,
  ETIQUETA_ESTADO_PERIODO,
  etiquetaTipoPeriodo,
  Periodo,
  PeriodoDatos,
  TipoPeriodo,
} from '../../../shared/models/periodo.model';
import { PeriodoService } from '../../../shared/services/periodo.service';

type Campo = 'codigo' | 'nombre' | 'tipo' | 'fechaInicio' | 'fechaFin' | 'estado' | 'codigoSiac';

const REQUERIDO: Record<Campo, string> = {
  codigo: 'El código es obligatorio.',
  nombre: 'El nombre es obligatorio.',
  tipo: 'Elige el tipo de período.',
  fechaInicio: 'La fecha de inicio es obligatoria.',
  fechaFin: 'La fecha de fin es obligatoria.',
  estado: 'Elige el estado del período.',
  codigoSiac: '',
};

const VALORES_INICIALES = {
  codigo: '',
  nombre: '',
  tipo: 'ORDINARIO' as TipoPeriodo,
  fechaInicio: '',
  fechaFin: '',
  estado: 'PLANIFICACION' as EstadoPeriodo,
  codigoSiac: '',
};

/** La fecha de fin debe ser posterior a la de inicio (ISO yyyy-MM-dd se compara como texto). */
const finPosteriorAInicio: ValidatorFn = (grupo) => {
  const inicio = grupo.get('fechaInicio')?.value as string;
  const fin = grupo.get('fechaFin')?.value as string;
  return inicio && fin && fin <= inicio ? { rangoFechas: true } : null;
};

let siguienteId = 0;

/**
 * Formulario de período (C1-27). Hijo de `app-periodos-lista`.
 *
 * Sin `periodo` crea uno nuevo; con `periodo` edita ese. Valida que el código no se repita, que
 * la fecha de fin sea posterior a la de inicio y los campos obligatorios. No guarda por sí
 * mismo: emite `guardar` con los datos (sin id) y el padre decide qué hacer con ellos.
 *
 * NOTA: según la tabla de componentes debe usar `app-campo-codigo-siac` (G5). Mientras no esté
 * en esta rama, el código SIAC es un campo de texto propio; al integrarlo, se reemplaza el
 * bloque marcado en la plantilla (es un campo de formulario reactivo, con el mismo `formControlName`).
 */
@Component({
  selector: 'app-periodo-form',
  imports: [ReactiveFormsModule],
  templateUrl: './periodo-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PeriodoFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly periodoService = inject(PeriodoService);

  /** Período a editar. Sin valor, el formulario crea uno nuevo. */
  readonly periodo = input<Periodo>();

  /** Emite los datos del período (sin id) cuando el formulario es válido. */
  readonly guardar = output<PeriodoDatos>();
  /** Emite cuando el usuario cancela. */
  readonly cancelar = output<void>();

  protected readonly prefijo = `periodo-form-${siguienteId++}`;
  protected readonly titulo = computed(() => {
    const p = this.periodo();
    return p ? `Editar período ${p.codigo}` : 'Nuevo período';
  });

  protected readonly tipos = (['ORDINARIO', 'EXTRAORDINARIO'] as const).map((valor) => ({
    valor,
    etiqueta: etiquetaTipoPeriodo(valor),
  }));
  protected readonly estados = (['PLANIFICACION', 'ACTIVO', 'CERRADO'] as const).map((valor) => ({
    valor,
    etiqueta: ETIQUETA_ESTADO_PERIODO[valor],
  }));

  /** Períodos existentes, para que el código no se repita. */
  private readonly existentes = toSignal(
    this.periodoService.listar().pipe(catchError(() => of([] as Periodo[]))),
    { initialValue: [] as Periodo[] },
  );

  private readonly codigoUnico: ValidatorFn = (control) => {
    const codigo = String(control.value ?? '')
      .trim()
      .toLowerCase();
    if (!codigo) return null;
    const idActual = this.periodo()?.id;
    const repetido = this.existentes().some(
      (p) => p.id !== idActual && p.codigo.toLowerCase() === codigo,
    );
    return repetido ? { duplicado: true } : null;
  };

  protected readonly form = this.fb.group(
    {
      codigo: ['', [Validators.required, Validators.maxLength(20), this.codigoUnico]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      tipo: [VALORES_INICIALES.tipo, Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      estado: [VALORES_INICIALES.estado, Validators.required],
      codigoSiac: ['', Validators.maxLength(30)],
    },
    { validators: finPosteriorAInicio },
  );

  /** Puente a signals: con OnPush, la plantilla se actualiza cuando cambia el estado del form. */
  private readonly cambios = toSignal(this.form.events);

  constructor() {
    // Carga los datos cuando cambia el período a editar (o limpia el formulario si es nuevo).
    effect(() => {
      const p = this.periodo();
      untracked(() =>
        this.form.reset(
          p
            ? {
                codigo: p.codigo,
                nombre: p.nombre,
                tipo: p.tipo,
                fechaInicio: p.fechaInicio,
                fechaFin: p.fechaFin,
                estado: p.estado,
                codigoSiac: p.codigoSiac ?? '',
              }
            : VALORES_INICIALES,
        ),
      );
    });

    // Revalida el código cuando llega la lista de períodos existentes.
    effect(() => {
      this.existentes();
      untracked(() => this.form.controls.codigo.updateValueAndValidity());
    });
  }

  /** Mensaje de error del campo, o `null` si no hay (solo después de tocarlo). */
  protected error(campo: Campo): string | null {
    this.cambios();
    const control = this.form.controls[campo];
    if (!control.touched) return null;

    const errores = control.errors;
    if (errores?.['required']) return REQUERIDO[campo];
    if (errores?.['maxlength']) return `Máximo ${errores['maxlength'].requiredLength} caracteres.`;
    if (errores?.['duplicado']) return 'Ya existe un período con ese código.';
    if (campo === 'fechaFin' && this.form.errors?.['rangoFechas']) {
      return 'La fecha de fin debe ser posterior a la de inicio.';
    }
    return null;
  }

  /** Clases del campo: el borde pasa a `accent` cuando tiene error. */
  protected clase(campo: Campo): string {
    const borde = this.error(campo) ? 'border-accent' : 'border-border';
    return `mt-1 w-full rounded-md border ${borde} bg-surface px-3 py-2 text-sm text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`;
  }

  protected alGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.guardar.emit({
      codigo: v.codigo.trim(),
      nombre: v.nombre.trim(),
      tipo: v.tipo,
      estado: v.estado,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      codigoSiac: v.codigoSiac.trim() || undefined,
    });
  }
}
