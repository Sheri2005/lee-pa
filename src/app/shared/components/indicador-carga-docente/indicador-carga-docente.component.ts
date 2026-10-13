/**
 * app-indicador-carga-docente · C2-15 · Compartido UI
 * Grupo dueño: G2 · Planificación (responsable: Xavier Cardenas)
 * Reutilizan: G3 (vista de horario) y G5 (reporte de carga docente).
 * HU: G2-11. Ejemplo de uso en README.md (misma carpeta).
 */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-indicador-carga-docente',
  templateUrl: './indicador-carga-docente.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class IndicadorCargaDocenteComponent {
  /** Horas asignadas al docente en el período consultado. */
  readonly asignadas = input.required<number>();
  /** Carga máxima del mismo período, mayor que cero. */
  readonly maxima = input.required<number>();

  private readonly formatoNumero = new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 2,
  });

  readonly datosValidos = computed(() => {
    const asignadas = this.asignadas();
    const maxima = this.maxima();
    return (
      Number.isFinite(asignadas) &&
      Number.isFinite(maxima) &&
      asignadas >= 0 &&
      maxima > 0 &&
      Number.isFinite((asignadas / maxima) * 100)
    );
  });

  readonly sobrecarga = computed(() => this.datosValidos() && this.asignadas() > this.maxima());

  readonly alLimite = computed(() => this.datosValidos() && this.asignadas() === this.maxima());

  readonly porcentaje = computed(() =>
    this.datosValidos() ? (this.asignadas() / this.maxima()) * 100 : 0,
  );

  /** Solo se limita el ancho visual; el texto conserva el porcentaje real. */
  readonly anchoBarra = computed(() => Math.min(this.porcentaje(), 100));

  readonly mensaje = computed(() => {
    if (!this.datosValidos()) {
      return 'Ingresa horas asignadas válidas y una carga máxima mayor que cero.';
    }
    if (this.sobrecarga()) {
      const exceso = this.asignadas() - this.maxima();
      return `Sobrecarga: ${this.formatear(exceso)} h por encima del máximo.`;
    }
    if (this.alLimite()) {
      return 'Carga máxima alcanzada.';
    }
    return `Disponibles: ${this.formatear(this.maxima() - this.asignadas())} h.`;
  });

  readonly etiquetaAccesible = computed(() => {
    if (!this.datosValidos()) return this.mensaje();
    return (
      `${this.formatear(this.asignadas())} de ${this.formatear(this.maxima())} horas asignadas. ` +
      `${this.formatear(this.porcentaje())} por ciento. ${this.mensaje()}`
    );
  });

  formatear(valor: number): string {
    return this.formatoNumero.format(valor);
  }
}
