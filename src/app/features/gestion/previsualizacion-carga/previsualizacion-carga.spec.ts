import { TestBed } from '@angular/core/testing';
import { ColumnaPlantilla, FilaValidada } from '../../../shared/models/carga-masiva.model';
import { PrevisualizacionCargaComponent } from './previsualizacion-carga';

const COLUMNAS: ColumnaPlantilla[] = [
  { clave: 'codigo', etiqueta: 'Código' },
  { clave: 'nombre', etiqueta: 'Nombre' },
];

function fila(numero: number, error?: string): FilaValidada {
  return {
    numero,
    datos: { codigo: `C${numero}`, nombre: `Materia ${numero}` },
    errores: error ? [error] : [],
    valida: !error,
  };
}

describe('PrevisualizacionCargaComponent', () => {
  async function crear(filas: FilaValidada[], faltantes: string[] = []) {
    await TestBed.configureTestingModule({
      imports: [PrevisualizacionCargaComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PrevisualizacionCargaComponent);
    fixture.componentRef.setInput('columnas', COLUMNAS);
    fixture.componentRef.setInput('filas', filas);
    fixture.componentRef.setInput('faltantes', faltantes);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const filasTabla = () => Array.from(el.querySelectorAll('tbody tr'));
    return { fixture, el, filasTabla };
  }

  it('muestra una fila por dato con su estado OK/Error y el motivo', async () => {
    const { filasTabla } = await crear([fila(2), fila(3, 'Código es obligatorio.')]);
    const [ok, error] = filasTabla();
    expect(ok.textContent).toContain('OK');
    expect(ok.textContent).toContain('Materia 2');
    expect(error.textContent).toContain('Error');
    expect(error.textContent).toContain('Código es obligatorio.');
  });

  it('muestra el contador de filas, válidas y con errores', async () => {
    const { el } = await crear([fila(2), fila(3), fila(4, 'x')]);
    const contador = el.querySelector('[role="status"]')!.textContent!.replace(/\s+/g, ' ');
    expect(contador).toContain('3 filas');
    expect(contador).toContain('2 válidas');
    expect(contador).toContain('1 con errores');
  });

  it('el filtro «solo errores» oculta las filas OK', async () => {
    const { fixture, el, filasTabla } = await crear([fila(2), fila(3, 'x'), fila(4)]);
    const filtro = el.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    filtro.checked = true;
    filtro.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(filasTabla()).toHaveLength(1);
    expect(filasTabla()[0].textContent).toContain('Error');

    filtro.checked = false;
    filtro.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(filasTabla()).toHaveLength(3);
  });

  it('no muestra el filtro si todas las filas son válidas', async () => {
    const { el } = await crear([fila(2), fila(3)]);
    expect(el.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('avisa de las columnas obligatorias que faltan', async () => {
    const { el } = await crear([fila(2)], ['Cantidad']);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Cantidad');
  });

  it('dibuja como máximo 200 filas pero las cuenta todas', async () => {
    const muchas = Array.from({ length: 250 }, (_, i) => fila(i + 2));
    const { el, filasTabla } = await crear(muchas);
    expect(filasTabla()).toHaveLength(200);
    expect(el.querySelector('[role="status"]')!.textContent).toContain('250 filas');
    expect(el.textContent).toContain('primeras 200 filas');
  });
});
