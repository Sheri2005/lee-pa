import { NivelMalla, ParametrosPlanificacion } from '../models/parametros-planificacion.model';

/** Valores iniciales cuando una planificación todavía no tiene parámetros guardados. */
export const PARAMETROS_POR_DEFECTO: ParametrosPlanificacion = {
  nivelesOfertados: [],
  cupoMaximoParalelo: 35,
  minimoEstudiantesAbrir: 15,
};

/** Parámetros ya guardados (datos ficticios; clave = id de planificación). */
export const PARAMETROS_MOCK: Record<number, ParametrosPlanificacion> = {
  1: { nivelesOfertados: [1, 2, 3, 4], cupoMaximoParalelo: 35, minimoEstudiantesAbrir: 15 },
  3: { nivelesOfertados: [1, 2, 3], cupoMaximoParalelo: 30, minimoEstudiantesAbrir: 12 },
};

const NOMBRES_MATERIAS = [
  'Fundamentos',
  'Matemática aplicada',
  'Taller integrador',
  'Metodología',
  'Electiva de nivel',
];

/** Malla de ejemplo: 8 niveles con 5 materias cada uno (igual para cualquier malla en el prototipo). */
export const MALLA_NIVELES_MOCK: NivelMalla[] = Array.from({ length: 8 }, (_, i) => ({
  nivel: i + 1,
  materias: NOMBRES_MATERIAS.map((nombre, j) => ({
    codigo: `MAT-${i + 1}0${j + 1}`,
    nombre: `${nombre} ${i + 1}`,
    horasSemanales: 4 + (j % 3),
  })),
}));
