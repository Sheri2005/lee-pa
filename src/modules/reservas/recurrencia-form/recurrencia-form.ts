// C4-09 · Dueño: G4 · Reservas · Responsable: Justin Soledispa
// Recurrencia semanal de una reserva: días de la semana y rango de fechas.
// Hijo de app-reserva-form (C4-06). Usa app-selector-rango-fechas (C4-05) para el rango.
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { CampoFechaComponent } from '../../../app/shared/components/selector-rango-fechas/campo-fecha';
import { DiaSemana, ReservaSerie } from '../../../app/core/models/reserva.model';
import {
  diasEnRango,
  fechaLegible,
  fechaValida,
  hoy,
  PeriodoRango,
  rangoCompleto,
  sumarDias,
  validarRango,
} from '../../../app/shared/components/selector-rango-fechas/rango-fechas';
import { SelectorRangoFechasComponent } from '../../../app/shared/components/selector-rango-fechas/selector-rango-fechas';

/** Lo que emite el formulario: una serie de reserva sin `id`. */
export type Recurrencia = Omit<ReservaSerie, 'id'>;

export const DIAS_SEMANA: readonly { valor: DiaSemana; corto: string; nombre: string }[] = [
  { valor: 'LUNES', corto: 'Lun', nombre: 'Lunes' },
  { valor: 'MARTES', corto: 'Mar', nombre: 'Martes' },
  { valor: 'MIERCOLES', corto: 'Mié', nombre: 'Miércoles' },
  { valor: 'JUEVES', corto: 'Jue', nombre: 'Jueves' },
  { valor: 'VIERNES', corto: 'Vie', nombre: 'Viernes' },
  { valor: 'SABADO', corto: 'Sáb', nombre: 'Sábado' },
];

/** Política de reservas: se solicitan de lunes a viernes y una serie abarca hasta 90 días. */
export const DIAS_HABILES: readonly DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
];
export const MAXIMO_DIAS_SERIE = 90;

const DIA_POR_INDICE: (DiaSemana | null)[] = [
  null,
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
];

/** Fechas (YYYY-MM-DD) que genera la recurrencia, en orden. */
export function generarFechas(recurrencia: Recurrencia): string[] {
  const { fecha_desde: desde, fecha_hasta: hasta, dias_semana: dias } = recurrencia;
  if (!rangoCompleto({ desde, hasta }) || !dias.length) return [];

  const fechas: string[] = [];
  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    const dia = DIA_POR_INDICE[new Date(`${fecha}T12:00:00Z`).getUTCDay()];
    if (dia && dias.includes(dia)) fechas.push(fecha);
  }
  return fechas;
}

/** Mensaje de error de la recurrencia o `null` si es válida. */
export function validarRecurrencia(
  recurrencia: Recurrencia,
  maxDias = MAXIMO_DIAS_SERIE,
  fechaMin = '',
): string | null {
  const rango = { desde: recurrencia.fecha_desde, hasta: recurrencia.fecha_hasta };
  if (!recurrencia.dias_semana.length) return 'Elige al menos un día de la semana.';
  if (!fechaValida(rango.desde) || !fechaValida(rango.hasta))
    return 'Elige la fecha inicial y la final de la serie.';
  const errorRango = validarRango(rango);
  if (errorRango) return errorRango;
  if (fechaValida(fechaMin) && rango.desde < fechaMin)
    return `La serie no puede empezar antes de ${fechaLegible(fechaMin)}.`;
  if (diasEnRango(rango) > maxDias) return `La serie puede abarcar hasta ${maxDias} días.`;
  if (!generarFechas(recurrencia).length)
    return 'Ninguno de los días elegidos cae dentro del rango de fechas.';
  return null;
}

let siguienteId = 0;

@Component({
  selector: 'app-recurrencia-form',
  imports: [CampoFechaComponent, SelectorRangoFechasComponent],
  templateUrl: './recurrencia-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurrenciaFormComponent {
  /** Días que se pueden elegir. Por defecto, de lunes a viernes. */
  readonly diasHabilitados = input<readonly DiaSemana[]>(DIAS_HABILES);
  readonly maxDias = input(MAXIMO_DIAS_SERIE);
  /** Se pasan a app-selector-rango-fechas para su atajo "Período". */
  readonly periodos = input<readonly PeriodoRango[]>([]);
  readonly fechaReferencia = input('');
  /** Primera fecha permitida para la serie. Por defecto, hoy. */
  readonly fechaMin = input(hoy());
  /**
   * Fecha de la reserva que se repite. Si se indica, la serie empieza ese día (no se pide "Desde")
   * y su día de la semana queda elegido; así el formulario de reserva no pregunta la fecha dos veces.
   */
  readonly fechaInicio = input('');

  /** Admiten `[dias]`, `[desde]` y `[hasta]` para precargar, o enlace doble para limpiar. */
  readonly dias = model<DiaSemana[]>([]);
  readonly desde = model('');
  readonly hasta = model('');

  /** En cada cambio del usuario: la recurrencia si es válida, o `null` si no lo es. */
  readonly recurrenciaChange = output<Recurrencia | null>();

  protected readonly id = `recurrencia-form-${siguienteId++}`;
  protected readonly opciones = computed(() =>
    DIAS_SEMANA.filter((dia) => this.diasHabilitados().includes(dia.valor)),
  );
  /** "Desde" real: la fecha de la reserva si viene del padre, o la elegida por el usuario. */
  protected readonly inicio = computed(() =>
    fechaValida(this.fechaInicio()) ? this.fechaInicio() : this.desde(),
  );
  /** Última fecha que puede elegirse como "Hasta" cuando el inicio es fijo. */
  protected readonly hastaMaximo = computed(() =>
    fechaValida(this.fechaInicio()) ? sumarDias(this.fechaInicio(), this.maxDias() - 1) : '',
  );
  protected readonly recurrencia = computed<Recurrencia>(() => ({
    frecuencia: 'SEMANAL',
    dias_semana: DIAS_SEMANA.map((d) => d.valor).filter((d) => this.dias().includes(d)),
    fecha_desde: this.inicio(),
    fecha_hasta: this.hasta(),
  }));
  protected readonly error = computed(() =>
    validarRecurrencia(this.recurrencia(), this.maxDias(), this.fechaMin()),
  );
  protected readonly fechaLegible = fechaLegible;

  constructor() {
    // Con una fecha de inicio fija, su día de la semana queda elegido si el usuario aún no eligió ninguno.
    effect(() => {
      const inicio = this.fechaInicio();
      if (!fechaValida(inicio)) return;
      const dia = DIA_POR_INDICE[new Date(`${inicio}T12:00:00Z`).getUTCDay()];
      untracked(() => {
        if (dia && !this.dias().length && this.diasHabilitados().includes(dia))
          this.dias.set([dia]);
      });
    });
  }
  protected readonly fechas = computed(() =>
    this.error() ? [] : generarFechas(this.recurrencia()),
  );
  /**
   * Con todo vacío no se muestra error. El de un rango invertido ya lo muestra app-selector-rango-fechas,
   * así que aquí no se repite.
   */
  protected readonly mostrarError = computed(
    () =>
      !!this.error() &&
      !!(this.dias().length || this.desde() || this.hasta()) &&
      (!!this.fechaInicio() || !validarRango({ desde: this.desde(), hasta: this.hasta() })),
  );
  protected readonly resumenFechas = computed(() => {
    const fechas = this.fechas().map(fechaLegible);
    if (fechas.length <= 6) return fechas.join(' · ');
    return `${fechas.slice(0, 6).join(' · ')} y ${fechas.length - 6} más`;
  });

  protected alternarDia(dia: DiaSemana): void {
    this.dias.update((dias) =>
      dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia],
    );
    this.emitir();
  }

  protected cambiarDesde(valor: string): void {
    this.desde.set(valor);
    this.emitir();
  }

  protected cambiarHasta(valor: string): void {
    this.hasta.set(valor);
    this.emitir();
  }

  private emitir(): void {
    this.recurrenciaChange.emit(this.error() ? null : this.recurrencia());
  }
}
