import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Rol } from '../../models/rol.model';
import { RolService } from '../../services/rol.service';

let siguienteId = 0;

/**
 * Valor en el formulario: nombre del rol (simple) o lista de nombres (múltiple).
 * Se usa el nombre (único en la BD) para coincidir con `Usuario.roles` de UsuarioService.
 */
export type ValorSelectorRol = string | null | string[];

/**
 * Selector de rol (C1-13). Lista de roles activos del sistema, con selección simple o múltiple.
 *
 * Compatible con formularios reactivos (ControlValueAccessor): se usa con `formControlName`,
 * y el valor del control es el nombre del rol, o la lista de nombres con `multiple`.
 * También emite `rolChange` con el rol completo (o la lista) para quien no use formularios.
 */
@Component({
  selector: 'app-selector-rol',
  templateUrl: './selector-rol.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectorRolComponent), multi: true },
  ],
})
export class SelectorRolComponent implements ControlValueAccessor {
  private readonly servicio = inject(RolService);

  /** Selección múltiple (casillas). Sin ella, lista desplegable de un solo rol. */
  readonly multiple = input(false);
  /** Texto del label. No está en la hoja. */
  readonly etiqueta = input('Rol');

  /** Emite el rol elegido, o la lista de roles con `multiple`. */
  readonly rolChange = output<Rol | Rol[]>();

  protected readonly idCampo = `selector-rol-${siguienteId++}`;

  protected readonly roles = signal<Rol[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly deshabilitado = signal(false);
  /** Nombres elegidos (uno solo en modo simple). */
  protected readonly elegidos = signal<string[]>([]);

  protected readonly bloqueado = computed(() => this.cargando() || this.error() || this.deshabilitado());

  private alCambiarValor: (valor: ValorSelectorRol) => void = () => {};
  private alTocar: () => void = () => {};

  constructor() {
    this.servicio.listar({ soloActivos: true }).subscribe({
      next: (lista) => {
        this.roles.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  protected estaElegido(nombre: string): boolean {
    return this.elegidos().includes(nombre);
  }

  /** Modo simple: cambio en la lista desplegable. */
  protected elegirUno(valor: string): void {
    const rol = this.roles().find((r) => r.nombre === valor);
    if (!rol) return;
    this.elegidos.set([rol.nombre]);
    this.alCambiarValor(rol.nombre);
    this.rolChange.emit(rol);
  }

  /** Modo múltiple: marcar o desmarcar una casilla. */
  protected alternar(nombre: string, marcado: boolean): void {
    // Se respeta el orden de la lista de roles, no el orden de los clics.
    const nombres = this.roles()
      .map((r) => r.nombre)
      .filter((n) => (n === nombre ? marcado : this.elegidos().includes(n)));
    this.elegidos.set(nombres);
    this.alCambiarValor(nombres);
    this.rolChange.emit(this.roles().filter((r) => nombres.includes(r.nombre)));
  }

  protected tocar(): void {
    this.alTocar();
  }

  // --- ControlValueAccessor ---

  writeValue(valor: ValorSelectorRol): void {
    if (Array.isArray(valor)) this.elegidos.set([...valor]);
    else this.elegidos.set(valor == null ? [] : [valor]);
  }

  registerOnChange(fn: (valor: ValorSelectorRol) => void): void {
    this.alCambiarValor = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }
}
