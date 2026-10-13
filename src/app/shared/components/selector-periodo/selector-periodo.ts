import {
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
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { etiquetaTipoPeriodo, Periodo } from '../../models/periodo.model';
import { PeriodoService } from '../../services/periodo.service';

/** Estados en los que se preselecciona el período automáticamente. */
const ESTADOS_PRESELECCION = ['planificacion', 'activo'];

let siguienteId = 0;

/**
 * Selector de período académico (C1-28).
 *
 * Lista los períodos (código · nombre · tipo), preselecciona el que está en planificación o
 * activo y emite el período completo —incluido el tipo— para que G3/G4 carguen las franjas
 * correctas. Se puede filtrar por `estados` y por `tipo`.
 */
@Component({
  selector: 'app-selector-periodo',
  templateUrl: './selector-periodo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SelectorPeriodoComponent {
  private readonly periodoService = inject(PeriodoService);

  /** Muestra solo los períodos en esos estados (ej. `['PLANIFICACION', 'ACTIVO']`). */
  readonly estados = input<string[]>();
  /** Muestra solo los períodos de ese tipo (ej. `'ORDINARIO'`). */
  readonly tipo = input<string>();

  /** Emite el período completo al preseleccionar y cada vez que el usuario cambia. */
  readonly periodoChange = output<Periodo>();

  protected readonly idSelect = `selector-periodo-${siguienteId++}`;
  protected readonly error = signal(false);
  protected readonly seleccionadoId = signal<number | null>(null);

  private readonly periodos = toSignal(
    this.periodoService.listar().pipe(
      catchError(() => {
        this.error.set(true);
        return of([] as Periodo[]);
      }),
    ),
    { initialValue: null },
  );

  protected readonly cargando = computed(() => this.periodos() === null);

  protected readonly filtrados = computed(() => {
    const estados = this.estados()?.map((e) => e.toLowerCase());
    const tipo = this.tipo()?.toLowerCase();
    return (this.periodos() ?? []).filter(
      (p) =>
        (!estados?.length || estados.includes(p.estado.toLowerCase())) &&
        (!tipo || p.tipo.toLowerCase() === tipo),
    );
  });

  constructor() {
    // Conserva la selección mientras siga en la lista; si no, preselecciona planificación/activo.
    effect(() => {
      const lista = this.filtrados();
      untracked(() => {
        const actual = this.seleccionadoId();
        if (actual !== null && lista.some((p) => p.id === actual)) return;

        const preseleccion = lista.find((p) =>
          ESTADOS_PRESELECCION.includes(p.estado.toLowerCase()),
        );
        if (preseleccion) {
          this.seleccionar(preseleccion);
        } else {
          this.seleccionadoId.set(null);
        }
      });
    });
  }

  protected etiquetaTipo(tipo: string): string {
    return etiquetaTipoPeriodo(tipo);
  }

  protected alCambiar(valor: string): void {
    const periodo = this.filtrados().find((p) => p.id === Number(valor));
    if (periodo) this.seleccionar(periodo);
  }

  private seleccionar(periodo: Periodo): void {
    this.seleccionadoId.set(periodo.id);
    this.periodoChange.emit(periodo);
  }
}
