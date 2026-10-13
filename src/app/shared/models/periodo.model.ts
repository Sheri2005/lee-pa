export type EstadoPeriodo = 'PLANIFICACION' | 'ACTIVO' | 'CERRADO';
export type TipoPeriodo = 'ORDINARIO' | 'EXTRAORDINARIO';

export interface Periodo {
  id: number;
  codigo: string;
  nombre: string;
  /** Define las franjas horarias que cargan G3/G4. */
  tipo: TipoPeriodo;
  estado: EstadoPeriodo;
  /** Fechas ISO (yyyy-MM-dd). */
  fechaInicio: string;
  fechaFin: string;
  /** Código del período en SIAC 1.0 (opcional). */
  codigoSiac?: string;
}

/** Datos de un período sin su id: lo que emite el formulario y recibe `crear`/`actualizar`. */
export type PeriodoDatos = Omit<Periodo, 'id'>;

export const ETIQUETA_ESTADO_PERIODO: Record<EstadoPeriodo, string> = {
  PLANIFICACION: 'En planificación',
  ACTIVO: 'Activo',
  CERRADO: 'Cerrado',
};

/** 'ORDINARIO' → 'Ordinario'. */
export function etiquetaTipoPeriodo(tipo: string): string {
  return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
}
