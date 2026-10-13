// C4-05 · Dueño: G4 · Reservas
// Funciones puras del selector de rango de fechas. Las fechas son texto ISO `YYYY-MM-DD`
// y se calculan a las 12:00 UTC para que la zona horaria del navegador no desplace el día.

export interface RangoFechas {
  desde: string;
  hasta: string;
}

export interface PeriodoRango extends RangoFechas {
  id: number | string;
  nombre: string;
}

export const ZONA_HORARIA = 'America/Guayaquil';

/** Días que cubre "Esta semana": la universidad abre de lunes a sábado. */
export const DIAS_SEMANA_LABORABLE = 6;

export function fechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const valor = new Date(`${fecha}T12:00:00Z`);
  return !Number.isNaN(valor.getTime()) && valor.toISOString().slice(0, 10) === fecha;
}

export function hoy(zona = ZONA_HORARIA): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day']
    .map((tipo) => partes.find((p) => p.type === tipo)!.value)
    .join('-');
}

export function sumarDias(fecha: string, dias: number): string {
  const valor = new Date(`${fecha}T12:00:00Z`);
  valor.setUTCDate(valor.getUTCDate() + dias);
  return valor.toISOString().slice(0, 10);
}

/** Lunes a sábado de la semana (iniciada en lunes) que contiene la fecha de referencia. */
export function estaSemana(referencia: string): RangoFechas {
  const dia = new Date(`${referencia}T12:00:00Z`).getUTCDay();
  const lunes = sumarDias(referencia, -((dia + 6) % 7));
  return { desde: lunes, hasta: sumarDias(lunes, DIAS_SEMANA_LABORABLE - 1) };
}

/** Del primer al último día del mes de la fecha de referencia. */
export function esteMes(referencia: string): RangoFechas {
  const [anio, mes] = referencia.split('-').map(Number);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const prefijo = referencia.slice(0, 7);
  return { desde: `${prefijo}-01`, hasta: `${prefijo}-${String(ultimo).padStart(2, '0')}` };
}

/** Devuelve un mensaje de error o `null`. Un rango incompleto no es un error. */
export function validarRango(rango: RangoFechas): string | null {
  if (!rango.desde || !rango.hasta) return null;
  if (!fechaValida(rango.desde) || !fechaValida(rango.hasta)) return 'Introduce fechas válidas.';
  if (rango.hasta < rango.desde) return 'La fecha final debe ser igual o posterior a la inicial.';
  return null;
}

export type ExtremoRango = keyof RangoFechas;

/** Error del rango y extremos que lo causan (solo esos se marcan en rojo). */
export interface DiagnosticoRango {
  mensaje: string;
  campos: ExtremoRango[];
}

export interface LimitesRango {
  fechaMin?: string;
  fechaMax?: string;
  /** Extremo que cambió el usuario por última vez: es el que se marca si el rango queda invertido. */
  ultimo?: ExtremoRango;
}

/**
 * Error del rango con el extremo responsable, o `null`. Un extremo vacío no es un error, pero uno mal
 * escrito sí, aunque el otro todavía esté vacío.
 */
export function diagnosticarRango(
  rango: RangoFechas,
  { fechaMin = '', fechaMax = '', ultimo = 'hasta' }: LimitesRango = {},
): DiagnosticoRango | null {
  const malEscritos = (['desde', 'hasta'] as const).filter(
    (campo) => rango[campo] && !fechaValida(rango[campo]),
  );
  if (malEscritos.length === 2)
    return { mensaje: 'Introduce fechas válidas.', campos: malEscritos };
  if (malEscritos.length) {
    return { mensaje: 'Escribe una fecha válida, por ejemplo 16/11/2026.', campos: malEscritos };
  }

  const { desde, hasta } = rango;
  const min = fechaValida(fechaMin) ? fechaMin : '';
  const max = fechaValida(fechaMax) ? fechaMax : '';
  if (min && desde && desde < min) {
    return {
      mensaje: `La fecha inicial debe ser igual o posterior a ${fechaLegible(min)}.`,
      campos: ['desde'],
    };
  }
  if (max && hasta && hasta > max) {
    return {
      mensaje: `La fecha final debe ser igual o anterior a ${fechaLegible(max)}.`,
      campos: ['hasta'],
    };
  }
  if (min && hasta && hasta < min) {
    return {
      mensaje: `La fecha final debe ser igual o posterior a ${fechaLegible(min)}.`,
      campos: ['hasta'],
    };
  }
  if (max && desde && desde > max) {
    return {
      mensaje: `La fecha inicial debe ser igual o anterior a ${fechaLegible(max)}.`,
      campos: ['desde'],
    };
  }
  if (desde && hasta && hasta < desde) {
    return ultimo === 'desde'
      ? { mensaje: 'La fecha inicial debe ser igual o anterior a la final.', campos: ['desde'] }
      : { mensaje: 'La fecha final debe ser igual o posterior a la inicial.', campos: ['hasta'] };
  }
  return null;
}

export function rangoCompleto(rango: RangoFechas): boolean {
  return !!rango.desde && !!rango.hasta && validarRango(rango) === null;
}

export function mismoRango(a: RangoFechas, b: RangoFechas): boolean {
  return a.desde === b.desde && a.hasta === b.hasta;
}

export function diasEnRango(rango: RangoFechas): number {
  if (!rangoCompleto(rango)) return 0;
  return Math.round((Date.parse(rango.hasta) - Date.parse(rango.desde)) / 86_400_000) + 1;
}

export function fechaLegible(fecha: string): string {
  if (!fechaValida(fecha)) return fecha;
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${fecha}T12:00:00Z`));
}
