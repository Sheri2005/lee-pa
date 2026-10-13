// C4-12 · Dueño: G4 · Reservas
// Diálogo de detalle de una reserva con resumen, trazabilidad y cancelación controlada.
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { ResumenReserva } from '../../../app/core/models/reserva.model';
import { ReservaService } from '../../../app/core/services/reserva.service';
import { fechaLegible } from '../../../app/shared/components/selector-rango-fechas/rango-fechas';
import {
  ETIQUETA_ESTADO,
  ResumenReservaComponent,
} from '../../../app/shared/components/resumen-reserva/resumen-reserva';

type EstadoDetalle =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; reserva: ResumenReserva }
  | { tipo: 'no-encontrada' }
  | { tipo: 'error' };

let siguienteId = 0;

export function hoyEnGuayaquil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Qué se cancela: solo la fecha abierta o, si es una serie, todas sus fechas que aún se pueden cancelar
 * (las que ya pasaron o están rechazadas o canceladas no cambian).
 */
export type AlcanceCancelacion = 'FECHA' | 'SERIE';

/** Fechas de la reserva que se pueden cancelar: pendientes o aprobadas, de hoy en adelante. */
export function fechasCancelables(reserva: ResumenReserva, hoy = hoyEnGuayaquil()) {
  return reserva.sesiones.filter(
    (s) => (s.estado === 'PENDIENTE' || s.estado === 'APROBADA') && s.fecha >= hoy,
  );
}

/**
 * Se puede cancelar la fecha abierta (`reservaId`) si la reserva es del usuario, esa fecha está pendiente o
 * aprobada y es hoy o posterior. En una serie se mira solo esa ocurrencia, no las demás.
 */
export function reservaCancelable(
  reserva: ResumenReserva,
  reservaId: number,
  usuarioActualId: number | null,
  hoy = hoyEnGuayaquil(),
): boolean {
  const sesion = reserva.sesiones.find((s) => s.reserva_id === reservaId);
  return (
    !!sesion &&
    usuarioActualId !== null &&
    reserva.solicitante.id === usuarioActualId &&
    (sesion.estado === 'PENDIENTE' || sesion.estado === 'APROBADA') &&
    sesion.fecha >= hoy
  );
}

@Component({
  selector: 'app-reserva-detalle',
  imports: [ResumenReservaComponent],
  templateUrl: './reserva-detalle.html',
  host: { '(document:keydown.escape)': 'cerrarConEscape()' },
})
export class ReservaDetalleComponent {
  readonly reservaId = input.required<number>();
  /** Entrada opcional añadida al contrato para comprobar que la reserva pertenece al usuario. */
  readonly usuarioActualId = input<number | null>(null);

  /** Solicita al padre cerrar el diálogo sin cambios. */
  readonly cerrar = output<void>();
  /**
   * Solicita cancelar después de la confirmación: `'FECHA'` (solo la fecha abierta) o `'SERIE'` (todas las
   * fechas pendientes de la serie). Cambia el contrato del Excel, que no llevaba datos.
   */
  readonly cancelar = output<AlcanceCancelacion>();

  private readonly servicio = inject(ReservaService);
  protected readonly id = `reserva-detalle-${siguienteId++}`;
  protected readonly ETIQUETA_ESTADO = ETIQUETA_ESTADO;
  private readonly dialogo = viewChild.required<ElementRef<HTMLElement>>('dialogo');
  protected readonly confirmandoCancelacion = signal(false);

  protected readonly estado = toSignal(
    toObservable(this.reservaId).pipe(
      switchMap((id): Observable<EstadoDetalle> =>
        this.servicio.obtenerResumen(id).pipe(
          map((reserva): EstadoDetalle =>
            reserva ? { tipo: 'listo', reserva } : { tipo: 'no-encontrada' },
          ),
          catchError(() => of<EstadoDetalle>({ tipo: 'error' })),
          startWith<EstadoDetalle>({ tipo: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando' } as EstadoDetalle },
  );

  protected readonly puedeCancelar = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'listo'
      ? reservaCancelable(estado.reserva, this.reservaId(), this.usuarioActualId())
      : false;
  });
  protected readonly reserva = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'listo' ? estado.reserva : null;
  });
  /** Fechas de la serie que se cancelarían con «Toda la serie»; vacío si no es una serie. */
  protected readonly restantesSerie = computed(() => {
    const reserva = this.reserva();
    return reserva?.serie ? fechasCancelables(reserva) : [];
  });
  /** Solo hay elección si la serie tiene más de una fecha que se pueda cancelar. */
  protected readonly ofrecerSerie = computed(() => this.restantesSerie().length > 1);
  protected readonly alcance = signal<AlcanceCancelacion>('FECHA');
  protected readonly fechaAbierta = computed(() => {
    const sesion = this.reserva()?.sesiones.find((s) => s.reserva_id === this.reservaId());
    return sesion ? fechaLegible(sesion.fecha) : '';
  });

  constructor() {
    // Al abrirse, el foco pasa al diálogo para que el teclado y los lectores de pantalla empiecen ahí.
    afterNextRender(() => this.dialogo().nativeElement.focus());
  }

  /** Clic en el fondo oscuro (fuera del diálogo): cierra. */
  protected cerrarDesdeFondo(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) this.cerrarConEscape();
  }

  protected cerrarConEscape(): void {
    if (this.confirmandoCancelacion()) {
      this.confirmandoCancelacion.set(false);
      return;
    }
    this.cerrar.emit();
  }

  protected pedirCancelacion(): void {
    this.alcance.set('FECHA');
    this.confirmandoCancelacion.set(true);
  }

  protected confirmarCancelacion(): void {
    if (!this.puedeCancelar()) return;
    this.confirmandoCancelacion.set(false);
    this.cancelar.emit(this.ofrecerSerie() ? this.alcance() : 'FECHA');
  }
}
