/**
 * C2-04 · app-planificacion-encabezado
 * Grupo dueño: G2 · Planificación (responsable: Raúl Garay)
 * Reutilizado por: G3 (app-armado-horario, app-resumen-horario)
 *                  G5 (app-exportacion-siac)
 * Para pedir cambios: abrir un issue en el repositorio (no copiar el componente).
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Planificacion } from '../../../core/models/planificacion.model';

@Component({
  selector: 'app-planificacion-encabezado',
  templateUrl: './planificacion-encabezado.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanificacionEncabezadoComponent {
  readonly planificacion = input.required<Planificacion>();
}