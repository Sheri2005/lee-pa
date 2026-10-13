import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ResumenImportacion } from '../../../models/carga-masiva.model';

/** Paso 4 de la carga masiva: resultado de la importación y enlace a la bitácora (C1-56). */
@Component({
  selector: 'app-resumen-importacion',
  imports: [RouterLink],
  templateUrl: './resumen-importacion.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ResumenImportacionComponent {
  readonly resumen = input.required<ResumenImportacion>();
  /** El usuario pide empezar otra carga. */
  readonly nuevaCarga = output<void>();
}
