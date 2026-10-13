import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarraFiltrosComponent } from './barra-filtros';

@Component({
  imports: [BarraFiltrosComponent],
  template: `
    <app-barra-filtros
      [filtrosActivos]="activos"
      (buscar)="busquedas = busquedas + 1"
      (limpiar)="limpiezas = limpiezas + 1"
    >
      <label>Nombre <input id="filtro-nombre" type="text" /></label>
    </app-barra-filtros>
  `,
})
class Anfitrion {
  activos = 0;
  busquedas = 0;
  limpiezas = 0;
}

@Component({
  imports: [BarraFiltrosComponent],
  template: `<app-barra-filtros [accionesAbajo]="true"><input /></app-barra-filtros>`,
})
class AnfitrionAccionesAbajo {}

describe('BarraFiltrosComponent', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let anfitrion: Anfitrion;
  let elemento: HTMLElement;

  const boton = (texto: string) =>
    [...elemento.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.trim() === texto,
    )!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitrion] }).compileComponents();
    fixture = TestBed.createComponent(Anfitrion);
    anfitrion = fixture.componentInstance;
    elemento = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('proyecta los filtros recibidos', () => {
    expect(elemento.querySelector('#filtro-nombre')).toBeTruthy();
  });

  it('emite buscar al pulsar Buscar', () => {
    boton('Buscar').click();
    expect(anfitrion.busquedas).toBe(1);
    expect(anfitrion.limpiezas).toBe(0);
  });

  it('emite buscar al enviar el formulario con Enter', () => {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(anfitrion.busquedas).toBe(1);
  });

  it('emite limpiar al pulsar Limpiar sin disparar buscar', () => {
    boton('Limpiar').click();
    expect(anfitrion.limpiezas).toBe(1);
    expect(anfitrion.busquedas).toBe(0);
  });

  it('muestra el contador solo cuando hay filtros activos', () => {
    expect(elemento.textContent).not.toContain('activo');
    anfitrion.activos = 2;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(elemento.textContent).toContain('2 activos');
  });

  it('en móvil empieza plegada y se despliega con el botón Mostrar', () => {
    const alternar = boton('Mostrar');
    const campos = elemento.querySelector<HTMLElement>(
      `#${alternar.getAttribute('aria-controls')}`,
    )!;

    expect(alternar.getAttribute('aria-expanded')).toBe('false');
    expect(campos.classList).toContain('hidden');
    expect(campos.classList).toContain('md:flex');

    alternar.click();
    fixture.detectChanges();

    expect(alternar.getAttribute('aria-expanded')).toBe('true');
    expect(alternar.textContent).toContain('Ocultar');
    expect(campos.classList).not.toContain('hidden');
    expect(campos.classList).toContain('flex');
  });

  it('plegar o desplegar no emite buscar ni limpiar', () => {
    boton('Mostrar').click();
    expect(anfitrion.busquedas).toBe(0);
    expect(anfitrion.limpiezas).toBe(0);
  });

  it('con accionesAbajo pone los botones en una fila propia abajo', async () => {
    const abajo = TestBed.createComponent(AnfitrionAccionesAbajo);
    abajo.detectChanges();
    const buscar = [...(abajo.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Buscar',
    )!;

    expect(buscar.parentElement!.classList).toContain('w-full');
    expect(buscar.parentElement!.classList).toContain('border-t');
    expect(boton('Buscar').parentElement!.classList).not.toContain('w-full');
  });
});
