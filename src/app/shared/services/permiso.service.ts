import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Permiso } from '../models/permiso.model';

/**
 * Permisos (tablas `permiso` y `rol_permiso`). Lo usa C1-12 (matriz de roles y permisos,
 * Maximilian) para mostrar y guardar las casillas.
 *
 * Separado de `RolService` por decisión del equipo, para que sea escalable. Hoy los permisos
 * son una lista fija (configuración predeterminada) y solo se asignan a roles; no se crean ni
 * se editan desde la aplicación.
 *
 * TEMPORAL: datos en memoria. Los códigos son los que ya usa el menú de Gestión; cada módulo
 * agregará los suyos. La asignación inicial por rol es una propuesta a validar con el grupo.
 */
@Injectable({ providedIn: 'root' })
export class PermisoService {
  private readonly permisos: Permiso[] = [
    { id: 1, codigo: 'usuario.ver', nombre: 'Ver usuarios', descripcion: null },
    { id: 2, codigo: 'facultad.ver', nombre: 'Ver facultades', descripcion: null },
    { id: 3, codigo: 'carrera.ver', nombre: 'Ver carreras', descripcion: null },
    { id: 4, codigo: 'periodo.ver', nombre: 'Ver períodos', descripcion: null },
    { id: 5, codigo: 'materia.ver', nombre: 'Ver materias', descripcion: null },
    { id: 6, codigo: 'malla.ver', nombre: 'Ver mallas', descripcion: null },
    { id: 7, codigo: 'docente.ver', nombre: 'Ver docentes', descripcion: null },
    { id: 8, codigo: 'importacion.ejecutar', nombre: 'Ejecutar carga masiva', descripcion: null },
    { id: 9, codigo: 'panel.ver', nombre: 'Ver panel administrativo', descripcion: null },
  ];

  /** Configuración predeterminada de `rol_permiso`: id del rol → códigos de permiso. */
  private asignaciones = new Map<number, string[]>([
    // Administrador: todo.
    [1, this.permisos.map((p) => p.codigo)],
    // Coordinador: lo que necesita para planificar su carrera.
    [2, ['carrera.ver', 'periodo.ver', 'materia.ver', 'malla.ver', 'docente.ver']],
    // Decano: su facultad y sus carreras.
    [3, ['facultad.ver', 'carrera.ver']],
    // Docente: nada del módulo de Gestión.
    [4, []],
  ]);

  listar(): Observable<Permiso[]> {
    return of(this.permisos.map((p) => ({ ...p })));
  }

  /** Códigos de permiso que tiene el rol (vacío si el rol no tiene ninguno). */
  permisosDeRol(rolId: number): Observable<string[]> {
    return of([...(this.asignaciones.get(rolId) ?? [])]);
  }

  /** Reemplaza los permisos del rol (lo que guarda la matriz de C1-12). */
  asignarPermisos(rolId: number, codigos: string[]): Observable<string[]> {
    const desconocidos = codigos.filter((c) => !this.permisos.some((p) => p.codigo === c));
    if (desconocidos.length) {
      return throwError(() => new Error(`Permisos desconocidos: ${desconocidos.join(', ')}.`));
    }
    const unicos = [...new Set(codigos)];
    this.asignaciones.set(rolId, unicos);
    return of([...unicos]);
  }
}
