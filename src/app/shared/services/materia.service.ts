import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { MATERIAS_MOCK } from '../mocks/materias.mock';
import { Materia } from '../models/materia.model';

export interface FiltrosMateria {
  carreraResponsableId?: number;
  mallaId?: number;
}

@Injectable({ providedIn: 'root' })
export class MateriaService {
  /**
   * Lista materias; si se pasan filtros, solo devuelve las que cumplen todos.
   * Cuando exista backend, se cambia el cuerpo de `listar` por una llamada HTTP
   * (`GET /api/materias?carreraResponsableId=&mallaId=`) y los componentes no se tocan.
   */
  listar(filtros: FiltrosMateria = {}): Observable<Materia[]> {
    const { carreraResponsableId, mallaId } = filtros;
    const datos = MATERIAS_MOCK.filter(
      (m) =>
        (carreraResponsableId == null || m.carreraResponsableId === carreraResponsableId) &&
        (mallaId == null || m.mallaIds.includes(mallaId)),
    );
    return of(datos).pipe(delay(300));
  }
}
