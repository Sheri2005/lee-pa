// Servicio de reservas · Dueño: G4 · Reservas
// Lo usan app-resumen-reserva (C4-13) y app-reserva-form (C4-06). Pendiente de conectar con la API del backend.
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  NuevaSolicitudReserva,
  ResumenReserva,
  SolicitudRegistrada,
} from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  /** Resumen de solo lectura de una reserva, o `null` si no existe. */
  obtenerResumen(reservaId: number): Observable<ResumenReserva | null> {
    // Pendiente: GET /reservas/{reservaId}/resumen cuando exista la API.
    void reservaId;
    return of(null);
  }

  /**
   * Registra la solicitud y la deja pendiente de aprobación (G5). El backend valida otra vez cada fecha.
   * `null` mientras no exista la API: la solicitud no se ha registrado.
   */
  solicitar(solicitud: NuevaSolicitudReserva): Observable<SolicitudRegistrada | null> {
    // Pendiente: POST /reservas/solicitudes cuando exista la API.
    void solicitud;
    return of(null);
  }
}
