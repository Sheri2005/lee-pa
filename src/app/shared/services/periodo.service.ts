import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { PERIODOS_MOCK } from '../mocks/periodos.mock';
import { Periodo, PeriodoDatos } from '../models/periodo.model';

/**
 * Cuando exista backend, se cambia el cuerpo de cada método por una llamada HTTP y los
 * componentes no se tocan. Mientras tanto, los cambios viven en memoria (se pierden al recargar).
 */
@Injectable({ providedIn: 'root' })
export class PeriodoService {
  private periodos: Periodo[] = [...PERIODOS_MOCK];

  /** Lista todos los períodos académicos. Backend: `GET /api/periodos`. */
  listar(): Observable<Periodo[]> {
    return of([...this.periodos]).pipe(delay(300));
  }

  /** Crea un período y lo devuelve con su id. Backend: `POST /api/periodos`. */
  crear(datos: PeriodoDatos): Observable<Periodo> {
    const id = Math.max(0, ...this.periodos.map((p) => p.id)) + 1;
    const creado: Periodo = { ...datos, id };
    this.periodos = [...this.periodos, creado];
    return of(creado).pipe(delay(300));
  }

  /** Reemplaza los datos de un período. Backend: `PUT /api/periodos/:id`. */
  actualizar(id: number, datos: PeriodoDatos): Observable<Periodo> {
    const actualizado: Periodo = { ...datos, id };
    this.periodos = this.periodos.map((p) => (p.id === id ? actualizado : p));
    return of(actualizado).pipe(delay(300));
  }
}
