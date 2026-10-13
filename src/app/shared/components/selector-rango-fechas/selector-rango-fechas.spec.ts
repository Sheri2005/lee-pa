import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RangoFechas } from './rango-fechas';
import { SelectorRangoFechasComponent } from './selector-rango-fechas';

describe('SelectorRangoFechasComponent (C4-05)', () => {
  let fixture: ComponentFixture<SelectorRangoFechasComponent>;
  let emitidos: RangoFechas[];
  let raiz: HTMLElement;

  const periodos = [
    { id: 2, nombre: 'Ordinario II 2026', desde: '2026-09-01', hasta: '2026-12-19' },
    { id: 1, nombre: 'Ordinario I 2026', desde: '2026-04-27', hasta: '2026-08-15' },
  ];

  const boton = (texto: string) =>
    [...raiz.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto)!;
  const inputs = () =>
    raiz.querySelectorAll<HTMLInputElement>('input[name="desde"], input[name="hasta"]');
  const cambiar = (el: HTMLInputElement, valor: string) => {
    el.value = valor;
    el.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorRangoFechasComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SelectorRangoFechasComponent);
    fixture.componentRef.setInput('fechaReferencia', '2026-10-01');
    emitidos = [];
    fixture.componentInstance.rangoChange.subscribe((r) => emitidos.push(r));
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('aplica "Esta semana" (lunes a sábado) y lo marca como activo', () => {
    boton('Esta semana').click();
    fixture.detectChanges();

    expect(emitidos).toEqual([{ desde: '2026-09-28', hasta: '2026-10-03' }]);
    expect(inputs()[0].value).toBe('28/09/2026');
    expect(inputs()[1].value).toBe('03/10/2026');
    expect(boton('Esta semana').getAttribute('aria-pressed')).toBe('true');
    expect(boton('Este mes').getAttribute('aria-pressed')).toBe('false');
    expect(raiz.textContent).toContain('6 días');
  });

  it('aplica "Este mes"', () => {
    boton('Este mes').click();
    expect(emitidos).toEqual([{ desde: '2026-10-01', hasta: '2026-10-31' }]);
  });

  it('oculta el atajo de período si no recibe períodos', () => {
    expect(raiz.querySelector('app-campo-seleccion')).toBeNull();
  });

  it('aplica un período elegido de la lista', () => {
    fixture.componentRef.setInput('periodos', periodos);
    fixture.detectChanges();

    raiz.querySelector<HTMLButtonElement>('app-campo-seleccion button')!.click();
    fixture.detectChanges();
    raiz.querySelector<HTMLElement>('[role="option"][data-valor="2"]')!.click();
    fixture.detectChanges();

    expect(emitidos).toEqual([{ desde: '2026-09-01', hasta: '2026-12-19' }]);
    expect(raiz.querySelector('app-campo-seleccion button')!.textContent).toContain(
      'Ordinario II 2026',
    );
  });

  it('emite al completar las fechas a mano y no emite rangos inválidos', () => {
    cambiar(inputs()[0], '2026-10-10');
    expect(emitidos).toEqual([]);

    cambiar(inputs()[1], '2026-10-05');
    expect(emitidos).toEqual([]);
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('posterior');
    expect(inputs()[1].getAttribute('aria-invalid')).toBe('true');

    cambiar(inputs()[1], '2026-10-12');
    expect(emitidos).toEqual([{ desde: '2026-10-10', hasta: '2026-10-12' }]);
    expect(raiz.querySelector('[role="alert"]')).toBeNull();
  });

  it('toma los valores iniciales de las entradas desde y hasta', () => {
    fixture.componentRef.setInput('desde', '2026-11-02');
    fixture.componentRef.setInput('hasta', '2026-11-07');
    fixture.detectChanges();

    expect(inputs()[0].value).toBe('02/11/2026');
    expect(inputs()[1].value).toBe('07/11/2026');
    expect(emitidos).toEqual([]);
  });

  it('puede ocultar el resumen del rango', () => {
    boton('Este mes').click();
    fixture.detectChanges();
    expect(raiz.textContent).toContain('31 días');

    fixture.componentRef.setInput('mostrarResumen', false);
    fixture.detectChanges();
    expect(raiz.textContent).not.toContain('31 días');
  });

  it('respeta la fecha mínima', () => {
    fixture.componentRef.setInput('fechaMin', '2026-10-10');
    cambiar(inputs()[0], '2026-10-05');
    cambiar(inputs()[1], '2026-10-20');

    expect(emitidos).toEqual([]);
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('igual o posterior');
  });

  it('marca en rojo solo el extremo que causa el error', () => {
    cambiar(inputs()[1], '2026-10-05');
    cambiar(inputs()[0], '2026-10-10');

    expect(inputs()[0].getAttribute('aria-invalid')).toBe('true');
    expect(inputs()[1].getAttribute('aria-invalid')).toBe('false');
    expect(inputs()[0].getAttribute('aria-describedby')).toContain('-error');
    expect(inputs()[1].getAttribute('aria-describedby')).toBeNull();
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('anterior a la final');
  });

  it('avisa de una fecha mal escrita aunque el otro extremo esté vacío', () => {
    cambiar(inputs()[0], '31/02/2026');

    expect(inputs()[0].getAttribute('aria-invalid')).toBe('true');
    expect(inputs()[1].getAttribute('aria-invalid')).toBe('false');
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('fecha válida');
  });

  it('con la fecha mínima marca solo "Desde"', () => {
    fixture.componentRef.setInput('fechaMin', '2026-10-10');
    cambiar(inputs()[0], '2026-10-05');
    cambiar(inputs()[1], '2026-10-20');

    expect(inputs()[0].getAttribute('aria-invalid')).toBe('true');
    expect(inputs()[1].getAttribute('aria-invalid')).toBe('false');
  });

  it('el padre puede precargar y limpiar el rango sin que quede un error', () => {
    fixture.componentRef.setInput('desde', '2026-11-10');
    fixture.componentRef.setInput('hasta', '2026-11-02');
    fixture.detectChanges();
    expect(raiz.querySelector('[role="alert"]')).not.toBeNull();

    fixture.componentRef.setInput('desde', '');
    fixture.componentRef.setInput('hasta', '');
    fixture.detectChanges();

    expect(inputs()[0].value).toBe('');
    expect(inputs()[1].value).toBe('');
    expect(raiz.querySelector('[role="alert"]')).toBeNull();
    expect(emitidos).toEqual([]);
  });

  it('se adapta al ancho de su contenedor, no al de la ventana', () => {
    const grupo = raiz.querySelector('[role="group"]')!;
    expect(grupo.classList).toContain('@container');
    expect(raiz.querySelector('.grid')!.className).not.toMatch(/(^|\s)(sm|lg):grid-cols/);
  });
});
