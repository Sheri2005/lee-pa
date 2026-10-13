// C4-04 · Dueño: G4 · Reservas
// Selector de fecha + hora de inicio y hora de fin con validación (fin > inicio, dentro del horario permitido).
// Lo usan app-filtros-disponibilidad (C4-02) y app-reserva-form (C4-06).
import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { CampoFechaComponent } from '../../../app/shared/components/selector-rango-fechas/campo-fecha';
import {
  fechaLegible,
  fechaValida,
  hoy,
  ZONA_HORARIA,
} from '../../../app/shared/components/selector-rango-fechas/rango-fechas';
import { CampoHoraComponent, horaDe } from './campo-hora';

export interface RangoHorario {
  fecha: string;
  inicio: string;
  fin: string;
}

export interface LimitesRangoHorario {
  fechaMin?: string;
  horaMin?: string;
  horaMax?: string;
  /** Solo de lunes a viernes. */
  soloDiasHabiles?: boolean;
  /** Las horas deben caer en múltiplos de estos minutos (0 = sin restricción). */
  pasoMinutos?: number;
  /** Momento actual; si la fecha es hoy, la hora de inicio no puede haber pasado. */
  ahora?: { fecha: string; hora: string };
}

/** Fecha y hora actuales en Guayaquil. */
export function ahoraEnGuayaquil(): { fecha: string; hora: string } {
  const hora = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA_HORARIA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
  return { fecha: hoy(), hora };
}

export type CampoRangoHorario = keyof RangoHorario;

/** Error del rango y campos que lo causan (solo esos se marcan en rojo). */
export interface DiagnosticoRangoHorario {
  mensaje: string;
  campos: CampoRangoHorario[];
}

let siguienteId = 0;

/** Convierte `HH:mm` a minutos desde las 00:00, o `null` si el formato no es válido. */
export function horaEnMinutos(hora: string): number | null {
  const coincidencia = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);
  if (!coincidencia) return null;
  return Number(coincidencia[1]) * 60 + Number(coincidencia[2]);
}

/** Error del rango con los campos responsables, o `null` si es válido. */
export function diagnosticarRangoHorario(
  rango: RangoHorario,
  { fechaMin, horaMin, horaMax, soloDiasHabiles, pasoMinutos, ahora }: LimitesRangoHorario,
): DiagnosticoRangoHorario | null {
  const vacios = (['fecha', 'inicio', 'fin'] as const).filter((campo) => !rango[campo]);
  if (vacios.length) {
    return { mensaje: 'Completa la fecha, la hora de inicio y la hora de fin.', campos: vacios };
  }

  if (!fechaValida(rango.fecha)) {
    return { mensaje: 'Escribe una fecha válida, por ejemplo 16/11/2026.', campos: ['fecha'] };
  }

  if (fechaMin && rango.fecha < fechaMin) {
    return {
      mensaje: `La fecha debe ser igual o posterior a ${fechaLegible(fechaMin)}.`,
      campos: ['fecha'],
    };
  }

  const diaSemana = new Date(`${rango.fecha}T12:00:00Z`).getUTCDay();
  if (soloDiasHabiles && (diaSemana === 0 || diaSemana === 6)) {
    return { mensaje: 'Las reservas se solicitan de lunes a viernes.', campos: ['fecha'] };
  }

  const inicio = horaEnMinutos(rango.inicio);
  const fin = horaEnMinutos(rango.fin);
  if (inicio === null || fin === null) {
    return {
      mensaje: 'Escribe la hora en formato de 24 horas, por ejemplo 14:30.',
      campos: [
        ...(inicio === null ? ['inicio' as const] : []),
        ...(fin === null ? ['fin' as const] : []),
      ],
    };
  }

  const limiteInferior = horaMin ? horaEnMinutos(horaMin) : null;
  const limiteSuperior = horaMax ? horaEnMinutos(horaMax) : null;
  if (
    (horaMin && limiteInferior === null) ||
    (horaMax && limiteSuperior === null) ||
    (limiteInferior !== null && limiteSuperior !== null && limiteInferior >= limiteSuperior)
  ) {
    return { mensaje: 'El horario permitido no tiene una configuración válida.', campos: [] };
  }

  if (pasoMinutos) {
    const fueraDePaso = (['inicio', 'fin'] as const).filter(
      (campo) => (campo === 'inicio' ? inicio : fin) % pasoMinutos !== 0,
    );
    if (fueraDePaso.length) {
      return {
        mensaje: `Usa horas en intervalos de ${pasoMinutos} minutos, por ejemplo 14:${String(pasoMinutos).padStart(2, '0')}.`,
        campos: fueraDePaso,
      };
    }
  }

  if (limiteInferior !== null && inicio < limiteInferior) {
    return {
      mensaje: `La hora de inicio debe ser igual o posterior a ${horaMin}.`,
      campos: ['inicio'],
    };
  }

  if (limiteSuperior !== null && fin > limiteSuperior) {
    return { mensaje: `La hora de fin debe ser igual o anterior a ${horaMax}.`, campos: ['fin'] };
  }

  if (fin <= inicio) {
    return { mensaje: 'La hora de fin debe ser posterior a la hora de inicio.', campos: ['fin'] };
  }

  if (ahora && rango.fecha === ahora.fecha && rango.inicio <= ahora.hora) {
    return { mensaje: 'La hora de inicio ya pasó; elige una hora posterior.', campos: ['inicio'] };
  }

  return null;
}

/** Devuelve el mensaje de error del rango o `null` si es válido. */
export function validarRangoHorario(
  rango: RangoHorario,
  limites: LimitesRangoHorario,
): string | null {
  return diagnosticarRangoHorario(rango, limites)?.mensaje ?? null;
}

@Component({
  selector: 'app-selector-rango-horario',
  imports: [CampoFechaComponent, CampoHoraComponent],
  templateUrl: './selector-rango-horario.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorRangoHorarioComponent {
  readonly fechaMin = input<string>();
  readonly horaMin = input<string>();
  readonly horaMax = input<string>();
  /** Título de la tarjeta. */
  readonly etiqueta = input('Fecha y horario');
  /** Con `false` se muestra sin recuadro ni título visible, para integrarlo en otra tarjeta o barra. */
  readonly enmarcado = input(true);
  /** Solo de lunes a viernes: el calendario desactiva sábados y domingos. */
  readonly soloDiasHabiles = input(false);
  /** Minutos entre horas válidas (la lista de horas usa el mismo paso). 0 = sin restricción. */
  readonly pasoMinutos = input(15);

  /** Admiten `[fecha]` para precargar y `[(fecha)]` si el padre necesita limpiarlos. */
  readonly fecha = model('');
  readonly inicio = model('');
  readonly fin = model('');

  /** Se emite solo cuando el usuario deja un rango completo y válido. */
  readonly rangoChange = output<RangoHorario>();

  protected readonly id = `rango-horario-${siguienteId++}`;
  protected readonly diagnostico = computed(() =>
    diagnosticarRangoHorario(
      { fecha: this.fecha(), inicio: this.inicio(), fin: this.fin() },
      {
        fechaMin: this.fechaMin(),
        horaMin: this.horaMin(),
        horaMax: this.horaMax(),
        soloDiasHabiles: this.soloDiasHabiles(),
        pasoMinutos: this.pasoMinutos(),
        ahora: ahoraEnGuayaquil(),
      },
    ),
  );
  protected readonly error = computed(() => this.diagnostico()?.mensaje ?? null);
  /** Con todos los campos vacíos (al inicio o tras limpiar) no se muestra ningún error. */
  protected readonly mostrarError = computed(
    () => !!this.error() && !!(this.fecha() || this.inicio() || this.fin()),
  );
  /** La lista de la hora de fin empieza un paso después de la hora de inicio. */
  protected readonly minimoFin = computed(() => {
    const inicio = horaEnMinutos(this.inicio());
    return inicio === null
      ? (this.horaMin() ?? '00:00')
      : horaDe(Math.min(inicio + (this.pasoMinutos() || 15), 23 * 60 + 59));
  });
  protected readonly duracion = computed(() => {
    if (this.error()) return '';
    const minutos = (horaEnMinutos(this.fin()) ?? 0) - (horaEnMinutos(this.inicio()) ?? 0);
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return [horas ? `${horas} h` : '', resto ? `${resto} min` : ''].filter(Boolean).join(' ');
  });
  protected readonly fechaLegible = fechaLegible;

  protected campoInvalido(campo: CampoRangoHorario): boolean {
    return this.mostrarError() && !!this.diagnostico()?.campos.includes(campo);
  }

  protected actualizar(campo: CampoRangoHorario, valor: string): void {
    this[campo].set(valor);

    if (!this.error()) {
      this.rangoChange.emit({ fecha: this.fecha(), inicio: this.inicio(), fin: this.fin() });
    }
  }
}
