import { Injectable } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';
import {
  DisponibilidadCargada,
  DocenteParaDisponibilidad,
  PeriodoResumen,
} from '../models/disponibilidad.model';
import { FranjaHoraria } from '../models/franja.model';
import {
  DISPONIBILIDAD_MOCK,
  DOCENTES_MOCK,
  FRANJAS_MOCK,
  PERIODOS_MOCK,
} from '../mocks/disponibilidad.mock';

/**
 * Disponibilidad docente por período (Módulo 2 · Grupo 2 · HU G2-09).
 *
 * Mientras no exista backend trabaja en memoria sobre `DISPONIBILIDAD_MOCK`, así que lo que se
 * guarda se mantiene durante la sesión. Cuando exista la API solo cambia el cuerpo de cada
 * método; la pantalla no se toca.
 */
@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private guardada: Record<string, number[]> = structuredClone(DISPONIBILIDAD_MOCK);

  /** Períodos entre los que se puede elegir (catálogo del M1). */
  listarPeriodos(): Observable<PeriodoResumen[]> {
    return of(PERIODOS_MOCK.map((p) => ({ ...p }))).pipe(delay(150));
  }

  /** Docentes disponibles para registrar (catálogo del M1). */
  listarDocentes(): Observable<DocenteParaDisponibilidad[]> {
    return of(DOCENTES_MOCK.map((d) => ({ ...d }))).pipe(delay(150));
  }

  /**
   * Franjas del tipo del período elegido más las que el docente ya tiene marcadas.
   * Las franjas salen del catálogo del M3 según `periodo.tipo` (criterio de la HU G2-09).
   */
  obtenerDisponibilidad(docenteId: number, periodoId: number): Observable<DisponibilidadCargada> {
    const periodo = PERIODOS_MOCK.find((p) => p.id === periodoId);
    const docente = DOCENTES_MOCK.find((d) => d.id === docenteId);
    if (!periodo || !docente) {
      return throwError(() => new Error('No se encontró el período o el docente'));
    }
    const franjas: FranjaHoraria[] = FRANJAS_MOCK[periodo.tipo].map((f) => ({ ...f }));
    return of({
      periodo: { ...periodo },
      docente: { ...docente },
      franjas,
      franjasDisponibles: [...(this.guardada[this.clave(docenteId, periodoId)] ?? [])],
    }).pipe(delay(300));
  }

  /** Reemplaza la disponibilidad del docente en ese período por las franjas marcadas. */
  guardar(
    docenteId: number,
    periodoId: number,
    franjaIds: number[],
  ): Observable<DisponibilidadCargada> {
    const periodo = PERIODOS_MOCK.find((p) => p.id === periodoId);
    if (!periodo) {
      return throwError(() => new Error('No se encontró el período'));
    }
    const validas = new Set(FRANJAS_MOCK[periodo.tipo].map((f) => f.id));
    if (franjaIds.some((id) => !validas.has(id))) {
      return throwError(
        () => new Error('Hay franjas que no corresponden al tipo de este período'),
      );
    }
    this.guardada[this.clave(docenteId, periodoId)] = [...new Set(franjaIds)].sort(
      (a, b) => a - b,
    );
    return this.obtenerDisponibilidad(docenteId, periodoId);
  }

  /**
   * Copia la disponibilidad del período anterior del mismo tipo (criterio opcional de G2-09).
   * Solo sirve si ese período tiene algo registrado para el docente.
   */
  copiarDelPeriodoAnterior(docenteId: number, periodoId: number): Observable<number[]> {
    const periodo = PERIODOS_MOCK.find((p) => p.id === periodoId);
    if (!periodo) {
      return throwError(() => new Error('No se encontró el período'));
    }
    const anterior = PERIODOS_MOCK.filter(
      (p) => p.tipo === periodo.tipo && p.id !== periodo.id,
    ).find((p) => (this.guardada[this.clave(docenteId, p.id)] ?? []).length > 0);
    if (!anterior) {
      return throwError(
        () =>
          new Error(
            `${this.nombreDocente(docenteId)} no tiene disponibilidad registrada en un período ${periodo.tipo.toLowerCase()} anterior.`,
          ),
      );
    }
    return of([...this.guardada[this.clave(docenteId, anterior.id)]]).pipe(
      delay(200),
      map((ids) => [...ids]),
    );
  }

  /** Período del que se copiaría la disponibilidad, si hay alguno. */
  periodoAnteriorConDatos(docenteId: number, periodoId: number): PeriodoResumen | null {
    const periodo = PERIODOS_MOCK.find((p) => p.id === periodoId);
    if (!periodo) return null;
    return (
      PERIODOS_MOCK.filter((p) => p.tipo === periodo.tipo && p.id !== periodo.id).find(
        (p) => (this.guardada[this.clave(docenteId, p.id)] ?? []).length > 0,
      ) ?? null
    );
  }

  private nombreDocente(docenteId: number): string {
    return DOCENTES_MOCK.find((d) => d.id === docenteId)?.nombres ?? 'El docente';
  }

  private clave(docenteId: number, periodoId: number): string {
    return `${docenteId}:${periodoId}`;
  }
}
