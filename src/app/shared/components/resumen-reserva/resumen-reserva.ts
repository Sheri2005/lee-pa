// C4-13 · Responsable: Justin Soledispa · Dueño: G4 · Reservas
// Resumen de solo lectura de una reserva (o serie): espacio, fecha y horas u ocurrencias, solicitante,
// asistentes, motivo, recursos y estado. Lo usan app-reserva-detalle (C4-12) y app-solicitud-detalle (G5).
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { DiaSemana, EstadoReserva, ResumenReserva } from '../../../core/models/reserva.model';
import { ReservaService } from '../../../core/services/reserva.service';
import { fechaLegible } from '../selector-rango-fechas/rango-fechas';

type EstadoCarga =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; resumen: ResumenReserva }
  | { tipo: 'no-encontrada' }
  | { tipo: 'error' };

const NOMBRE_DIA: Record<DiaSemana, string> = {
  LUNES: 'lunes',
  MARTES: 'martes',
  MIERCOLES: 'miércoles',
  JUEVES: 'jueves',
  VIERNES: 'viernes',
  SABADO: 'sábado',
};

export const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

// TEMPORAL: colores del estado hasta usar <app-estado-badge> (C5-08, G5). La paleta no tiene tokens
// de éxito ni de error, así que aprobada y rechazada usan la paleta estándar de Tailwind.
const CLASES_ESTADO: Record<EstadoReserva, string> = {
  PENDIENTE: 'bg-accent-gold/10 text-accent-gold',
  APROBADA: 'bg-emerald-50 text-emerald-700',
  RECHAZADA: 'bg-red-50 text-red-700',
  CANCELADA: 'bg-muted text-text-secondary',
};

export function diasTexto(dias: readonly DiaSemana[]): string {
  const nombres = dias.map((dia) => NOMBRE_DIA[dia]);
  return nombres.length > 1
    ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
    : (nombres[0] ?? '');
}

export function pisoTexto(piso: number): string {
  return piso === 0 ? 'Planta baja' : `Piso ${piso}`;
}

export function tipoTexto(tipo: string): string {
  return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
}

@Component({
  selector: 'app-resumen-reserva',
  templateUrl: './resumen-reserva.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenReservaComponent {
  readonly reservaId = input.required<number>();

  private readonly servicio = inject(ReservaService);

  protected readonly carga = toSignal(
    toObservable(this.reservaId).pipe(
      switchMap((id): Observable<EstadoCarga> =>
        this.servicio.obtenerResumen(id).pipe(
          map((resumen): EstadoCarga =>
            resumen ? { tipo: 'listo', resumen } : { tipo: 'no-encontrada' },
          ),
          catchError(() => of<EstadoCarga>({ tipo: 'error' })),
          startWith<EstadoCarga>({ tipo: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando' } as EstadoCarga },
  );
  protected readonly resumen = computed(() => {
    const carga = this.carga();
    return carga.tipo === 'listo' ? carga.resumen : null;
  });

  protected readonly fechaLegible = fechaLegible;
  protected readonly diasTexto = diasTexto;
  protected readonly pisoTexto = pisoTexto;
  protected readonly tipoTexto = tipoTexto;
  protected readonly ETIQUETA_ESTADO = ETIQUETA_ESTADO;
  protected readonly CLASES_ESTADO = CLASES_ESTADO;
}
