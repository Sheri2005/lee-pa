import { Planificacion } from "../models/planificacion.model";

const FI = { id: 1, codigo: 'FI', nombre: 'Facultado de Ingeniería'};
const FA = { id: 2, codigo: 'FA', nombre: 'Facultado de Arquitectura'};

const P_2027_1 = {id: 10, codigo: '2027-1', nombre: 'Primer período ordinario 2027', tipo: 'ORDINARIO' as const};
const P_2026_2 = { id: 9, codigo: '2026-2', nombre: 'Segundo período ordinario 2026', tipo: 'ORDINARIO' as const };

export const PLANIFICACIONES_MOCK: Planificacion[] = [
    {
    id: 1,
    carrera: { id: 5, codigo: 'ING-COMP', nombre: 'Ingeniería en Computación' },
    facultad: FI, periodo: P_2027_1,
    malla: { id: 3, codigo: 'M-COMP-2024', nombre: 'Malla 2024', anioInicio: 2024 },
    estado: 'APROBADA',
  },
  {
    id: 2,
    carrera: { id: 6, codigo: 'ING-IND', nombre: 'Ingeniería Industrial' },
    facultad: FI, periodo: P_2027_1,
    malla: { id: 4, codigo: 'M-IND-2023', nombre: 'Malla 2023', anioInicio: 2023 },
    estado: 'PENDIENTE',
  },
  {
    id: 3,
    carrera: { id: 7, codigo: 'ARQ', nombre: 'Arquitectura' },
    facultad: FA, periodo: P_2027_1,
    malla: { id: 5, codigo: 'M-ARQ-2022', nombre: 'Malla 2022', anioInicio: 2022 },
    estado: 'BORRADOR',
  },
  {
    id: 4,
    carrera: { id: 5, codigo: 'ING-COMP', nombre: 'Ingeniería en Computación' },
    facultad: FI, periodo: P_2026_2,
    malla: { id: 3, codigo: 'M-COMP-2024', nombre: 'Malla 2024', anioInicio: 2024 },
    estado: 'APROBADA',
  },
];