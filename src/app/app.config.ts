import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { MENU_GESTION } from '../modules/gestion/gestion.menu';
import { routes } from './app.routes';
import { SiacService } from './core/services/siac.service';
import { SIAC_CODE_AVAILABILITY_CHECKER } from './shared/components/campo-codigo-siac/siac-code-availability';
import { MenuConfigService } from './shared/services/menu-config.service';
import { PermisosService } from './shared/services/permisos.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: SIAC_CODE_AVAILABILITY_CHECKER,
      useExisting: SiacService,
    },
    // Cada grupo agrega aquí el menú de su módulo (G2: MENU_PLANIFICACION, etc.).
    provideAppInitializer(() => {
      const menu = inject(MenuConfigService);
      menu.registrar(MENU_GESTION);

      inject(PermisosService).establecer([
        'usuario.ver', 'facultad.ver', 'carrera.ver', 'periodo.ver',
        'materia.ver', 'malla.ver', 'docente.ver', 'importacion.ejecutar', 'panel.ver',
      ]);
    }),
  ],
};
