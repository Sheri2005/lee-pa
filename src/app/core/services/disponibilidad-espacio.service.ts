// Servicio de disponibilidad de espacios · Dueño: G4 · Reservas
// Lo usan app-buscar-espacios (C4-01), para buscar espacios libres, y app-espacios-alternativos (C4-08), para
// sugerir alternativas. Pendiente de conectar con la API del backend.
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Espacio } from '../models/espacio.model';
import { AlternativaEspacio, FiltroDisponibilidad } from '../models/ocupacion.model';
import { SolicitudReserva } from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class DisponibilidadEspacioService {
  /** Espacios activos y libres que cumplen todos los filtros solicitados. */
  buscar(filtros: Readonly<FiltroDisponibilidad>): Observable<readonly Espacio[]> {
    // Pendiente: GET /espacios/disponibilidad?... cuando exista la API.
    void filtros;
    return of([]);
  }

  buscarAlternativas(solicitud: SolicitudReserva): Observable<AlternativaEspacio[]> {
    // Pendiente: POST /reservas/alternativas cuando exista la API.
    void solicitud;
    return of([]);
  }
}
