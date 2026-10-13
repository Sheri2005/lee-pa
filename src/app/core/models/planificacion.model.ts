export type EstadoPlanificacion =
  'BORRADOR' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CON_CAMBIOS';

export interface Planificacion {
  id: number;
  carrera: { id: number; codigo: string; nombre: string };
  facultad: { id: number; codigo: string; nombre: string };
  periodo: { id: number; codigo: string; nombre: string; tipo: 'ORDINARIO' | 'EXTRAORDINARIO' };
  malla: { id: number; codigo: string; nombre: string; anioInicio: number };
  estado: EstadoPlanificacion;
}
