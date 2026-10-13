import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RegistroImportacion } from '../../../shared/models/bitacora-importacion.model';
import { CargaMasivaService } from '../../../shared/services/carga-masiva.service';

/** Misma forma que `RangoFechas` de app-selector-rango-fechas (C4-05, G4). */
interface RangoFechas {
  desde: string;
  hasta: string;
}

/**
 * Bitácora de importaciones (C1-56). Ruta: /gestion/carga-masiva/bitacora.
 *
 * Historial de la carga masiva: entidad, archivo, usuario, fecha, filas OK/error y el
 * detalle de errores de cada importación. Se filtra por entidad y rango de fechas.
 *
 * TEMPORAL: encabezado (app-encabezado-pagina, C3-23, G3), barra de filtros
 * (app-barra-filtros, C4-21, G4), rango de fechas (app-selector-rango-fechas, C4-05, G4) y
 * tabla (app-tabla-datos, C4-20, G4) están dibujados aquí y marcados en la plantilla.
 */
@Component({
  selector: 'app-bitacora-importaciones',
  imports: [DatePipe, RouterLink],
  templateUrl: './bitacora-importaciones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BitacoraImportacionesComponent {
  private readonly servicio = inject(CargaMasivaService);

  protected readonly registros = signal<RegistroImportacion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);

  /** Valores que el usuario está editando en la barra de filtros. */
  protected readonly entidad = signal('');
  protected readonly rango = signal<RangoFechas>({ desde: '', hasta: '' });
  /** Filtros que se aplican a la tabla (cambian al pulsar Buscar o Limpiar). */
  protected readonly aplicados = signal<{ entidad: string } & RangoFechas>({ entidad: '', desde: '', hasta: '' });

  /** Importación con el detalle de errores abierto. */
  protected readonly abierta = signal<number | null>(null);

  protected readonly entidades = computed(() =>
    [...new Set(this.registros().map((r) => r.entidad))].sort((a, b) => a.localeCompare(b, 'es')),
  );

  protected readonly rangoInvalido = computed(() => {
    const { desde, hasta } = this.rango();
    return !!desde && !!hasta && desde > hasta;
  });

  protected readonly filtrosActivos = computed(() => {
    const f = this.aplicados();
    return [f.entidad, f.desde || f.hasta].filter(Boolean).length;
  });

  protected readonly filtrados = computed(() => {
    const { entidad, desde, hasta } = this.aplicados();
    return this.registros().filter((r) => {
      // La fecha viene con la zona de Ecuador (-05:00): los 10 primeros caracteres son el día local.
      const dia = r.fecha.slice(0, 10);
      return (!entidad || r.entidad === entidad) && (!desde || dia >= desde) && (!hasta || dia <= hasta);
    });
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.servicio.listarBitacora().subscribe({
      next: (lista) => {
        this.registros.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }

  /** Respuesta a `(buscar)` de app-barra-filtros. */
  protected buscar(evento?: Event): void {
    evento?.preventDefault();
    if (this.rangoInvalido()) return;
    this.aplicados.set({ entidad: this.entidad(), ...this.rango() });
    this.abierta.set(null);
  }

  /** Respuesta a `(limpiar)` de app-barra-filtros. */
  protected limpiar(): void {
    this.entidad.set('');
    this.rango.set({ desde: '', hasta: '' });
    this.buscar();
  }

  protected alternarDetalle(id: number): void {
    this.abierta.update((actual) => (actual === id ? null : id));
  }

  protected cambiarRango(extremo: keyof RangoFechas, valor: string): void {
    this.rango.update((r) => ({ ...r, [extremo]: valor }));
  }
}
