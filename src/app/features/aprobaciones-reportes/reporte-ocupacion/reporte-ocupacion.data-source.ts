import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  CatalogosReporteOcupacion,
  ConsultaReporteOcupacion,
  ResultadoReporteOcupacion,
} from './reporte-ocupacion.models';

export interface ReporteOcupacionDataSource {
  cargarCatalogos(): Observable<CatalogosReporteOcupacion>;
  consultar(
    consulta: ConsultaReporteOcupacion,
  ): Observable<ResultadoReporteOcupacion>;
}

export const REPORTE_OCUPACION_SOURCE =
  new InjectionToken<ReporteOcupacionDataSource>('REPORTE_OCUPACION_SOURCE');
