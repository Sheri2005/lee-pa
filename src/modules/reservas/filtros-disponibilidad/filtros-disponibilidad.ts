// C4-02 · Dueño: G4 · Reservas
// Filtros de la búsqueda de espacios: fecha, rango horario, tipo de espacio, capacidad mínima, recursos
// y edificio. Hijo de app-buscar-espacios (C4-01). Usa app-barra-filtros (C4-21) y
// app-selector-rango-horario (C4-04).
import { Component, computed, input, output, signal } from '@angular/core';
import { FiltroDisponibilidad } from '../../../app/core/models/ocupacion.model';
import { BarraFiltrosComponent } from '../../../app/shared/components/barra-filtros/barra-filtros';
import { CampoMultiseleccionComponent } from './campo-multiseleccion';
import {
  CampoSeleccionComponent,
  OpcionSeleccion,
} from '../../../app/shared/components/selector-rango-fechas/campo-seleccion';
import { hoy } from '../../../app/shared/components/selector-rango-fechas/rango-fechas';
import {
  ahoraEnGuayaquil,
  SelectorRangoHorarioComponent,
  validarRangoHorario,
} from '../selector-rango-horario/selector-rango-horario';

// El modelo vive en core; se reexporta para que quien ya lo importaba desde aquí no cambie.
export type { FiltroDisponibilidad };

let siguienteId = 0;

/** Tope razonable de asistentes para filtrar (el auditorio más grande ronda este valor). */
export const CAPACIDAD_MAXIMA = 500;

@Component({
  selector: 'app-filtros-disponibilidad',
  imports: [
    BarraFiltrosComponent,
    CampoMultiseleccionComponent,
    CampoSeleccionComponent,
    SelectorRangoHorarioComponent,
  ],
  templateUrl: './filtros-disponibilidad.html',
})
export class FiltrosDisponibilidadComponent {
  /** Se pasan a app-selector-rango-horario. Por defecto: desde hoy, de 07:00 a 21:00. */
  readonly fechaMin = input(hoy());
  readonly horaMin = input('07:00');
  readonly horaMax = input('21:00');

  readonly buscar = output<FiltroDisponibilidad>();

  protected readonly id = `filtros-disponibilidad-${siguienteId++}`;
  // TEMPORAL: opciones de los catálogos de G3 · Horarios mientras sus selectores no están en main.
  // Las pasa la página que usa los filtros; desaparecen al usar app-selector-tipo-espacio (C3-10),
  // app-selector-edificio (C3-07) y app-selector-recursos (C3-11), que traen sus propios datos.
  /** Tipos de espacio: `{ valor: 'AULA', etiqueta: 'Aula' }`. */
  readonly tiposEspacio = input<readonly OpcionSeleccion[]>([]);
  /** Edificios: `{ valor: '1', etiqueta: 'Bloque F' }` (valor = id). */
  readonly edificios = input<readonly OpcionSeleccion[]>([]);
  /** Recursos instalados en los espacios: `{ valor: '1', etiqueta: 'Proyector' }` (valor = id). */
  readonly recursos = input<readonly OpcionSeleccion[]>([]);
  protected readonly CAPACIDAD_MAXIMA = CAPACIDAD_MAXIMA;

  protected readonly fecha = signal('');
  protected readonly inicio = signal('');
  protected readonly fin = signal('');
  protected readonly tipo = signal('');
  protected readonly capacidad = signal('');
  protected readonly recursosElegidos = signal<string[]>([]);
  protected readonly edificio = signal('');
  protected readonly intentado = signal(false);

  protected readonly errorRango = computed(() =>
    validarRangoHorario(
      { fecha: this.fecha(), inicio: this.inicio(), fin: this.fin() },
      {
        fechaMin: this.fechaMin(),
        horaMin: this.horaMin(),
        horaMax: this.horaMax(),
        soloDiasHabiles: true,
        pasoMinutos: 15,
        ahora: ahoraEnGuayaquil(),
      },
    ),
  );
  /** Con el rango vacío, app-selector-rango-horario no muestra error; lo avisa este componente. */
  protected readonly rangoVacio = computed(() => !this.fecha() && !this.inicio() && !this.fin());

  protected readonly errorCapacidad = computed(() => {
    const valor = this.capacidad().trim();
    if (valor === '') return null;
    if (!/^\d+$/.test(valor) || Number(valor) < 1)
      return 'La capacidad mínima debe ser un número entero mayor que 0.';
    return Number(valor) > CAPACIDAD_MAXIMA
      ? `Ningún espacio supera las ${CAPACIDAD_MAXIMA} personas.`
      : null;
  });

  protected readonly filtrosActivos = computed(
    () =>
      [
        this.tipo(),
        this.capacidad().trim(),
        this.recursosElegidos().length,
        this.edificio(),
      ].filter(Boolean).length,
  );

  protected readonly numeroCapacidad = computed(() => {
    const numero = Number(this.capacidad().trim());
    return Number.isInteger(numero) ? numero : 0;
  });

  /** Botones − / +: de 5 en 5, entre 1 y la capacidad máxima. */
  protected sumarCapacidad(delta: number): void {
    const nueva = Math.min(Math.max(this.numeroCapacidad() + delta, 0), CAPACIDAD_MAXIMA);
    this.capacidad.set(nueva ? String(nueva) : '');
  }

  /** Al salir del campo, un número mayor que el máximo se ajusta al máximo. */
  protected ajustarCapacidad(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    if (/^\d+$/.test(campo.value.trim()) && Number(campo.value) > CAPACIDAD_MAXIMA) {
      this.capacidad.set(String(CAPACIDAD_MAXIMA));
      campo.value = String(CAPACIDAD_MAXIMA);
    }
  }

  protected enviar(): void {
    this.intentado.set(true);
    if (this.errorRango() || this.errorCapacidad()) return;

    const capacidad = this.capacidad().trim();
    this.buscar.emit({
      fecha: this.fecha(),
      horaInicio: this.inicio(),
      horaFin: this.fin(),
      tipoEspacio: this.tipo() || null,
      capacidadMinima: capacidad ? Number(capacidad) : null,
      recursos: this.recursosElegidos().map(Number),
      edificioId: this.edificio() ? Number(this.edificio()) : null,
    });
  }

  protected limpiar(): void {
    this.fecha.set('');
    this.inicio.set('');
    this.fin.set('');
    this.tipo.set('');
    this.capacidad.set('');
    this.recursosElegidos.set([]);
    this.edificio.set('');
    this.intentado.set(false);
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
