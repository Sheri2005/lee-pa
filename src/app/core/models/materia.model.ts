/**
 * Modelo de Materia (catálogo del Módulo 1 · Gestión).
 *
 * Proyección mínima que usan los componentes de G2 (`app-indicador-materia-compartida`,
 * `app-materias-a-planificar`). Integrar con el modelo de G1 cuando esté disponible.
 * Basado en la tabla `materia` del diccionario de datos: `carrera_responsable_id` es la
 * carrera dueña de la materia (la única que puede aperturarla).
 */
export interface Materia {
  id: number;
  codigo: string;
  nombre: string;
  carreraResponsableId: number;
  /** Nombre de la carrera responsable (dato "de vista" que devuelve la API anidado). */
  carreraResponsable: string;
}
