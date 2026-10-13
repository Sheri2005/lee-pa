import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CriterioRegla } from './criterio-regla.model';

let siguienteId = 0;

@Component({
  selector: 'app-justificacion-regla',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (compacto()) {
      <span class="group relative inline-block">
        <button
          type="button"
          class="rounded-full border border-[#EFE6EA] px-2.5 py-0.5 text-sm text-[#75001B] focus-visible:outline-2 focus-visible:outline-[#B7731E]"
          [attr.aria-describedby]="idTooltip"
        >
          <span aria-hidden="true">ⓘ</span> {{ resumen() }}
        </button>
        <div
          role="tooltip"
          [id]="idTooltip"
          class="invisible absolute left-0 top-full z-10 mt-1.5 min-w-[16rem] rounded-lg border border-[#EFE6EA] bg-white p-3 opacity-0 shadow-lg
                 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        >
          <ng-container [ngTemplateOutlet]="lista" />
        </div>
      </span>
    } @else {
      <ng-container [ngTemplateOutlet]="lista" />
    }

    <ng-template #lista>
      <ul class="m-0 grid list-none gap-1.5 p-0">
        @for (c of criterios(); track $index) {
          <li class="flex items-baseline gap-2 text-[#5A0015]">
            <span [class]="claseIcono(c)" aria-hidden="true">{{ icono(c) }}</span>
            <span class="sr-only">{{ estado(c) }}:</span>
            <span>{{ c.etiqueta }}</span>
            @if (c.valor) {
              <strong class="text-[#621324]">{{ c.valor }}</strong>
            }
          </li>
        } @empty {
          <li class="italic text-[#6F666A]">Sin criterios registrados</li>
        }
      </ul>
    </ng-template>
  `,
})
export class JustificacionReglaComponent {
  criterios = input.required<CriterioRegla[]>();
  compacto = input(false, { transform: booleanAttribute });

  readonly idTooltip = `just-tip-${siguienteId++}`;

  resumen = computed(() => {
    const evaluables = this.criterios().filter(c => c.cumple !== undefined);
    const ok = evaluables.filter(c => c.cumple).length;
    return evaluables.length ? `${ok}/${evaluables.length} criterios` : 'Ver justificación';
  });

  icono(c: CriterioRegla) {
    return c.cumple === true ? '✔\uFE0E' : c.cumple === false ? '✖\uFE0E' : '•';
  }

  estado(c: CriterioRegla) {
    return c.cumple === true ? 'Cumple' : c.cumple === false ? 'No cumple' : 'Dato';
  }

  // Clases completas (no armadas con texto dinámico) para que Tailwind las detecte
  claseIcono(c: CriterioRegla) {
    return c.cumple === true ? 'text-green-700' : c.cumple === false ? 'text-[#9A1232]' : 'text-[#6F666A]';
  }
}