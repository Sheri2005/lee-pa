import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RecursoReservableService } from './recurso-reservable.service';

describe('RecursoReservableService', () => {
  it('sin API todavía no devuelve recursos', async () => {
    const servicio = TestBed.inject(RecursoReservableService);

    expect(await firstValueFrom(servicio.disponibilidad('2026-11-27', '15:00', '16:00'))).toEqual(
      [],
    );
  });
});
