import { Docente } from '../models/asignacion-docente.model';
import { Paralelo } from '../models/paralelo.model';
import { PARALELOS_MOCK } from './paralelos.mock';

interface DocentePlanificacionMock {
  docente: Docente;
  activo: boolean;
  materiasHabilitadas: number[];
  paralelosDisponibles: number[];
  /** Horas confirmadas externas a los paralelos de este fixture, por período. */
  cargaExternaPorPeriodo: Record<number, number>;
}

/** Fixture de G2, no modelo ni servicio definitivo de Gestión. */
export const DOCENTES_PLANIFICACION_MOCK: DocentePlanificacionMock[] = [
  {
    docente: { id: 7, nombres: 'María Fernanda Torres', cargaMaxima: 24 },
    activo: true,
    materiasHabilitadas: [101, 145],
    paralelosDisponibles: [1, 2, 3, 4, 5],
    cargaExternaPorPeriodo: { 10: 14, 9: 8 },
  },
  {
    docente: { id: 12, nombres: 'Jorge Andrade', cargaMaxima: 24 },
    activo: true,
    materiasHabilitadas: [101, 145],
    paralelosDisponibles: [1, 2, 3],
    cargaExternaPorPeriodo: { 10: 8, 9: 0 },
  },
  {
    docente: { id: 21, nombres: 'Ana López', cargaMaxima: 24 },
    activo: true,
    materiasHabilitadas: [101],
    paralelosDisponibles: [1, 2],
    cargaExternaPorPeriodo: { 10: 20, 9: 0 },
  },
  {
    docente: { id: 22, nombres: 'Carlos Ruiz', cargaMaxima: 24 },
    activo: true,
    materiasHabilitadas: [999],
    paralelosDisponibles: [1, 2, 3],
    cargaExternaPorPeriodo: { 10: 4, 9: 0 },
  },
  {
    docente: { id: 23, nombres: 'Elena Paz', cargaMaxima: 24 },
    activo: true,
    materiasHabilitadas: [101, 145],
    paralelosDisponibles: [],
    cargaExternaPorPeriodo: { 10: 4, 9: 0 },
  },
  {
    docente: { id: 24, nombres: 'Luis Vera', cargaMaxima: 24 },
    activo: true,
    materiasHabilitadas: [101, 145],
    paralelosDisponibles: [1, 2, 3],
    cargaExternaPorPeriodo: { 10: 22, 9: 0 },
  },
  {
    docente: { id: 25, nombres: 'Docente inactivo', cargaMaxima: 24 },
    activo: false,
    materiasHabilitadas: [101, 145],
    paralelosDisponibles: [1, 2, 3],
    cargaExternaPorPeriodo: { 10: 0, 9: 0 },
  },
];

export interface ParaleloAsignacionMock {
  planificacionId: number;
  paralelo: Paralelo;
}

/**
 * Relación ficticia explícita: cursoPlanificadoId NO es planificacionId.
 * La planificación 3 existe en PLANIFICACIONES_MOCK y está en BORRADOR.
 * Los paralelos 4 y 5 comprueban la carga de otra planificación y otro período.
 */
export const PARALELOS_ASIGNACION_MOCK: ParaleloAsignacionMock[] = [
  ...PARALELOS_MOCK.map((paralelo) => ({
    planificacionId: 3,
    paralelo: structuredClone(paralelo),
  })),
  {
    planificacionId: 1,
    paralelo: {
      ...structuredClone(PARALELOS_MOCK[0]),
      id: 4,
      cursoPlanificadoId: 40,
      codigo: 'C',
      horasSemanales: 2,
    },
  },
  {
    planificacionId: 4,
    paralelo: {
      ...structuredClone(PARALELOS_MOCK[0]),
      id: 5,
      cursoPlanificadoId: 50,
      codigo: 'D',
      horasSemanales: 6,
    },
  },
];
