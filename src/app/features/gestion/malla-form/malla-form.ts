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
import { Malla, MallaDatos } from '../../../shared/models/malla.model';
import { MallaService } from '../../../shared/services/malla.service';

type Campo = 'codigo' | 'nombre' | 'anioInicio';

const REQUERIDO: Record<Campo, string> = {
  codigo: 'El código es obligatorio.',
  nombre: 'El nombre es obligatorio.',
  anioInicio: 'El año de vigencia es obligatorio.',
};

const ANIO_MINIMO = 2000;
const ANIO_MAXIMO = 2100;

const anioEntero: ValidatorFn = (control) =>
  control.value == null || Number.isInteger(control.value) ? null : { entero: true };

let siguienteId = 0;


@Component({
  selector: 'app-malla-form',
  imports: [ReactiveFormsModule],
  templateUrl: './malla-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class MallaFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly mallaService = inject(MallaService);

  /** Malla a editar. Sin valor, el formulario crea una nueva. */
  readonly malla = input<Malla>();

  /** Emite los datos de la malla (sin id) cuando el formulario es válido. */
  readonly guardar = output<MallaDatos>();
  /** Emite cuando el usuario cancela. */
  readonly cancelar = output<void>();

  protected readonly prefijo = `malla-form-${siguienteId++}`;
  protected readonly titulo = computed(() => {
    const m = this.malla();
    return m ? `Editar malla ${m.codigo}` : 'Nueva malla';
  });

  /** Mallas existentes, para que el código no se repita. */
  private readonly existentes = toSignal(
    this.mallaService.listar().pipe(catchError(() => of([] as Malla[]))),
    { initialValue: [] as Malla[] },
  );

  private readonly codigoUnico: ValidatorFn = (control) => {
    const codigo = String(control.value ?? '')
      .trim()
      .toLowerCase();
    if (!codigo) return null;
    const idActual = this.malla()?.id;
    const repetido = this.existentes().some(
      (m) => m.id !== idActual && m.codigo.toLowerCase() === codigo,
    );
    return repetido ? { duplicado: true } : null;
  };

  protected readonly form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(20), this.codigoUnico]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    anioInicio: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(ANIO_MINIMO),
      Validators.max(ANIO_MAXIMO),
      anioEntero,
    ]),
  });

  /** Puente a signals: con OnPush, la plantilla se actualiza cuando cambia el estado del form. */
  private readonly cambios = toSignal(this.form.events);

  constructor() {
    // Carga los datos cuando cambia la malla a editar (o limpia el formulario si es nueva).
    effect(() => {
      const m = this.malla();
      untracked(() =>
        this.form.reset(
          m
            ? { codigo: m.codigo, nombre: m.nombre, anioInicio: m.anioInicio }
            : { codigo: '', nombre: '', anioInicio: null },
        ),
      );
    });

    // Revalida el código cuando llega la lista de mallas existentes.
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
    if (errores?.['duplicado']) return 'Ya existe una malla con ese código.';
    if (errores?.['entero']) return 'El año debe ser un número entero.';
    if (errores?.['min'] || errores?.['max']) {
      return `Ingresa un año entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}.`;
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
      anioInicio: v.anioInicio as number,
    });
  }
}