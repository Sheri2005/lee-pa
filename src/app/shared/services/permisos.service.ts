import { Injectable, computed, signal } from '@angular/core';

/**
 * Permisos del usuario autenticado.
 *
 * TEMPORAL (prototipo, semanas 2-4): los permisos se cargan a mano con `establecer()`.
 * Cuando exista el servicio de autenticación (G1, T-04), este servicio debe llenarse
 * con los permisos del usuario que devuelve el login (tabla rol_permiso), sin cambiar
 * su API pública para que el menú y los guards no se enteren.
 */
@Injectable({ providedIn: 'root' })
export class PermisosService {
  private readonly _permisos = signal<ReadonlySet<string>>(new Set());

  /** Permisos actuales (solo lectura). */
  readonly permisos = computed(() => this._permisos());

  establecer(permisos: readonly string[]): void {
    this._permisos.set(new Set(permisos));
  }

  limpiar(): void {
    this._permisos.set(new Set());
  }

  /** Sin permiso requerido => visible. Con permiso => debe estar en el conjunto del usuario. */
  tiene(permiso?: string): boolean {
    return !permiso || this._permisos().has(permiso);
  }
}
