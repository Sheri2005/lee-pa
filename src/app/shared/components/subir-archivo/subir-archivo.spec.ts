import { TestBed } from '@angular/core/testing';
import * as XLSX from 'xlsx';
import {
  describirFormatos,
  filasConEncabezados,
  libroPlantilla,
  normalizarColumna,
  SubirArchivoComponent,
  validarArchivo,
} from './subir-archivo';

describe('SubirArchivoComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SubirArchivoComponent] }).compileComponents();
  });

  it('se crea y muestra el contrato por defecto', () => {
    const fixture = TestBed.createComponent(SubirArchivoComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Excel o CSV');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Hasta 5 MB');
  });

  it('rechaza una extensión no permitida', () => {
    expect(validarArchivo({ name: 'datos.pdf', size: 20 }, ['.csv', '.xlsx'], 5)).toContain(
      'Usa Excel o CSV.',
    );
  });

  it('nombra los formatos de forma comprensible', () => {
    expect(describirFormatos(['.csv', '.xlsx'])).toBe('Excel o CSV');
    expect(describirFormatos(['.xlsx', '.xls', '.csv'])).toBe('Excel o CSV');
    expect(describirFormatos(['csv'])).toBe('CSV');
    expect(describirFormatos(['.xlsx', '.csv', '.json'])).toBe('Excel, CSV o JSON');
  });

  it('acepta por defecto Excel moderno y antiguo (.xls) y CSV', () => {
    for (const nombre of ['a.xlsx', 'a.xls', 'a.csv']) {
      expect(validarArchivo({ name: nombre, size: 10 }, ['.xlsx', '.xls', '.csv'], 5)).toBeNull();
    }
  });

  it('exige las columnas obligatorias y usa su nombre exacto como clave', () => {
    const columnas = ['nombre', 'cantidad', 'estado'];
    expect(normalizarColumna(' Año_Inicio ')).toBe('ano inicio');

    // "NOMBRE" y "Cantidad " valen; la columna extra se conserva; las filas vacías se ignoran.
    expect(
      filasConEncabezados(
        [
          ['NOMBRE', 'Cantidad ', 'Estado', 'Observación'],
          ['Proyector', '4', 'ACTIVO', 'Sala 3'],
          ['', '', '', ''],
        ],
        columnas,
      ),
    ).toEqual([{ nombre: 'Proyector', cantidad: '4', estado: 'ACTIVO', Observación: 'Sala 3' }]);

    expect(() =>
      filasConEncabezados(
        [
          ['nombre', 'cantidad'],
          ['Laptop', '2'],
        ],
        columnas,
      ),
    ).toThrow(
      'El archivo no tiene la columna estado. La primera fila debe tener: nombre, cantidad, estado.',
    );
    expect(() =>
      filasConEncabezados([
        ['nombre', ''],
        ['Laptop', '2'],
      ]),
    ).toThrow('sin celdas vacías');
  });

  it('explica la forma del archivo y ofrece la plantilla solo si hay columnas', () => {
    const fixture = TestBed.createComponent(SubirArchivoComponent);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.textContent).toContain('Cómo debe estar el archivo');
    expect(raiz.textContent).not.toContain('Descargar plantilla');

    fixture.componentRef.setInput('columnas', ['nombre', 'cantidad']);
    fixture.detectChanges();
    const chips = [...raiz.querySelectorAll('[aria-label="Columnas obligatorias"] > span')];
    expect(chips.map((c) => c.textContent?.trim())).toEqual(['nombre', 'cantidad']);
    expect(raiz.textContent).toContain('Descargar plantilla');
  });

  it('la plantilla lleva los encabezados y las filas de ejemplo', () => {
    const libro = libroPlantilla(
      ['nombre', 'cantidad', 'estado'],
      [{ nombre: 'Proyector', cantidad: 4 }],
    );
    expect(XLSX.utils.sheet_to_json(libro.Sheets['Datos'], { header: 1 })).toEqual([
      ['nombre', 'cantidad', 'estado'],
      ['Proyector', 4, ''],
    ]);
  });

  it('al leer un archivo muestra su nombre y cuántas filas trae', async () => {
    const fixture = TestBed.createComponent(SubirArchivoComponent);
    await fixture.componentInstance.procesarArchivo(
      new File(['nombre\nProyector\nLaptop'], 'recursos.csv'),
    );
    fixture.detectChanges();

    const estado = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(estado?.textContent?.replace(/\s*·\s*/g, ' · ')).toContain(
      'recursos.csv · 2 filas leídas',
    );
  });

  it('rechaza archivos vacíos o mayores al límite', () => {
    expect(validarArchivo({ name: 'datos.csv', size: 0 }, ['.csv'], 5)).toBe(
      'El archivo está vacío.',
    );
    expect(validarArchivo({ name: 'datos.csv', size: 2 * 1024 * 1024 }, ['.csv'], 1)).toBe(
      'El archivo supera el máximo de 1 MB.',
    );
  });

  it('lee un CSV y emite sus filas', async () => {
    const fixture = TestBed.createComponent(SubirArchivoComponent);
    const filas: unknown[] = [];
    fixture.componentInstance.filasLeidas.subscribe((resultado) => filas.push(resultado));

    const archivo = new File(['nombre,cantidad\nProyector,2\nMicrófono,4'], 'recursos.csv', {
      type: 'text/csv',
    });
    await fixture.componentInstance.procesarArchivo(archivo);

    expect(filas).toEqual([
      [
        { nombre: 'Proyector', cantidad: '2' },
        { nombre: 'Micrófono', cantidad: '4' },
      ],
    ]);
  });

  it('conserva tildes y eñes en CSV UTF-8 con BOM y en CSV de Excel (Windows-1252)', async () => {
    const fixture = TestBed.createComponent(SubirArchivoComponent);
    const leidas: unknown[] = [];
    fixture.componentInstance.filasLeidas.subscribe((resultado) => leidas.push(resultado));

    // "CSV UTF-8" de Excel: empieza con BOM (EF BB BF).
    const utf8 = new TextEncoder().encode('﻿nombre\nAño lectivo\nMicrófono');
    // "CSV delimitado por comas" de Excel en Windows: ñ = F1, ó = F3.
    const windows1252 = new Uint8Array([
      ...new TextEncoder().encode('nombre\nA'),
      0xf1,
      ...new TextEncoder().encode('o lectivo\nMicr'),
      0xf3,
      ...new TextEncoder().encode('fono'),
    ]);

    await fixture.componentInstance.procesarArchivo(new File([utf8], 'utf8.csv'));
    await fixture.componentInstance.procesarArchivo(new File([windows1252], 'excel.csv'));

    const esperado = [{ nombre: 'Año lectivo' }, { nombre: 'Micrófono' }];
    expect(leidas).toEqual([esperado, esperado]);
  });

  it('lee la primera hoja de un XLSX', async () => {
    const fixture = TestBed.createComponent(SubirArchivoComponent);
    let filas: unknown[] = [];
    fixture.componentInstance.filasLeidas.subscribe((resultado) => (filas = resultado));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.json_to_sheet([{ codigo: 'A-101', nombre: 'Auditorio' }]),
      'Espacios',
    );
    const contenido = XLSX.write(libro, { type: 'array', bookType: 'xlsx' });

    await fixture.componentInstance.procesarArchivo(
      new File([contenido], 'espacios.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );

    expect(filas).toEqual([{ codigo: 'A-101', nombre: 'Auditorio' }]);
  });

  it('emite error cuando el archivo no contiene datos', async () => {
    const fixture = TestBed.createComponent(SubirArchivoComponent);
    let mensaje = '';
    fixture.componentInstance.error.subscribe((error) => (mensaje = error));

    await fixture.componentInstance.procesarArchivo(new File([''], 'vacio.csv'));

    expect(mensaje).toBe('El archivo está vacío.');
  });
});
