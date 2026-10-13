/** Opción individual del menú lateral. */
export interface MenuItem {
  /** Texto visible. */
  etiqueta: string;
  /** Ruta de Angular a la que navega (ej. '/gestion/usuarios'). */
  ruta: string;
  /** Nombre del ícono, debe existir en ICONOS_MENU. */
  icono: string;
  /** Código de permiso requerido. Si se omite, la opción es visible para cualquier usuario autenticado. */
  permiso?: string;
}

/** Grupo de opciones del menú, normalmente uno por módulo (Gestión, Planificación, ...). */
export interface MenuGrupo {
  /** Identificador único del grupo (ej. 'gestion'). */
  id: string;
  etiqueta: string;
  /** Orden de aparición; menor = más arriba. */
  orden: number;
  items: MenuItem[];
}
