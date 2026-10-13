import { PlantillaCarga } from '../models/carga-masiva.model';

/** Plantilla de ejemplo para las pruebas de carga masiva. No va en un `.spec.ts`: importar
 * un spec desde otro hace que Vitest pierda las pruebas del archivo importado a veces. */
export const PLANTILLA_PRUEBA: PlantillaCarga = {
  nombre: 'Estudiantes estimados',
  nombreArchivo: 'plantilla-estudiantes',
  endpoint: '/api/estudiantes-estimados/importar',
  columnas: [
    { clave: 'materia', etiqueta: 'Materia', obligatorio: true },
    {
      clave: 'cantidad',
      etiqueta: 'Cantidad',
      obligatorio: true,
      validador: (v) => (/^\d+$/.test(v) ? null : 'Cantidad debe ser un número entero.'),
    },
    { clave: 'nota', etiqueta: 'Nota, opcional' },
  ],
};