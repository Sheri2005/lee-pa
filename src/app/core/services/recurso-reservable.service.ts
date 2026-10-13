// Servicio de recursos reservables · Dueño: G4 · Reservas
// Lo usa app-recursos-de-reserva (C4-18). Pendiente de conectar con la API del backend.
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DisponibilidadRecurso, RecursoReservable } from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class RecursoReservableService {
  /** Catálogo completo para la página de administración C4-16. */
  listar(): Observable<RecursoReservable[]> {
    // Pendiente: GET /recursos-reservables cuando exista la API.
    return of([]);
  }

  crear(datos: Omit<RecursoReservable, 'id'>): Observable<RecursoReservable | null> {
    // Pendiente: POST /recursos-reservables cuando exista la API.
    void datos;
    return of(null);
  }

  actualizar(recurso: RecursoReservable): Observable<RecursoReservable | null> {
    // Pendiente: PUT /recursos-reservables/{id} cuando exista la API.
    void recurso;
    return of(null);
  }

  cambiarEstado(id: number, estado: boolean): Observable<boolean> {
    // Pendiente: PATCH /recursos-reservables/{id}/estado cuando exista la API.
    void [id, estado];
    return of(false);
  }

  /**
   * Unidades libres de cada recurso activo en una fecha y franja: la cantidad total menos lo prestado
   * en reservas APROBADAS que se cruzan con la franja. El cálculo lo hará el backend.
   */
  disponibilidad(
    fecha: string,
    horaInicio: string,
    horaFin: string,
  ): Observable<DisponibilidadRecurso[]> {
    // Pendiente: GET /recursos-reservables/disponibilidad?fecha=&inicio=&fin= cuando exista la API.
    void [fecha, horaInicio, horaFin];
    return of([]);
  }
}
