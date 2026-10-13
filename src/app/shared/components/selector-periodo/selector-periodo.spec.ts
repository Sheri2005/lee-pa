import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PERIODOS_MOCK } from '../../mocks/periodos.mock';
import { Periodo } from '../../models/periodo.model';
import { PeriodoService } from '../../services/periodo.service';
import { SelectorPeriodoComponent } from './selector-periodo';

describe('SelectorPeriodoComponent', () => {
  async function crear(
    listar: () => unknown = () => of(PERIODOS_MOCK),
    entradas: { estados?: string[]; tipo?: string } = {},
  ) {
    await TestBed.configureTestingModule({
      imports: [SelectorPeriodoComponent],
      providers: [{ provide: PeriodoService, useValue: { listar } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SelectorPeriodoComponent);
    const emitidos: Periodo[] = [];
    fixture.componentInstance.periodoChange.subscribe((p) => emitidos.push(p));
    if (entradas.estados) fixture.componentRef.setInput('estados', entradas.estados);
    if (entradas.tipo) fixture.componentRef.setInput('tipo', entradas.tipo);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    const select = el.querySelector('select') as HTMLSelectElement;
    const opciones = () =>
      Array.from(select.querySelectorAll('option'))
        .filter((o) => o.value !== '')
        .map((o) => o.textContent?.replace(/\s+/g, ' ').trim());
    return { fixture, el, select, emitidos, opciones };
  }

  it('lista los períodos con código, nombre y tipo', async () => {
    const { opciones } = await crear();
    expect(opciones()).toHaveLength(PERIODOS_MOCK.length);
    expect(opciones()[1]).toBe('2026-2 · Segundo período ordinario 2026 (Ordinario)');
  });

  it('preselecciona el primer período en planificación o activo y lo emite completo', async () => {
    const { select, emitidos } = await crear();
    expect(select.value).toBe('9');
    expect(emitidos).toEqual([PERIODOS_MOCK[1]]);
    expect(emitidos[0].tipo).toBe('ORDINARIO');
  });

  it('filtra por estados', async () => {
    const { opciones, emitidos } = await crear(undefined, { estados: ['CERRADO'] });
    expect(opciones()).toEqual(['2026-1 · Primer período ordinario 2026 (Ordinario)']);
    expect(emitidos).toHaveLength(0);
  });

  it('filtra por tipo sin distinguir mayúsculas', async () => {
    const { opciones } = await crear(undefined, { tipo: 'extraordinario' });
    expect(opciones()).toEqual(['2026-E · Período extraordinario 2026 (Extraordinario)']);
  });

  it('emite el período completo cuando el usuario cambia la opción', async () => {
    const { fixture, select, emitidos } = await crear();
    select.value = '10';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(emitidos.at(-1)).toEqual(PERIODOS_MOCK[2]);
  });

  it('avisa si no se pudieron cargar y deshabilita el select', async () => {
    const { el, select } = await crear(() => throwError(() => new Error('falla')));
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
    expect(select.disabled).toBe(true);
  });

  it('usa ids distintos si hay dos selectores en la misma página', async () => {
    const { select } = await crear();
    const otro = TestBed.createComponent(SelectorPeriodoComponent);
    await otro.whenStable();
    expect((otro.nativeElement as HTMLElement).querySelector('select')!.id).not.toBe(select.id);
  });
});
