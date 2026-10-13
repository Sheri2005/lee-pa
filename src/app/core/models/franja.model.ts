/**
 * Franja horaria (catálogo del Módulo 3 · Horarios).
 *
 * Tabla `franja_horaria` del diccionario de datos: las franjas dependen del **tipo de período**
 * (ordinario o extraordinario), y cada período usa las de su tipo. Proyección mínima que usa
 * `app-disponibilidad-docente` (C2-16); integrar con el modelo de G3 cuando esté disponible.
 */

export type TipoPeriodo = 'ORDINARIO' | 'EXTRAORDINARIO';

export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO';

/** Días en el orden en que se muestran, con su nombre visible. */
export const DIAS_SEMANA: ReadonlyArray<{ dia: DiaSemana; etiqueta: string; corta: string }> = [
  { dia: 'LUNES', etiqueta: 'Lunes', corta: 'Lun' },
  { dia: 'MARTES', etiqueta: 'Martes', corta: 'Mar' },
  { dia: 'MIERCOLES', etiqueta: 'Miércoles', corta: 'Mié' },
  { dia: 'JUEVES', etiqueta: 'Jueves', corta: 'Jue' },
  { dia: 'VIERNES', etiqueta: 'Viernes', corta: 'Vie' },
  { dia: 'SABADO', etiqueta: 'Sábado', corta: 'Sáb' },
];

export interface FranjaHoraria {
  id: number;
  tipoPeriodo: TipoPeriodo;
  diaSemana: DiaSemana;
  /** Hora de inicio en formato HH:MM (24 h). */
  horaInicio: string;
  /** Hora de fin en formato HH:MM (24 h). */
  horaFin: string;
}

/** Duración de la franja en horas (p. ej. 07:00–09:00 → 2). */
export function duracionHoras(franja: FranjaHoraria): number {
  const [hi, mi] = franja.horaInicio.split(':').map(Number);
  const [hf, mf] = franja.horaFin.split(':').map(Number);
  return (hf * 60 + mf - (hi * 60 + mi)) / 60;
}
