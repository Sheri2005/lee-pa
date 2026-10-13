// C4-05 · Dueño: G4 · Reservas
// Selector de rango de fechas desde–hasta con atajos (esta semana, este mes, período).
// Compartido UI: no consulta servicios; los períodos los entrega el componente padre.
import { Component, computed, input, model, output, signal } from '@angular/core';
import { CampoFechaComponent } from './campo-fecha';
import { CampoSeleccionComponent, OpcionSeleccion } from './campo-seleccion';
import {
  ExtremoRango,
  PeriodoRango,
  RangoFechas,
  diagnosticarRango,
  diasEnRango,
  esteMes,
  estaSemana,
  fechaLegible,
  fechaValida,
  hoy,
  mismoRango,
  rangoCompleto,
} from './rango-fechas';

let siguienteId = 0;

@Component({
  selector: 'app-selector-rango-fechas',
  imports: [CampoFechaComponent, CampoSeleccionComponent],
  templateUrl: './selector-rango-fechas.html',
  host: { class: 'block min-w-0' },
})
export class SelectorRangoFechasComponent {
  /** Admite `[desde]` o enlace doble `[(desde)]` si el padre necesita restablecerlo. */
  readonly desde = model('');
  readonly hasta = model('');
  /** Períodos académicos para el atajo "Período". Sin períodos, el atajo no se muestra. */
  readonly periodos = input<readonly PeriodoRango[]>([]);
  /** Fecha que se toma como "hoy" para los atajos. Vacío: fecha actual en Guayaquil. */
  readonly fechaReferencia = input('');
  readonly etiqueta = input('Rango de fechas');
  /** Con `false` se muestra sin recuadro ni título visible, para integrarlo en otra tarjeta. */
  readonly enmarcado = input(true);
  /** Con `false` no muestra el resumen del rango (útil si el padre ya muestra el suyo). */
  readonly mostrarResumen = input(true);
  /** Límites opcionales (YYYY-MM-DD): los días fuera de ellos no se pueden elegir. */
  readonly fechaMin = input('');
  readonly fechaMax = input('');
  /** Desactiva sábados y domingos en los calendarios. */
  readonly sinFinesDeSemana = input(false);

  /** Se emite solo cuando ambas fechas están completas y el rango es válido. */
  readonly rangoChange = output<RangoFechas>();

  protected readonly id = `rango-fechas-${siguienteId++}`;
  protected readonly rango = computed<RangoFechas>(() => ({
    desde: this.desde(),
    hasta: this.hasta(),
  }));
  /** Extremo que cambió el usuario por última vez; si el rango queda invertido, es el que se marca. */
  private readonly ultimo = signal<ExtremoRango>('hasta');
  protected readonly diagnostico = computed(() =>
    diagnosticarRango(this.rango(), {
      fechaMin: this.fechaMin(),
      fechaMax: this.fechaMax(),
      ultimo: this.ultimo(),
    }),
  );
  protected readonly error = computed(() => this.diagnostico()?.mensaje ?? null);
  protected readonly dias = computed(() => diasEnRango(this.rango()));

  protected readonly referencia = computed(() =>
    fechaValida(this.fechaReferencia()) ? this.fechaReferencia() : hoy(),
  );
  protected readonly atajos = computed(() => [
    { id: 'semana', etiqueta: 'Esta semana', rango: estaSemana(this.referencia()) },
    { id: 'mes', etiqueta: 'Este mes', rango: esteMes(this.referencia()) },
  ]);
  protected readonly periodosValidos = computed(() =>
    this.periodos().filter((p) => rangoCompleto(p)),
  );
  protected readonly periodoActivo = computed(() =>
    String(this.periodosValidos().find((p) => mismoRango(p, this.rango()))?.id ?? ''),
  );
  protected readonly opcionesPeriodo = computed<OpcionSeleccion[]>(() =>
    this.periodosValidos().map((p) => ({
      valor: String(p.id),
      etiqueta: p.nombre,
      detalle: `${fechaLegible(p.desde)} – ${fechaLegible(p.hasta)}`,
    })),
  );

  protected readonly fechaLegible = fechaLegible;
  protected readonly mismoRango = mismoRango;

  protected campoInvalido(campo: ExtremoRango): boolean {
    return !!this.diagnostico()?.campos.includes(campo);
  }

  protected cambiarDesde(valor: string): void {
    this.ultimo.set('desde');
    this.desde.set(valor);
    this.emitirSiValido();
  }

  protected cambiarHasta(valor: string): void {
    this.ultimo.set('hasta');
    this.hasta.set(valor);
    this.emitirSiValido();
  }

  protected elegirPeriodo(valor: string): void {
    const periodo = this.periodosValidos().find((p) => String(p.id) === valor);
    if (periodo) this.aplicar(periodo);
  }

  protected aplicar(rango: RangoFechas): void {
    this.desde.set(rango.desde);
    this.hasta.set(rango.hasta);
    this.emitirSiValido();
  }

  private emitirSiValido(): void {
    const rango = this.rango();
    if (rangoCompleto(rango) && !this.error()) this.rangoChange.emit({ ...rango });
  }
}
