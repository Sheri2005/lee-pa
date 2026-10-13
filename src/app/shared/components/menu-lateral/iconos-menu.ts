/**
 * Íconos disponibles para el menú (viewBox 24x24, trazo). Para agregar uno nuevo,
 * añade aquí su(s) trazo(s) `d` y úsalo por nombre en la configuración del menú.
 */
export const ICONOS_MENU: Record<string, string> = {
  inicio: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  usuarios:
    'M16 20v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M10 11a3 3 0 100-6 3 3 0 000 6M20 20v-1a3 3 0 00-2-2.8M16 5.2a3 3 0 010 5.6',
  facultades: 'M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01',
  carreras: 'M12 3l9 4-9 4-9-4 9-4M7 10v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5',
  periodos: 'M5 5h14v15H5zM5 9h14M9 3v4M15 3v4',
  materias: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4M5 17a3 3 0 013-3h11',
  mallas: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  docentes: 'M12 4l9 4-9 4-9-4 9-4M6 10.5V15M18 10.5V15M6 15c0 1.5 2.7 3 6 3s6-1.5 6-3',
  carga: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  planificacion: 'M9 5h10M9 12h10M9 19h10M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2',
  horarios: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18',
  reservas: 'M8 3v3M16 3v3M5 6h14v14H5zM9 14l2 2 4-4',
  reportes: 'M5 20V10M12 20V4M19 20v-7',
  menu: 'M4 6h16M4 12h16M4 18h16',
};

/** Ícono por defecto si el nombre no existe (evita un hueco en el menú). */
export const ICONO_POR_DEFECTO = 'M12 8v4M12 16h.01M12 21a9 9 0 100-18 9 9 0 000 18';
