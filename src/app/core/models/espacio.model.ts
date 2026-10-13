// Modelo de espacio · TEMPORAL hasta que G3 · Horarios publique el suyo en este mismo archivo.
// Sigue la tabla `espacio` del modelo SQL, con el nombre del edificio y los recursos ya resueltos.
// Lo usan los servicios de core y C4-03, C4-06, C4-08 y C4-14.

export interface RecursoEspacio {
  id: number;
  nombre: string;
}

export interface Espacio {
  id: number;
  codigo: string;
  nombre: string;
  edificio_id: number;
  /** Nombre del edificio, por ejemplo "Bloque F". */
  edificio: string;
  /** 0 = planta baja. */
  piso: number;
  /** Valor del catálogo: 'AULA', 'LABORATORIO', 'AUDITORIO'… */
  tipo_espacio: string;
  capacidad: number;
  accesible: boolean;
  estado: boolean;
  recursos: RecursoEspacio[];
}
