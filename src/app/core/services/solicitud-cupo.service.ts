import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  ListadoMateriasCompartidas,
  MateriaCompartida,
} from '../models/materia-compartida.model';
import { MATERIAS_COMPARTIDAS_MOCK } from '../mocks/materias-compartidas.mock';

/** Tope de cupos por solicitud en el prototipo (el backend validará de verdad). */
export const MAXIMO_CUPOS_SOLICITUD = 200;

/**
 * Materias compartidas y solicitudes de cupo de una planificación dependiente
 * (Módulo 2 · Grupo 2 · HU G2-08).
 *
 * Mientras no exista backend trabaja en memoria sobre `MATERIAS_COMPARTIDAS_MOCK`, así que las
 * solicitudes se mantienen durante la sesión. Cuando exista la API solo cambia el cuerpo de
 * cada método y el componente no se toca.
 */
@Injectable({ providedIn: 'root' })
export class SolicitudCupoService {
  private datos: Record<number, ListadoMateriasCompartidas> = structuredClone(
    MATERIAS_COMPARTIDAS_MOCK,
  );
  private siguienteId =
    Math.max(
      0,
      ...Object.values(MATERIAS_COMPARTIDAS_MOCK).flatMap((listado) =>
        listado.materias.flatMap((m) => m.solicitudes.map((s) => s.id)),
      ),
    ) + 1;

  /** Materias compartidas de la malla de la carrera dependiente. */
  listarMateriasCompartidas(planificacionId: number): Observable<ListadoMateriasCompartidas> {
    const listado = this.datos[planificacionId];
    if (!listado) {
      return throwError(() => new Error(`Planificación ${planificacionId} no encontrada`));
    }
    return of(structuredClone(listado)).pipe(delay(300));
  }

  /**
   * Registra una solicitud de N cupos en un paralelo abierto por la carrera responsable.
   * Solo se puede pedir si la responsable ya planificó la materia y el paralelo tiene cupos.
   */
  solicitarCupos(
    planificacionId: number,
    materiaId: number,
    paraleloId: number,
    cupos: number,
  ): Observable<ListadoMateriasCompartidas> {
    const listado = this.datos[planificacionId];
    const materia = listado?.materias.find((m) => m.materia.id === materiaId);
    if (!listado || !materia) {
      return throwError(() => new Error('No se encontró la materia en esta planificación'));
    }
    if (materia.estadoResponsable !== 'PLANIFICADA') {
      return throwError(
        () =>
          new Error(
            `${materia.materia.carreraResponsable} todavía no planificó ${materia.materia.codigo}: no se pueden pedir cupos aún.`,
          ),
      );
    }
    const paralelo = materia.paralelosAbiertos.find((p) => p.id === paraleloId);
    if (!paralelo) {
      return throwError(() => new Error('Ese paralelo ya no está abierto'));
    }
    if (!Number.isInteger(cupos) || cupos < 1 || cupos > MAXIMO_CUPOS_SOLICITUD) {
      return throwError(
        () => new Error(`Pide entre 1 y ${MAXIMO_CUPOS_SOLICITUD} cupos`),
      );
    }
    if (cupos > paralelo.cuposDisponibles) {
      return throwError(
        () =>
          new Error(
            `El paralelo ${paralelo.codigo} solo tiene ${paralelo.cuposDisponibles} cupos disponibles.`,
          ),
      );
    }
    materia.solicitudes.push({
      id: this.siguienteId++,
      paraleloId,
      planificacionId,
      cupos,
      estado: 'PENDIENTE',
    });
    return this.listarMateriasCompartidas(planificacionId);
  }

  /** Cupos ya solicitados por esta planificación en una materia (sin contar los rechazados). */
  cuposSolicitados(materia: MateriaCompartida): number {
    return materia.solicitudes
      .filter((s) => s.estado !== 'RECHAZADA')
      .reduce((total, s) => total + s.cupos, 0);
  }
}
