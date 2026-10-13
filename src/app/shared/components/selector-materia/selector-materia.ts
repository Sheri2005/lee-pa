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
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { Materia } from '../../models/materia.model';
import { MateriaService } from '../../services/materia.service';

const MAX_RESULTADOS = 10;

let siguienteId = 0;

/** Minúsculas y sin tildes, para que "calculo" encuentre "Cálculo". */
const normalizar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Autocompletar de materias (C1-31).
 *
 * Busca por código o nombre y muestra la carrera responsable junto al nombre. Se puede limitar
 * a una carrera responsable o a una malla. Funciona con teclado: flechas, Enter y Escape.
 */
@Component({
  selector: 'app-selector-materia',
  templateUrl: './selector-materia.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SelectorMateriaComponent {
  private readonly materiaService = inject(MateriaService);

  /** Limita las materias a las de una carrera responsable. */
  readonly carreraResponsableId = input<number>();
  /** Limita las materias a las de una malla. */
  readonly mallaId = input<number>();

  /** Emite la materia completa al seleccionarla. */
  readonly materiaChange = output<Materia>();

  protected readonly idInput = `selector-materia-${siguienteId++}`;
  protected readonly idLista = `${this.idInput}-lista`;

  protected readonly texto = signal('');
  protected readonly abierto = signal(false);
  protected readonly activo = signal(0);
  protected readonly error = signal(false);
  private readonly seleccionada = signal<Materia | null>(null);

  private readonly filtros = computed(() => ({
    carreraResponsableId: this.carreraResponsableId(),
    mallaId: this.mallaId(),
  }));

  // Vuelve a pedir las materias cuando cambia la carrera o la malla.
  private readonly materias = toSignal(
    toObservable(this.filtros).pipe(
      tap(() => this.error.set(false)),
      switchMap((filtros) =>
        this.materiaService.listar(filtros).pipe(
          catchError(() => {
            this.error.set(true);
            return of([] as Materia[]);
          }),
        ),
      ),
    ),
    { initialValue: [] as Materia[] },
  );

  protected readonly resultados = computed(() => {
    const q = normalizar(this.texto());
    const lista = this.materias();
    const coinciden = q
      ? lista.filter((m) => normalizar(m.codigo).includes(q) || normalizar(m.nombre).includes(q))
      : lista;
    return coinciden.slice(0, MAX_RESULTADOS);
  });

  constructor() {
    // Si al cambiar los filtros la materia elegida ya no está en la lista, se limpia el campo.
    effect(() => {
      const lista = this.materias();
      untracked(() => {
        const elegida = this.seleccionada();
        if (elegida && !lista.some((m) => m.id === elegida.id)) {
          this.seleccionada.set(null);
          this.texto.set('');
        }
      });
    });
  }

  protected alEscribir(valor: string): void {
    this.texto.set(valor);
    this.seleccionada.set(null);
    this.activo.set(0);
    this.abierto.set(true);
  }

  protected alPulsarTecla(evento: KeyboardEvent): void {
    const total = this.resultados().length;
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        this.abierto.set(true);
        this.activo.set(total ? (this.activo() + 1) % total : 0);
        break;
      case 'ArrowUp':
        evento.preventDefault();
        this.activo.set(total ? (this.activo() - 1 + total) % total : 0);
        break;
      case 'Enter': {
        const materia = this.resultados()[this.activo()];
        if (this.abierto() && materia) {
          evento.preventDefault();
          this.seleccionar(materia);
        }
        break;
      }
      case 'Escape':
        this.abierto.set(false);
        break;
    }
  }

  protected seleccionar(materia: Materia): void {
    this.seleccionada.set(materia);
    this.texto.set(`${materia.codigo} · ${materia.nombre}`);
    this.abierto.set(false);
    this.materiaChange.emit(materia);
  }

  protected abrir(): void {
    this.abierto.set(true);
  }

    /** Vacía el campo y cierra la lista, sin emitir. Sirve para agregar varias materias seguidas. */
  limpiar(): void {
    this.texto.set('');
    this.seleccionada.set(null);
    this.abierto.set(false);
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }
}
