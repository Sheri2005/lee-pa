// C4-16 · Dueño: G4 · Reservas
// Página de administración del catálogo de recursos reservables.
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecursoReservable } from '../../../app/core/models/reserva.model';
import { RecursoReservableService } from '../../../app/core/services/recurso-reservable.service';
import {
  DatosRecursoReservable,
  normalizarNombre,
  RecursoReservableFormComponent,
} from '../recurso-reservable-form/recurso-reservable-form';

export type FiltroRecursos = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

const FILTROS: readonly { valor: FiltroRecursos; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'ACTIVOS', etiqueta: 'Activos' },
  { valor: 'INACTIVOS', etiqueta: 'Inactivos' },
];

@Component({
  selector: 'app-recursos-reservables-lista',
  imports: [RecursoReservableFormComponent],
  templateUrl: './recursos-reservables-lista.html',
})
export class RecursosReservablesListaComponent {
  private readonly servicio = inject(RecursoReservableService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly recursos = signal<RecursoReservable[]>([]);
  protected readonly cargando = signal(true);
  protected readonly mensajeError = signal('');
  protected readonly formularioAbierto = signal(false);
  protected readonly seleccionado = signal<RecursoReservable | null>(null);
  protected readonly cambiandoEstado = signal<number | null>(null);
  /** Aviso del último cambio de estado ("Laptop quedó inactivo"). */
  protected readonly aviso = signal('');

  protected readonly FILTROS = FILTROS;
  protected readonly filtroElegido = signal<FiltroRecursos>('TODOS');
  protected readonly busqueda = signal('');
  protected readonly conteo = computed(() => {
    const activos = this.recursos().filter((r) => r.estado).length;
    return {
      TODOS: this.recursos().length,
      ACTIVOS: activos,
      INACTIVOS: this.recursos().length - activos,
    };
  });
  /** Si la opción elegida se queda sin recursos, se ven todos. */
  protected readonly filtro = computed<FiltroRecursos>(() => {
    const elegido = this.filtroElegido();
    return elegido !== 'TODOS' && this.conteo()[elegido] ? elegido : 'TODOS';
  });
  /** Recursos del filtro y la búsqueda (sin importar mayúsculas ni tildes): activos primero, cada grupo en orden alfabético. */
  protected readonly visibles = computed(() => {
    const filtro = this.filtro();
    const texto = normalizarNombre(this.busqueda());
    return this.recursos()
      .filter((r) => filtro === 'TODOS' || r.estado === (filtro === 'ACTIVOS'))
      .filter((r) => !texto || normalizarNombre(r.nombre).includes(texto))
      .sort(
        (a, b) => Number(b.estado) - Number(a.estado) || a.nombre.localeCompare(b.nombre, 'es'),
      );
  });

  constructor() {
    this.servicio
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (recursos) => {
          this.recursos.set(recursos);
          this.cargando.set(false);
        },
        error: () => {
          this.mensajeError.set('No se pudo cargar el catálogo de recursos.');
          this.cargando.set(false);
        },
      });
  }

  protected nuevo(): void {
    this.seleccionado.set(null);
    this.formularioAbierto.set(true);
  }
  protected editar(recurso: RecursoReservable): void {
    this.seleccionado.set(recurso);
    this.formularioAbierto.set(true);
  }

  protected guardar(datos: DatosRecursoReservable): void {
    const operacion =
      datos.id === undefined
        ? this.servicio.crear({
            nombre: datos.nombre,
            cantidad: datos.cantidad,
            estado: datos.estado,
          })
        : this.servicio.actualizar({
            id: datos.id,
            nombre: datos.nombre,
            cantidad: datos.cantidad,
            estado: datos.estado,
          });
    operacion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (guardado) => {
        if (guardado)
          this.recursos.update((recursos) =>
            recursos.some((recurso) => recurso.id === guardado.id)
              ? recursos.map((recurso) => (recurso.id === guardado.id ? guardado : recurso))
              : [...recursos, guardado],
          );
        this.formularioAbierto.set(false);
      },
      error: () => this.mensajeError.set('No se pudo guardar el recurso.'),
    });
  }

  protected filtrar(filtro: FiltroRecursos): void {
    this.filtroElegido.set(filtro);
  }

  protected buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected alternarEstado(recurso: RecursoReservable): void {
    this.aviso.set('');
    this.cambiandoEstado.set(recurso.id);
    this.servicio
      .cambiarEstado(recurso.id, !recurso.estado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          if (actualizado) {
            this.recursos.update((recursos) =>
              recursos.map((actual) =>
                actual.id === recurso.id ? { ...actual, estado: !actual.estado } : actual,
              ),
            );
            this.aviso.set(`${recurso.nombre} quedó ${recurso.estado ? 'inactivo' : 'activo'}.`);
          } else {
            this.mensajeError.set(
              'No se pudo cambiar el estado: el servicio todavía no está conectado.',
            );
          }
          this.cambiandoEstado.set(null);
        },
        error: () => {
          this.mensajeError.set('No se pudo cambiar el estado del recurso.');
          this.cambiandoEstado.set(null);
        },
      });
  }

  protected nombres(): string[] {
    return this.recursos().map((recurso) => recurso.nombre);
  }
}
