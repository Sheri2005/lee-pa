import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DatosUsuario } from '../models/usuario.model';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let servicio: UsuarioService;

  const nuevo = (cambios: Partial<DatosUsuario> = {}): DatosUsuario => ({
    username: 'nuevo',
    email: 'nuevo@uees.edu.ec',
    nombres: 'Usuario Nuevo',
    origen: 'LOCAL',
    codigoSiac: null,
    estado: 'A',
    roles: ['Docente'],
    ...cambios,
  });

  const mensajeDe = (p: Promise<unknown>) =>
    p.then(
      () => 'sin error',
      (e: Error) => e.message,
    );

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(UsuarioService);
  });

  it('lista todos los usuarios', async () => {
    expect((await firstValueFrom(servicio.listar())).length).toBe(10);
  });

  it('filtra por rol sin distinguir mayúsculas', async () => {
    const decanos = await firstValueFrom(servicio.listar({ rol: 'decano' }));
    expect(decanos.map((u) => u.id)).toEqual([10, 11, 12, 13, 14]);
  });

  it('con soloActivos deja fuera a los inactivos', async () => {
    const docentes = await firstValueFrom(servicio.listar({ rol: 'Docente', soloActivos: true }));
    expect(docentes.every((u) => u.estado === 'A')).toBe(true);
    expect(docentes.some((u) => u.username === 'gsalazar')).toBe(false);
  });

  it('devuelve copias: cambiar el resultado no altera los datos', async () => {
    const [primero] = await firstValueFrom(servicio.listar());
    primero.roles.push('Coordinador');
    primero.nombres = 'Cambiado';
    const [otraVez] = await firstValueFrom(servicio.listar());
    expect(otraVez.nombres).not.toBe('Cambiado');
    expect(otraVez.roles).toEqual(['Administrador']);
  });

  it('crea un usuario con un id nuevo', async () => {
    const creado = await firstValueFrom(servicio.crear(nuevo()));
    expect(creado.id).toBeGreaterThan(31);
    expect((await firstValueFrom(servicio.listar())).length).toBe(11);
  });

  it('rechaza username, email o código SIAC repetidos', async () => {
    expect(await mensajeDe(firstValueFrom(servicio.crear(nuevo({ username: 'ADMIN' }))))).toContain('username');
    expect(await mensajeDe(firstValueFrom(servicio.crear(nuevo({ email: 'mortiz@uees.edu.ec' }))))).toContain('email');
    expect(await mensajeDe(firstValueFrom(servicio.crear(nuevo({ codigoSiac: 'U-0010' }))))).toContain('código SIAC');
  });

  it('rechaza campos obligatorios vacíos', async () => {
    expect(await mensajeDe(firstValueFrom(servicio.crear(nuevo({ nombres: ' ' }))))).toContain('obligatorios');
  });

  it('actualiza conservando su propio username', async () => {
    const [admin] = await firstValueFrom(servicio.listar());
    const editado = await firstValueFrom(servicio.actualizar(admin.id, { ...admin, nombres: 'Admin General' }));
    expect(editado.nombres).toBe('Admin General');
  });

  it('falla al actualizar un usuario que no existe', async () => {
    expect(await mensajeDe(firstValueFrom(servicio.actualizar(999, nuevo())))).toContain('no existe');
  });

  it('desactiva y reactiva', async () => {
    expect((await firstValueFrom(servicio.cambiarEstado(30, 'I'))).estado).toBe('I');
    expect((await firstValueFrom(servicio.cambiarEstado(30, 'A'))).estado).toBe('A');
  });
});
