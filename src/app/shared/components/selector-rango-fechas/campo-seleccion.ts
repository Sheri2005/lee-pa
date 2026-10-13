// Pieza de formulario · Dueño: G4 · Reservas
// Lista desplegable con el estilo de la paleta (sustituye al <select> del navegador) y animación al abrir.
// No es un componente del catálogo: la usan app-selector-rango-fechas (C4-05), app-filtros-disponibilidad (C4-02)
// y cualquier pantalla que ponga filtros dentro de app-barra-filtros (C4-21).
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  signal,
} from '@angular/core';

export interface OpcionSeleccion {
  valor: string;
  etiqueta: string;
  /** Texto secundario opcional, por ejemplo las fechas de un período. */
  detalle?: string;
}

@Component({
  selector: 'app-campo-seleccion',
  templateUrl: './campo-seleccion.html',
  host: {
    class: 'relative block',
    '(document:click)': 'clicFuera($event)',
  },
})
export class CampoSeleccionComponent {
  readonly opciones = input<readonly OpcionSeleccion[]>([]);
  /** Valor elegido; `''` es la opción vacía. */
  readonly valor = model('');
  /** Texto de la opción vacía ("Todos", "Elegir período…"). Sin texto, no hay opción vacía. */
  readonly vacio = input('');
  readonly idCampo = input.required<string>();
  readonly nombre = input('');
  readonly invalido = input(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly abierto = signal(false);
  protected readonly activa = signal(0);

  protected readonly lista = computed<OpcionSeleccion[]>(() => [
    ...(this.vacio() ? [{ valor: '', etiqueta: this.vacio() }] : []),
    ...this.opciones(),
  ]);
  protected readonly elegida = computed(() =>
    this.lista().find((opcion) => opcion.valor === this.valor()),
  );

  protected alternar(): void {
    if (this.abierto()) {
      this.cerrar(false);
      return;
    }
    this.activa.set(
      Math.max(
        this.lista().findIndex((o) => o.valor === this.valor()),
        0,
      ),
    );
    this.abierto.set(true);
    this.enfocarActiva();
  }

  protected elegir(opcion: OpcionSeleccion): void {
    if (opcion.valor !== this.valor()) this.valor.set(opcion.valor);
    this.cerrar(true);
  }

  protected teclaBoton(evento: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp'].includes(evento.key) && !this.abierto()) {
      evento.preventDefault();
      this.alternar();
    }
  }

  protected teclaLista(evento: KeyboardEvent): void {
    const total = this.lista().length;
    const movimientos: Record<string, number> = {
      ArrowDown: this.activa() + 1,
      ArrowUp: this.activa() - 1,
      Home: 0,
      End: total - 1,
    };
    if (evento.key in movimientos) {
      evento.preventDefault();
      this.activa.set(Math.min(Math.max(movimientos[evento.key], 0), total - 1));
      this.enfocarActiva();
    } else if (evento.key === 'Escape' || evento.key === 'Tab') {
      if (evento.key === 'Escape') evento.preventDefault();
      this.cerrar(evento.key === 'Escape');
    } else if (evento.key.length === 1 && evento.key !== ' ') {
      // Saltar a la siguiente opción que empieza por la letra pulsada.
      const letra = evento.key.toLowerCase();
      const lista = this.lista();
      for (let paso = 1; paso <= total; paso++) {
        const indice = (this.activa() + paso) % total;
        if (lista[indice].etiqueta.toLowerCase().startsWith(letra)) {
          this.activa.set(indice);
          this.enfocarActiva();
          break;
        }
      }
    }
  }

  protected cerrar(devolverFoco: boolean): void {
    if (!this.abierto()) return;
    this.abierto.set(false);
    if (devolverFoco) this.host.nativeElement.querySelector<HTMLButtonElement>('button')?.focus();
  }

  protected clicFuera(evento: Event): void {
    if (this.abierto() && !this.host.nativeElement.contains(evento.target as Node)) {
      this.cerrar(false);
    }
  }

  private enfocarActiva(): void {
    afterNextRender(
      () => {
        const opcion =
          this.host.nativeElement.querySelectorAll<HTMLElement>('[role="option"]')[this.activa()];
        opcion?.focus({ preventScroll: true });
        opcion?.scrollIntoView?.({ block: 'nearest' });
      },
      { injector: this.injector },
    );
  }
}
