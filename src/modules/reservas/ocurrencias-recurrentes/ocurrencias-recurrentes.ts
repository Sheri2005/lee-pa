// C4-10 · Dueño: G4 · Reservas
// Fechas que genera la recurrencia, cada una con su estado: disponible, con conflicto o por comprobar.
// Hijo de app-reserva-form (C4-06): recibe las ocurrencias ya evaluadas; no consulta servicios ni genera fechas.
import { Component, computed, input, signal } from '@angular/core';
import {
  ConflictoOcurrencia,
  EstadoOcurrencia,
  Ocurrencia,
} from '../../../app/core/models/ocupacion.model';
import { SEPARACION_MINUTOS } from '../../../app/core/services/ocupacion.service';
import { fechaCorta } from '../../../app/shared/components/selector-rango-fechas/campo-fecha';

/** Filas que se muestran antes de "Ver todas". */
export const FILAS_INICIALES = 8;

const ESTADOS: Record<EstadoOcurrencia, string> = {
  DISPONIBLE: 'Disponible',
  CONFLICTO: 'Con conflicto',
  PENDIENTE: 'Por comprobar',
};

/** `2026-11-10` → `Mar 10/11/2026`. */
export function fechaConDia(iso: string): string {
  const dia = new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', weekday: 'short' })
    .format(new Date(`${iso}T12:00:00Z`))
    .replace('.', '');
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fechaCorta(iso)}`;
}

/** "Se cruza con la clase Cálculo I · P1 (08:00–10:00)". */
export function describirConflicto(
  { ocupacion, motivo }: ConflictoOcurrencia,
  separacion = SEPARACION_MINUTOS,
): string {
  const que =
    ocupacion.tipo === 'CLASE'
      ? `la clase ${ocupacion.titulo}`
      : `la reserva ${ocupacion.estado === 'APROBADA' ? 'aprobada ' : ''}«${ocupacion.titulo}»`;
  const horario = `${ocupacion.hora_inicio}–${ocupacion.hora_fin}`;
  return motivo === 'CRUCE'
    ? `Se cruza con ${que} (${horario}).`
    : `Quedan menos de ${separacion} minutos libres con ${que} (${horario}).`;
}

export type FiltroOcurrencias = 'TODAS' | 'DISPONIBLE' | 'CONFLICTO';

const FILTROS: readonly { valor: FiltroOcurrencias; etiqueta: string }[] = [
  { valor: 'TODAS', etiqueta: 'Todas' },
  { valor: 'DISPONIBLE', etiqueta: 'Disponibles' },
  { valor: 'CONFLICTO', etiqueta: 'Con conflicto' },
];

let siguienteId = 0;

@Component({
  selector: 'app-ocurrencias-recurrentes',
  templateUrl: './ocurrencias-recurrentes.html',
  host: { class: 'block min-w-0' },
})
export class OcurrenciasRecurrentesComponent {
  readonly ocurrencias = input<readonly Ocurrencia[]>([]);

  protected readonly id = `ocurrencias-recurrentes-${siguienteId++}`;
  protected readonly filtroElegido = signal<FiltroOcurrencias>('TODAS');
  protected readonly expandida = signal(false);

  protected readonly conteo = computed(() => {
    const conteo: Record<EstadoOcurrencia, number> = { DISPONIBLE: 0, CONFLICTO: 0, PENDIENTE: 0 };
    for (const o of this.ocurrencias()) conteo[o.estado]++;
    return conteo;
  });
  /** El filtro aparece cuando ya hay fechas comprobadas (disponibles o con conflicto). */
  protected readonly hayComprobadas = computed(
    () => !!(this.conteo().DISPONIBLE + this.conteo().CONFLICTO),
  );
  /** Si la opción elegida se queda sin fechas (por ejemplo, se resuelven los conflictos), se ven todas. */
  protected readonly filtro = computed<FiltroOcurrencias>(() => {
    const elegido = this.filtroElegido();
    return elegido !== 'TODAS' && this.conteo()[elegido] ? elegido : 'TODAS';
  });
  protected readonly filtradas = computed(() => {
    const filtro = this.filtro();
    return filtro === 'TODAS'
      ? this.ocurrencias()
      : this.ocurrencias().filter((o) => o.estado === filtro);
  });
  protected readonly visibles = computed(() =>
    this.expandida() ? this.filtradas() : this.filtradas().slice(0, FILAS_INICIALES),
  );
  protected readonly ocultas = computed(() => this.filtradas().length - this.visibles().length);

  /** Resumen que se anuncia a los lectores de pantalla cuando cambia el resultado. */
  protected readonly resumen = computed(() => {
    const { DISPONIBLE, CONFLICTO, PENDIENTE } = this.conteo();
    const total = this.ocurrencias().length;
    if (!total) return '';
    if (PENDIENTE === total) return `${total} ${total === 1 ? 'fecha' : 'fechas'} por comprobar`;
    return [
      DISPONIBLE ? `${DISPONIBLE} ${DISPONIBLE === 1 ? 'disponible' : 'disponibles'}` : '',
      CONFLICTO ? `${CONFLICTO} con conflicto` : '',
      PENDIENTE ? `${PENDIENTE} por comprobar` : '',
    ]
      .filter(Boolean)
      .join(', ');
  });

  protected readonly FILAS_INICIALES = FILAS_INICIALES;
  protected readonly ESTADOS = ESTADOS;
  protected readonly FILTROS = FILTROS;
  protected readonly fechaConDia = fechaConDia;
  protected readonly describirConflicto = describirConflicto;

  protected cantidad(filtro: FiltroOcurrencias): number {
    return filtro === 'TODAS' ? this.ocurrencias().length : this.conteo()[filtro];
  }

  protected filtrar(filtro: FiltroOcurrencias): void {
    this.filtroElegido.set(filtro);
    this.expandida.set(false);
  }
}
