import {
  resumirReporteOcupacion,
  type FilaOcupacion,
} from './reporte-ocupacion.models';

describe('resumirReporteOcupacion', () => {
  it('calcula ocupación total ponderada y porcentajes por espacio', () => {
    const filas: FilaOcupacion[] = [
      {
        edificioId: 'ed-a',
        edificio: 'Edificio A',
        espacioId: 'au-1',
        espacio: 'Aula 1',
        franjasDisponibles: 10,
        franjasOcupadas: 5,
      },
      {
        edificioId: 'ed-a',
        edificio: 'Edificio A',
        espacioId: 'au-2',
        espacio: 'Aula 2',
        franjasDisponibles: 30,
        franjasOcupadas: 9,
      },
    ];

    expect(resumirReporteOcupacion(filas)).toEqual({
      franjasDisponibles: 40,
      franjasOcupadas: 14,
      porcentajeOcupacion: 35,
      etiquetas: ['Aula 1', 'Aula 2'],
      porcentajesPorEspacio: [50, 30],
    });
  });

  it('devuelve cero cuando no hay franjas disponibles', () => {
    expect(resumirReporteOcupacion([])).toEqual({
      franjasDisponibles: 0,
      franjasOcupadas: 0,
      porcentajeOcupacion: 0,
      etiquetas: [],
      porcentajesPorEspacio: [],
    });
  });
});
