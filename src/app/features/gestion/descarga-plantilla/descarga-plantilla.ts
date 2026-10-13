import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { PlantillaCarga } from '../../../shared/models/carga-masiva.model';
import { CargaMasivaService } from '../../../shared/services/carga-masiva.service';

export type FormatoPlantilla = 'csv' | 'xlsx';

const TIPOS: Record<FormatoPlantilla, string> = {
  csv: 'text/csv;charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Descarga de la plantilla de carga masiva (C1-51), en CSV o Excel, con los encabezados de
 * `config` y una fila de ejemplo. Es el paso 1 de `app-carga-masiva` (C1-50).
 */
@Component({
  selector: 'app-descarga-plantilla',
  templateUrl: './descarga-plantilla.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class DescargaPlantillaComponent {
  private readonly servicio = inject(CargaMasivaService);

  readonly config = input.required<PlantillaCarga>();
  /** Se emite con el formato elegido después de iniciar la descarga. */
  readonly descargada = output<FormatoPlantilla>();

  protected readonly hayEjemplo = computed(() => this.config().columnas.some((c) => c.ejemplo));

  protected descargar(formato: FormatoPlantilla): void {
    const config = this.config();
    const contenido: BlobPart =
      formato === 'csv'
        ? this.servicio.generarCsvPlantilla(config)
        : (this.servicio.generarXlsxPlantilla(config).buffer as ArrayBuffer);

    const url = URL.createObjectURL(new Blob([contenido], { type: TIPOS[formato] }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${config.nombreArchivo}.${formato}`;
    enlace.click();
    URL.revokeObjectURL(url);
    this.descargada.emit(formato);
  }
}
