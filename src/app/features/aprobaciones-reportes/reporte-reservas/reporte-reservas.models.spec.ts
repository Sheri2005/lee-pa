import {
  construirCalendarioMensual,
  resumirReporteReservas,
  type FilaReservaReporte,
} from './reporte-reservas.models';

describe('reporte-reservas.models', () => {
  it('construye un calendario de 42 celdas alineado de lunes a domingo', () => {
    const calendario = construirCalendarioMensual(2024, 2, []);
    const celdasDelMes = calendario.filter((celda) => celda !== null);

    expect(calendario).toHaveLength(42);
    expect(calendario[3]?.fechaISO).toBe('2024-02-01');
    expect(celdasDelMes).toHaveLength(29);
    expect(calendario[31]?.fechaISO).toBe('2024-02-29');
  });

  it('resume reservas y promedia solo tiempos de aprobación disponibles', () => {
    const filas: FilaReservaReporte[] = [
      {
        reservaId: 'res-1',
        fecha: '2026-10-03',
        espacioId: 'esp-1',
        espacio: 'Aula 1',
        solicitante: 'Ana',
        estado: 'Aprobada',
        tiempoAprobacionHoras: 2,
      },
      {
        reservaId: 'res-2',
        fecha: '2026-10-03',
        espacioId: 'esp-1',
        espacio: 'Aula 1',
        solicitante: 'Luis',
        estado: 'Pendiente',
        tiempoAprobacionHoras: null,
      },
      {
        reservaId: 'res-3',
        fecha: '2026-10-10',
        espacioId: 'esp-2',
        espacio: 'Laboratorio',
        solicitante: 'Eva',
        estado: 'Aprobada',
        tiempoAprobacionHoras: 4,
      },
    ];

    expect(resumirReporteReservas(filas, 2026, 10)).toEqual({
      totalReservas: 3,
      tiempoPromedioAprobacionHoras: 3,
      etiquetas: Array.from({ length: 31 }, (_, index) => String(index + 1)),
      reservasPorDia: Array.from({ length: 31 }, (_, index) =>
        index === 2 ? 2 : index === 9 ? 1 : 0,
      ),
    });
    expect(construirCalendarioMensual(2026, 10, filas)[5]?.reservas).toBe(2);
  });

  it('devuelve promedio nulo si no hay tiempos de aprobación', () => {
    expect(resumirReporteReservas([], 2026, 10).tiempoPromedioAprobacionHoras).toBeNull();
  });
});
