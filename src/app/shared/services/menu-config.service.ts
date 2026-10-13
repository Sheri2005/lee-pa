import { Injectable, computed, signal } from '@angular/core';
import { MenuGrupo } from '../models/menu.model';

/**
 * Configuración común del menú lateral.
 *
 * Cada grupo registra las opciones de su módulo con `registrar()`; no toca el
 * componente del menú. Registrar dos veces el mismo `id` reemplaza el grupo
 * (útil con recarga en caliente y para evitar duplicados).
 */
@Injectable({ providedIn: 'root' })
export class MenuConfigService {
  private readonly _grupos = signal<readonly MenuGrupo[]>([]);

  /** Grupos registrados, ordenados por `orden`. */
  readonly grupos = computed(() => [...this._grupos()].sort((a, b) => a.orden - b.orden));

  registrar(grupo: MenuGrupo): void {
    this._grupos.update((actuales) => [...actuales.filter((g) => g.id !== grupo.id), grupo]);
  }
}
