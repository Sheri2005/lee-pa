import { Docente } from '../models/asignacion-docente.model';

export interface EvaluacionDocenteMock {
  docente: Docente;
  habilitado: boolean;
  disponible: boolean;
  cargaSinParalelo: number;
}

/**
 * Datos ficticios por paralelo, no contratos confirmados de la API.
 * Disponible representa el resultado de la evaluación para ese paralelo/período.
 * La carga excluye siempre el paralelo consultado para evitar contar sus horas dos veces.
 */
export const ASIGNACION_DOCENTE_MOCK: Readonly<Record<number, readonly EvaluacionDocenteMock[]>> = {
  1: [
    {
      docente: { id: 7, nombres: 'María Fernanda Torres', cargaMaxima: 24 },
      habilitado: true,
      disponible: true,
      cargaSinParalelo: 16,
    },
    {
      docente: { id: 12, nombres: 'Jorge Andrade', cargaMaxima: 24 },
      habilitado: true,
      disponible: true,
      cargaSinParalelo: 8,
    },
    {
      docente: { id: 21, nombres: 'Ana López', cargaMaxima: 24 },
      habilitado: true,
      disponible: true,
      cargaSinParalelo: 20,
    },
    {
      docente: { id: 22, nombres: 'Carlos Ruiz', cargaMaxima: 24 },
      habilitado: false,
      disponible: true,
      cargaSinParalelo: 4,
    },
    {
      docente: { id: 23, nombres: 'Elena Paz', cargaMaxima: 24 },
      habilitado: true,
      disponible: false,
      cargaSinParalelo: 4,
    },
    {
      docente: { id: 24, nombres: 'Luis Vera', cargaMaxima: 24 },
      habilitado: true,
      disponible: true,
      cargaSinParalelo: 22,
    },
  ],
  2: [
    {
      docente: { id: 12, nombres: 'Jorge Andrade', cargaMaxima: 24 },
      habilitado: true,
      disponible: false,
      cargaSinParalelo: 8,
    },
  ],
  3: [
    {
      docente: { id: 12, nombres: 'Jorge Andrade', cargaMaxima: 24 },
      habilitado: true,
      disponible: true,
      cargaSinParalelo: 18,
    },
    {
      docente: { id: 7, nombres: 'María Fernanda Torres', cargaMaxima: 24 },
      habilitado: true,
      disponible: true,
      cargaSinParalelo: 22,
    },
  ],
};
