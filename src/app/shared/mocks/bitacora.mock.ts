import { RegistroImportacion } from '../models/bitacora-importacion.model';

/** TEMPORAL: importaciones ficticias para el prototipo de la bitácora (C1-56). */
export const BITACORA_MOCK: RegistroImportacion[] = [
  {
    id: 1, entidad: 'Usuarios', archivo: 'usuarios-2027-1.csv', usuarioId: 1, usuarioNombre: 'Administrador del sistema',
    fecha: '2026-09-28T09:15:00-05:00', totalFilas: 42, filasOk: 42, filasError: 0, errores: [],
  },
  {
    id: 2, entidad: 'Docentes', archivo: 'docentes.csv', usuarioId: 1, usuarioNombre: 'Administrador del sistema',
    fecha: '2026-09-29T11:40:00-05:00', totalFilas: 18, filasOk: 16, filasError: 2,
    errores: [
      { fila: 5, columna: 'email', mensaje: 'email no es un correo válido.' },
      { fila: 12, columna: 'carga_maxima_horas', mensaje: 'carga_maxima_horas debe ser un número mayor que 0.' },
    ],
  },
  {
    id: 3, entidad: 'Períodos', archivo: 'periodos.csv', usuarioId: 20, usuarioNombre: 'Diego Muñoz',
    fecha: '2026-10-01T16:05:00-05:00', totalFilas: 3, filasOk: 2, filasError: 1,
    errores: [{ fila: 4, columna: 'fecha_fin', mensaje: 'fecha_fin debe ser posterior a fecha_inicio.' }],
  },
  {
    id: 4, entidad: 'Materias', archivo: 'materias-ingenieria.xlsx', usuarioId: 21, usuarioNombre: 'Paola Acosta',
    fecha: '2026-10-03T10:20:00-05:00', totalFilas: 65, filasOk: 65, filasError: 0, errores: [],
  },
  {
    id: 5, entidad: 'Materias por malla', archivo: 'malla-software-2024.csv', usuarioId: null, usuarioNombre: null,
    fecha: '2026-10-05T08:50:00-05:00', totalFilas: 40, filasOk: 37, filasError: 3,
    errores: [
      { fila: 7, columna: 'nivel', mensaje: 'nivel debe ser un número entero mayor que 0.' },
      { fila: 19, columna: 'unidad_curricular', mensaje: 'unidad_curricular debe ser BASICA, PROFESIONAL, INTEGRACION.' },
      { fila: 33, columna: null, mensaje: 'La materia MAT-999 no existe.' },
    ],
  },
];
