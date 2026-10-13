import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampoHoraComponent, leerHora } from './campo-hora';

describe('CampoHoraComponent', () => {
  let fixture: ComponentFixture<CampoHoraComponent>;
  let raiz: HTMLElement;
  let valores: string[];

  const campo = () => raiz.querySelector('input')!;
  const opciones = () => [...raiz.querySelectorAll<HTMLButtonElement>('[role="option"]')];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CampoHoraComponent] }).compileComponents();
    fixture = TestBed.createComponent(CampoHoraComponent);
    fixture.componentRef.setInput('idCampo', 'prueba');
    fixture.componentRef.setInput('min', '07:00');
    fixture.componentRef.setInput('max', '21:00');
    valores = [];
    fixture.componentInstance.valor.subscribe((v) => valores.push(v));
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('ofrece horas de 24 horas cada 15 minutos dentro de los límites', () => {
    raiz.querySelector<HTMLButtonElement>('button[aria-haspopup]')!.click();
    fixture.detectChanges();

    const textos = opciones().map((o) => o.textContent!.trim());
    expect(textos[0]).toBe('07:00');
    expect(textos).toContain('14:30');
    expect(textos.at(-1)).toBe('21:00');
    expect(textos.some((t) => /AM|PM/.test(t))).toBe(false);
  });

  it('elige una hora de la lista', () => {
    raiz.querySelector<HTMLButtonElement>('button[aria-haspopup]')!.click();
    fixture.detectChanges();
    opciones()
      .find((o) => o.textContent!.trim() === '16:45')!
      .click();
    fixture.detectChanges();

    expect(valores).toEqual(['16:45']);
    expect(campo().value).toBe('16:45');
    expect(raiz.querySelector('[role="listbox"]')).toBeNull();
  });

  it('completa horas abreviadas al salir del campo', () => {
    campo().value = '930';
    campo().dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(valores).toEqual(['09:30']);
    expect(campo().value).toBe('09:30');
  });

  it('mientras se escribe no interpreta horas a medias', () => {
    campo().value = '143';
    campo().dispatchEvent(new Event('input'));

    expect(valores).toEqual([]);
  });

  it('interpreta horas en formato de 24 horas', () => {
    expect(leerHora('9:30')).toBe('09:30');
    expect(leerHora('1430')).toBe('14:30');
    expect(leerHora('23:59')).toBe('23:59');
    expect(leerHora('24:00')).toBeNull();
    expect(leerHora('')).toBe('');
  });
});
