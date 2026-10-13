import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Rol } from '../models/rol.model';

/**
 * Roles del sistema (tabla `rol`). Lo usan C1-13 (selector, Jose) y C1-12 (matriz de roles y
 * permisos, Maximilian). Los permisos de cada rol están en `PermisoService`.
 *
 * Los 4 roles mínimos del documento de planificación. Los nombres cortos son los que se guardan
 * en los roles del usuario (`UsuarioService`); el nombre largo del documento va en la descripción.
 *
 * TEMPORAL: datos en memoria. Cuando exista la API solo cambia el interior del método.
 */
@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly roles: Rol[] = [
    { id: 1, nombre: 'Administrador', descripcion: 'Administrador del sistema', estado: 'A' },
    { id: 2, nombre: 'Coordinador', descripcion: 'Coordinador de carrera', estado: 'A' },
    { id: 3, nombre: 'Decano', descripcion: 'Decano / Aprobador', estado: 'A' },
    { id: 4, nombre: 'Docente', descripcion: 'Docente', estado: 'A' },
  ];

  /** @param soloActivos deja fuera a los roles con estado I. */
  listar(opciones: { soloActivos?: boolean } = {}): Observable<Rol[]> {
    const lista = opciones.soloActivos ? this.roles.filter((r) => r.estado === 'A') : this.roles;
    return of(lista.map((r) => ({ ...r })));
  }
}
