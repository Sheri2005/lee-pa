import { Component, signal } from '@angular/core';
import { CursoManual } from '../../../core/models/curso-manual.model';
import { CursoManualFormComponent } from '../curso-manual-form/curso-manual-form.component';

/** Demostración temporal de C2-09; no sustituye al futuro padre C2-08. */
@Component({
  selector: 'app-curso-manual-demo',
  imports: [CursoManualFormComponent],
  template: `
    <main class="mx-auto max-w-3xl space-y-4 p-6">
      <h1 class="text-2xl font-semibold">Curso manual</h1>
      <p>Demostración con datos en memoria. Al recargar se restablecen.</p>
      <label class="block"
        >Planificación
        <select
          #selector
          class="rounded border border-border p-2"
          [value]="planificacionId()"
          (change)="planificacionId.set(+selector.value)"
        >
          <option value="3">3 · Arquitectura · Borrador</option>
          <option value="1">1 · Computación · Aprobada</option>
          <option value="999">999 · Inexistente</option>
        </select>
      </label>
      <button
        type="button"
        class="rounded bg-primary px-4 py-2 text-white"
        (click)="abierto.set(true)"
      >
        Agregar curso manual
      </button>
      @if (ultimo(); as curso) {
        <p role="status">
          Guardado: {{ curso.materia.codigo }} · {{ curso.numeroParalelos }} paralelos ·
          {{ curso.motivo }}
        </p>
      }
      @if (abierto()) {
        <app-curso-manual-form
          [planificacionId]="planificacionId()"
          (guardar)="alGuardar($event)"
          (cancelar)="abierto.set(false)"
        />
      }
    </main>
  `,
})
export class CursoManualDemoComponent {
  readonly planificacionId = signal(3);
  readonly abierto = signal(false);
  readonly ultimo = signal<CursoManual | null>(null);
  alGuardar(curso: CursoManual): void {
    this.ultimo.set(curso);
    this.abierto.set(false);
  }
}
