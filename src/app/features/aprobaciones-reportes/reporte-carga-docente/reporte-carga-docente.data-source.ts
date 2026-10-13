import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  CatalogosReporteCargaDocente,
  ConsultaReporteCargaDocente,
  FilaCargaDocente,
} from './reporte-carga-docente.models';

export interface ReporteCargaDocenteDataSource {
  cargarCatalogos(): Observable<CatalogosReporteCargaDocente>;
  consultar(
    consulta: ConsultaReporteCargaDocente,
  ): Observable<readonly FilaCargaDocente[]>;
}

export const REPORTE_CARGA_DOCENTE_SOURCE =
  new InjectionToken<ReporteCargaDocenteDataSource>(
    'REPORTE_CARGA_DOCENTE_SOURCE',
  );
