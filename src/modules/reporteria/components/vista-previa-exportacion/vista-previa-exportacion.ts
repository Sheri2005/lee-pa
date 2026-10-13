import { Component, computed, input, signal } from '@angular/core';

export type FormatoVistaPrevia = 'json' | 'csv';

@Component({
  selector: 'app-vista-previa-exportacion',
  imports: [],
  templateUrl: './vista-previa-exportacion.html',
  styleUrl: './vista-previa-exportacion.css',
})
export class VistaPreviaExportacionComponent {
  readonly datosJson = input.required<unknown>();
  readonly contenidoCsv = input.required<string>();

  readonly nombreArchivo = input<string>('exportacion-siac');

  protected readonly formatoActivo = signal<FormatoVistaPrevia>('json');

  protected readonly jsonFormateado = computed(
    () => JSON.stringify(this.datosJson(), null, 2) ?? '',
  );

  protected readonly contenidoActual = computed(() =>
    this.formatoActivo() === 'json'
      ? this.jsonFormateado()
      : this.contenidoCsv(),
  );

  protected readonly sinContenido = computed(
    () => this.contenidoActual().trim().length === 0,
  );

  protected cambiarFormato(formato: FormatoVistaPrevia): void {
    this.formatoActivo.set(formato);
  }

  protected descargar(): void {
    if (this.sinContenido()) {
      return;
    }

    const formato = this.formatoActivo();

    if (formato === 'json') {
      const blob = new Blob([this.jsonFormateado()], {
        type: 'application/json;charset=utf-8;',
      });

      this.descargarBlob(
        blob,
        `${this.obtenerNombreArchivoSeguro()}.json`,
      );

      return;
    }

    const blob = new Blob(['\uFEFF', this.contenidoCsv()], {
      type: 'text/csv;charset=utf-8;',
    });

    this.descargarBlob(
      blob,
      `${this.obtenerNombreArchivoSeguro()}.csv`,
    );
  }

  protected etiquetaDescarga(): string {
    return this.formatoActivo() === 'json'
      ? 'Descargar JSON'
      : 'Descargar CSV';
  }

  private obtenerNombreArchivoSeguro(): string {
    const nombre = this.nombreArchivo().trim() || 'exportacion-siac';

    return nombre.replace(/[<>:"/\\|?*]+/g, '-');
  }

  private descargarBlob(
    contenido: Blob,
    nombreArchivo: string,
  ): void {
    const url = URL.createObjectURL(contenido);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();

    URL.revokeObjectURL(url);
  }
}