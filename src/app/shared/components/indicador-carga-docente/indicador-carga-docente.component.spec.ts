import { TestBed } from '@angular/core/testing';
import { IndicadorCargaDocenteComponent } from './indicador-carga-docente.component';

describe('IndicadorCargaDocenteComponent', () => {
  function crear(asignadas: number, maxima: number) {
    const fixture = TestBed.createComponent(IndicadorCargaDocenteComponent);
    fixture.componentRef.setInput('asignadas', asignadas);
    fixture.componentRef.setInput('maxima', maxima);
    fixture.detectChanges();
    return fixture;
  }

  it.each([
    [0, 24, '0%', 'Disponibles: 24 h.'],
    [18, 24, '75%', 'Disponibles: 6 h.'],
    [7.5, 15, '50%', 'Disponibles: 7,5 h.'],
  ])('muestra la carga %s / %s y las horas disponibles', (asignadas, maxima, ancho, mensaje) => {
    const host: HTMLElement = crear(asignadas, maxima).nativeElement;
    const barra = host.querySelector<HTMLElement>('[role="progressbar"] > div')!;
    expect(barra.style.width).toBe(ancho);
    expect(barra.classList.contains('bg-emerald-600')).toBe(true);
    expect(host.textContent).toContain(mensaje);
  });

  it('marca el máximo exacto sin confundirlo con una sobrecarga', () => {
    const host: HTMLElement = crear(24, 24).nativeElement;
    const barra = host.querySelector<HTMLElement>('[role="progressbar"] > div')!;
    expect(barra.style.width).toBe('100%');
    expect(barra.classList.contains('bg-amber-500')).toBe(true);
    expect(barra.classList.contains('bg-red-600')).toBe(false);
    expect(host.textContent).toContain('Carga máxima alcanzada.');
  });

  it('conserva la sobrecarga real y limita la barra y su valor ARIA al 100 %', () => {
    const host: HTMLElement = crear(30, 24).nativeElement;
    const progreso = host.querySelector<HTMLElement>('[role="progressbar"]')!;
    const barra = progreso.firstElementChild as HTMLElement;
    expect(host.textContent).toContain('30 / 24 h');
    expect(host.textContent).toContain('125 %');
    expect(host.textContent).toContain('Sobrecarga: 6 h por encima del máximo.');
    expect(barra.style.width).toBe('100%');
    expect(barra.classList.contains('bg-red-600')).toBe(true);
    expect(progreso.getAttribute('aria-valuenow')).toBe('100');
    expect(progreso.getAttribute('aria-valuemax')).toBe('100');
    expect(progreso.getAttribute('aria-valuetext')).toContain('125 por ciento');
    expect(progreso.getAttribute('aria-valuetext')).toContain('Sobrecarga: 6 h');
  });

  it.each([
    [6, 0],
    [0, 0],
    [6, -24],
    [-2, 24],
    [NaN, 24],
    [6, NaN],
    [Infinity, 24],
    [6, Infinity],
    [Number.MAX_VALUE, Number.MIN_VALUE],
  ])('no presenta datos inválidos (%s / %s) como una carga válida', (asignadas, maxima) => {
    const host: HTMLElement = crear(asignadas, maxima).nativeElement;
    expect(host.querySelector('[role="progressbar"]')).toBeNull();
    expect(host.textContent).toContain('Ingresa horas asignadas válidas');
    expect(host.textContent).not.toContain('NaN');
    expect(host.textContent).not.toContain('Infinity');
    expect(host.textContent).not.toContain('Disponibles:');
  });

  it('actualiza ancho, color y texto cuando el padre cambia ambas entradas', () => {
    const fixture = crear(18, 24);
    const host: HTMLElement = fixture.nativeElement;

    fixture.componentRef.setInput('asignadas', 30);
    fixture.detectChanges();
    expect(host.textContent).toContain('Sobrecarga: 6 h');
    expect(host.querySelector('.bg-red-600')).not.toBeNull();

    fixture.componentRef.setInput('maxima', 40);
    fixture.detectChanges();
    expect(host.textContent).toContain('Disponibles: 10 h.');
    expect(host.querySelector('.bg-red-600')).toBeNull();
    expect(host.querySelector('.bg-emerald-600')).not.toBeNull();
    expect(host.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('75');

    fixture.componentRef.setInput('maxima', 0);
    fixture.detectChanges();
    expect(host.querySelector('[role="progressbar"]')).toBeNull();

    fixture.componentRef.setInput('maxima', 30);
    fixture.detectChanges();
    expect(host.textContent).toContain('Carga máxima alcanzada.');
    expect(host.querySelector('.bg-amber-500')).not.toBeNull();
  });
});
