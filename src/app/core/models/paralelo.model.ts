/**
 * Modelo de Paralelo (Módulo 2 · Planificación · Grupo 2).
 *
 * Basado en la tabla `paralelo` del diccionario de datos del M2 (HU G2-07, G2-10).
 * Los campos `materia` y `docente` son datos "de vista" que la API devuelve
 * anidados para no tener que hacer otra consulta al pintar la tarjeta.
 */
import { Recurso } from './recurso.model';

/** Estado de la asignación de docente (paralelo.estado_docente). */
export type EstadoDocente = 'SIN_ASIGNAR' | 'SUGERIDO' | 'CONFIRMADO';

/**
 * Tipo de espacio requerido (paralelo.tipo_espacio_requerido).
 * PENDIENTE: confirmar con el Grupo 3 si es una lista fija o el catálogo de espacios.
 */
export type TipoEspacio = 'AULA' | 'LABORATORIO' | 'AUDITORIO' | 'TALLER';

/** Nombre visible de cada tipo de espacio (lo usan C2-12 y C2-11). */
export const ETIQUETAS_TIPO_ESPACIO: Record<TipoEspacio, string> = {
  AULA: 'Aula',
  LABORATORIO: 'Laboratorio',
  AUDITORIO: 'Auditorio',
  TALLER: 'Taller',
};

/** Tipos de espacio en el orden en que se ofrecen al elegir. */
export const TIPOS_ESPACIO = Object.keys(ETIQUETAS_TIPO_ESPACIO) as TipoEspacio[];

export interface MateriaResumen {
  id: number;
  codigo: string;
  nombre: string;
}

export interface DocenteResumen {
  id: number;
  nombres: string;
}

export interface Paralelo {
  id: number;
  cursoPlanificadoId: number;
  /** Código del paralelo dentro del curso: A, B, C… (único por curso). */
  codigo: string;
  cupo: number;
  /** Horas semanales, tomadas de la malla. */
  horasSemanales: number;
  tipoEspacioRequerido: TipoEspacio;
  materia: MateriaResumen;
  /** null mientras no se haya asignado docente. */
  docente: DocenteResumen | null;
  estadoDocente: EstadoDocente;
  /** Recursos requeridos (tabla `paralelo_recurso`). Opcional: no todos los paralelos piden. */
  recursos?: Recurso[];
}
