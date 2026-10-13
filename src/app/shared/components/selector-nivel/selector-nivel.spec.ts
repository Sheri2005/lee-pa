import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MallaService } from '../../services/malla.service';
import { SelectorNivelComponent } from './selector-nivel';

describe('SelectorNivelComponent', () => {
  const NIVELES: Record<number, number> = { 3: 9, 4: 10, 5: 3 };

  async function crear(
    entradas: { mallaId?: number; multiple?: boolean } = {},
    listarNiveles: (id: number) => unknown = (id) =>
      of(Array.from({ length: NIVELES[id] ?? 0 }, (_, i) => i + 1)),
  ) {
    await TestBed.configureTestingModule({
      imports: [SelectorNivelComponent],
      providers: [{ provide: MallaService, useValue: { listarNiveles } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SelectorNivelComponent);
    const emitidos: number[][] = [];
    fixture.componentInstance.nivelesChange.subscribe((n) => emitidos.push(n));
    if (entradas.mallaId != null) fixture.componentRef.setInput('mallaId', entradas.mallaId);
    if (entradas.multiple != null) fixture.componentRef.setInput('multiple', entradas.multiple);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    const casillas = () => Array.from(el.querySelectorAll('input')) as HTMLInputElement[];
    const marcados = () =>
      casillas()
        .filter((c) => c.checked)
        .map((c) => Number(c.value));
    const pulsar = async (nivel: number) => {
      casillas()
        .find((c) => c.value === String(nivel))!
        .click();
      await fixture.whenStable();
    };
    const limpiar = () =>
      Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Limpiar')) as
        HTMLButtonElement | undefined;
    const poner = async (nombre: string, valor: unknown) => {
      fixture.componentRef.setInput(nombre, valor);
      await fixture.whenStable();
    };
    return { fixture, el, emitidos, casillas, marcados, pulsar, limpiar, poner };
  }

  it('sin malla muestra un aviso, sin niveles y deshabilitado', async () => {
    const { el, casillas } = await crear();
    expect(el.textContent).toContain('Elige una malla para ver sus niveles.');
    expect(casillas()).toHaveLength(0);
    expect(el.querySelector('fieldset')!.disabled).toBe(true);
  });

  it('muestra los niveles 1..n de la malla', async () => {
    const { casillas } = await crear({ mallaId: 3 });
    expect(casillas().map((c) => Number(c.value))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('por defecto es de selección simple (radios) y solo deja elegir uno', async () => {
    const { casillas, marcados, pulsar, emitidos, el } = await crear({ mallaId: 3 });
    expect(casillas().every((c) => c.type === 'radio')).toBe(true);
    expect(el.querySelector('legend')?.textContent?.trim()).toBe('Nivel');

    await pulsar(3);
    await pulsar(5);
    expect(marcados()).toEqual([5]);
    expect(emitidos).toEqual([[3], [5]]);
  });

  it('en modo múltiple (casillas) emite los niveles ordenados', async () => {
    const { casillas, marcados, pulsar, emitidos, el } = await crear({
      mallaId: 3,
      multiple: true,
    });
    expect(casillas().every((c) => c.type === 'checkbox')).toBe(true);
    expect(el.querySelector('legend')?.textContent?.trim()).toBe('Niveles');

    await pulsar(2);
    await pulsar(5);
    await pulsar(1);
    expect(emitidos.at(-1)).toEqual([1, 2, 5]);

    await pulsar(2); // desmarcar
    expect(emitidos.at(-1)).toEqual([1, 5]);
    expect(marcados()).toEqual([1, 5]);
  });

  it('"Limpiar selección" deja todo sin marcar y emite una lista vacía', async () => {
    const { fixture, limpiar, pulsar, marcados, emitidos } = await crear({
      mallaId: 3,
      multiple: true,
    });
    expect(limpiar()).toBeUndefined();

    await pulsar(2);
    await pulsar(4);
    limpiar()!.click();
    await fixture.whenStable();
    expect(marcados()).toEqual([]);
    expect(emitidos.at(-1)).toEqual([]);
    expect(limpiar()).toBeUndefined();
  });

  it('al cambiar a una malla con menos niveles descarta los que ya no existen', async () => {
    const { pulsar, poner, emitidos, marcados } = await crear({ mallaId: 3, multiple: true });
    await pulsar(2);
    await pulsar(7);

    await poner('mallaId', 5); // la malla 5 solo tiene 3 niveles
    expect(marcados()).toEqual([2]);
    expect(emitidos.at(-1)).toEqual([2]);
  });

  it('al pasar de múltiple a simple se queda solo con el nivel menor', async () => {
    const { pulsar, poner, emitidos, marcados } = await crear({ mallaId: 3, multiple: true });
    await pulsar(6);
    await pulsar(2);

    await poner('multiple', false);
    expect(marcados()).toEqual([2]);
    expect(emitidos.at(-1)).toEqual([2]);
  });

  it('si la malla no tiene niveles lo avisa', async () => {
    const { el } = await crear({ mallaId: 99 });
    expect(el.textContent).toContain('Esta malla no tiene niveles.');
  });

  it('avisa si no se pudieron cargar los niveles', async () => {
    const { el, casillas } = await crear({ mallaId: 3 }, () =>
      throwError(() => new Error('falla')),
    );
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
    expect(casillas()).toHaveLength(0);
  });

  it('dos selectores en la misma página no comparten el grupo de radios', async () => {
    const { casillas } = await crear({ mallaId: 5 });
    const otro = TestBed.createComponent(SelectorNivelComponent);
    otro.componentRef.setInput('mallaId', 5);
    await otro.whenStable();
    const nombreOtro = (otro.nativeElement as HTMLElement).querySelector('input')!.name;
    expect(nombreOtro).not.toBe(casillas()[0].name);
  });
});