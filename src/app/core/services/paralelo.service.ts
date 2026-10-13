import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { CursoPlanificado } from '../models/curso-planificado.model';
import { Paralelo, TipoEspacio } from '../models/paralelo.model';
import { Recurso } from '../models/recurso.model';
import { PARALELOS_MOCK } from '../mocks/paralelos.mock';
import { RECURSOS_MOCK } from '../mocks/recursos.mock';

/** Campos que el editor puede cambiar de un paralelo (HU G2-07). */
export interface CambiosParalelo {
  cupo?: number;
  tipoEspacioRequerido?: TipoEspacio;
  recursos?: Recurso[];
}

/** Códigos de paralelo disponibles, en orden: A, B, C… (curso_planificado → paralelo.codigo). */
const CODIGOS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Tope defensivo del prototipo: ningún curso debería necesitar más paralelos que códigos. */
export const MAXIMO_PARALELOS = CODIGOS.length;

/**
 * Paralelos de un curso planificado (Módulo 2 · Grupo 2 · HU G2-07).
 *
 * Mientras no exista backend trabaja en memoria sobre `PARALELOS_MOCK`, de modo que los
 * cambios se mantienen durante la sesión. Cuando exista la API solo cambia el cuerpo de cada
 * método (una llamada HTTP por operación) y los componentes no se tocan.
 */
@Injectable({ providedIn: 'root' })
export class ParaleloService {
  /** Copia propia para no mutar el mock importado. */
  private paralelos: Paralelo[] = PARALELOS_MOCK.map((p) => this.copiar(p));
  private siguienteId = Math.max(0, ...PARALELOS_MOCK.map((p) => p.id)) + 1;

  /** Paralelos del curso, ordenados por código. */
  listarPorCurso(cursoPlanificadoId: number): Observable<Paralelo[]> {
    return of(this.deCurso(cursoPlanificadoId)).pipe(delay(250));
  }

  /**
   * Agrega un paralelo al curso con el primer código libre y el cupo máximo de la
   * planificación. Las horas semanales se copian de la malla y no se piden al usuario.
   * Una materia compartida no se apertura aquí: la planifica su carrera responsable (HU G2-08).
   */
  agregar(curso: CursoPlanificado): Observable<Paralelo[]> {
    if (curso.esCompartida) {
      return throwError(
        () => new Error('Una materia compartida la apertura su carrera responsable'),
      );
    }
    const existentes = this.deCurso(curso.id);
    const codigo = CODIGOS.find((c) => !existentes.some((p) => p.codigo === c));
    if (!codigo) {
      return throwError(() => new Error(`Máximo ${MAXIMO_PARALELOS} paralelos por curso`));
    }
    this.paralelos.push({
      id: this.siguienteId++,
      cursoPlanificadoId: curso.id,
      codigo,
      cupo: curso.cupoMaximo,
      horasSemanales: curso.horasSemanales,
      tipoEspacioRequerido: 'AULA',
      materia: { ...curso.materia },
      docente: null,
      estadoDocente: 'SIN_ASIGNAR',
      recursos: [],
    });
    return this.listarPorCurso(curso.id);
  }

  /** Cambia cupo, tipo de espacio o recursos de un paralelo. */
  actualizar(paraleloId: number, cambios: CambiosParalelo): Observable<Paralelo[]> {
    const paralelo = this.paralelos.find((p) => p.id === paraleloId);
    if (!paralelo) {
      return throwError(() => new Error(`Paralelo ${paraleloId} no encontrado`));
    }
    if (cambios.cupo !== undefined) paralelo.cupo = cambios.cupo;
    if (cambios.tipoEspacioRequerido) paralelo.tipoEspacioRequerido = cambios.tipoEspacioRequerido;
    if (cambios.recursos) paralelo.recursos = cambios.recursos.map((r) => ({ ...r }));
    return this.listarPorCurso(paralelo.cursoPlanificadoId);
  }

  /** Elimina un paralelo del curso. */
  eliminar(paraleloId: number): Observable<Paralelo[]> {
    const indice = this.paralelos.findIndex((p) => p.id === paraleloId);
    if (indice === -1) {
      return throwError(() => new Error(`Paralelo ${paraleloId} no encontrado`));
    }
    const [eliminado] = this.paralelos.splice(indice, 1);
    return this.listarPorCurso(eliminado.cursoPlanificadoId);
  }

  /**
   * Catálogo de recursos que se pueden pedir por paralelo.
   * PENDIENTE (C3-11): consumir el catálogo del Grupo 3 cuando lo publique.
   */
  recursosDisponibles(): Recurso[] {
    return RECURSOS_MOCK.map((r) => ({ ...r }));
  }

  private deCurso(cursoPlanificadoId: number): Paralelo[] {
    return this.paralelos
      .filter((p) => p.cursoPlanificadoId === cursoPlanificadoId)
      .sort((a, b) => a.codigo.localeCompare(b.codigo, 'es'))
      .map((p) => this.copiar(p));
  }

  private copiar(p: Paralelo): Paralelo {
    return {
      ...p,
      materia: { ...p.materia },
      docente: p.docente ? { ...p.docente } : null,
      recursos: p.recursos?.map((r) => ({ ...r })) ?? [],
    };
  }
}
