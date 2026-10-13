import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { routes } from '../../../app.routes';
import { RegistroImportacion } from '../../../shared/models/bitacora-importacion.model';
import { CargaMasivaService } from '../../../shared/services/carga-masiva.service';
import { BitacoraImportacionesComponent } from './bitacora-importaciones';

describe('BitacoraImportacionesComponent', () => {
  let fixture: ComponentFixture<BitacoraImportacionesComponent>;
  let el: HTMLElement;

  async function crear(providers: unknown[] = []) {
    await TestBed.configureTestingModule({
      imports: [BitacoraImportacionesComponent],
      providers: [provideRouter([]), ...(providers as never[])],
    }).compileComponents();
    fixture = TestBed.createComponent(BitacoraImportacionesComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  const filas = () => Array.from(el.querySelectorAll('tbody tr:not([id])'));
  const celdas = (fila: Element) => Array.from(fila.querySelectorAll('td')).map((td) => td.textContent?.trim());
  const botonPorTexto = (texto: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto)!;

  function filtrar(cambios: { entidad?: string; desde?: string; hasta?: string }) {
    if (cambios.entidad !== undefined) {
      const sel = el.querySelector<HTMLSelectElement>('#filtro-entidad')!;
      sel.value = cambios.entidad;
      sel.dispatchEvent(new Event('change'));
    }
    for (const extremo of ['desde', 'hasta'] as const) {
      if (cambios[extremo] !== undefined) {
        const input = el.querySelector<HTMLInputElement>(`#filtro-${extremo}`)!;
        input.value = cambios[extremo]!;
        input.dispatchEvent(new Event('change'));
      }
    }
    fixture.detectChanges();
  }

  function buscar() {
    botonPorTexto('Buscar').click();
    fixture.detectChanges();
  }

  describe('con los datos de prueba', () => {
    beforeEach(() => crear());

    it('muestra el título y un enlace para hacer una nueva carga', () => {
      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Bitácora de importaciones');
      expect(el.querySelector('header a')?.getAttribute('href')).toBe('/gestion/carga-masiva');
    });

    it('lista las importaciones de la más reciente a la más antigua', () => {
      expect(filas().length).toBe(5);
      expect(celdas(filas()[0])[1]).toBe('Materias por malla');
      expect(celdas(filas()[4])[1]).toBe('Usuarios');
    });

    it('muestra fecha en hora de Ecuador, archivo, usuario y conteo de filas', () => {
      const docentes = filas().find((f) => celdas(f)[1] === 'Docentes')!;
      expect(celdas(docentes).slice(0, 7)).toEqual([
        '29/09/2026 11:40', 'Docentes', 'docentes.csv', 'Administrador del sistema', '18', '16', '2',
      ]);
    });

    it('indica cuando el usuario de la importación fue eliminado', () => {
      expect(celdas(filas()[0])[3]).toBe('Usuario eliminado');
    });

    it('solo ofrece ver errores en las importaciones que los tienen', () => {
      expect(el.querySelectorAll('button[aria-expanded]').length).toBe(3);
    });

    it('abre y cierra el detalle de errores con fila, columna y mensaje', () => {
      const boton = el.querySelector<HTMLButtonElement>('button[aria-label="Ver errores de malla-software-2024.csv"]')!;
      boton.click();
      fixture.detectChanges();

      expect(boton.getAttribute('aria-expanded')).toBe('true');
      const detalle = el.querySelector(`#${boton.getAttribute('aria-controls')}`)!;
      const items = Array.from(detalle.querySelectorAll('li')).map((li) => li.textContent?.replace(/\s+/g, ' ').trim());
      expect(items).toEqual([
        'Fila 7 · nivel : nivel debe ser un número entero mayor que 0.',
        'Fila 19 · unidad_curricular : unidad_curricular debe ser BASICA, PROFESIONAL, INTEGRACION.',
        'Fila 33 : La materia MAT-999 no existe.',
      ]);

      boton.click();
      fixture.detectChanges();
      expect(el.querySelector('#errores-5')).toBeNull();
    });

    it('filtra por entidad al pulsar Buscar (no antes)', () => {
      filtrar({ entidad: 'Períodos' });
      expect(filas().length).toBe(5);
      buscar();
      expect(filas().map((f) => celdas(f)[1])).toEqual(['Períodos']);
    });

    it('filtra por rango de fechas, incluyendo los extremos', () => {
      filtrar({ desde: '2026-09-29', hasta: '2026-10-03' });
      buscar();
      expect(filas().map((f) => celdas(f)[1])).toEqual(['Materias', 'Períodos', 'Docentes']);
    });

    it('no aplica un rango invertido y avisa del error', () => {
      filtrar({ desde: '2026-10-05', hasta: '2026-10-01' });
      buscar();
      expect(filas().length).toBe(5);
      expect(el.querySelector('#error-rango')?.textContent).toContain('no puede ser posterior');
      expect(el.querySelector('#filtro-desde')?.getAttribute('aria-invalid')).toBe('true');
    });

    it('muestra un mensaje cuando los filtros no encuentran nada, y Limpiar los quita', () => {
      filtrar({ desde: '2027-01-01' });
      buscar();
      expect(el.querySelector('tbody')?.textContent).toContain('No hay importaciones con esos filtros');

      botonPorTexto('Limpiar').click();
      fixture.detectChanges();
      expect(filas().length).toBe(5);
      expect(el.querySelector<HTMLInputElement>('#filtro-desde')!.value).toBe('');
    });

    it('anuncia cuántas importaciones se muestran', () => {
      expect(el.querySelector('[aria-live]')?.textContent?.trim()).toBe('5 importaciones');
    });
  });

  describe('casos especiales', () => {
    it('muestra el error de carga y Reintentar vuelve a pedir los datos', async () => {
      let falla = true;
      await crear([
        {
          provide: CargaMasivaService,
          useValue: {
            listarBitacora: (): Observable<RegistroImportacion[]> =>
              falla ? throwError(() => new Error('sin red')) : of([]),
          },
        },
      ]);
      expect(el.querySelector('div[role="alert"]')?.textContent).toContain('No se pudo cargar la bitácora');

      falla = false;
      botonPorTexto('Reintentar').click();
      fixture.detectChanges();
      expect(el.querySelector('tbody')?.textContent).toContain('Todavía no se ha hecho ninguna importación');
    });
  });

  describe('ruta', () => {
    it('/gestion/carga-masiva/bitacora muestra la bitácora', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/gestion/carga-masiva/bitacora');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('Bitácora de importaciones');
    });
  });
});
