import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResumenImportacion } from '../../models/carga-masiva.model';
import { CargaMasivaService } from '../../services/carga-masiva.service';
import { PLANTILLA_PRUEBA } from '../../testing/plantilla-prueba';
import { SubirArchivoComponent } from '../subir-archivo/subir-archivo';
import { CargaMasivaComponent } from './carga-masiva';

describe('CargaMasivaComponent', () => {
  async function crear(servicio?: Partial<CargaMasivaService>) {
    await TestBed.configureTestingModule({
      imports: [CargaMasivaComponent],
      providers: [
        provideRouter([]),
        ...(servicio
          ? [
              {
                provide: CargaMasivaService,
                useValue: Object.assign(new CargaMasivaService(), servicio),
              },
            ]
          : []),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CargaMasivaComponent);
    fixture.componentRef.setInput('config', PLANTILLA_PRUEBA);
    const finalizadas: ResumenImportacion[] = [];
    fixture.componentInstance.importacionFinalizada.subscribe((r) => finalizadas.push(r));
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const boton = (texto: string) =>
      Array.from(el.querySelectorAll('button')).find((b) =>
        b.textContent?.trim().startsWith(texto),
      ) as HTMLButtonElement | undefined;
    const pulsar = async (texto: string) => {
      boton(texto)!.click();
      await fixture.whenStable();
    };
    const subir = async (filas: Record<string, unknown>[]) => {
      fixture.debugElement
        .query((d) => d.componentInstance instanceof SubirArchivoComponent)
        .componentInstance.filasLeidas.emit(filas);
      await fixture.whenStable();
    };
    const pasoActual = () => el.querySelector('[aria-current="step"]')?.textContent?.trim();
    return { fixture, el, boton, pulsar, subir, pasoActual, finalizadas };
  }

  it('empieza en el paso 1 con las columnas de la plantilla', async () => {
    const { el, pasoActual } = await crear();
    expect(pasoActual()).toContain('Plantilla');
    expect(el.textContent).toContain('Materia');
    expect(el.textContent).toContain('Cantidad');
  });

  it('avanza al paso 2 y muestra el selector de archivo', async () => {
    const { el, pulsar, pasoActual } = await crear();
    await pulsar('Ya tengo mi archivo');
    expect(pasoActual()).toContain('Archivo');
    expect(el.querySelector('app-subir-archivo')).not.toBeNull();
  });

  it('al recibir filas valida y pasa a la previsualización', async () => {
    const { el, pulsar, subir, pasoActual } = await crear();
    await pulsar('Ya tengo mi archivo');
    await subir([
      { Materia: 'Cálculo', Cantidad: '30' },
      { Materia: '', Cantidad: 'x' },
    ]);
    expect(pasoActual()).toContain('Validación');
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(el.textContent).toContain('1 válidas');
    expect(el.textContent).toContain('1 con errores');
    expect(el.textContent).toContain('Materia es obligatorio.');
  });

  it('importa solo las válidas, muestra el resumen y emite importacionFinalizada', async () => {
    const importar = vi.fn((_c, filas) =>
      of({
        total: filas.length,
        importadas: 1,
        rechazadas: 1,
        errores: [{ fila: 3, mensaje: 'Materia es obligatorio.' }],
      }),
    );
    const { el, pulsar, subir, pasoActual, finalizadas } = await crear({ importar });
    await pulsar('Ya tengo mi archivo');
    await subir([
      { Materia: 'Cálculo', Cantidad: '30' },
      { Materia: '', Cantidad: '5' },
    ]);
    await pulsar('Importar 1 filas válidas');

    expect(importar).toHaveBeenCalledOnce();
    expect(pasoActual()).toContain('Resumen');
    expect(el.textContent).toContain('Importación finalizada');
    expect(el.textContent).toContain('Fila 3:');
    expect(finalizadas).toHaveLength(1);
    expect(finalizadas[0].importadas).toBe(1);
  });

  it('no permite importar si ninguna fila es válida', async () => {
    const { boton, pulsar, subir } = await crear();
    await pulsar('Ya tengo mi archivo');
    await subir([
      { Materia: '', Cantidad: '' },
      { Materia: '', Cantidad: 'x' },
    ]);
    expect(boton('Importar')!.disabled).toBe(true);
  });

  it('bloquea la importación y avisa si faltan columnas obligatorias', async () => {
    const { el, boton, pulsar, subir } = await crear();
    await pulsar('Ya tengo mi archivo');
    await subir([{ Materia: 'Cálculo' }]);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Cantidad');
    expect(boton('Importar')!.disabled).toBe(true);
  });

  it('muestra el error del selector de archivo', async () => {
    const { fixture, el, pulsar } = await crear();
    await pulsar('Ya tengo mi archivo');
    fixture.debugElement
      .query((d) => d.componentInstance instanceof SubirArchivoComponent)
      .componentInstance.error.emit('El archivo está vacío.');
    await fixture.whenStable();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('El archivo está vacío.');
  });

  it('avisa si falla la importación y permite reintentar', async () => {
    const importar = vi.fn(() => throwError(() => new Error('x')));
    const { el, boton, pulsar, subir, pasoActual } = await crear({ importar });
    await pulsar('Ya tengo mi archivo');
    await subir([{ Materia: 'A', Cantidad: '1' }]);
    await pulsar('Importar');
    expect(pasoActual()).toContain('Validación');
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudo completar');
    expect(boton('Importar')!.disabled).toBe(false);
  });

  it('"Cargar otro archivo" reinicia el asistente', async () => {
    const { pulsar, subir, pasoActual } = await crear();
    await pulsar('Ya tengo mi archivo');
    await subir([{ Materia: 'A', Cantidad: '1' }]);
    await pulsar('Importar');
    await new Promise((r) => setTimeout(r, 500));
    await pulsar('Cargar otro archivo');
    expect(pasoActual()).toContain('Plantilla');
  });
});