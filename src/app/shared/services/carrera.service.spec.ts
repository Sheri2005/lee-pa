import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DatosCarrera } from '../models/carrera.model';
import { MATERIAS_MOCK } from '../mocks/materias.mock';
import { CarreraService } from './carrera.service';

describe('CarreraService', () => {
  let servicio: CarreraService;

  const nueva = (cambios: Partial<DatosCarrera> = {}): DatosCarrera => ({
    codigo: 'ING-CIV',
    nombre: 'Ingeniería Civil',
    facultadId: 1,
    facultadNombre: 'Facultad de Ingeniería',
    jornada: 'MATUTINA',
    modalidad: 'PRESENCIAL',
    coordinadorUsuarioId: null,
    coordinadorNombre: null,
    codigoSiac: null,
    estado: 'A',
    ...cambios,
  });

  const mensajeDe = (p: Promise<unknown>) =>
    p.then(
      () => 'sin error',
      (e: Error) => e.message,
    );

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(CarreraService);
  });

  it('lista todas las carreras', async () => {
    expect((await firstValueFrom(servicio.listar())).length).toBe(7);
  });

  it('las carreras de las materias de prueba de Julio existen con el mismo nombre', async () => {
    const carreras = await firstValueFrom(servicio.listar());
    for (const m of MATERIAS_MOCK) {
      expect(carreras.find((c) => c.id === m.carreraResponsableId)?.nombre).toBe(m.carreraResponsable);
    }
  });

  it('filtra por facultad', async () => {
    const ingenieria = await firstValueFrom(servicio.listar({ facultadId: 1 }));
    expect(ingenieria.map((c) => c.codigo)).toEqual(['ING-COMP', 'ING-IND', 'ARQ']);
  });

  it('filtra por coordinador ("mis carreras")', async () => {
    const mias = await firstValueFrom(servicio.listar({ coordinadorUsuarioId: 20 }));
    expect(mias.map((c) => c.codigo)).toEqual(['ING-COMP']);
  });

  it('con soloActivas deja fuera a las inactivas', async () => {
    const activas = await firstValueFrom(servicio.listar({ soloActivas: true }));
    expect(activas.every((c) => c.estado === 'A')).toBe(true);
    expect(activas.some((c) => c.codigo === 'DER')).toBe(false);
  });

  it('devuelve copias', async () => {
    const [primera] = await firstValueFrom(servicio.listar());
    primera.nombre = 'Cambiada';
    const [otraVez] = await firstValueFrom(servicio.listar());
    expect(otraVez.nombre).not.toBe('Cambiada');
  });

  it('crea una carrera con un id nuevo', async () => {
    expect((await firstValueFrom(servicio.crear(nueva()))).id).toBe(8);
  });

  it('no permite una carrera sin facultad', async () => {
    const sinFacultad = nueva({ facultadId: null as unknown as number });
    expect(await mensajeDe(firstValueFrom(servicio.crear(sinFacultad)))).toContain('facultad');
  });

  it('rechaza código, código SIAC o coordinador repetidos', async () => {
    expect(await mensajeDe(firstValueFrom(servicio.crear(nueva({ codigo: 'arq' }))))).toContain('código arq');
    expect(await mensajeDe(firstValueFrom(servicio.crear(nueva({ codigoSiac: 'ING-COMP' }))))).toContain('código SIAC');
    expect(await mensajeDe(firstValueFrom(servicio.crear(nueva({ coordinadorUsuarioId: 21 }))))).toContain('coordina');
  });

  it('rechaza código o nombre vacíos', async () => {
    expect(await mensajeDe(firstValueFrom(servicio.crear(nueva({ nombre: ' ' }))))).toContain('obligatorios');
  });

  it('actualiza conservando su propio código y coordinador', async () => {
    const [comp] = await firstValueFrom(servicio.listar({ coordinadorUsuarioId: 20 }));
    const editada = await firstValueFrom(servicio.actualizar(comp.id, { ...comp, jornada: 'NOCTURNA' }));
    expect(editada.jornada).toBe('NOCTURNA');
  });

  it('falla al actualizar una carrera que no existe', async () => {
    expect(await mensajeDe(firstValueFrom(servicio.actualizar(999, nueva())))).toContain('no existe');
  });

  it('desactiva y reactiva', async () => {
    expect((await firstValueFrom(servicio.cambiarEstado(7, 'I'))).estado).toBe('I');
    expect((await firstValueFrom(servicio.cambiarEstado(7, 'A'))).estado).toBe('A');
  });
});
