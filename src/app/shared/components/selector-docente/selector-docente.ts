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
import { Docente } from '../../models/docente.model';
import { DocenteService } from '../../services/docente.service';

const MAX_RESULTADOS = 10;

let siguienteId = 0;

/** Minúsculas y sin tildes, para que "sofia" encuentre "Sofía". */
const normalizar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Autocompletar de docentes (C1-43).
 *
 * Busca por nombre o identificación (varias palabras, en cualquier orden) y muestra la carga
 * máxima de cada docente. Con `materiaId` lista solo a los docentes habilitados para esa materia.
 * Funciona con teclado: flechas, Enter y Escape.
 */
@Component({
  selector: 'app-selector-docente',
  templateUrl: './selector-docente.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SelectorDocenteComponent {
  private readonly docenteService = inject(DocenteService);

  /** Limita la lista a los docentes habilitados para esta materia. */
  readonly materiaId = input<number>();

  /** Emite el docente completo al seleccionarlo. */
  readonly docenteChange = output<Docente>();

  protected readonly idInput = `selector-docente-${siguienteId++}`;
  protected readonly idLista = `${this.idInput}-lista`;

  protected readonly texto = signal('');
  protected readonly abierto = signal(false);
  protected readonly activo = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  private readonly seleccionado = signal<Docente | null>(null);

  // Vuelve a pedir los docentes cuando cambia la materia.
  private readonly docentes = toSignal(
    toObservable(this.materiaId).pipe(
      tap(() => {
        this.error.set(false);
        this.cargando.set(true);
      }),
      switchMap((materiaId) =>
        this.docenteService.listar({ materiaId }).pipe(
          catchError(() => {
            this.error.set(true);
            return of([] as Docente[]);
          }),
        ),
      ),
      tap(() => this.cargando.set(false)),
    ),
    { initialValue: [] as Docente[] },
  );

  protected readonly resultados = computed(() => {
    const palabras = normalizar(this.texto()).split(/\s+/).filter(Boolean);
    const lista = this.docentes();
    const coinciden = palabras.length
      ? lista.filter((d) => {
          const contenido = `${normalizar(d.nombre)} ${d.identificacion}`;
          return palabras.every((p) => contenido.includes(p));
        })
      : lista;
    return coinciden.slice(0, MAX_RESULTADOS);
  });

  /** Hay una materia elegida pero ningún docente habilitado para ella. */
  protected readonly sinHabilitados = computed(
    () =>
      this.materiaId() != null && !this.cargando() && !this.error() && this.docentes().length === 0,
  );

  constructor() {
    // Si al cambiar la materia el docente elegido ya no está habilitado, se limpia el campo.
    effect(() => {
      const lista = this.docentes();
      untracked(() => {
        const elegido = this.seleccionado();
        if (elegido && !lista.some((d) => d.id === elegido.id)) {
          this.seleccionado.set(null);
          this.texto.set('');
        }
      });
    });
  }

  protected alEscribir(valor: string): void {
    this.texto.set(valor);
    this.seleccionado.set(null);
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
        const docente = this.resultados()[this.activo()];
        if (this.abierto() && docente) {
          evento.preventDefault();
          this.seleccionar(docente);
        }
        break;
      }
      case 'Escape':
        this.abierto.set(false);
        break;
    }
  }

  protected seleccionar(docente: Docente): void {
    this.seleccionado.set(docente);
    this.texto.set(docente.nombre);
    this.abierto.set(false);
    this.docenteChange.emit(docente);
  }

  protected abrir(): void {
    this.abierto.set(true);
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }
}