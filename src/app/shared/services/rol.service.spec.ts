import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RolService } from './rol.service';

describe('RolService', () => {
  let servicio: RolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(RolService);
  });

  it('tiene los 4 roles mínimos del documento', async () => {
    const roles = await firstValueFrom(servicio.listar());
    expect(roles.map((r) => r.nombre)).toEqual(['Administrador', 'Coordinador', 'Decano', 'Docente']);
  });

  it('el nombre largo del documento va en la descripción', async () => {
    const roles = await firstValueFrom(servicio.listar());
    expect(roles.find((r) => r.nombre === 'Coordinador')?.descripcion).toBe('Coordinador de carrera');
    expect(roles.find((r) => r.nombre === 'Decano')?.descripcion).toBe('Decano / Aprobador');
  });

  it('con soloActivos devuelve solo los de estado A', async () => {
    const roles = await firstValueFrom(servicio.listar({ soloActivos: true }));
    expect(roles.every((r) => r.estado === 'A')).toBe(true);
  });

  it('devuelve copias', async () => {
    const [primero] = await firstValueFrom(servicio.listar());
    primero.nombre = 'Cambiado';
    const [otraVez] = await firstValueFrom(servicio.listar());
    expect(otraVez.nombre).toBe('Administrador');
  });
});
