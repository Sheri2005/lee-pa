import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuGrupo } from '../../models/menu.model';
import { MenuConfigService } from '../../services/menu-config.service';
import { PermisosService } from '../../services/permisos.service';
import { ICONO_POR_DEFECTO, ICONOS_MENU } from './iconos-menu';

/**
 * Menú de navegación lateral agrupado por módulo (C1-02).
 *
 * - Lee la configuración común (`MenuConfigService`) y los permisos del usuario (`PermisosService`).
 * - Oculta las opciones sin permiso y los grupos que quedan vacíos.
 * - Resalta la opción activa según la ruta actual.
 */
@Component({
  selector: 'app-menu-lateral',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-lateral.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuLateralComponent {
  private readonly config = inject(MenuConfigService);
  private readonly permisos = inject(PermisosService);

  /** Muestra solo los íconos (barra angosta). */
  readonly colapsado = input(false);

  /** Emite la ruta de la opción seleccionada. La navegación la hace el routerLink. */
  readonly navegar = output<string>();

  /** Grupos con solo las opciones permitidas; sin grupos vacíos. */
  protected readonly gruposVisibles = computed<MenuGrupo[]>(() =>
    this.config
      .grupos()
      .map((grupo) => ({
        ...grupo,
        items: grupo.items.filter((item) => this.permisos.tiene(item.permiso)),
      }))
      .filter((grupo) => grupo.items.length > 0),
  );

  protected trazoIcono(nombre: string): string {
    return ICONOS_MENU[nombre] ?? ICONO_POR_DEFECTO;
  }

  protected alSeleccionar(ruta: string): void {
    this.navegar.emit(ruta);
  }
}
