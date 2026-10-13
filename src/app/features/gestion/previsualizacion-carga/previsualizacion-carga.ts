import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ColumnaPlantilla, FilaValidada } from '../../../shared/models/carga-masiva.model';

/** Filas que se dibujan como máximo; el contador cuenta todas. */
const LIMITE_FILAS = 200;

/**
 * Previsualización de la carga masiva (C1-53): tabla con las filas leídas, el estado OK/Error de
 * cada una y el motivo del error, con filtro «solo errores» y contador. Es el paso 3 de
 * `app-carga-masiva` (C1-50).
 *
 * TODO: cuando existan `app-tabla-datos` (G4) y `app-estado-badge` (G5), reemplazar la tabla y
 * el badge de este template por esos componentes.
 */
@Component({
  selector: 'app-previsualizacion-carga',
  templateUrl: './previsualizacion-carga.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PrevisualizacionCargaComponent {
  readonly filas = input.required<FilaValidada[]>();
  /** Columnas de la plantilla, para los encabezados y el orden de los datos. */
  readonly columnas = input.required<ColumnaPlantilla[]>();
  /** Columnas obligatorias que el archivo no trae. */
  readonly faltantes = input<readonly string[]>([]);

  protected readonly limite = LIMITE_FILAS;
  protected readonly soloErrores = signal(false);

  protected readonly validas = computed(() => this.filas().filter((f) => f.valida).length);
  protected readonly conErrores = computed(() => this.filas().length - this.validas());
  protected readonly visibles = computed(() => {
    const filas = this.soloErrores() ? this.filas().filter((f) => !f.valida) : this.filas();
    return filas.slice(0, LIMITE_FILAS);
  });

  protected alternarSoloErrores(evento: Event): void {
    this.soloErrores.set((evento.target as HTMLInputElement).checked);
  }
}
