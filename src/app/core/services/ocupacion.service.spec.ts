import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Ocupacion } from '../models/ocupacion.model';
import {
  bloqueaEspacio,
  conflictoEntre,
  evaluarDisponibilidad,
  OcupacionService,
} from './ocupacion.service';

const clase: Ocupacion = {
  tipo: 'CLASE',
  id: 1,
  espacio_id: 7,
  fecha: '2026-11-10',
  hora_inicio: '08:00',
  hora_fin: '10:00',
  titulo: 'Cálculo I · P1',
};
const franja = (hora_inicio: string, hora_fin: string, fecha = '2026-11-10') => ({
  fecha,
  hora_inicio,
  hora_fin,
});

describe('OcupacionService', () => {
  it('sin API devuelve null, no una lista vacía que parecería "libre"', async () => {
    const servicio = TestBed.inject(OcupacionService);

    expect(await firstValueFrom(servicio.ocupacion(7, '2026-11-09', '2026-11-14'))).toBeNull();
    expect(await firstValueFrom(servicio.espacios())).toBeNull();
  });

  it('detecta cruces de horario', () => {
    expect(conflictoEntre(franja('09:00', '11:00'), clase)).toBe('CRUCE');
    expect(conflictoEntre(franja('07:00', '08:30'), clase)).toBe('CRUCE');
    expect(conflictoEntre(franja('09:00', '11:00', '2026-11-11'), clase)).toBeNull();
  });

  it('exige 15 minutos de separación: 15 bastan, 14 no', () => {
    expect(conflictoEntre(franja('10:15', '11:00'), clase)).toBeNull();
    expect(conflictoEntre(franja('10:14', '11:00'), clase)).toBe('SEPARACION');
    expect(conflictoEntre(franja('07:00', '07:45'), clase)).toBeNull();
    expect(conflictoEntre(franja('07:00', '07:46'), clase)).toBe('SEPARACION');
    expect(
      conflictoEntre(franja('09:00', '10:00'), {
        ...clase,
        hora_inicio: '07:00',
        hora_fin: '08:50',
      }),
    ).toBe('SEPARACION');
  });

  it('solo bloquean las clases y las reservas aprobadas', () => {
    const reserva: Ocupacion = { ...clase, tipo: 'RESERVA', estado: 'PENDIENTE' };
    expect(bloqueaEspacio(reserva)).toBe(false);
    expect(conflictoEntre(franja('09:00', '11:00'), reserva)).toBeNull();
    expect(conflictoEntre(franja('09:00', '11:00'), { ...reserva, estado: 'APROBADA' })).toBe(
      'CRUCE',
    );
  });

  it('evalúa cada fecha y solo está disponible si todas lo están', () => {
    const resultado = evaluarDisponibilidad(7, ['2026-11-03', '2026-11-10'], '09:00', '11:00', [
      clase,
      { ...clase, id: 2, espacio_id: 8, fecha: '2026-11-03' },
    ]);

    expect(resultado.disponible).toBe(false);
    expect(resultado.ocurrencias.map((o) => o.estado)).toEqual(['DISPONIBLE', 'CONFLICTO']);
    expect(resultado.ocurrencias[1].conflictos).toEqual([{ ocupacion: clase, motivo: 'CRUCE' }]);
    expect(evaluarDisponibilidad(7, ['2026-11-03'], '09:00', '11:00', []).disponible).toBe(true);
    expect(evaluarDisponibilidad(7, [], '09:00', '11:00', []).disponible).toBe(false);
  });
});
