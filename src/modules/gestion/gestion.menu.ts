import { MenuGrupo } from '../../app/shared/models/menu.model';

/**
 * Opciones de menú del módulo Gestión (Grupo 1).
 * Los demás grupos hacen lo mismo en su carpeta: `<modulo>.menu.ts` y lo registran en app.config.ts.
 * Los códigos de permiso son provisionales hasta que se fijen en la tabla `permiso`.
 */
export const MENU_GESTION: MenuGrupo = {
  id: 'gestion',
  etiqueta: 'Gestión',
  orden: 1,
  items: [
    { etiqueta: 'Panel', ruta: '/gestion/panel', icono: 'reportes', permiso: 'panel.ver' },
    { etiqueta: 'Usuarios', ruta: '/gestion/usuarios', icono: 'usuarios', permiso: 'usuario.ver' },
    {
      etiqueta: 'Facultades',
      ruta: '/gestion/facultades',
      icono: 'facultades',
      permiso: 'facultad.ver',
    },
    { etiqueta: 'Carreras', ruta: '/gestion/carreras', icono: 'carreras', permiso: 'carrera.ver' },
    { etiqueta: 'Períodos', ruta: '/gestion/periodos', icono: 'periodos', permiso: 'periodo.ver' },
    { etiqueta: 'Materias', ruta: '/gestion/materias', icono: 'materias', permiso: 'materia.ver' },
    { etiqueta: 'Mallas', ruta: '/gestion/mallas', icono: 'mallas', permiso: 'malla.ver' },
    { etiqueta: 'Docentes', ruta: '/gestion/docentes', icono: 'docentes', permiso: 'docente.ver' },
    {
      etiqueta: 'Carga masiva',
      ruta: '/gestion/carga-masiva',
      icono: 'carga',
      permiso: 'importacion.ejecutar',
    },
  ],
};
