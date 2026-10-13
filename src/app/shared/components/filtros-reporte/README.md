# Filtros de reporte

Componente standalone compartido del Grupo 5 para los filtros C5-13: facultad, carrera dependiente, período y rango de fechas. No consulta servicios; entrega los criterios seleccionados a la pantalla consumidora.

## Contrato

- `facultades`: opciones `{ id, nombre }`.
- `carreras`: opciones `{ id, nombre, facultadId }`.
- `periodos`: opciones `{ id, nombre }`.
- `filtrosAplicados`: evento emitido al aplicar o limpiar el formulario. Sus campos `facultadId`, `carreraId`, `periodoId`, `fechaInicio` y `fechaFin` son `string | null`.
- Las fechas usan el formato `YYYY-MM-DD`. Un límite de fecha puede quedar vacío; si ambos están definidos, la fecha inicial debe ser anterior o igual a la final.
- La lista de carreras depende de la facultad actual. Al cambiar de facultad, el componente limpia la carrera previamente seleccionada.

## Uso desde un reporte

Importa `FiltrosReporteComponent` y los tipos exportados por el directorio:

```ts
import { Component } from '@angular/core';
import {
  type FiltrosReporte,
  FiltrosReporteComponent,
  type OpcionCarreraReporte,
  type OpcionFiltroReporte,
} from '../../../shared/components/filtros-reporte';

@Component({
  standalone: true,
  imports: [FiltrosReporteComponent],
  templateUrl: './reporte-cursos-paralelos.html',
})
export class ReporteCursosParalelosComponent {
  readonly facultades: OpcionFiltroReporte[] = [];
  readonly carreras: OpcionCarreraReporte[] = [];
  readonly periodos: OpcionFiltroReporte[] = [];

  aplicarFiltros(filtros: FiltrosReporte): void {
    // Pasar los criterios al servicio del reporte.
  }
}
```

```html
<app-filtros-reporte
  [facultades]="facultades"
  [carreras]="carreras"
  [periodos]="periodos"
  (filtrosAplicados)="aplicarFiltros($event)"
/>
```
