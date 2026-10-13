import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { SiacService } from '../../core/services/siac.service';
import { ResumenPanel } from '../models/panel.model';
import { DOCENTES_MOCK } from '../mocks/docentes.mock';
import { CarreraService } from './carrera.service';
import { PanelService } from './panel.service';

describe('PanelService', () => {
  let servicio: PanelService;

  beforeEach(() => {
    vi.useFakeTimers();
    servicio = TestBed.inject(PanelService);
  });

  afterEach(() => vi.useRealTimers());

  /** Espera a que respondan todos los servicios (cada uno simula su demora). */
  async function resumen(): Promise<ResumenPanel> {
    const promesa = firstValueFrom(servicio.resumen());
    await vi.advanceTimersByTimeAsync(1000);
    return promesa;
  }

  it('cuenta las carreras activas (deja fuera las inactivas)', async () => {
    // 7 carreras de prueba; DER (Derecho) está inactiva.
    expect((await resumen()).carrerasActivas).toBe(6);
  });

  it('cuenta solo las mallas vigentes', async () => {
    expect((await resumen()).mallasVigentes).toBe(3);
  });

  it('cuenta todos los docentes registrados', async () => {
    expect((await resumen()).docentesRegistrados).toBe(DOCENTES_MOCK.length);
  });

  it('los períodos abiertos son los que no están cerrados', async () => {
    // 2 en planificación + 1 activo; el cerrado no cuenta.
    expect((await resumen()).periodosAbiertos).toBe(3);
  });

  it('usa los mismos registros sin código SIAC que app-registros-sin-siac', async () => {
    const siac = TestBed.inject(SiacService);
    const promesa = firstValueFrom(siac.registrosSinCodigo());
    await vi.advanceTimersByTimeAsync(1000);
    expect((await resumen()).registrosSinSiac).toBe((await promesa).length);
  });

  it('agrupa las carreras activas por facultad activa, en orden alfabético', async () => {
    expect((await resumen()).carrerasPorFacultad).toEqual([
      { facultad: 'FCE', carreras: 1 },
      { facultad: 'FCOM', carreras: 1 },
      { facultad: 'FCS', carreras: 1 },
      { facultad: 'FI', carreras: 3 },
    ]);
  });

  it('se actualiza con los cambios de los catálogos', async () => {
    const carreras = TestBed.inject(CarreraService);
    vi.spyOn(carreras, 'listar').mockReturnValue(of([]));
    const r = await resumen();
    expect(r.carrerasActivas).toBe(0);
    expect(r.carrerasPorFacultad.every((f) => f.carreras === 0)).toBe(true);
  });
});
