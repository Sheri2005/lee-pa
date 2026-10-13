import { PlantillaCarga } from '../../../shared/models/carga-masiva.model';

/*
 * Plantillas de carga masiva del Módulo 1, según el Anexo C del documento de planificación.
 * Los encabezados son los nombres de columna del anexo; los marcados con * son obligatorios.
 *
 * TEMPORAL: los `endpoint` son provisionales hasta que el backend defina sus rutas.
 */

const esEntero = (v: string) => /^\d+$/.test(v);
const esNumero = (v: string) => /^\d+(\.\d+)?$/.test(v);

/** Fecha real en formato AAAA-MM-DD. */
function esFecha(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const fecha = new Date(`${v}T00:00:00Z`);
  return !isNaN(fecha.getTime()) && fecha.toISOString().startsWith(v);
}

/** Valor dentro de una lista cerrada (sin distinguir mayúsculas). */
const unoDe =
  (permitidos: string[], campo: string) =>
  (v: string): string | null =>
    permitidos.includes(v.toUpperCase()) ? null : `${campo} debe ser ${permitidos.join(', ')}.`;

export const PLANTILLA_USUARIOS: PlantillaCarga = {
  nombre: 'Usuarios',
  nombreArchivo: 'plantilla-usuarios',
  endpoint: '/api/usuarios/importar',
  columnas: [
    { clave: 'username', etiqueta: 'username', obligatorio: true },
    {
      clave: 'email',
      etiqueta: 'email',
      obligatorio: true,
      validador: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'email no es un correo válido.'),
    },
    { clave: 'nombres', etiqueta: 'nombres', obligatorio: true },
    // El nombre del rol no se valida aquí: lo definirá RolService (C1-12/C1-13).
    { clave: 'rol', etiqueta: 'rol', obligatorio: true },
    { clave: 'codigo_siac', etiqueta: 'codigo_siac' },
  ],
};

export const PLANTILLA_DOCENTES: PlantillaCarga = {
  nombre: 'Docentes',
  nombreArchivo: 'plantilla-docentes',
  endpoint: '/api/docentes/importar',
  columnas: [
    { clave: 'identificacion', etiqueta: 'identificacion', obligatorio: true },
    { clave: 'nombres', etiqueta: 'nombres', obligatorio: true },
    {
      clave: 'email',
      etiqueta: 'email',
      obligatorio: true,
      validador: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'email no es un correo válido.'),
    },
    {
      clave: 'carga_maxima_horas',
      etiqueta: 'carga_maxima_horas',
      obligatorio: true,
      validador: (v) =>
        esNumero(v) && Number(v) > 0 ? null : 'carga_maxima_horas debe ser un número mayor que 0.',
    },
    { clave: 'codigo_siac', etiqueta: 'codigo_siac' },
    { clave: 'materias_habilitadas', etiqueta: 'materias_habilitadas' },
  ],
};

export const PLANTILLA_PERIODOS: PlantillaCarga = {
  nombre: 'Períodos',
  nombreArchivo: 'plantilla-periodos',
  endpoint: '/api/periodos/importar',
  columnas: [
    { clave: 'codigo', etiqueta: 'codigo', obligatorio: true },
    { clave: 'nombre', etiqueta: 'nombre', obligatorio: true },
    { clave: 'tipo', etiqueta: 'tipo', obligatorio: true, validador: unoDe(['ORDINARIO', 'EXTRAORDINARIO'], 'tipo') },
    {
      clave: 'fecha_inicio',
      etiqueta: 'fecha_inicio',
      obligatorio: true,
      validador: (v) => (esFecha(v) ? null : 'fecha_inicio debe tener el formato AAAA-MM-DD.'),
    },
    {
      clave: 'fecha_fin',
      etiqueta: 'fecha_fin',
      obligatorio: true,
      validador: (v, fila) => {
        if (!esFecha(v)) return 'fecha_fin debe tener el formato AAAA-MM-DD.';
        // Regla de la BD: fecha_inicio < fecha_fin.
        return esFecha(fila['fecha_inicio']) && v <= fila['fecha_inicio']
          ? 'fecha_fin debe ser posterior a fecha_inicio.'
          : null;
      },
    },
    { clave: 'codigo_siac', etiqueta: 'codigo_siac' },
  ],
};

export const PLANTILLA_MATERIAS: PlantillaCarga = {
  nombre: 'Materias',
  nombreArchivo: 'plantilla-materias',
  endpoint: '/api/materias/importar',
  columnas: [
    { clave: 'codigo', etiqueta: 'codigo', obligatorio: true },
    { clave: 'nombre', etiqueta: 'nombre', obligatorio: true },
    { clave: 'descripcion', etiqueta: 'descripcion' },
    { clave: 'carrera_responsable', etiqueta: 'carrera_responsable', obligatorio: true },
    { clave: 'codigo_siac', etiqueta: 'codigo_siac' },
  ],
};

export const PLANTILLA_MATERIAS_MALLA: PlantillaCarga = {
  nombre: 'Materias por malla',
  nombreArchivo: 'plantilla-materias-por-malla',
  endpoint: '/api/mallas/materias/importar',
  columnas: [
    { clave: 'malla', etiqueta: 'malla', obligatorio: true },
    { clave: 'materia', etiqueta: 'materia', obligatorio: true },
    {
      clave: 'nivel',
      etiqueta: 'nivel',
      obligatorio: true,
      validador: (v) => (esEntero(v) && Number(v) > 0 ? null : 'nivel debe ser un número entero mayor que 0.'),
    },
    {
      clave: 'unidad_curricular',
      etiqueta: 'unidad_curricular',
      obligatorio: true,
      validador: unoDe(['BASICA', 'PROFESIONAL', 'INTEGRACION'], 'unidad_curricular'),
    },
    ...(['horas_contacto', 'horas_practico', 'horas_autonomas'] as const).map((clave) => ({
      clave,
      etiqueta: clave,
      obligatorio: true,
      validador: (v: string) => (esNumero(v) ? null : `${clave} debe ser un número (0 o más).`),
    })),
    { clave: 'prerrequisitos', etiqueta: 'prerrequisitos' },
    { clave: 'correquisitos', etiqueta: 'correquisitos' },
  ],
};

/** Las 5 entidades que se importan desde /gestion/carga-masiva, en el orden del anexo. */
export const PLANTILLAS_GESTION: readonly PlantillaCarga[] = [
  PLANTILLA_USUARIOS,
  PLANTILLA_DOCENTES,
  PLANTILLA_PERIODOS,
  PLANTILLA_MATERIAS,
  PLANTILLA_MATERIAS_MALLA,
];
