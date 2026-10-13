import { Materia } from '../models/materia.model';

const COMPUTACION = { carreraResponsableId: 5, carreraResponsable: 'Ingeniería en Computación' };
const INDUSTRIAL = { carreraResponsableId: 6, carreraResponsable: 'Ingeniería Industrial' };
const ARQUITECTURA = { carreraResponsableId: 7, carreraResponsable: 'Arquitectura' };

/** Los ids de malla (3, 4, 5) coinciden con `planificaciones.mock.ts` (G2). */
export const MATERIAS_MOCK: Materia[] = [
  { id: 1, codigo: 'MAT-101', nombre: 'Cálculo I', ...COMPUTACION, mallaIds: [3, 4] },
  { id: 2, codigo: 'MAT-102', nombre: 'Cálculo II', ...COMPUTACION, mallaIds: [3, 4] },
  { id: 3, codigo: 'FIS-101', nombre: 'Física I', ...COMPUTACION, mallaIds: [3, 4] },
  {
    id: 4,
    codigo: 'PRG-201',
    nombre: 'Programación Orientada a Objetos',
    ...COMPUTACION,
    mallaIds: [3],
  },
  { id: 5, codigo: 'EST-201', nombre: 'Estadística', ...INDUSTRIAL, mallaIds: [3, 4] },
  { id: 6, codigo: 'IND-210', nombre: 'Procesos Industriales', ...INDUSTRIAL, mallaIds: [4] },
  { id: 7, codigo: 'ARQ-110', nombre: 'Taller de Diseño I', ...ARQUITECTURA, mallaIds: [5] },
];
