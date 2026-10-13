import { Paralelo } from '../models/paralelo.model';

/** Datos de prueba con la misma forma que devolverá la API (prototipo, semanas 2-4). */
export const PARALELOS_MOCK: Paralelo[] = [
  {
    id: 1,
    cursoPlanificadoId: 10,
    codigo: 'A',
    cupo: 35,
    horasSemanales: 4,
    tipoEspacioRequerido: 'AULA',
    materia: { id: 101, codigo: 'MAT-201', nombre: 'Cálculo Diferencial' },
    docente: { id: 7, nombres: 'María Fernanda Torres' },
    estadoDocente: 'CONFIRMADO',
  },
  {
    id: 2,
    cursoPlanificadoId: 10,
    codigo: 'B',
    cupo: 30,
    horasSemanales: 4,
    tipoEspacioRequerido: 'AULA',
    materia: { id: 101, codigo: 'MAT-201', nombre: 'Cálculo Diferencial' },
    docente: { id: 12, nombres: 'Jorge Andrade' },
    estadoDocente: 'SUGERIDO',
  },
  {
    id: 3,
    cursoPlanificadoId: 11,
    codigo: 'A',
    cupo: 25,
    horasSemanales: 6,
    tipoEspacioRequerido: 'LABORATORIO',
    materia: {
      id: 145,
      codigo: 'ICO-305',
      nombre: 'Programación Orientada a Objetos',
    },
    docente: null,
    estadoDocente: 'SIN_ASIGNAR',
  },
];
