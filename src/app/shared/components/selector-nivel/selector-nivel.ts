import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { MallaService } from '../../services/malla.service';

let siguienteId = 0;

/**
 * Selector de niveles de una malla (C1-39).
 *
 * Muestra los niveles (1..n) de la malla como chips y permite elegir uno (`multiple` apagado) o
 * varios (`multiple` encendido). Emite siempre la lista de niveles elegidos, ordenada; sin
 * selección emite `[]`. Si cambia la malla o el modo, descarta lo que ya no corresponde y emite
 * lo que queda.
 */
@Component({
  selector: 'app-selector-nivel',
  templateUrl: './selector-nivel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SelectorNivelComponent {
  private readonly mallaService = inject(MallaService);

  /** Malla de la que se muestran los niveles. Sin malla, el selector queda deshabilitado. */
  readonly mallaId = input<number>();
  /** `false` (por defecto): un solo nivel. `true`: varios niveles. Se puede escribir `multiple`. */
  readonly multiple = input(false, { transform: booleanAttribute });

  /** Emite los niveles elegidos, ordenados de menor a mayor. */
  readonly nivelesChange = output<number[]>();

  protected readonly idGrupo = `selector-nivel-${siguienteId++}`;
  protected readonly cargando = signal(false);
  protected readonly error = signal(false);
  private readonly elegidos = signal<number[]>([]);

  protected readonly claseChip =
    'inline-block min-w-10 rounded-full border border-border bg-surface px-3 py-1 text-center text-sm text-primary-dark hover:bg-muted peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary';

  protected readonly etiqueta = computed(() => (this.multiple() ? 'Niveles' : 'Nivel'));

  // Vuelve a pedir los niveles cuando cambia la malla.
  protected readonly niveles = toSignal(
    toObservable(this.mallaId).pipe(
      tap((id) => {
        this.error.set(false);
        this.cargando.set(id != null);
      }),
      switchMap((id) =>
        id == null
          ? of([] as number[])
          : this.mallaService.listarNiveles(id).pipe(
              catchError(() => {
                this.error.set(true);
                return of([] as number[]);
              }),
            ),
      ),
      tap(() => this.cargando.set(false)),
    ),
    { initialValue: [] as number[] },
  );

  /**
   * Niveles elegidos que siguen siendo válidos para la malla y el modo actuales. Se calcula antes
   * de dibujar, así lo que se ve nunca difiere del estado (los radios dejan solo uno marcado).
   */
  protected readonly seleccion = computed(() => {
    const validos = this.elegidos().filter((n) => this.niveles().includes(n));
    return this.multiple() ? validos : validos.slice(0, 1);
  });

  constructor() {
    // Si la malla o el modo cambian y se descartó algún nivel, guarda lo que queda y avisa.
    effect(() => {
      const vigente = this.seleccion();
      untracked(() => {
        if (vigente.length !== this.elegidos().length) {
          this.elegidos.set(vigente);
          this.nivelesChange.emit(vigente);
        }
      });
    });
  }

  protected estaMarcado(nivel: number): boolean {
    return this.seleccion().includes(nivel);
  }

  protected alCambiar(nivel: number, marcado: boolean): void {
    const actual = this.seleccion();
    let nueva: number[];
    if (!this.multiple()) {
      nueva = marcado ? [nivel] : [];
    } else if (marcado) {
      nueva = actual.includes(nivel) ? actual : [...actual, nivel].sort((a, b) => a - b);
    } else {
      nueva = actual.filter((n) => n !== nivel);
    }
    this.elegidos.set(nueva);
    this.nivelesChange.emit(nueva);
  }

  protected limpiar(): void {
    this.elegidos.set([]);
    this.nivelesChange.emit([]);
  }
}