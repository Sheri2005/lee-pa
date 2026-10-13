import { Routes } from '@angular/router';
import { ShellLayoutComponent } from './shared/components/shell-layout/shell-layout';
import { AccesoDenegadoComponent } from './shared/components/acceso-denegado/acceso-denegado';

export const routes: Routes = [
  {
    path: '',
    component: ShellLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'planificacion' },
      
      // G2 · Planificación (Tus rutas)
      {
        path: 'demo/curso-manual',
        loadComponent: () =>
          import('./features/planificacion/curso-manual-demo/curso-manual-demo.component').then(
            (m) => m.CursoManualDemoComponent,
          ),
      },
      {
        path: 'planificacion',
        loadComponent: () =>
          import('./features/planificacion/planificaciones-lista/planificaciones-lista.component').then(
            (m) => m.PlanificacionesListaComponent,
          ),
      },
      {
        path: 'planificacion/:id',
        loadComponent: () =>
          import('./features/planificacion/planificacion-detalle/planificacion-detalle.component').then(
            (m) => m.PlanificacionDetalleComponent,
          ),
      },

      // Rutas entrantes desde main
      { path: 'acceso-denegado', component: AccesoDenegadoComponent },
      {
        path: 'gestion/panel',
        loadComponent: () =>
          import('./features/gestion/panel-administrativo/panel-administrativo').then(
            (m) => m.PanelAdministrativoComponent,
          ),
      },
      {
        path: 'gestion/facultades',
        loadComponent: () =>
          import('./features/gestion/facultades-lista/facultades-lista').then(
            (m) => m.FacultadesListaComponent,
          ),
      },
      {
        path: 'gestion/periodos',
        loadComponent: () =>
          import('./features/gestion/periodos-lista/periodos-lista').then(
            (m) => m.PeriodosListaComponent,
          ),
      },
      {
        path: 'gestion/carga-masiva',
        loadComponent: () =>
          import('./features/gestion/carga-masiva-pagina/carga-masiva-pagina').then(
            (m) => m.CargaMasivaPaginaComponent,
          ),
      },
      {
        path: 'gestion/carga-masiva/bitacora',
        loadComponent: () =>
          import('./features/gestion/bitacora-importaciones/bitacora-importaciones').then(
            (m) => m.BitacoraImportacionesComponent,
          ),
      },
      {
        path: 'reportes/cursos-paralelos',
        loadComponent: () =>
          import('./features/aprobaciones-reportes/reporte-cursos-paralelos/reporte-cursos-paralelos').then(
            (modulo) => modulo.ReporteCursosParalelosComponent,
          ),
      },
      {
        path: 'reportes/ocupacion',
        loadComponent: () =>
          import('./features/aprobaciones-reportes/reporte-ocupacion/reporte-ocupacion').then(
            (modulo) => modulo.ReporteOcupacionComponent,
          ),
      },
      {
        path: 'reportes/carga-docente',
        loadComponent: () =>
          import('./features/aprobaciones-reportes/reporte-carga-docente/reporte-carga-docente').then(
            (modulo) => modulo.ReporteCargaDocenteComponent,
          ),
      },
      {
        path: 'reportes/materias-compartidas',
        loadComponent: () =>
          import('./features/aprobaciones-reportes/reporte-materias-compartidas/reporte-materias-compartidas').then(
            (modulo) => modulo.ReporteMateriasCompartidasComponent,
          ),
      },
      {
        path: 'reportes/reservas',
        loadComponent: () =>
          import('./features/aprobaciones-reportes/reporte-reservas/reporte-reservas').then(
            (modulo) => modulo.ReporteReservasComponent,
          ),
      },
    ],
  },
];
