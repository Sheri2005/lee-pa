// C4-03 · Dueño: G4 · Reservas
// Rejilla de espacios libres con su tarjeta y acción "Reservar"; estado vacío si no hay resultados.
// Hijo de app-buscar-espacios (C4-01). No consulta servicios: recibe los espacios ya filtrados.
import { Component, computed, input, output } from '@angular/core';
import { Espacio } from '../../../app/core/models/espacio.model';

const TIPOS: Record<string, string> = {
  AULA: 'Aula',
  LABORATORIO: 'Laboratorio',
  AUDITORIO: 'Auditorio',
};

export function tipoLegible(tipo: string): string {
  return TIPOS[tipo] ?? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
}

export function pisoLegible(piso: number): string {
  return piso === 0 ? 'Planta baja' : `Piso ${piso}`;
}

let siguienteId = 0;

export function recursosTexto(espacio: Espacio): string {
  return espacio.recursos.map((r) => r.nombre).join(' · ');
}

@Component({
  selector: 'app-resultados-disponibilidad',
  templateUrl: './resultados-disponibilidad.html',
})
export class ResultadosDisponibilidadComponent {
  readonly espacios = input<readonly Espacio[]>([]);
  /** Muestra el indicador de carga en lugar de resultados o estado vacío. */
  readonly cargando = input(false);

  readonly reservar = output<Espacio>();

  protected readonly id = `resultados-disponibilidad-${siguienteId++}`;
  protected readonly total = computed(() => this.espacios().length);
  protected readonly esqueletos = [1, 2, 3];
  protected readonly tipoLegible = tipoLegible;
  protected readonly pisoLegible = pisoLegible;
  protected readonly recursosTexto = recursosTexto;
}
