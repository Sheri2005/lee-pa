// Servicio de ocupación de espacios · Dueño: G4 · Reservas
// Lo usan app-reserva-form (C4-06), para comprobar cada fecha antes de enviar, y app-calendario-ocupacion (C4-14).
// Pendiente de conectar con la API del backend. Mientras tanto devuelve `null` ("sin datos"), nunca una lista
// vacía: una lista vacía significaría que el espacio está libre.
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  ConflictoOcurrencia,
  MotivoConflicto,
  Ocupacion,
  Ocurrencia,
  ResultadoDisponibilidad,
} from '../models/ocupacion.model';
import { Espacio } from '../models/espacio.model';

/** Política del módulo: minutos libres que deben quedar entre dos ocupaciones del mismo espacio. */
export const SEPARACION_MINUTOS = 15;

interface Franja {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

function enMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Ocupaciones que impiden reservar: las clases y las reservas aprobadas. Una pendiente se ve, pero no bloquea. */
export function bloqueaEspacio(ocupacion: Ocupacion): boolean {
  return ocupacion.tipo === 'CLASE' || ocupacion.estado === 'APROBADA';
}

/**
 * `CRUCE` si los horarios se solapan, `SEPARACION` si quedan menos de `separacion` minutos entre ambos,
 * o `null` si la ocupación no afecta a la franja.
 */
export function conflictoEntre(
  franja: Franja,
  ocupacion: Ocupacion,
  separacion = SEPARACION_MINUTOS,
): MotivoConflicto | null {
  if (franja.fecha !== ocupacion.fecha || !bloqueaEspacio(ocupacion)) return null;
  const inicio = enMinutos(franja.hora_inicio);
  const fin = enMinutos(franja.hora_fin);
  const ocupadoDesde = enMinutos(ocupacion.hora_inicio);
  const ocupadoHasta = enMinutos(ocupacion.hora_fin);
  if (inicio < ocupadoHasta && ocupadoDesde < fin) return 'CRUCE';
  if (inicio < ocupadoHasta + separacion && ocupadoDesde < fin + separacion) return 'SEPARACION';
  return null;
}

/** Una ocurrencia sin comprobar por cada fecha. */
export function ocurrenciasPendientes(
  fechas: readonly string[],
  horaInicio: string,
  horaFin: string,
): Ocurrencia[] {
  return fechas.map((fecha) => ({
    fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    estado: 'PENDIENTE',
    conflictos: [],
  }));
}

/** Compara cada fecha con la ocupación del espacio y devuelve el resultado de todas. */
export function evaluarDisponibilidad(
  espacioId: number,
  fechas: readonly string[],
  horaInicio: string,
  horaFin: string,
  ocupaciones: readonly Ocupacion[],
  separacion = SEPARACION_MINUTOS,
): ResultadoDisponibilidad {
  const ocurrencias = ocurrenciasPendientes(fechas, horaInicio, horaFin).map((ocurrencia) => {
    const conflictos: ConflictoOcurrencia[] = ocupaciones
      .filter((o) => o.espacio_id === espacioId)
      .map((ocupacion) => ({
        ocupacion,
        motivo: conflictoEntre(ocurrencia, ocupacion, separacion),
      }))
      .filter((c): c is ConflictoOcurrencia => c.motivo !== null)
      .sort((a, b) => a.ocupacion.hora_inicio.localeCompare(b.ocupacion.hora_inicio));
    return {
      ...ocurrencia,
      estado: conflictos.length ? 'CONFLICTO' : 'DISPONIBLE',
      conflictos,
    } satisfies Ocurrencia;
  });
  return {
    espacio_id: espacioId,
    disponible: ocurrencias.length > 0 && ocurrencias.every((o) => o.estado === 'DISPONIBLE'),
    ocurrencias,
  };
}

@Injectable({ providedIn: 'root' })
export class OcupacionService {
  /**
   * Clases (G3) y reservas pendientes o aprobadas (G4) de un espacio entre dos fechas, ambas incluidas.
   * `null` mientras no exista la API.
   */
  ocupacion(espacioId: number, desde: string, hasta: string): Observable<Ocupacion[] | null> {
    // Pendiente: GET /espacios/{espacioId}/ocupacion?desde=&hasta= cuando exista la API.
    void [espacioId, desde, hasta];
    return of(null);
  }

  /**
   * TEMPORAL: espacios activos que se pueden reservar, hasta que G3 · Horarios publique su servicio de
   * espacios (lo usa su app-selector-espacio). `null` mientras no exista la API.
   */
  espacios(): Observable<Espacio[] | null> {
    // Pendiente: GET /espacios?estado=true (G3) cuando exista la API.
    return of(null);
  }
}
