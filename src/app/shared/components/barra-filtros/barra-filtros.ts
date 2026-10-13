/**
 * C4-21 · Barra de filtros · Grupo dueño: G4 · Reservas
 *
 * Contenedor de filtros en fila. Cada pantalla proyecta sus propios campos
 * y escucha los eventos `buscar` y `limpiar`. En móvil los filtros se pliegan
 * detrás de un botón para no ocupar la pantalla.
 */
import { Component, input, output, signal } from '@angular/core';

let siguienteId = 0;

@Component({
  selector: 'app-barra-filtros',
  templateUrl: './barra-filtros.html',
})
export class BarraFiltrosComponent {
  /** Texto de la cabecera de la barra. */
  readonly titulo = input('Filtros');
  /** Cantidad de filtros aplicados; se muestra como contador si es mayor que 0. */
  readonly filtrosActivos = input(0);
  /** Con `true`, Limpiar y Buscar van en una fila propia abajo a la derecha y los filtros usan todo el ancho. */
  readonly accionesAbajo = input(false);

  /** Se emite al pulsar Buscar o al presionar Enter dentro de un filtro. */
  readonly buscar = output<void>();
  /** Se emite al pulsar Limpiar; la pantalla que lo usa restablece sus filtros. */
  readonly limpiar = output<void>();

  /** Solo afecta a pantallas pequeñas: desde `md` los filtros siempre están visibles. */
  protected readonly desplegada = signal(false);
  protected readonly id = `barra-filtros-${siguienteId++}`;

  enviar(evento: Event) {
    evento.preventDefault();
    this.buscar.emit();
  }

  protected alternar() {
    this.desplegada.update((valor) => !valor);
  }
}
