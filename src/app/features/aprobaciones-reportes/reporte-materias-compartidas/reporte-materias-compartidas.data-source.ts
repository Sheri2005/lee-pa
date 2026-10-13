import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  CatalogosReporteMateriasCompartidas,
  ConsultaReporteMateriasCompartidas,
  FilaMateriaCompartida,
} from './reporte-materias-compartidas.models';

export interface ReporteMateriasCompartidasDataSource {
  cargarCatalogos(): Observable<CatalogosReporteMateriasCompartidas>;
  consultar(
    consulta: ConsultaReporteMateriasCompartidas,
  ): Observable<readonly FilaMateriaCompartida[]>;
}

export const REPORTE_MATERIAS_COMPARTIDAS_SOURCE =
  new InjectionToken<ReporteMateriasCompartidasDataSource>(
    'REPORTE_MATERIAS_COMPARTIDAS_SOURCE',
  );
