import {
  resumirMateriasCompartidas,
  type FilaMateriaCompartida,
} from './reporte-materias-compartidas.models';

describe('resumirMateriasCompartidas', () => {
  it('cuenta materias y carreras dependientes y suma los cupos solicitados', () => {
    const filas: FilaMateriaCompartida[] = [
      {
        materiaId: 'mat-1',
        materia: 'Matemática',
        carreraResponsableId: 'car-sis',
        carreraResponsable: 'Sistemas',
        carreraDependienteId: 'car-ind',
        carreraDependiente: 'Industrial',
        cuposSolicitados: 20,
      },
      {
        materiaId: 'mat-1',
        materia: 'Matemática',
        carreraResponsableId: 'car-sis',
        carreraResponsable: 'Sistemas',
        carreraDependienteId: 'car-civ',
        carreraDependiente: 'Civil',
        cuposSolicitados: 15,
      },
      {
        materiaId: 'mat-2',
        materia: 'Física',
        carreraResponsableId: 'car-civ',
        carreraResponsable: 'Civil',
        carreraDependienteId: 'car-sis',
        carreraDependiente: 'Sistemas',
        cuposSolicitados: 12,
      },
    ];

    expect(resumirMateriasCompartidas(filas)).toEqual({
      totalMateriasCompartidas: 2,
      totalCarrerasDependientes: 3,
      totalCuposSolicitados: 47,
    });
  });

  it('devuelve totales en cero cuando no hay materias compartidas', () => {
    expect(resumirMateriasCompartidas([])).toEqual({
      totalMateriasCompartidas: 0,
      totalCarrerasDependientes: 0,
      totalCuposSolicitados: 0,
    });
  });

  it('no confunde las relaciones si los identificadores contienen separadores', () => {
    const filas: FilaMateriaCompartida[] = [
      {
        materiaId: 'mat:a',
        materia: 'Materia A',
        carreraResponsableId: 'resp-1',
        carreraResponsable: 'Responsable 1',
        carreraDependienteId: 'car-b',
        carreraDependiente: 'Dependiente 1',
        cuposSolicitados: 1,
      },
      {
        materiaId: 'mat',
        materia: 'Materia B',
        carreraResponsableId: 'resp-2',
        carreraResponsable: 'Responsable 2',
        carreraDependienteId: 'a:car-b',
        carreraDependiente: 'Dependiente 2',
        cuposSolicitados: 1,
      },
    ];

    expect(resumirMateriasCompartidas(filas).totalCarrerasDependientes).toBe(2);
  });
});
