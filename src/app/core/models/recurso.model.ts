/**
 * Recurso requerido por un paralelo (catálogo del Módulo 3 · Horarios).
 *
 * Proyección mínima que usa `app-paralelos-editor` (C2-11) para registrar los recursos
 * requeridos (tablas `recurso` y `paralelo_recurso` del diccionario de datos).
 * El catálogo real y su selector (`app-selector-recursos`, C3-11) los publica el Grupo 3:
 * integrar con su modelo cuando esté disponible.
 */
export interface Recurso {
  id: number;
  nombre: string;
}
