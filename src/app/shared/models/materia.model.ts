export interface Materia {
  id: number;
  codigo: string;
  nombre: string;
  carreraResponsableId: number;
  /** Nombre de la carrera responsable; se muestra junto al nombre de la materia. */
  carreraResponsable: string;
  /** Mallas en las que se dicta la materia (una materia puede estar en varias). */
  mallaIds: number[];
}
