import { TestBed } from '@angular/core/testing';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AsignacionDocenteService } from './asignacion-docente.service';

describe('AsignacionDocenteService', () => {
  function servicio() {
    return TestBed.inject(AsignacionDocenteService);
  }

  it('filtra activos, habilitados y disponibles, ordenando por carga proyectada válida', async () => {
    const respuesta = await firstValueFrom(servicio().obtenerCandidatos(1));
    expect(respuesta.candidatos.map((d) => d.docente.id)).toEqual([12, 7, 21]);
    expect(respuesta.candidatos.map((d) => d.cargaProyectada)).toEqual([12, 20, 24]);
  });

  it('lista solo los paralelos de la planificación y expone la carga actual confirmada', async () => {
    const panel = await firstValueFrom(servicio().listar(3));
    expect(panel.filas.map((f) => f.paralelo.id)).toEqual([1, 2, 3]);
    expect(panel.filas[0].cargaActual).toBe(20);
    expect(panel.filas[1].cargaActual).toBe(8); // sugerencia todavía no confirmada
    expect(panel.filas[2].cargaActual).toBeNull();
    expect(panel.editable).toBe(true);
    expect((await firstValueFrom(servicio().listar(2))).filas).toEqual([]);
  });

  it('acepta la sugerencia, emite una revisión y actualiza las opciones de otros paralelos', async () => {
    const s = servicio();
    const cambio = await firstValueFrom(s.confirmar(3, 2, 12));
    expect(cambio.estado).toBe('CONFIRMADO');
    expect(s.revision()).toBe(1);
    const panel = await firstValueFrom(s.listar(3));
    expect(panel.filas[1].paralelo.estadoDocente).toBe('CONFIRMADO');
    expect(panel.filas[1].cargaActual).toBe(12);
    const candidatos = await firstValueFrom(s.obtenerCandidatos(1));
    expect(candidatos.candidatos.find((d) => d.docente.id === 12)?.cargaProyectada).toBe(16);
  });

  it('reasigna liberando la carga anterior y no cuenta dos veces una confirmación repetida', async () => {
    const s = servicio();
    await firstValueFrom(s.confirmar(3, 1, 12));
    await firstValueFrom(s.confirmar(3, 1, 12));
    const candidatos = await firstValueFrom(s.obtenerCandidatos(1));
    expect(candidatos.candidatos.find((d) => d.docente.id === 12)?.cargaProyectada).toBe(12);
    expect(candidatos.candidatos.find((d) => d.docente.id === 7)?.cargaSinParalelo).toBe(16);
  });

  it('incluye carga de otras planificaciones del período, excluyendo períodos anteriores', async () => {
    const candidatos = await firstValueFrom(servicio().obtenerCandidatos(1));
    // María: 14 externas + 2 de otra planificación del período; no suma 6 del período anterior.
    expect(candidatos.candidatos.find((d) => d.docente.id === 7)?.cargaSinParalelo).toBe(16);
  });

  it('permite el límite exacto y rechaza sobrecarga sin modificar el estado', async () => {
    const s = servicio();
    await firstValueFrom(s.confirmar(3, 1, 21));
    await expect(firstValueFrom(s.confirmar(3, 2, 21))).rejects.toThrow('excede');
    await expect(firstValueFrom(s.confirmar(3, 1, 24))).rejects.toThrow('excede');
    const panel = await firstValueFrom(s.listar(3));
    expect(panel.filas[0].paralelo.docente?.id).toBe(21);
    expect(panel.filas[0].cargaActual).toBe(24);
    expect(panel.filas[1].paralelo.estadoDocente).toBe('SUGERIDO');
  });

  it('revalida escrituras concurrentes para no exceder la carga máxima', async () => {
    const s = servicio();
    const resultados = await Promise.allSettled([
      firstValueFrom(s.confirmar(3, 1, 21)),
      firstValueFrom(s.confirmar(3, 2, 21)),
    ]);
    expect(resultados.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(s.revision()).toBe(1);
  });

  it.each([22, 23, 25, 999])('rechaza docente no elegible: %s', async (id) => {
    await expect(firstValueFrom(servicio().confirmar(3, 1, id))).rejects.toThrow();
  });

  it('bloquea otra planificación y una planificación aprobada', async () => {
    await expect(firstValueFrom(servicio().confirmar(1, 1, 12))).rejects.toThrow('pertenece');
    await expect(firstValueFrom(servicio().confirmar(1, 4, 7))).rejects.toThrow('no admite');
  });

  it.each([0, -1, 1.5, NaN, 999])('rechaza identificadores inválidos: %s', async (id) => {
    await expect(firstValueFrom(servicio().listar(id))).rejects.toThrow();
    await expect(firstValueFrom(servicio().obtenerCandidatos(id))).rejects.toThrow();
  });

  it('devuelve copias sin compartir objetos mutables con la vista', async () => {
    const s = servicio();
    const [panel, sugerencias] = await firstValueFrom(
      forkJoin([s.listar(3), s.obtenerCandidatos(1)]),
    );
    panel.filas[0].paralelo.materia.nombre = 'Modificado';
    sugerencias.candidatos[0].docente.nombres = 'Modificado';
    const siguiente = await firstValueFrom(s.obtenerCandidatos(1));
    expect(siguiente.paralelo.materia.nombre).toBe('Cálculo Diferencial');
    expect(siguiente.candidatos[0].docente.nombres).toBe('Jorge Andrade');
  });
});
