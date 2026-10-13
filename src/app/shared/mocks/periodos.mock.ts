import { Periodo } from '../models/periodo.model';

/** Mismos ids y códigos que usa `planificaciones.mock.ts` (G2). */
export const PERIODOS_MOCK: Periodo[] = [
  {
    id: 8,
    codigo: '2026-1',
    nombre: 'Primer período ordinario 2026',
    tipo: 'ORDINARIO',
    estado: 'CERRADO',
    fechaInicio: '2026-03-02',
    fechaFin: '2026-07-10',
  },
  {
    id: 9,
    codigo: '2026-2',
    nombre: 'Segundo período ordinario 2026',
    tipo: 'ORDINARIO',
    estado: 'ACTIVO',
    fechaInicio: '2026-09-07',
    fechaFin: '2027-01-15',
  },
  {
    id: 10,
    codigo: '2027-1',
    nombre: 'Primer período ordinario 2027',
    tipo: 'ORDINARIO',
    estado: 'PLANIFICACION',
    fechaInicio: '2027-03-01',
    fechaFin: '2027-07-09',
  },
  {
    id: 11,
    codigo: '2026-E',
    nombre: 'Período extraordinario 2026',
    tipo: 'EXTRAORDINARIO',
    estado: 'PLANIFICACION',
    fechaInicio: '2027-01-18',
    fechaFin: '2027-02-26',
  },
];
