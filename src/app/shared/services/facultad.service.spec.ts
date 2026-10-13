import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DatosFacultad } from '../models/facultad.model';
import { FacultadService } from './facultad.service';

describe('FacultadService', () => {
  let servicio: FacultadService;

  const nueva = (cambios: Partial<DatosFacultad> = {}): DatosFacultad => ({
    codigo: 'FARQ',
    nombre: 'Facultad de Arquitectura',
    decanoUsuarioId: null,
    decanoNombre: null,
    codigoSiac: null,
    estado: 'A',
    ...cambios,
  });

  const mensajeDe = (obs: Promise<unknown>) =>
    obs.then(
      () => 'sin error',
      (e: Error) => e.message,
    );

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(FacultadService);
  });

  it('lista todas las facultades', async () => {
    const lista = await firstValueFrom(servicio.listar());
    expect(lista.length).toBe(5);
  });

  it('con soloActivas devuelve solo las de estado A', async () => {
    const lista = await firstValueFrom(servicio.listar({ soloActivas: true }));
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((f) => f.estado === 'A')).toBe(true);
  });

  it('devuelve copias: cambiar el resultado no altera los datos', async () => {
    const [primera] = await firstValueFrom(servicio.listar());
    primera.nombre = 'Cambiado';
    const [otraVez] = await firstValueFrom(servicio.listar());
    expect(otraVez.nombre).not.toBe('Cambiado');
  });

  it('crea una facultad con un id nuevo', async () => {
    const creada = await firstValueFrom(servicio.crear(nueva()));
    expect(creada.id).toBeGreaterThan(5);
    const lista = await firstValueFrom(servicio.listar());
    expect(lista.some((f) => f.codigo === 'FARQ')).toBe(true);
  });

  it('rechaza un código repetido sin distinguir mayúsculas', async () => {
    const msg = await mensajeDe(firstValueFrom(servicio.crear(nueva({ codigo: 'fi' }))));
    expect(msg).toContain('código fi');
  });

  it('rechaza un código SIAC repetido', async () => {
    const msg = await mensajeDe(firstValueFrom(servicio.crear(nueva({ codigoSiac: 'SIAC-FI' }))));
    expect(msg).toContain('código SIAC');
  });

  it('permite varias facultades sin código SIAC', async () => {
    const creada = await firstValueFrom(servicio.crear(nueva({ codigoSiac: null })));
    expect(creada.codigoSiac).toBeNull();
  });

  it('rechaza un decano que ya dirige otra facultad', async () => {
    const msg = await mensajeDe(
      firstValueFrom(servicio.crear(nueva({ decanoUsuarioId: 10, decanoNombre: 'X' }))),
    );
    expect(msg).toContain('decano');
  });

  it('rechaza código o nombre vacíos', async () => {
    const msg = await mensajeDe(firstValueFrom(servicio.crear(nueva({ nombre: '  ' }))));
    expect(msg).toContain('obligatorios');
  });

  it('actualiza conservando su propio código', async () => {
    const editada = await firstValueFrom(
      servicio.actualizar(1, {
        codigo: 'FI',
        nombre: 'Facultad de Ingenierías',
        decanoUsuarioId: 10,
        decanoNombre: 'María Fernanda Ortiz',
        codigoSiac: 'SIAC-FI',
        estado: 'A',
      }),
    );
    expect(editada.nombre).toBe('Facultad de Ingenierías');
  });

  it('falla al actualizar una facultad que no existe', async () => {
    const msg = await mensajeDe(firstValueFrom(servicio.actualizar(999, nueva())));
    expect(msg).toContain('no existe');
  });

  it('cambia el estado a I y de vuelta a A', async () => {
    expect((await firstValueFrom(servicio.cambiarEstado(1, 'I'))).estado).toBe('I');
    expect((await firstValueFrom(servicio.cambiarEstado(1, 'A'))).estado).toBe('A');
  });
});
