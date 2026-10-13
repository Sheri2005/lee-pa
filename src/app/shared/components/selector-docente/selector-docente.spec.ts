import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DOCENTES_MOCK } from '../../mocks/docentes.mock';
import { Docente } from '../../models/docente.model';
import { DocenteService, FiltrosDocente } from '../../services/docente.service';
import { SelectorDocenteComponent } from './selector-docente';

describe('SelectorDocenteComponent', () => {
  /** Servicio falso que aplica el filtro por materia, como el real. */
  const listarConFiltro = (filtros: FiltrosDocente) =>
    of(
      DOCENTES_MOCK.filter(
        (d) => filtros.materiaId == null || d.materiaIds.includes(filtros.materiaId),
      ),
    );

  async function crear(
    listar: (filtros: FiltrosDocente) => unknown = listarConFiltro,
    entradas: { materiaId?: number } = {},
  ) {
    await TestBed.configureTestingModule({
      imports: [SelectorDocenteComponent],
      providers: [{ provide: DocenteService, useValue: { listar } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SelectorDocenteComponent);
    const emitidos: Docente[] = [];
    fixture.componentInstance.docenteChange.subscribe((d) => emitidos.push(d));
    if (entradas.materiaId != null) fixture.componentRef.setInput('materiaId', entradas.materiaId);
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
    return { fixture, el, entrada, emitidos, escribir, tecla, opciones };
  }

  it('busca por nombre sin distinguir tildes ni mayúsculas', async () => {
    const { escribir, opciones } = await crear();
    await escribir('SOFIA');
    expect(opciones()).toEqual(['Delgado Ponce Sofía 0912345705 · Carga máx.: 20 h']);
  });

  it('busca por identificación', async () => {
    const { escribir, opciones } = await crear();
    await escribir('0912345697');
    expect(opciones()).toEqual(['Cedeño Loor Pablo 0912345697 · Carga máx.: 12 h']);
  });

  it('acepta varias palabras en cualquier orden', async () => {
    const { escribir, opciones } = await crear();
    await escribir('luis andrade');
    expect(opciones()).toEqual(['Andrade Mora Luis 0912345671 · Carga máx.: 20 h']);
  });

  it('muestra la identificación y la carga máxima de cada docente', async () => {
    const { escribir, el } = await crear();
    await escribir('espinoza');
    const texto = el.querySelector('[role="option"]')?.textContent ?? '';
    expect(texto).toContain('0912345713');
    expect(texto).toContain('Carga máx.: 8 h');
  });

  it('emite el docente completo al elegir con el mouse y deja su nombre en el campo', async () => {
    const { fixture, escribir, el, entrada, emitidos } = await crear();
    await escribir('franco');
    el.querySelector('[role="option"]')!.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await fixture.whenStable();
    expect(emitidos).toEqual([DOCENTES_MOCK[5]]);
    expect(entrada.value).toBe('Franco Zambrano Elena');
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  it('funciona con teclado: flecha abajo y Enter', async () => {
    const { escribir, tecla, emitidos } = await crear();
    await escribir('a'); // casi todos los nombres tienen una "a"
    await tecla('ArrowDown'); // pasa del primero (Andrade) al segundo (Bravo)
    await tecla('Enter');
    expect(emitidos).toEqual([DOCENTES_MOCK[1]]);
  });

  it('Escape cierra la lista', async () => {
    const { escribir, tecla, el } = await crear();
    await escribir('a');
    expect(el.querySelector('[role="listbox"]')).not.toBeNull();
    await tecla('Escape');
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  it('con materiaId solo ofrece a los docentes habilitados para esa materia', async () => {
    const listar = vi.fn(listarConFiltro);
    const { escribir, opciones } = await crear(listar, { materiaId: 4 });
    expect(listar).toHaveBeenCalledWith({ materiaId: 4 });
    await escribir('');
    expect(opciones().map((o) => o?.split(' 09')[0])).toEqual([
      'Cedeño Loor Pablo',
      'Delgado Ponce Sofía',
    ]);
  });

  it('avisa cuando no hay docentes habilitados para la materia', async () => {
    const { escribir, el } = await crear(listarConFiltro, { materiaId: 999 });
    await escribir('a');
    expect(el.textContent).toContain('No hay docentes habilitados para esta materia.');
  });

  it('avisa cuando nada coincide con lo escrito', async () => {
    const { escribir, el } = await crear();
    await escribir('zzzz');
    expect(el.textContent).toContain('No hay docentes que coincidan.');
  });

  it('al cambiar a una materia en la que el docente no está habilitado, limpia el campo', async () => {
    const { fixture, escribir, el, entrada } = await crear(listarConFiltro, { materiaId: 4 });
    await escribir('cedeño');
    el.querySelector('[role="option"]')!.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    );
    await fixture.whenStable();
    expect(entrada.value).toBe('Cedeño Loor Pablo');

    fixture.componentRef.setInput('materiaId', 6); // solo Espinoza está habilitado
    await fixture.whenStable();
    expect(entrada.value).toBe('');
  });

  it('avisa si no se pudieron cargar los docentes', async () => {
    const { el } = await crear(() => throwError(() => new Error('falla')));
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar los docentes',
    );
  });

  it('dos selectores en la misma página usan ids distintos', async () => {
    const { entrada } = await crear();
    const otro = TestBed.createComponent(SelectorDocenteComponent);
    await otro.whenStable();
    expect((otro.nativeElement as HTMLElement).querySelector('input')!.id).not.toBe(entrada.id);
  });
});