import {
  diagnosticarRango,
  diasEnRango,
  esteMes,
  estaSemana,
  fechaValida,
  rangoCompleto,
  sumarDias,
  validarRango,
} from './rango-fechas';

describe('rango-fechas (C4-05)', () => {
  it('valida fechas ISO reales', () => {
    expect(fechaValida('2026-10-01')).toBe(true);
    expect(fechaValida('2026-02-30')).toBe(false);
    expect(fechaValida('01/10/2026')).toBe(false);
    expect(fechaValida('')).toBe(false);
  });

  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-12-30', 3)).toBe('2027-01-02');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('"Esta semana" va de lunes a sábado', () => {
    // Jueves 1 de octubre de 2026
    expect(estaSemana('2026-10-01')).toEqual({ desde: '2026-09-28', hasta: '2026-10-03' });
    // Lunes y sábado pertenecen a su propia semana
    expect(estaSemana('2026-09-28')).toEqual({ desde: '2026-09-28', hasta: '2026-10-03' });
    expect(estaSemana('2026-10-03')).toEqual({ desde: '2026-09-28', hasta: '2026-10-03' });
  });

  it('un domingo pertenece a la semana que termina ese día', () => {
    expect(estaSemana('2026-10-04')).toEqual({ desde: '2026-09-28', hasta: '2026-10-03' });
  });

  it('"Este mes" cubre el mes completo, incluidos meses cortos y bisiestos', () => {
    expect(esteMes('2026-10-15')).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' });
    expect(esteMes('2026-02-10')).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' });
    expect(esteMes('2028-02-10')).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' });
  });

  it('valida el orden del rango y no marca error si está incompleto', () => {
    expect(validarRango({ desde: '', hasta: '' })).toBeNull();
    expect(validarRango({ desde: '2026-10-01', hasta: '' })).toBeNull();
    expect(validarRango({ desde: '2026-10-01', hasta: '2026-10-01' })).toBeNull();
    expect(validarRango({ desde: '2026-10-02', hasta: '2026-10-01' })).toMatch(/posterior/);
    expect(validarRango({ desde: '2026-13-01', hasta: '2026-10-01' })).toMatch(/válidas/);
  });

  it('cuenta días inclusivos solo en rangos completos', () => {
    expect(diasEnRango({ desde: '2026-09-28', hasta: '2026-10-03' })).toBe(6);
    expect(diasEnRango({ desde: '2026-10-01', hasta: '2026-10-01' })).toBe(1);
    expect(diasEnRango({ desde: '2026-10-01', hasta: '' })).toBe(0);
    expect(rangoCompleto({ desde: '2026-10-05', hasta: '2026-10-01' })).toBe(false);
  });

  it('diagnostica solo el extremo responsable del error', () => {
    expect(diagnosticarRango({ desde: '', hasta: '' })).toBeNull();
    expect(diagnosticarRango({ desde: '32/13/2026', hasta: '' })).toEqual({
      mensaje: 'Escribe una fecha válida, por ejemplo 16/11/2026.',
      campos: ['desde'],
    });
    expect(diagnosticarRango({ desde: 'x', hasta: 'y' })?.campos).toEqual(['desde', 'hasta']);
    expect(diagnosticarRango({ desde: '2026-10-10', hasta: '2026-10-05' })?.campos).toEqual([
      'hasta',
    ]);
    expect(
      diagnosticarRango({ desde: '2026-10-10', hasta: '2026-10-05' }, { ultimo: 'desde' }),
    ).toEqual({
      mensaje: 'La fecha inicial debe ser igual o anterior a la final.',
      campos: ['desde'],
    });
    expect(
      diagnosticarRango({ desde: '2026-10-01', hasta: '2026-10-20' }, { fechaMin: '2026-10-05' })
        ?.campos,
    ).toEqual(['desde']);
    expect(
      diagnosticarRango({ desde: '2026-10-01', hasta: '2026-10-20' }, { fechaMax: '2026-10-15' })
        ?.campos,
    ).toEqual(['hasta']);
  });

  it('no impone límites si el padre no los indica (reportes históricos)', () => {
    expect(diagnosticarRango({ desde: '2019-01-05', hasta: '2026-12-31' })).toBeNull();
  });
});
