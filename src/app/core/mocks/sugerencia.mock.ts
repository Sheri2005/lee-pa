import { Materia } from '../models/materia.model';
import { EstadoPlanificacion } from '../models/planificacion.model';
import { ParametrosPlanificacion } from '../models/sugerencia.model';

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

/**
 * Datos de entrada de las reglas de sugerencia: lo que el sistema conoce de cada materia antes
 * de decidir si se apertura. `SugerenciaService` aplica las reglas de la HU G2-05 sobre esto.
 */
export interface SemillaCurso {
  materia: Materia;
  /** Nivel de la malla vigente; null si la materia no está en la malla. */
  nivel: number | null;
  mallaMateriaId: number | null;
  horasSemanales: number;
  estudiantesEstimados: number;
  /** Demanda de períodos anteriores; null en el primer período. */
  demandaHistorica: number | null;
  /** true si la responsable es otra carrera: no se apertura aquí (HU G2-08). */
  esCompartida: boolean;
}

export interface SemillaPlanificacion {
  estado: EstadoPlanificacion;
  parametros: ParametrosPlanificacion;
  semillas: SemillaCurso[];
  /** Materias que se pueden agregar a mano (no están en la sugerencia). */
  agregables: Materia[];
}

const ICO_101 = materia(140, 'ICO-101', 'Introducción a la Computación', COMP);
const ICO_210 = materia(141, 'ICO-210', 'Estructuras de Datos', COMP);
const ICO_305 = materia(145, 'ICO-305', 'Programación Orientada a Objetos', COMP);
const ICO_402 = materia(148, 'ICO-402', 'Bases de Datos', COMP);
const ICO_450 = materia(152, 'ICO-450', 'Redes de Computadoras', COMP);
const ICO_520 = materia(160, 'ICO-520', 'Infraestructura y Plataformas', COMP);
const ICO_610 = materia(165, 'ICO-610', 'Seminario de Titulación', COMP);
const MAT_201 = materia(101, 'MAT-201', 'Cálculo Diferencial', IND);

export const SUGERENCIA_MOCK: Record<number, SemillaPlanificacion> = {
  // Computación 2026-1, en borrador: el caso completo
  1: {
    estado: 'BORRADOR',
    parametros: { cupoMaximo: 35, minimoApertura: 10, nivelesOfertados: [1, 2, 3, 4] },
    semillas: [
      {
        materia: ICO_101,
        nivel: 1,
        mallaMateriaId: 10,
        horasSemanales: 4,
        estudiantesEstimados: 80,
        demandaHistorica: 74,
        esCompartida: false,
      },
      {
        materia: ICO_210,
        nivel: 2,
        mallaMateriaId: 20,
        horasSemanales: 6,
        estudiantesEstimados: 62,
        demandaHistorica: 58,
        esCompartida: false,
      },
      {
        materia: ICO_305,
        nivel: 3,
        mallaMateriaId: 30,
        horasSemanales: 6,
        estudiantesEstimados: 35,
        demandaHistorica: 31,
        esCompartida: false,
      },
      // No alcanza el mínimo para abrir: se sugiere con 0 paralelos
      {
        materia: ICO_402,
        nivel: 4,
        mallaMateriaId: 40,
        horasSemanales: 4,
        estudiantesEstimados: 7,
        demandaHistorica: 9,
        esCompartida: false,
      },
      // Nivel 5 no ofertado: queda fuera de la sugerencia
      {
        materia: ICO_450,
        nivel: 5,
        mallaMateriaId: 50,
        horasSemanales: 4,
        estudiantesEstimados: 40,
        demandaHistorica: 38,
        esCompartida: false,
      },
      // Compartida: la apertura Industrial, aquí solo se piden cupos (C2-17)
      {
        materia: MAT_201,
        nivel: 2,
        mallaMateriaId: 21,
        horasSemanales: 4,
        estudiantesEstimados: 48,
        demandaHistorica: 45,
        esCompartida: true,
      },
    ],
    agregables: [ICO_520, ICO_610],
  },
  // Industrial 2026-1, ya enviada a aprobación: no se puede cambiar (HU G2-06)
  2: {
    estado: 'PENDIENTE',
    parametros: { cupoMaximo: 40, minimoApertura: 12, nivelesOfertados: [1, 2] },
    semillas: [
      {
        materia: materia(130, 'IND-101', 'Introducción a la Ingeniería Industrial', IND),
        nivel: 1,
        mallaMateriaId: 60,
        horasSemanales: 4,
        estudiantesEstimados: 90,
        demandaHistorica: 85,
        esCompartida: false,
      },
    ],
    agregables: [],
  },
  // Arquitectura: sin materias en la malla vigente (estado vacío)
  3: {
    estado: 'BORRADOR',
    parametros: { cupoMaximo: 30, minimoApertura: 10, nivelesOfertados: [1] },
    semillas: [],
    agregables: [],
  },
};
