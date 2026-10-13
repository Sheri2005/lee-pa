import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CampoFechaComponent, fechaCorta, leerFecha, nombreMes } from './campo-fecha';

describe('CampoFechaComponent', () => {
  let fixture: ComponentFixture<CampoFechaComponent>;
  let raiz: HTMLElement;
  let valores: string[];

  const campo = () => raiz.querySelector('input')!;
  const abrir = () => {
    raiz.querySelector<HTMLButtonElement>('button[aria-haspopup]')!.click();
    fixture.detectChanges();
  };
  const dia = (iso: string) =>
    raiz.querySelector<HTMLButtonElement>(`button[data-fecha="${iso}"]`)!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CampoFechaComponent] }).compileComponents();
    fixture = TestBed.createComponent(CampoFechaComponent);
    fixture.componentRef.setInput('idCampo', 'prueba');
    fixture.componentRef.setInput('fechaHoy', '2026-10-01');
    valores = [];
    fixture.componentInstance.valor.subscribe((v) => valores.push(v));
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('muestra la fecha en formato dd/mm/aaaa', () => {
    fixture.componentRef.setInput('valor', '2026-11-16');
    fixture.detectChanges();

    expect(campo().value).toBe('16/11/2026');
    expect(campo().placeholder).toBe('dd/mm/aaaa');
  });

  it('abre un calendario de lunes a domingo en el mes de hoy y elige un día', () => {
    abrir();

    expect(raiz.querySelector('[role="dialog"]')?.textContent).toContain('Octubre 2026');
    expect(raiz.textContent).toContain('Lu');
    expect(dia('2026-10-01').getAttribute('aria-current')).toBe('date');

    dia('2026-10-15').click();
    fixture.detectChanges();

    expect(valores).toEqual(['2026-10-15']);
    expect(campo().value).toBe('15/10/2026');
    expect(raiz.querySelector('[role="dialog"]')).toBeNull();
  });

  it('desactiva los días fuera de los límites', () => {
    fixture.componentRef.setInput('min', '2026-10-10');
    fixture.componentRef.setInput('max', '2026-10-20');
    abrir();

    expect(dia('2026-10-09').disabled).toBe(true);
    expect(dia('2026-10-21').disabled).toBe(true);
    expect(dia('2026-10-15').disabled).toBe(false);
  });

  it('cambia de mes con las flechas', () => {
    abrir();
    raiz.querySelector<HTMLButtonElement>('button[aria-label="Mes siguiente"]')!.click();
    fixture.detectChanges();

    expect(raiz.querySelector('[role="dialog"]')?.textContent).toContain('Noviembre 2026');
  });

  it('acepta fechas escritas a mano', () => {
    campo().value = '5/1/2027';
    campo().dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(valores).toEqual(['2027-01-05']);
  });

  it('interpreta y formatea fechas', () => {
    expect(leerFecha('16/11/2026')).toBe('2026-11-16');
    expect(leerFecha('2026-11-16')).toBe('2026-11-16');
    expect(leerFecha('31/02/2026')).toBeNull();
    expect(leerFecha('')).toBe('');
    expect(fechaCorta('2026-01-05')).toBe('05/01/2026');
    expect(nombreMes('2026-03')).toBe('Marzo 2026');
  });

  it('marca la otra punta del rango y los días intermedios', () => {
    fixture.componentRef.setInput('valor', '2026-10-20');
    fixture.componentRef.setInput('otroExtremo', '2026-10-15');
    fixture.componentRef.setInput('nombreExtremo', 'Desde');
    abrir();

    expect(dia('2026-10-15').classList).toContain('ring-primary/50');
    expect(dia('2026-10-17').classList).toContain('bg-muted');
    expect(dia('2026-10-22').classList).not.toContain('bg-muted');
    expect(raiz.textContent).toContain('Desde 15/10/2026');
  });

  it('puede desactivar los fines de semana', () => {
    fixture.componentRef.setInput('sinFinesDeSemana', true);
    abrir();

    expect(dia('2026-10-03').disabled).toBe(true);
    expect(dia('2026-10-04').disabled).toBe(true);
    expect(dia('2026-10-05').disabled).toBe(false);
  });

  describe('ubicación del calendario', () => {
    const panel = () => raiz.querySelector<HTMLElement>('[role="dialog"]')!;
    const simular = (campo: Partial<DOMRect>, ventana: { ancho: number; alto: number }) => {
      vi.spyOn(raiz, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        bottom: 0,
        ...campo,
      } as DOMRect);
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(ventana.ancho);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(ventana.alto);
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(304);
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(360);
    };

    afterEach(() => vi.restoreAllMocks());

    it('se desplaza a la izquierda si desbordaría la ventana por la derecha', async () => {
      simular({ left: 200, top: 100, bottom: 144 }, { ancho: 390, alto: 800 });
      abrir();
      await fixture.whenStable();
      fixture.detectChanges();

      // 200 + 304 − (390 − 8) = 122 px de desborde.
      expect(panel().style.left).toBe('-122px');
      expect(panel().classList).toContain('top-full');
    });

    it('nunca se sale por la izquierda en un contenedor estrecho', async () => {
      simular({ left: 16, top: 100, bottom: 144 }, { ancho: 320, alto: 800 });
      abrir();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(panel().style.left).toBe('-8px');
    });

    it('se abre hacia arriba si no cabe debajo', async () => {
      simular({ left: 16, top: 600, bottom: 644 }, { ancho: 1280, alto: 760 });
      abrir();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(panel().style.left).toBe('0px');
      expect(panel().classList).toContain('bottom-full');
    });
  });
});
