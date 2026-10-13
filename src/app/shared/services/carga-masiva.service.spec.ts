import { PlantillaCarga } from '../models/carga-masiva.model';
import { PLANTILLA_PRUEBA } from '../testing/plantilla-prueba';
import { CargaMasivaService, normalizar } from './carga-masiva.service';

describe('CargaMasivaService', () => {
  const servicio = new CargaMasivaService();

  it('normaliza tildes, mayúsculas y espacios', () => {
    expect(normalizar('  Código ')).toBe('codigo');
  });

  it('genera un CSV solo con encabezados, escapando comas', () => {
    expect(servicio.generarCsvPlantilla(PLANTILLA_PRUEBA)).toBe(
      '\uFEFFMateria,Cantidad,"Nota, opcional"\r\n',
    );
  });

  it('detecta columnas obligatorias ausentes', () => {
    expect(servicio.columnasFaltantes(PLANTILLA_PRUEBA, [{ Materia: 'X' }])).toEqual(['Cantidad']);
    expect(servicio.columnasFaltantes(PLANTILLA_PRUEBA, [{ materia: 'X', CANTIDAD: '1' }])).toEqual(
      [],
    );
  });

  it('valida obligatorios y validadores, y numera desde la fila 2', () => {
    const filas = servicio.validar(PLANTILLA_PRUEBA, [
      { Materia: 'Cálculo', Cantidad: '30' },
      { Materia: '', Cantidad: '30' },
      { Materia: 'Física', Cantidad: 'abc' },
    ]);
    expect(filas.map((f) => [f.numero, f.valida])).toEqual([
      [2, true],
      [3, false],
      [4, false],
    ]);
    expect(filas[1].errores).toEqual(['Materia es obligatorio.']);
    expect(filas[2].errores).toEqual(['Cantidad debe ser un número entero.']);
  });

  it('ignora filas totalmente vacías', () => {
    const filas = servicio.validar(PLANTILLA_PRUEBA, [
      { Materia: '', Cantidad: '' },
      { Materia: 'A', Cantidad: '1' },
    ]);
    expect(filas).toHaveLength(1);
    expect(filas[0].numero).toBe(3);
  });

  it('importa solo las filas válidas', async () => {
    const filas = servicio.validar(PLANTILLA_PRUEBA, [
      { Materia: 'A', Cantidad: '1' },
      { Materia: '', Cantidad: '1' },
    ]);
    const resumen = await new Promise((ok) =>
      servicio.importar(PLANTILLA_PRUEBA, filas).subscribe(ok),
    );
    expect(resumen).toEqual({
      total: 2,
      importadas: 1,
      rechazadas: 1,
      errores: [{ fila: 3, mensaje: 'Materia es obligatorio.' }],
    });
  });

  describe('plantilla con fila de ejemplo', () => {
    const conEjemplo: PlantillaCarga = {
      ...PLANTILLA_PRUEBA,
      columnas: [
        { clave: 'materia', etiqueta: 'Materia', obligatorio: true, ejemplo: 'Cálculo I' },
        { clave: 'cantidad', etiqueta: 'Cantidad', obligatorio: true, ejemplo: '30' },
        { clave: 'nota', etiqueta: 'Nota, opcional', ejemplo: 'a, b' },
      ],
    };

    it('incluye la fila de ejemplo en las filas de la plantilla y en el CSV', () => {
      expect(servicio.filasPlantilla(conEjemplo)).toEqual([
        ['Materia', 'Cantidad', 'Nota, opcional'],
        ['Cálculo I', '30', 'a, b'],
      ]);
      expect(servicio.generarCsvPlantilla(conEjemplo)).toBe(
        '\uFEFFMateria,Cantidad,"Nota, opcional"\r\nCálculo I,30,"a, b"\r\n',
      );
    });

    it('genera un .xlsx (zip con firma PK)', () => {
      const bytes = servicio.generarXlsxPlantilla(conEjemplo);
      expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');
    });

    it('no importa la fila de ejemplo si el usuario la deja', () => {
      const filas = servicio.validar(conEjemplo, [
        { Materia: 'Cálculo I', Cantidad: '30', 'Nota, opcional': 'a, b' },
        { Materia: 'Física', Cantidad: '25', 'Nota, opcional': '' },
      ]);
      expect(filas.map((f) => f.numero)).toEqual([3]);
    });
  });
});