import { firstValueFrom } from 'rxjs';
import { FilaValidada, PlantillaCarga } from '../models/carga-masiva.model';
import { CargaMasivaService } from './carga-masiva.service';

const PLANTILLA_PRUEBA: PlantillaCarga = {
  nombre: 'Estudiantes estimados',
  nombreArchivo: 'plantilla-estudiantes',
  endpoint: '/api/estudiantes-estimados/importar',
  columnas: [
    { clave: 'materia', etiqueta: 'Materia', obligatorio: true },
    { clave: 'cantidad', etiqueta: 'Cantidad', obligatorio: true },
  ],
};

/** Bitácora de la carga masiva (C1-56): listar y registrar cada importación. */
describe('CargaMasivaService · bitácora', () => {
  let servicio: CargaMasivaService;

  const filas: FilaValidada[] = [
    { numero: 2, datos: { materia: 'Cálculo', cantidad: '30' }, errores: [], valida: true },
    { numero: 3, datos: { materia: '', cantidad: 'x' }, errores: ['Materia es obligatorio.', 'Cantidad debe ser un número entero.'], valida: false },
  ];

  beforeEach(() => {
    servicio = new CargaMasivaService();
  });

  it('lista los registros de la más reciente a la más antigua', async () => {
    const lista = await firstValueFrom(servicio.listarBitacora());
    expect(lista.length).toBe(5);
    const fechas = lista.map((r) => Date.parse(r.fecha));
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a));
  });

  it('devuelve copias: cambiar el resultado no altera la bitácora', async () => {
    const [primero] = await firstValueFrom(servicio.listarBitacora());
    primero.errores.push({ fila: 99, columna: null, mensaje: 'x' });
    const [otraVez] = await firstValueFrom(servicio.listarBitacora());
    expect(otraVez.errores.length).toBe(primero.errores.length - 1);
  });

  it('cada importación queda registrada al principio de la bitácora', async () => {
    await firstValueFrom(servicio.importar(PLANTILLA_PRUEBA, filas));
    const lista = await firstValueFrom(servicio.listarBitacora());

    expect(lista.length).toBe(6);
    const nuevo = lista[0];
    expect(nuevo.entidad).toBe('Estudiantes estimados');
    expect([nuevo.totalFilas, nuevo.filasOk, nuevo.filasError]).toEqual([2, 1, 1]);
    expect(nuevo.totalFilas).toBe(nuevo.filasOk + nuevo.filasError);
    expect(nuevo.id).toBe(6);
  });

  it('registra un error por cada mensaje de las filas rechazadas', async () => {
    await firstValueFrom(servicio.importar(PLANTILLA_PRUEBA, filas));
    const [nuevo] = await firstValueFrom(servicio.listarBitacora());
    expect(nuevo.errores).toEqual([
      { fila: 3, columna: null, mensaje: 'Materia es obligatorio.' },
      { fila: 3, columna: null, mensaje: 'Cantidad debe ser un número entero.' },
    ]);
  });

  it('guarda la fecha con la zona de Ecuador', async () => {
    await firstValueFrom(servicio.importar(PLANTILLA_PRUEBA, filas));
    const [nuevo] = await firstValueFrom(servicio.listarBitacora());
    expect(nuevo.fecha).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-05:00$/);
    expect(Math.abs(Date.parse(nuevo.fecha) - Date.now())).toBeLessThan(60_000);
  });

  it('usa textos provisionales para archivo y usuario (TEMPORAL)', async () => {
    await firstValueFrom(servicio.importar(PLANTILLA_PRUEBA, filas));
    const [nuevo] = await firstValueFrom(servicio.listarBitacora());
    expect(nuevo.archivo).toBe('(nombre no disponible)');
    expect(nuevo.usuarioNombre).toBe('Usuario de prueba');
  });
});
