import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { MALLAS_MOCK, NIVELES_POR_MALLA_MOCK } from '../mocks/mallas.mock';
import { Malla, MallaDatos } from '../models/malla.model';

/**
 * Cuando exista backend, se cambia el cuerpo de cada método por una llamada HTTP y los
 * componentes no se tocan. Mientras tanto, los cambios viven en memoria (se pierden al recargar).
 */
@Injectable({ providedIn: 'root' })
export class MallaService {
  private mallas: Malla[] = [...MALLAS_MOCK];

  /** Lista todas las mallas. Backend: `GET /api/mallas`. */
  listar(): Observable<Malla[]> {
    return of([...this.mallas]).pipe(delay(300));
  }

  /** Números de nivel (1..n) de una malla. Backend: `GET /api/mallas/:id/niveles`. */
  listarNiveles(mallaId: number): Observable<number[]> {
    const total = NIVELES_POR_MALLA_MOCK[mallaId] ?? 0;
    return of(Array.from({ length: total }, (_, i) => i + 1)).pipe(delay(300));
  }

  /**
   * Crea una malla de la carrera indicada, vigente, y la devuelve con su id.
   * Backend: `POST /api/mallas`.
   */
  crear(datos: MallaDatos, carreraId: number): Observable<Malla> {
    const id = Math.max(0, ...this.mallas.map((m) => m.id)) + 1;
    const creada: Malla = { ...datos, id, carreraId, vigente: true };
    this.mallas = [...this.mallas, creada];
    return of(creada).pipe(delay(300));
  }

  /**
   * Cambia código, nombre y año de vigencia de una malla; conserva su carrera y su vigencia.
   * Backend: `PUT /api/mallas/:id`.
   */
  actualizar(id: number, datos: MallaDatos): Observable<Malla> {
    const actual = this.mallas.find((m) => m.id === id);
    if (!actual) return throwError(() => new Error(`No existe la malla ${id}.`));

    const actualizada: Malla = { ...actual, ...datos };
    this.mallas = this.mallas.map((m) => (m.id === id ? actualizada : m));
    return of(actualizada).pipe(delay(300));
  }
}
