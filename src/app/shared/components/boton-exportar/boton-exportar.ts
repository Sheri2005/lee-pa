import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export type FormatoExportacion = 'excel' | 'pdf' | 'csv';

export interface ColumnaExportacion {
  clave: string;
  encabezado: string;
}

@Component({
  selector: 'app-boton-exportar',
  imports: [],
  templateUrl: './boton-exportar.html',
  styleUrl: './boton-exportar.css',
})
export class BotonExportarComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly datos = input.required<readonly object[]>();
  readonly columnas = input.required<readonly ColumnaExportacion[]>();

  readonly nombreArchivo = input<string>('reporte');
  readonly formatos = input<readonly FormatoExportacion[]>([
    'excel',
    'pdf',
    'csv',
  ]);

  protected readonly menuAbierto = signal(false);

  protected readonly exportacionDeshabilitada = computed(
    () =>
      this.datos().length === 0 ||
      this.columnas().length === 0 ||
      this.formatos().length === 0,
  );

  protected alternarMenu(): void {
    if (this.exportacionDeshabilitada()) {
      return;
    }

    this.menuAbierto.update((abierto) => !abierto);
  }

  protected exportar(formato: FormatoExportacion): void {
    if (this.exportacionDeshabilitada()) {
      return;
    }

    this.menuAbierto.set(false);

    switch (formato) {
      case 'excel':
        this.exportarExcel();
        break;

      case 'pdf':
        this.exportarPdf();
        break;

      case 'csv':
        this.exportarCsv();
        break;
    }
  }

  protected etiquetaFormato(formato: FormatoExportacion): string {
    const etiquetas: Record<FormatoExportacion, string> = {
      excel: 'Excel (.xlsx)',
      pdf: 'PDF (.pdf)',
      csv: 'CSV (.csv)',
    };

    return etiquetas[formato];
  }

  @HostListener('document:click', ['$event'])
  protected cerrarMenuAlHacerClickFuera(event: MouseEvent): void {
    const objetivo = event.target as Node | null;

    if (objetivo && !this.elementRef.nativeElement.contains(objetivo)) {
      this.menuAbierto.set(false);
    }
  }

  private exportarExcel(): void {
    const hoja = XLSX.utils.aoa_to_sheet(this.obtenerMatrizExportacion());
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte');

    XLSX.writeFile(libro, `${this.obtenerNombreArchivoSeguro()}.xlsx`);
  }

  private exportarCsv(): void {
    const hoja = XLSX.utils.aoa_to_sheet(this.obtenerMatrizExportacion());

    const contenidoCsv = XLSX.utils.sheet_to_csv(hoja);

    const blob = new Blob(['\uFEFF', contenidoCsv], {
      type: 'text/csv;charset=utf-8;',
    });

    this.descargarBlob(
      blob,
      `${this.obtenerNombreArchivoSeguro()}.csv`,
    );
  }

  private exportarPdf(): void {
    const documento = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const columnas = this.columnas();
    const filas = this.obtenerFilasFormateadas();

    const margen = 10;
    const anchoPagina = documento.internal.pageSize.getWidth();
    const altoPagina = documento.internal.pageSize.getHeight();
    const anchoDisponible = anchoPagina - margen * 2;
    const anchoColumna = anchoDisponible / columnas.length;

    const tamanoFuente =
      columnas.length > 8 ? 6 : columnas.length > 5 ? 7 : 8;

    let posicionY = margen;

    const dibujarCabecera = (): void => {
      documento.setFont('helvetica', 'bold');
      documento.setFontSize(tamanoFuente);

      const textosCabecera = columnas.map((columna) =>
        documento.splitTextToSize(
          columna.encabezado,
          Math.max(anchoColumna - 4, 5),
        ) as string[],
      );

      const lineasMaximas = Math.max(
        ...textosCabecera.map((lineas) => lineas.length),
        1,
      );

      const altoFila = lineasMaximas * 4 + 4;

      textosCabecera.forEach((lineas, indice) => {
        const posicionX = margen + indice * anchoColumna;

        documento.rect(
          posicionX,
          posicionY,
          anchoColumna,
          altoFila,
        );

        documento.text(
          lineas,
          posicionX + 2,
          posicionY + 4,
        );
      });

      posicionY += altoFila;
      documento.setFont('helvetica', 'normal');
    };

    dibujarCabecera();

    for (const fila of filas) {
      const contenidoCeldas = fila.map((valor) =>
        documento.splitTextToSize(
          valor,
          Math.max(anchoColumna - 4, 5),
        ) as string[],
      );

      const lineasMaximas = Math.max(
        ...contenidoCeldas.map((lineas) => lineas.length),
        1,
      );

      const altoFila = lineasMaximas * 4 + 4;

      if (posicionY + altoFila > altoPagina - margen) {
        documento.addPage();
        posicionY = margen;
        dibujarCabecera();
      }

      contenidoCeldas.forEach((lineas, indice) => {
        const posicionX = margen + indice * anchoColumna;

        documento.rect(
          posicionX,
          posicionY,
          anchoColumna,
          altoFila,
        );

        documento.text(
          lineas,
          posicionX + 2,
          posicionY + 4,
        );
      });

      posicionY += altoFila;
    }

    documento.save(`${this.obtenerNombreArchivoSeguro()}.pdf`);
  }

  private obtenerMatrizExportacion(): string[][] {
    return [
      this.columnas().map((columna) => columna.encabezado),
      ...this.obtenerFilasFormateadas(),
    ];
  }

  private obtenerFilasFormateadas(): string[][] {
    return this.datos().map((fila) =>
      this.columnas().map((columna) =>
        this.normalizarValor(
          this.obtenerValor(fila, columna.clave),
        ),
      ),
    );
  }

  private obtenerValor(
    fila: object,
    clave: string,
  ): unknown {
    const partes = clave.split('.');

    let valor: unknown = fila;

    for (const parte of partes) {
      if (
        typeof valor !== 'object' ||
        valor === null ||
        !(parte in valor)
      ) {
        return '';
      }

      valor = (valor as Record<string, unknown>)[parte];
    }

    return valor;
  }

  private normalizarValor(valor: unknown): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    if (valor instanceof Date) {
      return valor.toLocaleString('es-EC');
    }

    if (typeof valor === 'boolean') {
      return valor ? 'Sí' : 'No';
    }

    if (typeof valor === 'object') {
      try {
        return JSON.stringify(valor);
      } catch {
        return '';
      }
    }

    return String(valor);
  }

  private obtenerNombreArchivoSeguro(): string {
    const nombre = this.nombreArchivo().trim() || 'reporte';

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