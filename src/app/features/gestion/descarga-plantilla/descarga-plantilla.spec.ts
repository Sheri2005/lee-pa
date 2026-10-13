import { TestBed } from '@angular/core/testing';
import { PlantillaCarga } from '../../../shared/models/carga-masiva.model';
import { DescargaPlantillaComponent, FormatoPlantilla } from './descarga-plantilla';

const CONFIG: PlantillaCarga = {
  nombre: 'Materias',
  nombreArchivo: 'plantilla-materias',
  endpoint: '/api/materias/importar',
  columnas: [
    { clave: 'codigo', etiqueta: 'Código', obligatorio: true, ejemplo: 'MAT101' },
    { clave: 'nombre', etiqueta: 'Nombre', obligatorio: true, ejemplo: 'Cálculo I' },
  ],
};

describe('DescargaPlantillaComponent', () => {
  async function crear(config: PlantillaCarga = CONFIG) {
    await TestBed.configureTestingModule({
      imports: [DescargaPlantillaComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DescargaPlantillaComponent);
    fixture.componentRef.setInput('config', config);
    const emitidos: FormatoPlantilla[] = [];
    fixture.componentInstance.descargada.subscribe((f) => emitidos.push(f));
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const boton = (texto: string) =>
      Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto)!;
    return { el, boton, emitidos };
  }

  let descargas: { nombre: string; blob: Blob }[];

  beforeEach(() => {
    descargas = [];
    let ultimoBlob!: Blob;
    URL.createObjectURL = vi.fn((b: Blob) => ((ultimoBlob = b), 'blob:prueba'));
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      descargas.push({ nombre: this.download, blob: ultimoBlob });
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('lista las columnas y avisa de la fila de ejemplo', async () => {
    const { el } = await crear();
    expect(el.textContent).toContain('Código');
    expect(el.textContent).toContain('(obligatorio)');
    expect(el.textContent).toContain('fila de ejemplo');
  });

  it('no menciona la fila de ejemplo si la plantilla no la define', async () => {
    const sinEjemplo = {
      ...CONFIG,
      columnas: CONFIG.columnas.map((c) => ({ ...c, ejemplo: undefined })),
    };
    const { el } = await crear(sinEjemplo);
    expect(el.textContent).not.toContain('fila de ejemplo');
  });

  it('descarga el CSV con encabezados y fila de ejemplo', async () => {
    const { boton, emitidos } = await crear();
    boton('Descargar CSV').click();

    expect(descargas).toHaveLength(1);
    expect(descargas[0].nombre).toBe('plantilla-materias.csv');
    expect(descargas[0].blob.type).toContain('text/csv');
    // Se leen los bytes y no el texto: `blob.text()` le quita el BOM al decodificar.
    const bytes = new Uint8Array(await descargas[0].blob.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]); // BOM UTF-8
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('Código,Nombre\r\nMAT101,Cálculo I\r\n');
    expect(emitidos).toEqual(['csv']);
  });

  it('descarga el Excel (.xlsx)', async () => {
    const { boton, emitidos } = await crear();
    boton('Descargar Excel').click();

    expect(descargas[0].nombre).toBe('plantilla-materias.xlsx');
    expect(descargas[0].blob.type).toContain('spreadsheetml.sheet');
    const bytes = new Uint8Array(await descargas[0].blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK'); // firma de zip
    expect(emitidos).toEqual(['xlsx']);
  });
});