import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  CatalogosReporteReservas,
  ConsultaReporteReservas,
  FilaReservaReporte,
} from './reporte-reservas.models';

export interface ReporteReservasDataSource {
  cargarCatalogos(): Observable<CatalogosReporteReservas>;
  consultar(
    consulta: ConsultaReporteReservas,
  ): Observable<readonly FilaReservaReporte[]>;
}

export const REPORTE_RESERVAS_SOURCE =
  new InjectionToken<ReporteReservasDataSource>('REPORTE_RESERVAS_SOURCE');
