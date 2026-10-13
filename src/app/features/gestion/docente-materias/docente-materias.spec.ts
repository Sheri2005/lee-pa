import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MATERIAS_MOCK } from '../../../shared/mocks/materias.mock';
import { Materia } from '../../../shared/models/materia.model';
import { DocenteService } from '../../../shared/services/docente.service';
import { MateriaService } from '../../../shared/services/materia.service';
import { DocenteMateriasComponent } from './docente-materias';

describe('DocenteMateriasComponent', () => {
  /** Materias habilitadas de cada docente, por id de docente. */
  const HABILITADAS: Record<number, Materia[]> = {
    1: [MATERIAS_MOCK[0], MATERIAS_MOCK[1]], // MAT-101, MAT-102
    2: [MATERIAS_MOCK[2]], // FIS-101
  };

  async function crear(
    entradas: { docenteId?: number } = {},
    listarMaterias: (id: number) => unknown = (id) => of(HABILITADAS[id] ?? []),
  ) {
    const spy = vi.fn(listarMaterias);
    await TestBed.configureTestingModule({
      imports: [DocenteMateriasComponent],
      providers: [
        { provide: DocenteService, useValue: { listarMaterias: spy } },
        { provide: MateriaService, useValue: { listar: () => of(MATERIAS_MOCK) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DocenteMateriasComponent);
    const emitidos: Materia[][] = [];
    fixture.componentInstance.materiasChange.subscribe((m) => emitidos.push(m));
    if (entradas.docenteId != null) fixture.componentRef.setInput('docenteId', entradas.docenteId);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    const filas = () =>
      Array.from(el.querySelectorAll('ul > li')).map((li) =>
        li.querySelector('span')?.textContent?.replace(/\s+/g, ' ').trim(),
      );
    const codigos = () => filas().map((f) => f?.split(' · ')[0]);
    const campo = () => el.querySelector('app-selector-materia input') as HTMLInputElement;
    const agregar = async (busqueda: string) => {
      campo().focus();
      campo().value = busqueda;
      campo().dispatchEvent(new Event('input'));
      await fixture.whenStable();
      el.querySelector('[role="option"]')!.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true }),
      );
      await fixture.whenStable();
    };
    const quitar = async (codigo: string) => {
      (el.querySelector(`[aria-label="Quitar ${codigo}"]`) as HTMLButtonElement).click();
      await fixture.whenStable();
    };
    return { fixture, el, spy, emitidos, filas, codigos, campo, agregar, quitar };
  }

  it('sin docente (nuevo) arranca vacío y no pide materias', async () => {
    const { el, spy } = await crear();
    expect(el.textContent).toContain('Este docente todavía no tiene materias habilitadas.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('con docenteId pide sus materias y las lista con la carrera responsable', async () => {
    const { spy, codigos, filas } = await crear({ docenteId: 1 });
    expect(spy).toHaveBeenCalledWith(1);
    expect(codigos()).toEqual(['MAT-101', 'MAT-102']);
    expect(filas()[0]).toBe('MAT-101 · Cálculo I Ingeniería en Computación');
  });

  it('no emite nada al cargar las materias del docente', async () => {
    const { emitidos } = await crear({ docenteId: 1 });
    expect(emitidos).toHaveLength(0);
  });

  it('agrega una materia con el autocompletar, emite la lista y vacía el campo', async () => {
    const { codigos, agregar, campo, emitidos } = await crear({ docenteId: 2 });
    await agregar('prg');

    expect(codigos()).toEqual(['FIS-101', 'PRG-201']);
    expect(emitidos).toHaveLength(1);
    expect(emitidos[0].map((m) => m.codigo)).toEqual(['FIS-101', 'PRG-201']);
    expect(campo().value).toBe('');
  });

  it('mantiene la lista ordenada por código', async () => {
    const { codigos, agregar } = await crear({ docenteId: 2 });
    await agregar('est');
    await agregar('mat-101');
    expect(codigos()).toEqual(['EST-201', 'FIS-101', 'MAT-101']);
  });

  it('no repite una materia que ya está: avisa y no emite', async () => {
    const { el, codigos, agregar, emitidos } = await crear({ docenteId: 1 });
    await agregar('mat-101');

    expect(codigos()).toEqual(['MAT-101', 'MAT-102']);
    expect(emitidos).toHaveLength(0);
    expect(el.querySelector('[role="status"]')?.textContent).toContain(
      'MAT-101 ya está en la lista.',
    );
  });

  it('quita una materia y emite la lista sin ella', async () => {
    const { codigos, quitar, emitidos } = await crear({ docenteId: 1 });
    await quitar('MAT-101');

    expect(codigos()).toEqual(['MAT-102']);
    expect(emitidos.at(-1)?.map((m) => m.codigo)).toEqual(['MAT-102']);
  });

  it('al quitar la última materia vuelve a mostrar el aviso de lista vacía', async () => {
    const { el, quitar, emitidos } = await crear({ docenteId: 2 });
    await quitar('FIS-101');

    expect(el.querySelector('ul')).toBeNull();
    expect(el.textContent).toContain('Este docente todavía no tiene materias habilitadas.');
    expect(emitidos.at(-1)).toEqual([]);
  });

  it('al cambiar de docente recarga la lista y descarta los cambios sin guardar', async () => {
    const { fixture, codigos, agregar, spy } = await crear({ docenteId: 1 });
    await agregar('prg');
    expect(codigos()).toContain('PRG-201');

    fixture.componentRef.setInput('docenteId', 2);
    await fixture.whenStable();
    expect(spy).toHaveBeenLastCalledWith(2);
    expect(codigos()).toEqual(['FIS-101']);
  });

  it('avisa si no se pudieron cargar las materias del docente', async () => {
    const { el } = await crear({ docenteId: 1 }, () => throwError(() => new Error('falla')));
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar las materias del docente',
    );
  });
});