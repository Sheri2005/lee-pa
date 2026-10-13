export type EntidadSiac = 'materia' | 'periodo' | 'carrera' | 'docente';

export interface RegistroSinSiac {
  entidad: EntidadSiac;
  id: number;
  codigo: string;
  nombre: string;
}