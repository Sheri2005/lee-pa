import { Materia } from '../models/materia.model';
import { MateriaAPlanificar } from '../models/materia-a-planificar.model';

const COMP = { id: 5, nombre: 'Ingeniería en Computación' };
const IND = { id: 6, nombre: 'Ingeniería Industrial' };

function materia(
  id: number,
  codigo: string,
  nombre: string,
  responsable: { id: number; nombre: string },
): Materia {
  return {
    id,
    codigo,
    nombre,
    carreraResponsableId: responsable.id,
    carreraResponsable: responsable.nombre,
  };
}

const ICO_101 = materia(140, 'ICO-101', 'Introducción a la Computación', COMP);
const ICO_210 = materia(141, 'ICO-210', 'Estructuras de Datos', COMP);
const ICO_305 = materia(145, 'ICO-305', 'Programación Orientada a Objetos', COMP);
const ICO_402 = materia(148, 'ICO-402', 'Bases de Datos', COMP);
const ICO_520 = materia(160, 'ICO-520', 'Infraestructura y Plataformas', COMP);
const MAT_201 = materia(101, 'MAT-201', 'Cálculo Diferencial', IND);
const ADM_150 = materia(120, 'ADM-150', 'Administración de Proyectos', IND);
const IND_101 = materia(130, 'IND-101', 'Introducción a la Ingeniería Industrial', IND);

const COMPUTACION: readonly MateriaAPlanificar[] = [
  {
    materia: ICO_101,
    origen: 'PROPIA_EN_MALLA',
    nivel: 1,
    horasSemanales: 4,
    carrerasQueLaUsan: [],
  },
  {
    materia: ICO_210,
    origen: 'PROPIA_EN_MALLA',
    nivel: 2,
    horasSemanales: 6,
    carrerasQueLaUsan: [],
  },
  {
    materia: ICO_305,
    origen: 'PROPIA_EN_MALLA',
    nivel: 3,
    horasSemanales: 6,
    carrerasQueLaUsan: [],
  },
  {
    materia: ICO_402,
    origen: 'PROPIA_EN_MALLA',
    nivel: 4,
    horasSemanales: 4,
    carrerasQueLaUsan: [],
  },
  // Caso real del documento: la carrera es dueña de la materia sin tenerla en su malla.
  {
    materia: ICO_520,
    origen: 'PROPIA_FUERA_DE_MALLA',
    nivel: null,
    horasSemanales: null,
    carrerasQueLaUsan: [],
  },
  {
    materia: MAT_201,
    origen: 'COMPARTIDA',
    nivel: 2,
    horasSemanales: 4,
    carrerasQueLaUsan: [IND.nombre, COMP.nombre, 'Arquitectura'],
  },
  {
    materia: ADM_150,
    origen: 'COMPARTIDA',
    nivel: 5,
    horasSemanales: 3,
    carrerasQueLaUsan: [IND.nombre, COMP.nombre],
  },
];

const INDUSTRIAL: readonly MateriaAPlanificar[] = [
  {
    materia: IND_101,
    origen: 'PROPIA_EN_MALLA',
    nivel: 1,
    horasSemanales: 4,
    carrerasQueLaUsan: [],
  },
  {
    materia: MAT_201,
    origen: 'PROPIA_EN_MALLA',
    nivel: 2,
    horasSemanales: 4,
    carrerasQueLaUsan: [],
  },
  {
    materia: ADM_150,
    origen: 'PROPIA_EN_MALLA',
    nivel: 5,
    horasSemanales: 3,
    carrerasQueLaUsan: [],
  },
  {
    materia: ICO_101,
    origen: 'COMPARTIDA',
    nivel: 1,
    horasSemanales: 4,
    carrerasQueLaUsan: [COMP.nombre, IND.nombre],
  },
];

/**
 * Datos ficticios por planificación (id de `PLANIFICACIONES_MOCK`), no contratos confirmados de la API.
 * Una materia es compartida solo desde la óptica de la carrera que no es responsable:
 * MAT-201 es propia en la planificación 2 (Industrial) y compartida en la 1 y 4 (Computación).
 */
export const MATERIAS_A_PLANIFICAR_MOCK: Readonly<Record<number, readonly MateriaAPlanificar[]>> = {
  1: COMPUTACION,
  2: INDUSTRIAL,
  3: [], // Arquitectura: todavía sin materias (probar el estado vacío)
  4: COMPUTACION,
};
