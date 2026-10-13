import { Materia } from '../models/materia.model';
import { ListadoMateriasCompartidas } from '../models/materia-compartida.model';

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

const MAT_201 = materia(101, 'MAT-201', 'Cálculo Diferencial', IND);
const ADM_150 = materia(120, 'ADM-150', 'Administración de Proyectos', IND);
const FIS_110 = materia(110, 'FIS-110', 'Física General', IND);
const ICO_101 = materia(140, 'ICO-101', 'Introducción a la Computación', COMP);

/**
 * Datos de prueba de `app-materias-compartidas` (C2-17), con la forma que devolverá la API.
 * Cada planificación cubre un caso distinto de la HU G2-08.
 */
export const MATERIAS_COMPARTIDAS_MOCK: Record<number, ListadoMateriasCompartidas> = {
  // Computación: una ya planificada con paralelos abiertos, una en borrador y una sin planificar
  1: {
    carreraId: COMP.id,
    carreraNombre: COMP.nombre,
    materias: [
      {
        materia: MAT_201,
        nivel: 2,
        estudiantesEstimados: 48,
        estadoResponsable: 'PLANIFICADA',
        paralelosAbiertos: [
          { id: 1, codigo: 'A', cupo: 35, cuposDisponibles: 12, docente: 'María Fernanda Torres' },
          { id: 2, codigo: 'B', cupo: 30, cuposDisponibles: 30, docente: 'Jorge Andrade' },
        ],
        solicitudes: [{ id: 1, paraleloId: 1, planificacionId: 1, cupos: 20, estado: 'ACEPTADA' }],
        carrerasQueLaUsan: [IND.nombre, COMP.nombre],
      },
      {
        materia: ADM_150,
        nivel: 5,
        estudiantesEstimados: 25,
        estadoResponsable: 'EN_BORRADOR',
        paralelosAbiertos: [],
        solicitudes: [],
        carrerasQueLaUsan: [IND.nombre, COMP.nombre],
      },
      {
        materia: FIS_110,
        nivel: 1,
        estudiantesEstimados: 60,
        estadoResponsable: 'NO_PLANIFICADA',
        paralelosAbiertos: [],
        solicitudes: [],
        carrerasQueLaUsan: [IND.nombre, COMP.nombre],
      },
    ],
  },
  // Industrial: una compartida con solicitud pendiente
  2: {
    carreraId: IND.id,
    carreraNombre: IND.nombre,
    materias: [
      {
        materia: ICO_101,
        nivel: 1,
        estudiantesEstimados: 18,
        estadoResponsable: 'PLANIFICADA',
        paralelosAbiertos: [
          { id: 7, codigo: 'A', cupo: 40, cuposDisponibles: 5, docente: 'Luis Vera' },
        ],
        solicitudes: [{ id: 2, paraleloId: 7, planificacionId: 2, cupos: 18, estado: 'PENDIENTE' }],
        carrerasQueLaUsan: [COMP.nombre, IND.nombre],
      },
    ],
  },
  // Arquitectura: su malla no tiene materias compartidas (estado vacío)
  3: { carreraId: 7, carreraNombre: 'Arquitectura', materias: [] },
};
