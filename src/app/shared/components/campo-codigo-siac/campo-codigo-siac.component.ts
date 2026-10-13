import { booleanAttribute, Component, forwardRef, Inject, Input, Optional } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_ASYNC_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { catchError, defaultIfEmpty, map, Observable, of, switchMap, take, timer } from 'rxjs';

import {
  SIAC_CODE_AVAILABILITY_CHECKER,
  SiacCodeAvailabilityChecker,
} from './siac-code-availability';

type ValidationState =
  'idle' | 'checking' | 'available' | 'taken' | 'unavailable' | 'not-configured' | 'required';

let nextInputId = 0;

@Component({
  selector: 'app-campo-codigo-siac',
  standalone: true,
  templateUrl: './campo-codigo-siac.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CampoCodigoSiacComponent),
      multi: true,
    },
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: forwardRef(() => CampoCodigoSiacComponent),
      multi: true,
    },
  ],
})
export class CampoCodigoSiacComponent implements ControlValueAccessor, Validator {
  @Input() label = 'Código SIAC 1.0';
  @Input() placeholder = 'Ej.: MAT-101';

  private entityValue = '';
  private currentIdValue?: string | number;
  private requiredValue = false;

  @Input()
  set entity(value: string) {
    if (value !== this.entityValue) {
      this.entityValue = value;
      this.onValidatorChange();
    }
  }
  get entity(): string {
    return this.entityValue;
  }

  @Input()
  set idActual(value: string | number | undefined) {
    if (value !== this.currentIdValue) {
      this.currentIdValue = value;
      this.onValidatorChange();
    }
  }
  get idActual(): string | number | undefined {
    return this.currentIdValue;
  }

  @Input({ transform: booleanAttribute })
  set required(value: boolean) {
    if (value !== this.requiredValue) {
      this.requiredValue = value;
      this.onValidatorChange();
    }
  }
  get required(): boolean {
    return this.requiredValue;
  }

  readonly inputId = `codigo-siac-${nextInputId++}`;

  value = '';
  disabled = false;
  touched = false;
  validationState: ValidationState = 'idle';

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  constructor(
    @Optional()
    @Inject(SIAC_CODE_AVAILABILITY_CHECKER)
    private readonly availabilityChecker?: SiacCodeAvailabilityChecker,
  ) {}

  writeValue(value: string | null | undefined): void {
    this.value = value ?? '';
    if (!this.value.trim()) {
      this.validationState = 'idle';
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  handleInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.validationState = 'idle';
    this.onChange(this.value);
  }

  handleBlur(): void {
    this.touched = true;
    const trimmedValue = this.value.trim();
    if (trimmedValue !== this.value) {
      this.value = trimmedValue;
      this.onChange(this.value);
    }
    this.onTouched();
    this.onValidatorChange();
  }

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const code = String(control.value ?? '').trim();

    if (!code) {
      this.validationState = this.required ? 'required' : 'idle';
      return of(this.required ? { required: true } : null);
    }

    // Until the backend adapter is provided, let the prototype work while
    // making the missing uniqueness check visible to the developer/user.
    if (!this.availabilityChecker) {
      this.validationState = 'not-configured';
      return of(null);
    }

    this.validationState = 'checking';
    return timer(300).pipe(
      switchMap(() =>
        this.availabilityChecker!.checkAvailability({
          entity: this.entity,
          code,
          ...(this.idActual === undefined ? {} : { currentId: this.idActual }),
        }),
      ),
      take(1),
      defaultIfEmpty(false),
      map((isAvailable) => {
        this.validationState = isAvailable ? 'available' : 'taken';
        return isAvailable ? null : { siacCodeTaken: true };
      }),
      catchError(() => {
        this.validationState = 'unavailable';
        return of({ siacCodeCheckUnavailable: true });
      }),
    );
  }

  get statusIcon(): string {
    switch (this.validationState) {
      case 'checking':
        return '…';
      case 'available':
        return '✓';
      case 'taken':
      case 'unavailable':
      case 'required':
        return '!';
      case 'not-configured':
        return 'i';
      default:
        return '';
    }
  }

  get validationMessage(): string | null {
    if (!this.touched && !this.value) {
      return null;
    }

    switch (this.validationState) {
      case 'required':
        return 'Este campo es obligatorio.';
      case 'taken':
        return 'Este código ya está registrado para esta entidad.';
      case 'unavailable':
        return 'No se pudo comprobar el código. Intenta nuevamente.';
      case 'not-configured':
        return 'La comprobación de unicidad está pendiente de conexión.';
      default:
        return null;
    }
  }

  get statusClasses(): string {
    switch (this.validationState) {
      case 'available':
        return 'text-emerald-700';
      case 'taken':
      case 'unavailable':
      case 'required':
        return 'text-red-700';
      case 'not-configured':
        return 'text-amber-700';
      case 'checking':
        return 'text-slate-500';
      default:
        return 'text-slate-500';
    }
  }

  get inputClasses(): string {
    const invalid = ['taken', 'unavailable', 'required'].includes(this.validationState);
    return invalid
      ? 'w-full rounded-lg border border-red-400 bg-white px-3 py-2.5 pr-10 text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100'
      : 'w-full rounded-lg border border-[#EFE6EA] bg-white px-3 py-2.5 pr-10 text-slate-900 outline-none transition focus:border-[#75001B] focus:ring-2 focus:ring-[#75001B]/10 disabled:cursor-not-allowed disabled:bg-slate-100';
  }
}
