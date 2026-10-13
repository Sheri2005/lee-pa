import { resumirReporteCursosParalelos } from './reporte-cursos-paralelos.models';
import type { FilaCursosParalelos } from './reporte-cursos-paralelos.models';

describe('resumirReporteCursosParalelos', () => {
  it('suma cursos y paralelos y agrupa las series por carrera', () => {
    const filas: FilaCursosParalelos[] = [
      {
        facultadId: 'fac-ing',
        facultad: 'Ingeniería',
        carreraId: 'car-sis',
        carrera: 'Sistemas',
        periodoId: 'per-1',
        periodo: '2026 - Ciclo 1',
        nivel: 1,
        cursos: 3,
        paralelos: 6,
      },
      {
        facultadId: 'fac-ing',
        facultad: 'Ingeniería',
        carreraId: 'car-sis',
        carrera: 'Sistemas',
        periodoId: 'per-1',
        periodo: '2026 - Ciclo 1',
        nivel: 2,
        cursos: 2,
        paralelos: 4,
      },
      {
        facultadId: 'fac-ing',
        facultad: 'Ingeniería',
        carreraId: 'car-ind',
        carrera: 'Industrial',
        periodoId: 'per-2',
        periodo: '2026 - Ciclo 2',
        nivel: 1,
        cursos: 4,
        paralelos: 8,
      },
    ];

    expect(resumirReporteCursosParalelos(filas)).toEqual({
      totalCursos: 9,
      totalParalelos: 18,
      etiquetas: ['Sistemas', 'Industrial'],
      series: [
        { nombre: 'Cursos', valores: [5, 4] },
        { nombre: 'Paralelos', valores: [10, 8] },
      ],
    });
  });

  it('devuelve totales en cero y series vacías cuando no hay filas', () => {
    expect(resumirReporteCursosParalelos([])).toEqual({
      totalCursos: 0,
      totalParalelos: 0,
      etiquetas: [],
      series: [
        { nombre: 'Cursos', valores: [] },
        { nombre: 'Paralelos', valores: [] },
      ],
    });
  });
});
