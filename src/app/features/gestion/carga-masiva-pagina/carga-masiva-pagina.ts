import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CargaMasivaComponent } from '../../../shared/components/carga-masiva/carga-masiva';
import { PlantillaCarga } from '../../../shared/models/carga-masiva.model';
import { PLANTILLAS_GESTION } from './plantillas-gestion';

/**
 * Página de carga masiva del módulo Gestión (C1-55). Ruta: /gestion/carga-masiva.
 *
 * El usuario elige qué entidad importar (usuarios, docentes, períodos, materias o
 * materias por malla) y se muestra el asistente `app-carga-masiva` (C1-50, Julio) con la
 * plantilla de esa entidad. Las plantillas están en `plantillas-gestion.ts` (Anexo C).
 *
 * TEMPORAL: el encabezado está dibujado aquí hasta que exista `app-encabezado-pagina` (C3-23, G3).
 */
@Component({
  selector: 'app-carga-masiva-pagina',
  imports: [CargaMasivaComponent, RouterLink],
  templateUrl: './carga-masiva-pagina.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CargaMasivaPaginaComponent {
  protected readonly plantillas = PLANTILLAS_GESTION;
  protected readonly plantilla = signal<PlantillaCarga>(PLANTILLAS_GESTION[0]);

  protected elegir(plantilla: PlantillaCarga): void {
    this.plantilla.set(plantilla);
  }
}
