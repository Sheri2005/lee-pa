import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PermisoService } from './permiso.service';

describe('PermisoService', () => {
  let servicio: PermisoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(PermisoService);
  });

  it('incluye los permisos que usa el menú de Gestión', async () => {
    const codigos = (await firstValueFrom(servicio.listar())).map((p) => p.codigo);
    for (const c of ['usuario.ver', 'facultad.ver', 'carrera.ver', 'periodo.ver', 'materia.ver', 'malla.ver', 'docente.ver', 'importacion.ejecutar', 'panel.ver']) {
      expect(codigos).toContain(c);
    }
  });

  it('los códigos de permiso no se repiten (UK de la BD)', async () => {
    const codigos = (await firstValueFrom(servicio.listar())).map((p) => p.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it('configuración predeterminada: el Administrador tiene todos los permisos', async () => {
    const todos = (await firstValueFrom(servicio.listar())).map((p) => p.codigo);
    expect(await firstValueFrom(servicio.permisosDeRol(1))).toEqual(todos);
  });

  it('un rol sin asignaciones devuelve una lista vacía', async () => {
    expect(await firstValueFrom(servicio.permisosDeRol(4))).toEqual([]);
    expect(await firstValueFrom(servicio.permisosDeRol(99))).toEqual([]);
  });

  it('asignarPermisos reemplaza los permisos del rol y quita repetidos', async () => {
    await firstValueFrom(servicio.asignarPermisos(4, ['materia.ver', 'malla.ver', 'materia.ver']));
    expect(await firstValueFrom(servicio.permisosDeRol(4))).toEqual(['materia.ver', 'malla.ver']);
  });

  it('rechaza códigos de permiso que no existen', async () => {
    const mensaje = await firstValueFrom(servicio.asignarPermisos(2, ['inventado.ver'])).then(
      () => 'sin error',
      (e: Error) => e.message,
    );
    expect(mensaje).toBe('Permisos desconocidos: inventado.ver.');
    expect(await firstValueFrom(servicio.permisosDeRol(2))).not.toContain('inventado.ver');
  });

  it('devuelve copias: cambiar el resultado no altera la asignación', async () => {
    const permisos = await firstValueFrom(servicio.permisosDeRol(3));
    permisos.push('usuario.ver');
    expect(await firstValueFrom(servicio.permisosDeRol(3))).toEqual(['facultad.ver', 'carrera.ver']);
  });
});
