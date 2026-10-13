import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  CatalogosCursosParalelos,
  ConsultaCursosParalelos,
  FilaCursosParalelos,
} from './reporte-cursos-paralelos.models';

export interface ReporteCursosParalelosDataSource {
  cargarCatalogos(): Observable<CatalogosCursosParalelos>;
  consultar(
    consulta: ConsultaCursosParalelos,
  ): Observable<readonly FilaCursosParalelos[]>;
}

export const REPORTE_CURSOS_PARALELOS_SOURCE =
  new InjectionToken<ReporteCursosParalelosDataSource>(
    'REPORTE_CURSOS_PARALELOS_SOURCE',
  );
