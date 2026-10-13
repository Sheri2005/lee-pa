// C4-17 · Dueño: G4 · Reservas · Responsable: Justin Soledispa
// Diálogo con el formulario de un recurso reservable: nombre, cantidad y estado. Sirve para crear y editar.
// Lo abre app-recursos-reservables-lista (C4-16), que es quien guarda con RecursoReservableService.
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RecursoReservable } from '../../../app/core/models/reserva.model';

/** Datos que emite el formulario; sin `id` cuando es un recurso nuevo. */
export type DatosRecursoReservable = Omit<RecursoReservable, 'id'> & { id?: number };

export const CANTIDAD_MAXIMA = 999;
export const LONGITUD_MAXIMA_NOMBRE = 80;
export const LONGITUD_MINIMA_NOMBRE = 3;

let siguienteId = 0;

/** Compara nombres sin distinguir mayúsculas, tildes ni espacios repetidos. */
export function normalizarNombre(nombre: string): string {
  return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

@Component({
  selector: 'app-recurso-reservable-form',
  templateUrl: './recurso-reservable-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cancelar.emit()' },
})
export class RecursoReservableFormComponent {
  /** Recurso a editar. Sin recurso, el formulario crea uno nuevo. */
  readonly recurso = input<RecursoReservable | null>(null);
  /** Nombres ya registrados, para no repetirlos. */
  readonly nombresExistentes = input<readonly string[]>([]);

  readonly guardar = output<DatosRecursoReservable>();
  readonly cancelar = output<void>();

  protected readonly id = `recurso-reservable-form-${siguienteId++}`;
  protected readonly CANTIDAD_MAXIMA = CANTIDAD_MAXIMA;
  protected readonly LONGITUD_MAXIMA_NOMBRE = LONGITUD_MAXIMA_NOMBRE;

  protected readonly nombre = linkedSignal(() => this.recurso()?.nombre ?? '');
  protected readonly cantidad = linkedSignal(() => String(this.recurso()?.cantidad ?? 1));
  protected readonly estado = linkedSignal(() => this.recurso()?.estado ?? true);
  /** Los errores se muestran después del primer intento de guardar. */
  protected readonly intentado = signal(false);

  protected readonly editando = computed(() => this.recurso() !== null);
  protected readonly numeroCantidad = computed(() => {
    const numero = Number(this.cantidad().trim());
    return Number.isInteger(numero) ? numero : 0;
  });

  protected readonly errorNombre = computed(() => {
    const nombre = normalizarNombre(this.nombre());
    if (!nombre) return 'Escribe el nombre del recurso.';
    if (nombre.length < LONGITUD_MINIMA_NOMBRE)
      return `El nombre debe tener al menos ${LONGITUD_MINIMA_NOMBRE} caracteres.`;
    if (this.nombre().trim().length > LONGITUD_MAXIMA_NOMBRE)
      return `El nombre admite hasta ${LONGITUD_MAXIMA_NOMBRE} caracteres.`;
    const propio = normalizarNombre(this.recurso()?.nombre ?? '');
    const repetido = this.nombresExistentes().some(
      (existente) => normalizarNombre(existente) === nombre && nombre !== propio,
    );
    return repetido ? 'Ya existe un recurso con ese nombre.' : null;
  });

  protected readonly errorCantidad = computed(() => {
    const valor = this.cantidad().trim();
    const numero = Number(valor);
    return /^\d+$/.test(valor) && numero >= 1 && numero <= CANTIDAD_MAXIMA
      ? null
      : `La cantidad debe ser un número entero entre 1 y ${CANTIDAD_MAXIMA}.`;
  });

  private readonly campoNombre = viewChild.required<ElementRef<HTMLInputElement>>('campoNombre');
  private readonly campoCantidad =
    viewChild.required<ElementRef<HTMLInputElement>>('campoCantidad');

  constructor() {
    afterNextRender(() => this.campoNombre().nativeElement.focus());
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.intentado.set(true);

    if (this.errorNombre()) {
      this.campoNombre().nativeElement.focus();
      return;
    }
    if (this.errorCantidad()) {
      this.campoCantidad().nativeElement.focus();
      return;
    }

    const id = this.recurso()?.id;
    this.guardar.emit({
      ...(id === undefined ? {} : { id }),
      nombre: this.nombre().replace(/\s+/g, ' ').trim(),
      cantidad: Number(this.cantidad()),
      estado: this.estado(),
    });
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  /** Botones − / +: siempre dejan un entero entre 1 y la cantidad máxima. */
  protected sumarCantidad(delta: number): void {
    const nueva = Math.min(Math.max(this.numeroCantidad() + delta, 1), CANTIDAD_MAXIMA);
    this.cantidad.set(String(nueva));
  }
}
