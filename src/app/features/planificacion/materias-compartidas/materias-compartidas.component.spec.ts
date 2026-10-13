import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import {
  ListadoMateriasCompartidas,
  MateriaCompartida,
} from '../../../core/models/materia-compartida.model';
import { SolicitudCupoService } from '../../../core/services/solicitud-cupo.service';
import { MateriasCompartidasComponent } from './materias-compartidas.component';

describe('MateriasCompartidasComponent', () => {
  const listarMateriasCompartidas = vi.fn();
  const solicitarCupos = vi.fn();

  const COMP = { id: 5, nombre: 'Ingeniería en Computación' };
  const IND = { id: 6, nombre: 'Ingeniería Industrial' };

  function compartida(
    id: number,
    codigo: string,
    nombre: string,
    extra: Partial<MateriaCompartida> = {},
  ): MateriaCompartida {
    return {
      materia: {
        id,
        codigo,
        nombre,
        carreraResponsableId: IND.id,
        carreraResponsable: IND.nombre,
      },
      nivel: 2,
      estudiantesEstimados: 48,
      estadoResponsable: 'PLANIFICADA',
      paralelosAbiertos: [
        { id: 1, codigo: 'A', cupo: 35, cuposDisponibles: 12, docente: 'María Torres' },
        { id: 2, codigo: 'B', cupo: 30, cuposDisponibles: 30, docente: null },
      ],
      solicitudes: [{ id: 1, paraleloId: 1, planificacionId: 1, cupos: 20, estado: 'ACEPTADA' }],
      carrerasQueLaUsan: [IND.nombre, COMP.nombre],
      ...extra,
    };
  }

  /** Desordenado a propósito: el componente debe ordenar por nivel y código. */
  function datos(materias?: MateriaCompartida[]): ListadoMateriasCompartidas {
    return {
      carreraId: COMP.id,
      carreraNombre: COMP.nombre,
      materias:
        materias ??
        [
          compartida(120, 'ADM-150', 'Administración de Proyectos', {
            nivel: 5,
            estudiantesEstimados: 25,
            estadoResponsable: 'EN_BORRADOR',
            paralelosAbiertos: [],
            solicitudes: [],
          }),
          compartida(101, 'MAT-201', 'Cálculo Diferencial'),
          compartida(110, 'FIS-110', 'Física General', {
            nivel: 1,
            estudiantesEstimados: 60,
            estadoResponsable: 'NO_PLANIFICADA',
            paralelosAbiertos: [],
            solicitudes: [],
          }),
        ],
    };
  }

  beforeEach(() => {
    listarMateriasCompartidas.mockReset();
    solicitarCupos.mockReset();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SolicitudCupoService,
          useValue: {
            listarMateriasCompartidas,
            solicitarCupos,
            cuposSolicitados: (m: MateriaCompartida) =>
              m.solicitudes
                .filter((s) => s.estado !== 'RECHAZADA')
                .reduce((total, s) => total + s.cupos, 0),
          },
        },
      ],
    });
  });

  async function crear(planificacionId = 1) {
    const fixture = TestBed.createComponent(MateriasCompartidasComponent);
    fixture.componentRef.setInput('planificacionId', planificacionId);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const texto = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  const boton = (fixture: { nativeElement: HTMLElement }, contiene: string) =>
    [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      texto(b).includes(contiene),
    ) as HTMLButtonElement;

  it('muestra carga mientras espera la respuesta', async () => {
    listarMateriasCompartidas.mockReturnValue(new Subject<ListadoMateriasCompartidas>());
    const fixture = await crear();
    expect(texto(fixture.nativeElement)).toContain('Cargando materias compartidas');
    expect(listarMateriasCompartidas).toHaveBeenCalledWith(1);
  });

  it('ordena por nivel y muestra estado, paralelos y cupos de cada materia', async () => {
    listarMateriasCompartidas.mockReturnValue(of(datos()));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;

    const codigos = [...host.querySelectorAll('tbody tr td:first-child')].map(texto);
    expect(codigos).toEqual(['FIS-110', 'MAT-201', 'ADM-150']);

    const filaMat = [...host.querySelectorAll('tbody tr')].find((tr) =>
      texto(tr).includes('MAT-201'),
    )!;
    expect(texto(filaMat)).toContain('Planificada');
    expect(texto(filaMat)).toContain('A · 12 de 35 libres');
    expect(texto(filaMat)).toContain('20 solicitados');
    expect(texto(filaMat)).toContain('faltan 28');
    expect(filaMat.querySelector('app-indicador-materia-compartida')).not.toBeNull();
  });

  it('advierte las materias que la carrera responsable todavía no planificó', async () => {
    listarMateriasCompartidas.mockReturnValue(of(datos()));
    const fixture = await crear();
    const aviso = fixture.nativeElement.querySelector('[role="note"]');
    expect(texto(aviso)).toContain('2 materia(s) sin planificar todavía');
    expect(texto(aviso)).toContain('no se pueden pedir cupos');
  });

  it('no ofrece solicitar cupos mientras la responsable no planifique', async () => {
    listarMateriasCompartidas.mockReturnValue(of(datos()));
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;

    const filaFis = [...host.querySelectorAll('tbody tr')].find((tr) =>
      texto(tr).includes('FIS-110'),
    )!;
    expect(texto(filaFis)).toContain('Sin planificar');
    expect(texto(filaFis)).toContain('Esperando a Ingeniería Industrial');
    // ojo: el indicador de materia compartida trae su propio botón (tooltip),
    // así que se cuentan solo los botones de la acción
    const botonesSolicitar = (raiz: Element) =>
      [...raiz.querySelectorAll('button')].filter((b) => texto(b) === 'Solicitar cupos');
    expect(botonesSolicitar(filaFis)).toHaveLength(0);
    // solo la materia ya planificada ofrece la acción
    expect(botonesSolicitar(host)).toHaveLength(1);
  });

  it('avisa cuando los paralelos abiertos ya no tienen cupos', async () => {
    const llena = compartida(101, 'MAT-201', 'Cálculo Diferencial', {
      paralelosAbiertos: [{ id: 1, codigo: 'A', cupo: 35, cuposDisponibles: 0, docente: null }],
      solicitudes: [],
    });
    listarMateriasCompartidas.mockReturnValue(of(datos([llena])));
    const fixture = await crear();
    expect(texto(fixture.nativeElement)).toContain('Sin cupos disponibles');
    expect(
      [...fixture.nativeElement.querySelectorAll('button')].filter(
        (b) => texto(b) === 'Solicitar cupos',
      ),
    ).toHaveLength(0);
  });

  it('abre el formulario, prellena los cupos que faltan y registra la solicitud', async () => {
    listarMateriasCompartidas.mockReturnValue(of(datos([compartida(101, 'MAT-201', 'Cálculo')])));
    solicitarCupos.mockReturnValue(of(datos()));
    const fixture = await crear();

    boton(fixture, 'Solicitar cupos').click();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const entrada = host.querySelector('input[type="number"]') as HTMLInputElement;
    // 48 estimados - 20 ya aceptados = 28, y el paralelo B tiene 30 libres
    expect(entrada.value).toBe('28');
    // solo se ofrecen los paralelos con cupo
    expect(host.querySelectorAll('option')).toHaveLength(2);

    boton(fixture, 'Enviar solicitud').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(solicitarCupos).toHaveBeenCalledWith(1, 101, 1, 28);
    expect(texto(fixture.nativeElement)).toContain('Solicitud enviada: 28 cupos en MAT-201');
    expect(fixture.nativeElement.querySelector('input[type="number"]')).toBeNull();
  });

  it('muestra el motivo cuando el servicio rechaza la solicitud', async () => {
    listarMateriasCompartidas.mockReturnValue(of(datos([compartida(101, 'MAT-201', 'Cálculo')])));
    solicitarCupos.mockReturnValue(
      throwError(() => new Error('El paralelo A solo tiene 12 cupos disponibles.')),
    );
    const fixture = await crear();

    boton(fixture, 'Solicitar cupos').click();
    fixture.detectChanges();
    boton(fixture, 'Enviar solicitud').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(texto(fixture.nativeElement.querySelector('[role="alert"]'))).toContain(
      'solo tiene 12 cupos disponibles',
    );
    // el formulario sigue abierto para corregir
    expect(fixture.nativeElement.querySelector('input[type="number"]')).not.toBeNull();
  });

  it('cierra el formulario al cancelar', async () => {
    listarMateriasCompartidas.mockReturnValue(of(datos([compartida(101, 'MAT-201', 'Cálculo')])));
    const fixture = await crear();

    boton(fixture, 'Solicitar cupos').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();

    boton(fixture, 'Cancelar').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(solicitarCupos).not.toHaveBeenCalled();
  });

  it('muestra el estado vacío cuando la malla no tiene materias compartidas', async () => {
    listarMateriasCompartidas.mockReturnValue(
      of({ carreraId: 7, carreraNombre: 'Arquitectura', materias: [] }),
    );
    const fixture = await crear(3);
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('app-estado-vacio')).not.toBeNull();
    expect(texto(host)).toContain('no tiene materias compartidas');
    expect(host.querySelector('table')).toBeNull();
  });

  it('permite reintentar después de un error de carga', async () => {
    listarMateriasCompartidas
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValueOnce(of(datos()));
    const fixture = await crear();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    boton(fixture, 'Reintentar').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(texto(fixture.nativeElement)).toContain('MAT-201');
    expect(listarMateriasCompartidas).toHaveBeenCalledTimes(2);
  });

  it('descarta la respuesta de la planificación anterior cuando cambia la entrada', async () => {
    const anterior = new Subject<ListadoMateriasCompartidas>();
    const actual = new Subject<ListadoMateriasCompartidas>();
    listarMateriasCompartidas.mockReturnValueOnce(anterior).mockReturnValueOnce(actual);
    const fixture = await crear();

    fixture.componentRef.setInput('planificacionId', 2);
    fixture.detectChanges();
    await fixture.whenStable();

    anterior.next(datos());
    fixture.detectChanges();
    expect(texto(fixture.nativeElement)).not.toContain('MAT-201');

    actual.next({ carreraId: 6, carreraNombre: IND.nombre, materias: [] });
    fixture.detectChanges();
    expect(texto(fixture.nativeElement)).toContain('no tiene materias compartidas');
    expect(listarMateriasCompartidas).toHaveBeenLastCalledWith(2);
  });
});
