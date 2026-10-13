import {
  porcentajeCargaDocente,
  resumirCargaDocente,
  type FilaCargaDocente,
} from './reporte-carga-docente.models';

describe('resumirCargaDocente', () => {
  it('suma las horas y cuenta a cada docente que excede su carga máxima', () => {
    const filas: FilaCargaDocente[] = [
      {
        docenteId: 'doc-1',
        docente: 'Ana Pérez',
        horasAsignadas: 20,
        cargaMaxima: 20,
      },
      {
        docenteId: 'doc-2',
        docente: 'Luis Mora',
        horasAsignadas: 24,
        cargaMaxima: 18,
      },
    ];

    expect(resumirCargaDocente(filas)).toEqual({
      totalHorasAsignadas: 44,
      totalCargaMaxima: 38,
      docentesSobrecargados: 1,
      porcentajeCargaGlobal: (44 / 38) * 100,
    });
    expect(porcentajeCargaDocente(filas[1])).toBe((24 / 18) * 100);
  });

  it('evita dividir por cero cuando la carga máxima es cero', () => {
    const fila: FilaCargaDocente = {
      docenteId: 'doc-1',
      docente: 'Ana Pérez',
      horasAsignadas: 3,
      cargaMaxima: 0,
    };

    expect(porcentajeCargaDocente(fila)).toBeNull();
    expect(resumirCargaDocente([fila]).docentesSobrecargados).toBe(1);
    expect(resumirCargaDocente([]).porcentajeCargaGlobal).toBeNull();
  });
});
