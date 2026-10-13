/** Malla curricular (tabla `malla`). */
export interface Malla {
  id: number;
  codigo: string;
  nombre: string;
  /** Año desde el que rige la malla (año de vigencia). */
  anioInicio: number;
  /** FK obligatoria a `carrera`: toda malla pertenece a una carrera. */
  carreraId: number;
  /** `true` si la malla está vigente. */
  vigente: boolean;
}

/**
 * Lo que captura el formulario de malla (C1-33) y recibe `actualizar`. La carrera y la vigencia no
 * se editan ahí: la carrera se indica al crear y la vigencia se conserva.
 */
export type MallaDatos = Pick<Malla, 'codigo' | 'nombre' | 'anioInicio'>;
