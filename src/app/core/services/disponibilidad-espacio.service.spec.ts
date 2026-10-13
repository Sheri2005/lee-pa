import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DisponibilidadEspacioService } from './disponibilidad-espacio.service';

describe('DisponibilidadEspacioService', () => {
  it('sin API todavía devuelve una lista vacía', async () => {
    const servicio = TestBed.inject(DisponibilidadEspacioService);

    const espacios = await firstValueFrom(
      servicio.buscar({
        fecha: '2026-11-16',
        horaInicio: '14:00',
        horaFin: '15:30',
        tipoEspacio: null,
        capacidadMinima: null,
        recursos: [],
        edificioId: null,
      }),
    );

    expect(espacios).toEqual([]);
  });
});
