import { Injectable, signal } from '@angular/core';
import { Observable, timer, map } from 'rxjs';
import {
  DOCENTES_PLANIFICACION_MOCK,
  PARALELOS_ASIGNACION_MOCK,
} from '../mocks/asignacion-planificacion.mock';
import { PLANIFICACIONES_MOCK } from '../mocks/planificaciones.mock';
import { CandidatoDocente, SugerenciaDocente } from '../models/asignacion-docente.model';
import { CambioAsignacion, PanelAsignacion } from '../models/asignacion-planificacion.model';

/** G2: estado mock común para C2-13 y C2-14. Se reinicia al recargar la aplicación. */
@Injectable({ providedIn: 'root' })
export class AsignacionDocenteService {
  private readonly paralelos = structuredClone(PARALELOS_ASIGNACION_MOCK);
  private readonly docentes = structuredClone(DOCENTES_PLANIFICACION_MOCK);
  private readonly version = signal(0);
  readonly revision = this.version.asReadonly();

  listar(planificacionId: number): Observable<PanelAsignacion> {
    return timer(200).pipe(
      map(() => {
        const planificacion = this.planificacion(planificacionId);
        return {
          planificacionId,
          editable: this.editable(planificacionId),
          filas: this.paralelos
            .filter((item) => item.planificacionId === planificacionId)
            .map((item) => {
              const docente = this.docentes.find((d) => d.docente.id === item.paralelo.docente?.id);
              return {
                paralelo: structuredClone(item.paralelo),
                cargaActual: docente
                  ? this.carga(docente.docente.id, planificacion.periodo.id)
                  : null,
                cargaMaxima: docente?.docente.cargaMaxima ?? null,
                opcionesManuales: this.opciones(item.paralelo.id),
              };
            }),
        };
      }),
    );
  }

  obtenerCandidatos(paraleloId: number): Observable<SugerenciaDocente> {
    return timer(200).pipe(
      map(() => ({
        paralelo: structuredClone(this.paralelo(paraleloId).paralelo),
        candidatos: this.opciones(paraleloId).filter(
          (d) => d.cargaProyectada <= d.docente.cargaMaxima,
        ),
      })),
    );
  }

  confirmar(
    planificacionId: number,
    paraleloId: number,
    docenteId: number,
  ): Observable<CambioAsignacion> {
    // La validación ocurre al efectuar la escritura, no con el snapshot de la pantalla.
    return timer(200).pipe(
      map(() => {
        const item = this.paralelo(paraleloId);
        if (item.planificacionId !== planificacionId)
          throw new Error('El paralelo no pertenece a esta planificación.');
        if (!this.editable(planificacionId)) throw new Error('La planificación no admite cambios.');
        const opcion = this.opciones(paraleloId).find((d) => d.docente.id === docenteId);
        if (!opcion)
          throw new Error('El docente no está activo, habilitado o disponible para este paralelo.');
        if (opcion.cargaProyectada > opcion.docente.cargaMaxima)
          throw new Error('La asignación excede la carga máxima del docente.');
        item.paralelo.docente = { id: opcion.docente.id, nombres: opcion.docente.nombres };
        item.paralelo.estadoDocente = 'CONFIRMADO';
        this.version.update((v) => v + 1);
        return {
          planificacionId,
          paraleloId,
          docente: { ...opcion.docente },
          estado: 'CONFIRMADO' as const,
        };
      }),
    );
  }

  private opciones(paraleloId: number): CandidatoDocente[] {
    const item = this.paralelo(paraleloId);
    const periodoId = this.planificacion(item.planificacionId).periodo.id;
    const horas = item.paralelo.horasSemanales;
    if (!Number.isFinite(horas) || horas <= 0) throw new Error('Horas del paralelo inválidas.');
    return this.docentes
      .filter(
        (d) =>
          d.activo &&
          d.materiasHabilitadas.includes(item.paralelo.materia.id) &&
          d.paralelosDisponibles.includes(paraleloId),
      )
      .map((d) => {
        if (!Number.isFinite(d.docente.cargaMaxima) || d.docente.cargaMaxima <= 0)
          throw new Error('Carga máxima inválida.');
        const cargaSinParalelo = this.carga(d.docente.id, periodoId, paraleloId);
        return {
          docente: { ...d.docente },
          cargaSinParalelo,
          cargaProyectada: cargaSinParalelo + horas,
        };
      })
      .sort(
        (a, b) =>
          a.cargaSinParalelo - b.cargaSinParalelo ||
          a.docente.nombres.localeCompare(b.docente.nombres, 'es') ||
          a.docente.id - b.docente.id,
      );
  }

  private carga(docenteId: number, periodoId: number, excluirParaleloId?: number): number {
    const docente = this.docentes.find((d) => d.docente.id === docenteId);
    const externa = docente?.cargaExternaPorPeriodo[periodoId];
    if (externa === undefined || !Number.isFinite(externa) || externa < 0)
      throw new Error('Falta una carga base válida para este período.');
    const total = this.paralelos.reduce((horas, item) => {
      const p = item.paralelo;
      if (
        p.id === excluirParaleloId ||
        p.docente?.id !== docenteId ||
        p.estadoDocente !== 'CONFIRMADO' ||
        this.planificacion(item.planificacionId).periodo.id !== periodoId
      )
        return horas;
      if (!Number.isFinite(p.horasSemanales) || p.horasSemanales <= 0)
        throw new Error('Horas asignadas inválidas.');
      return horas + p.horasSemanales;
    }, externa);
    if (!Number.isFinite(total)) throw new Error('Carga total inválida.');
    return total;
  }

  private paralelo(id: number) {
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new Error('Identificador de paralelo inválido.');
    const item = this.paralelos.find((p) => p.paralelo.id === id);
    if (!item) throw new Error('Paralelo inexistente.');
    return item;
  }

  private planificacion(id: number) {
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new Error('Identificador de planificación inválido.');
    const item = PLANIFICACIONES_MOCK.find((p) => p.id === id);
    if (!item) throw new Error('Planificación inexistente.');
    return item;
  }

  private editable(id: number): boolean {
    // Política propuesta para el prototipo; acordar estados editables con el equipo.
    return ['BORRADOR', 'CON_CAMBIOS'].includes(this.planificacion(id).estado);
  }
}
