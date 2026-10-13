import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
// Datos que presenta este indicador; no define el modelo de dominio de Gestión.
interface MateriaResponsableVista {
  carreraResponsableId: number;
  carreraResponsable: string;
}

let siguienteId = 0;

@Component({
  selector: 'app-indicador-materia-compartida',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
    templateUrl: './indicador-materia-compartida.component.html',
})
export class IndicadorMateriaCompartidaComponent {
  materia = input.required<MateriaResponsableVista>();
  carreraActualId = input<number>();
  carrerasQueLaUsan = input<string[]>([]);

  readonly idTooltip = `ind-tip-${siguienteId++}`;
  readonly clasePildora =
    'inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

  esPropia = computed(() => {
    const actual = this.carreraActualId();
    return actual !== undefined && actual === this.materia().carreraResponsableId;
  });

  textoResponsable = computed(() =>
    this.esPropia() ? 'Tu carrera es responsable' : `Responsable: ${this.materia().carreraResponsable}`,
  );
}