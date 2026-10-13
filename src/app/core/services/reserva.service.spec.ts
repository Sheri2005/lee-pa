import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ReservaService } from './reserva.service';

describe('ReservaService', () => {
  it('sin API todavía no devuelve ninguna reserva', async () => {
    const servicio = TestBed.inject(ReservaService);

    expect(await firstValueFrom(servicio.obtenerResumen(1))).toBeNull();
  });

  it('sin API todavía no registra ninguna solicitud', async () => {
    const servicio = TestBed.inject(ReservaService);
    const solicitud = {
      espacio_id: 1,
      hora_inicio: '09:00',
      hora_fin: '10:00',
      asistentes: 20,
      motivo: 'Taller de prueba',
      serie: null,
      fechas: ['2026-11-10'],
      recursos: [],
    };

    expect(await firstValueFrom(servicio.solicitar(solicitud))).toBeNull();
  });
});
