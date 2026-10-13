import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import {
  ETIQUETA_ESTADO_PERIODO,
  etiquetaTipoPeriodo,
  Periodo,
  PeriodoDatos,
} from '../../../shared/models/periodo.model';
import { PeriodoService } from '../../../shared/services/periodo.service';
import { PeriodoFormComponent } from '../periodo-form/periodo-form';

interface EstadoVista {
  etiqueta: string;
  clases: string;
  /** Color del puntito que va antes de la etiqueta. */
  punto: string;
}

/**
 * Colores de la paleta oficial (ver TAILWIND-Y-COLORES.md), salvo el verde de "activo", que es el
 * mismo de facultades (C1-20) y la bitácora (C1-56) (ver docs/componentes/g1/guia-colores.md).
 */
const CLASES_ESTADO: Record<string, Omit<EstadoVista, 'etiqueta'>> = {
  PLANIFICACION: { clases: 'bg-header text-accent-gold', punto: 'bg-accent-gold' },
  ACTIVO: { clases: 'bg-green-50', punto: 'bg-green-600' },
  CERRADO: { clases: 'bg-background text-text-secondary', punto: 'bg-text-secondary' },
};

/**
 * Listado de períodos académicos (C1-26). Ruta: /gestion/periodos.
 *
 * Muestra código, nombre, tipo, fechas y estado, con los más recientes primero, y permite crear
 * y editar períodos con `app-periodo-form` (C1-27).
 *
 * NOTA: según la tabla de componentes debe usar `app-encabezado-pagina` (G3), `app-tabla-datos`
 * (G4) y `app-estado-badge` (G5). Mientras no existan en esta rama, el encabezado, la tabla y la
 * etiqueta de estado se dibujan aquí mismo (bloques marcados en la plantilla); al integrarlos,
 * se reemplazan conservando las columnas.
 */
@Component({
  selector: 'app-periodos-lista',
  imports: [DatePipe, PeriodoFormComponent],
  templateUrl: './periodos-lista.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodosListaComponent {
  private readonly periodoService = inject(PeriodoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly error = signal(false);
  protected readonly errorGuardar = signal(false);
  protected readonly guardado = signal(false);

  /** Formulario visible y período que se edita (`null` = período nuevo). */
  protected readonly formAbierto = signal(false);
  protected readonly enEdicion = signal<Periodo | null>(null);

  /** Cada cambio vuelve a pedir la lista. */
  private readonly recarga = signal(0);

  private readonly datos = toSignal(
    toObservable(this.recarga).pipe(
      tap(() => this.error.set(false)),
      switchMap(() =>
        this.periodoService.listar().pipe(
          catchError(() => {
            this.error.set(true);
            return of([] as Periodo[]);
          }),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected readonly cargando = computed(() => this.datos() === null);

  /** Más recientes primero (por fecha de inicio). */
  protected readonly periodos = computed(() =>
    [...(this.datos() ?? [])].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)),
  );

  protected etiquetaTipo(tipo: string): string {
    return etiquetaTipoPeriodo(tipo);
  }

  protected estado(periodo: Periodo): EstadoVista {
    return {
      etiqueta: ETIQUETA_ESTADO_PERIODO[periodo.estado] ?? periodo.estado,
      ...(CLASES_ESTADO[periodo.estado] ?? CLASES_ESTADO['CERRADO']),
    };
  }

  protected nuevo(): void {
    this.enEdicion.set(null);
    this.abrirFormulario();
  }

  protected editar(periodo: Periodo): void {
    this.enEdicion.set(periodo);
    this.abrirFormulario();
  }

  protected cerrarFormulario(): void {
    this.formAbierto.set(false);
    this.enEdicion.set(null);
  }

  protected guardar(datos: PeriodoDatos): void {
    const editando = this.enEdicion();
    const peticion = editando
      ? this.periodoService.actualizar(editando.id, datos)
      : this.periodoService.crear(datos);

    this.errorGuardar.set(false);
    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.cerrarFormulario();
        this.guardado.set(true);
        this.recarga.update((n) => n + 1);
      },
      error: () => this.errorGuardar.set(true),
    });
  }

  private abrirFormulario(): void {
    this.guardado.set(false);
    this.errorGuardar.set(false);
    this.formAbierto.set(true);
  }
}
