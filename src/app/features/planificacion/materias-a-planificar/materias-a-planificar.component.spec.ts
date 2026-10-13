import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import {
  ListadoMateriasAPlanificar,
  MateriaAPlanificar,
} from '../../../core/models/materia-a-planificar.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { MateriasAPlanificarComponent } from './materias-a-planificar.component';

describe('MateriasAPlanificarComponent', () => {
  const obtenerMateriasAPlanificar = vi.fn();

  const COMP = { id: 5, nombre: 'Ingeniería en Computación' };
  const IND = { id: 6, nombre: 'Ingeniería Industrial' };

  function item(
    id: number,
    codigo: string,
    nombre: string,
    responsable: { id: number; nombre: string },
    extra: Partial<MateriaAPlanificar>,
  ): MateriaAPlanificar {
    return {
      materia: {
        id,
        codigo,
        nombre,
        carreraResponsableId: responsable.id,
        carreraResponsable: responsable.nombre,
      },
      origen: 'PROPIA_EN_MALLA',
      nivel: 1,
      horasSemanales: 4,
      carrerasQueLaUsan: [],
      ...extra,
    };
  }

  /** Desordenado a propósito: el componente debe agrupar y ordenar. */
  function datos(): ListadoMateriasAPlanificar {
    return {
      carreraId: COMP.id,
      materias: [
        item(101, 'MAT-201', 'Cálculo Diferencial', IND, {
          origen: 'COMPARTIDA',
          nivel: 2,
          carrerasQueLaUsan: [IND.nombre, COMP.nombre],
        }),
        item(145, 'ICO-305', 'Programación Orientada a Objetos', COMP, {
          nivel: 3,
          horasSemanales: 6,
        }),
        item(160, 'ICO-520', 'Infraestructura y Plataformas', COMP, {
          origen: 'PROPIA_FUERA_DE_MALLA',
          nivel: null,
          horasSemanales: null,
        }),
        item(140, 'ICO-101', 'Introducción a la Computación', COMP, { nivel: 1 }),
      ],
    };
  }

  beforeEach(() => {
    obtenerMateriasAPlanificar.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: PlanificacionService, useValue: { obtenerMateriasAPlanificar } }],
    });
  });

  async function crear() {
    const fixture = TestBed.createComponent(MateriasAPlanificarComponent);
    fixture.componentRef.setInput('planificacionId', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const texto = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

  it('muestra carga mientras espera la respuesta', async () => {
    obtenerMateriasAPlanificar.mockReturnValue(new Subject<ListadoMateriasAPlanificar>());
    const fixture = await crear();
    expect(fixture.nativeElement.textContent).toContain('Cargando materias');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(obtenerMateriasAPlanificar).toHaveBeenCalledWith(1);
  });

  it('agrupa por origen, en orden, y ordena cada grupo por nivel', async () => {
    obtenerMateriasAPlanificar.mockReturnValue(of(datos()));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;

    const titulos = [...host.querySelectorAll('tbody th')].map((th) =>
      texto(th.querySelector('span')),
    );
    expect(titulos).toEqual([
      'De la malla vigente',
      'Responsable fuera de la malla',
      'Compartidas',
    ]);

    const codigosPropias = [
      ...host.querySelectorAll('tbody')[0].querySelectorAll('tr:not(.bg-muted)'),
    ].map((fila) => texto(fila.querySelector('td')));
    expect(codigosPropias).toEqual(['ICO-101', 'ICO-305']);
    expect(host.textContent).toContain('Materias en esta planificación: 4');
    expect(host.textContent).toContain('no se aperturan aquí');
  });

  it('marca como compartidas solo las de otra carrera responsable', async () => {
    obtenerMateriasAPlanificar.mockReturnValue(of(datos()));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;

    const indicadores = host.querySelectorAll('app-indicador-materia-compartida');
    expect(indicadores).toHaveLength(1);
    expect(texto(indicadores[0])).toContain('Responsable: Ingeniería Industrial');
    expect(texto(indicadores[0])).toContain('Ingeniería en Computación'); // tooltip con carreras
    expect(host.textContent?.match(/Tu carrera(?! es)/g)).toHaveLength(3);
  });

  it('indica que no aplica nivel ni horas para la materia fuera de la malla', async () => {
    obtenerMateriasAPlanificar.mockReturnValue(of(datos()));
    const fixture = await crear();
    const fila = [...fixture.nativeElement.querySelectorAll('tr')].find((tr) =>
      (tr as HTMLElement).textContent?.includes('ICO-520'),
    ) as HTMLElement;
    expect(fila.querySelectorAll('.sr-only')).toHaveLength(2);
    expect(fila.textContent).toContain('No aplica');
  });

  it('no muestra grupos sin materias', async () => {
    const soloPropias = datos();
    soloPropias.materias = soloPropias.materias.filter((m) => m.origen === 'PROPIA_EN_MALLA');
    obtenerMateriasAPlanificar.mockReturnValue(of(soloPropias));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('tbody')).toHaveLength(1);
    expect(host.textContent).not.toContain('Compartidas');
    expect(host.querySelector('app-indicador-materia-compartida')).toBeNull();
  });

  it('muestra el estado vacío cuando no hay materias', async () => {
    obtenerMateriasAPlanificar.mockReturnValue(of({ carreraId: 7, materias: [] }));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('app-estado-vacio')).not.toBeNull();
    expect(host.textContent).toContain('No hay materias para planificar');
    expect(host.querySelector('table')).toBeNull();
  });

  it('permite reintentar después de un error', async () => {
    obtenerMateriasAPlanificar
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValueOnce(of(datos()));
    const fixture = await crear();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cálculo Diferencial');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(obtenerMateriasAPlanificar).toHaveBeenCalledTimes(2);
  });

  it('descarta la respuesta de la planificación anterior cuando cambia la entrada', async () => {
    const anterior = new Subject<ListadoMateriasAPlanificar>();
    const actual = new Subject<ListadoMateriasAPlanificar>();
    obtenerMateriasAPlanificar.mockReturnValueOnce(anterior).mockReturnValueOnce(actual);
    const fixture = await crear();
    fixture.componentRef.setInput('planificacionId', 2);
    fixture.detectChanges();
    await fixture.whenStable();

    anterior.next(datos());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Cálculo Diferencial');

    actual.next({ carreraId: 6, materias: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay materias para planificar');
    expect(obtenerMateriasAPlanificar).toHaveBeenLastCalledWith(2);
  });
});
