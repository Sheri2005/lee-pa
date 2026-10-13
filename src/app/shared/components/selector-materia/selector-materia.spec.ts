import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MATERIAS_MOCK } from '../../mocks/materias.mock';
import { Materia } from '../../models/materia.model';
import { MateriaService } from '../../services/materia.service';
import { SelectorMateriaComponent } from './selector-materia';

describe('SelectorMateriaComponent', () => {
  async function crear(
    listar: (filtros: unknown) => unknown = () => of(MATERIAS_MOCK),
    entradas: { carreraResponsableId?: number; mallaId?: number } = {},
  ) {
    await TestBed.configureTestingModule({
      imports: [SelectorMateriaComponent],
      providers: [{ provide: MateriaService, useValue: { listar } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SelectorMateriaComponent);
    const emitidas: Materia[] = [];
    fixture.componentInstance.materiaChange.subscribe((m) => emitidas.push(m));
    if (entradas.carreraResponsableId != null) {
      fixture.componentRef.setInput('carreraResponsableId', entradas.carreraResponsableId);
    }
    if (entradas.mallaId != null) fixture.componentRef.setInput('mallaId', entradas.mallaId);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    const entrada = el.querySelector('input') as HTMLInputElement;

    const escribir = async (texto: string) => {
      entrada.focus();
      entrada.value = texto;
      entrada.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const tecla = async (key: string) => {
      entrada.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
      await fixture.whenStable();
    };
    const opciones = () =>
      Array.from(el.querySelectorAll('[role="option"]')).map((o) =>
        o.textContent?.replace(/\s+/g, ' ').trim(),
      );
    return { fixture, el, entrada, emitidas, escribir, tecla, opciones };
  }

  it('busca por código', async () => {
    const { escribir, opciones } = await crear();
    await escribir('prg');
    expect(opciones()).toEqual([
      'PRG-201 · Programación Orientada a Objetos Ingeniería en Computación',
    ]);
  });

  it('busca por nombre sin distinguir tildes ni mayúsculas', async () => {
    const { escribir, opciones } = await crear();
    await escribir('CALCULO');
    expect(opciones()).toHaveLength(2);
    expect(opciones()[0]).toContain('Cálculo I');
  });

  it('muestra la carrera responsable junto al nombre', async () => {
    const { escribir, el } = await crear();
    await escribir('taller');
    expect(el.querySelector('[role="option"]')?.textContent).toContain('Arquitectura');
  });

  it('emite la materia completa al elegir con el mouse y deja su texto en el campo', async () => {
    const { fixture, escribir, el, entrada, emitidas } = await crear();
    await escribir('fis');
    el.querySelector('[role="option"]')!.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await fixture.whenStable();
    expect(emitidas).toEqual([MATERIAS_MOCK[2]]);
    expect(entrada.value).toBe('FIS-101 · Física I');
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

    it('limpiar() vacía el campo y cierra la lista sin emitir', async () => {
    const { fixture, escribir, el, entrada, emitidas } = await crear();
    await escribir('fis');
    el.querySelector('[role="option"]')!.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await fixture.whenStable();
    expect(entrada.value).toBe('FIS-101 · Física I');

    fixture.componentInstance.limpiar();
    await fixture.whenStable();
    expect(entrada.value).toBe('');
    expect(emitidas).toHaveLength(1); // solo la emisión de cuando se eligió
  });

  it('funciona con teclado: flecha abajo y Enter', async () => {
    const { escribir, tecla, emitidas } = await crear();
    await escribir('calculo');
    await tecla('ArrowDown');
    await tecla('Enter');
    expect(emitidas).toEqual([MATERIAS_MOCK[1]]);
  });

  it('Escape cierra la lista', async () => {
    const { escribir, tecla, el } = await crear();
    await escribir('mat');
    expect(el.querySelector('[role="listbox"]')).not.toBeNull();
    await tecla('Escape');
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  it('pasa la carrera responsable y la malla al servicio', async () => {
    const listar = vi.fn(() => of(MATERIAS_MOCK));
    await crear(listar, { carreraResponsableId: 5, mallaId: 3 });
    expect(listar).toHaveBeenCalledWith({ carreraResponsableId: 5, mallaId: 3 });
  });

  it('avisa si no se pudieron cargar las materias', async () => {
    const { el } = await crear(() => throwError(() => new Error('falla')));
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
  });
});
