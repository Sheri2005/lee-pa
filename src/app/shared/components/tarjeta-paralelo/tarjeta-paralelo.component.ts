/**
 * app-tarjeta-paralelo · C2-12 · Compartido UI
 * Grupo dueño: G2 · Planificación (responsable: Paula Martillo)
 * Reutilizan: G3 (paralelos por ubicar en la grilla) y G5 (resumen y exportación).
 * HU: G2-07. Ejemplo de uso en README.md (misma carpeta).
 */
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ETIQUETAS_TIPO_ESPACIO, Paralelo } from '../../../core/models/paralelo.model';

/** Tipo de dato con el que viaja el paralelo al arrastrar (lo lee la grilla de G3). */
export const PARALELO_DRAG_TYPE = 'application/x-spare-paralelo';

@Component({
  selector: 'app-tarjeta-paralelo',
  templateUrl: './tarjeta-paralelo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
    role: 'button',
    tabindex: '0',
    '[attr.draggable]': 'arrastrable()',
    '[attr.aria-label]': 'etiquetaAccesible()',
    '(click)': 'emitirSeleccion()',
    '(keydown.enter)': 'emitirSeleccion()',
    '(keydown.space)': 'emitirSeleccion($event)',
    '(dragstart)': 'alArrastrar($event)',
  },
})
export class TarjetaParaleloComponent {
  /** Paralelo a mostrar. */
  readonly paralelo = input.required<Paralelo>();
  /** Si es true, la tarjeta se puede arrastrar (p. ej. a la grilla de horarios). */
  readonly arrastrable = input(false);
  /** Horas ya ubicadas en el horario. Si no se envía, no se muestra el progreso. */
  readonly horasUbicadas = input<number>();

  /** Se emite al hacer clic o presionar Enter/Espacio sobre la tarjeta. */
  readonly seleccionar = output<Paralelo>();

  readonly tipoEspacio = computed(() => ETIQUETAS_TIPO_ESPACIO[this.paralelo().tipoEspacioRequerido]);

  readonly muestraProgreso = computed(() => this.horasUbicadas() !== undefined);

  readonly horasPendientes = computed(() =>
    Math.max(this.paralelo().horasSemanales - (this.horasUbicadas() ?? 0), 0),
  );

  readonly porcentajeUbicado = computed(() => {
    const total = this.paralelo().horasSemanales;
    if (!total) return 0;
    return Math.min(Math.round(((this.horasUbicadas() ?? 0) / total) * 100), 100);
  });

  readonly iniciales = computed(() => {
    const nombres = this.paralelo().docente?.nombres ?? '';
    return nombres
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  });

  readonly etiquetaAccesible = computed(() => {
    const p = this.paralelo();
    let texto = `Paralelo ${p.codigo} de ${p.materia.nombre}, ${p.cupo} cupos, ${p.horasSemanales} horas semanales`;
    if (this.muestraProgreso()) texto += `, ${this.horasPendientes()} horas por ubicar`;
    return texto;
  });

  emitirSeleccion(evento?: Event): void {
    evento?.preventDefault(); // evita que Espacio haga scroll
    this.seleccionar.emit(this.paralelo());
  }

  alArrastrar(evento: DragEvent): void {
    if (!this.arrastrable() || !evento.dataTransfer) {
      evento.preventDefault();
      return;
    }
    const p = this.paralelo();
    evento.dataTransfer.effectAllowed = 'move';
    evento.dataTransfer.setData(PARALELO_DRAG_TYPE, JSON.stringify(p));
    evento.dataTransfer.setData('text/plain', String(p.id));
  }
}
