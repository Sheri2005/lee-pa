import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { DOCENTES_MOCK } from '../mocks/docentes.mock';
import { MATERIAS_MOCK } from '../mocks/materias.mock';
import { Docente } from '../models/docente.model';
import { Materia } from '../models/materia.model';

export interface FiltrosDocente {
  /** Solo los docentes habilitados para esta materia. */
  materiaId?: number;
}

@Injectable({ providedIn: 'root' })
export class DocenteService {
  /**
   * Lista docentes; con `materiaId`, solo los habilitados para esa materia.
   * Cuando exista backend, se cambia el cuerpo de `listar` por una llamada HTTP
   * (`GET /api/docentes?materiaId=`) y los componentes no se tocan.
   */
  listar(filtros: FiltrosDocente = {}): Observable<Docente[]> {
    const { materiaId } = filtros;
    const datos = DOCENTES_MOCK.filter(
      (d) => materiaId == null || d.materiaIds.includes(materiaId),
    );
    return of(datos).pipe(delay(300));
  }

  /**
   * Materias para las que un docente está habilitado (vacío si no tiene o no existe).
   * Backend: `GET /api/docentes/:id/materias`.
   */
  listarMaterias(docenteId: number): Observable<Materia[]> {
    const docente = DOCENTES_MOCK.find((d) => d.id === docenteId);
    const materias = MATERIAS_MOCK.filter((m) => docente?.materiaIds.includes(m.id));
    return of(materias).pipe(delay(300));
  }
}