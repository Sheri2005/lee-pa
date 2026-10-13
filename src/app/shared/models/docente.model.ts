export interface Docente {
  id: number;
  /** Cédula o documento de identificación. */
  identificacion: string;
  /** Nombre completo (apellidos y nombres). */
  nombre: string;
  /** Carga horaria máxima, en horas. */
  cargaMaxima: number;
  /** Materias para las que el docente está habilitado. */
  materiaIds: number[];
}