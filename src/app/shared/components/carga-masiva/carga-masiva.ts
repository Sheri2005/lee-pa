import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FilaCruda,
  FilaValidada,
  PlantillaCarga,
  ResumenImportacion,
} from '../../models/carga-masiva.model';
import { CargaMasivaService } from '../../services/carga-masiva.service';
import { SubirArchivoComponent } from '../subir-archivo/subir-archivo';
import { DescargaPlantillaComponent } from '../../../features/gestion/descarga-plantilla/descarga-plantilla';
import { PrevisualizacionCargaComponent } from '../../../features/gestion/previsualizacion-carga/previsualizacion-carga';
import { ResumenImportacionComponent } from './resumen-importacion/resumen-importacion';

const PASOS = ['Plantilla', 'Archivo', 'Validación', 'Resumen'] as const;

/**
 * Asistente de carga masiva (C1-50) de 4 pasos: plantilla → archivo → previsualización y
 * validación → resumen. Es reutilizable: se configura con `config` (columnas, obligatorios,
 * validadores y endpoint) y avisa con `importacionFinalizada`.
 *
 * Las filas inválidas NUNCA se guardan: solo se importan las que pasan la validación.
 *
 * NOTA: el paso 2 usa `app-subir-archivo` (C4-22, G4).
 */
@Component({
  selector: 'app-carga-masiva',
  imports: [
    DescargaPlantillaComponent,
    SubirArchivoComponent,
    PrevisualizacionCargaComponent,
    ResumenImportacionComponent,
  ],
  templateUrl: './carga-masiva.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CargaMasivaComponent {
  private readonly servicio = inject(CargaMasivaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly config = input.required<PlantillaCarga>();
  readonly importacionFinalizada = output<ResumenImportacion>();

  protected readonly pasos = PASOS;
  protected readonly paso = signal(1);
  protected readonly filas = signal<FilaValidada[]>([]);
  protected readonly faltantes = signal<string[]>([]);
  protected readonly errorArchivo = signal('');
  protected readonly importando = signal(false);
  protected readonly errorImportar = signal(false);
  protected readonly resumen = signal<ResumenImportacion | null>(null);

  protected readonly validas = computed(() => this.filas().filter((f) => f.valida).length);
  protected readonly puedeImportar = computed(
    () => this.validas() > 0 && this.faltantes().length === 0 && !this.importando(),
  );

  protected readonly extensiones = computed(() => this.config().extensiones ?? ['.csv', '.xlsx']);
  protected readonly tamanoMaxMB = computed(() => this.config().tamanoMaxMB ?? 5);

  protected irAPaso(paso: number): void {
    this.errorArchivo.set('');
    this.errorImportar.set(false);
    this.paso.set(paso);
  }

  protected recibirFilas(filas: FilaCruda[]): void {
    const config = this.config();
    this.errorArchivo.set('');
    this.faltantes.set(this.servicio.columnasFaltantes(config, filas));
    this.filas.set(this.servicio.validar(config, filas));
    this.irAPaso(3);
  }

  protected mostrarError(mensaje: string): void {
    this.errorArchivo.set(mensaje);
  }

  protected importar(): void {
    if (!this.puedeImportar()) return;
    this.importando.set(true);
    this.errorImportar.set(false);
    this.servicio
      .importar(this.config(), this.filas())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resumen) => {
          this.importando.set(false);
          this.resumen.set(resumen);
          this.irAPaso(4);
          this.importacionFinalizada.emit(resumen);
        },
        error: () => {
          this.importando.set(false);
          this.errorImportar.set(true);
        },
      });
  }

  protected nuevaCarga(): void {
    this.filas.set([]);
    this.faltantes.set([]);
    this.resumen.set(null);
    this.irAPaso(1);
  }
}
