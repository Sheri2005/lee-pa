import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResumenImportacion } from '../../../models/carga-masiva.model';
import { ResumenImportacionComponent } from './resumen-importacion';

describe('ResumenImportacionComponent', () => {
  let fixture: ComponentFixture<ResumenImportacionComponent>;

  async function crear(resumen: ResumenImportacion) {
    await TestBed.configureTestingModule({
      imports: [ResumenImportacionComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ResumenImportacionComponent);
    fixture.componentRef.setInput('resumen', resumen);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const valor = (el: HTMLElement, titulo: string) =>
    Array.from(el.querySelectorAll('dl > div'))
      .find((d) => d.querySelector('dt')?.textContent?.trim() === titulo)
      ?.querySelector('dd')
      ?.textContent?.trim();

  it('muestra filas leídas, importadas y rechazadas', async () => {
    const el = await crear({ total: 10, importadas: 8, rechazadas: 2, errores: [] });
    expect(valor(el, 'Filas leídas')).toBe('10');
    expect(valor(el, 'Importadas')).toBe('8');
    expect(valor(el, 'Rechazadas')).toBe('2');
  });

  it('lista el motivo de cada fila no importada', async () => {
    const el = await crear({
      total: 3,
      importadas: 1,
      rechazadas: 2,
      errores: [
        { fila: 2, mensaje: 'email es obligatorio.' },
        { fila: 4, mensaje: 'nivel debe ser un número entero mayor que 0.' },
      ],
    });
    const items = Array.from(el.querySelectorAll('li')).map((li) =>
      li.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(items).toEqual([
      'Fila 2: email es obligatorio.',
      'Fila 4: nivel debe ser un número entero mayor que 0.',
    ]);
  });

  it('no muestra la lista de errores si todo se importó', async () => {
    const el = await crear({ total: 5, importadas: 5, rechazadas: 0, errores: [] });
    expect(el.querySelector('ul')).toBeNull();
    expect(el.textContent).not.toContain('Filas no importadas');
  });

  it('"Cargar otro archivo" emite nuevaCarga', async () => {
    const el = await crear({ total: 1, importadas: 1, rechazadas: 0, errores: [] });
    let emitido = 0;
    fixture.componentInstance.nuevaCarga.subscribe(() => emitido++);
    el.querySelector('button')!.click();
    expect(emitido).toBe(1);
  });

  it('enlaza a la bitácora de importaciones (C1-56)', async () => {
    const el = await crear({ total: 1, importadas: 1, rechazadas: 0, errores: [] });
    const enlace = el.querySelector('a')!;
    expect(enlace.textContent?.trim()).toBe('Ver bitácora de importaciones');
    expect(enlace.getAttribute('href')).toBe('/gestion/carga-masiva/bitacora');
  });
});
