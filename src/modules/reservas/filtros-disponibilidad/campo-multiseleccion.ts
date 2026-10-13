// Pieza de formulario · Dueño: G4 · Reservas
// Lista desplegable de selección múltiple con buscador, para catálogos que pueden crecer (recursos, etc.).
// No es un componente del catálogo: la usa app-filtros-disponibilidad (C4-02).
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
import { OpcionSeleccion } from '../../../app/shared/components/selector-rango-fechas/campo-seleccion';

/** Compara textos sin distinguir mayúsculas ni tildes. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

@Component({
  selector: 'app-campo-multiseleccion',
  templateUrl: './campo-multiseleccion.html',
  host: {
    class: 'relative block',
    '(document:click)': 'clicFuera($event)',
  },
})
export class CampoMultiseleccionComponent {
  readonly opciones = input<readonly OpcionSeleccion[]>([]);
  /** Valores elegidos, en el orden de `opciones`. */
  readonly valores = model<string[]>([]);
  /** Texto cuando no hay nada elegido. */
  readonly vacio = input('Cualquiera');
  readonly idCampo = input.required<string>();
  readonly nombre = input('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly abierto = signal(false);
  protected readonly busqueda = signal('');

  protected readonly filtradas = computed(() => {
    const texto = normalizar(this.busqueda());
    return texto
      ? this.opciones().filter((o) => normalizar(o.etiqueta).includes(texto))
      : this.opciones();
  });

  /** Primeras etiquetas elegidas para el botón; el resto se resume como "+N". */
  protected readonly resumen = computed(() => {
    const elegidas = this.opciones().filter((o) => this.valores().includes(o.valor));
    return {
      texto: elegidas
        .slice(0, 2)
        .map((o) => o.etiqueta)
        .join(', '),
      resto: Math.max(elegidas.length - 2, 0),
    };
  });

  protected alternar(): void {
    if (this.abierto()) {
      this.cerrar(false);
      return;
    }
    this.busqueda.set('');
    this.abierto.set(true);
    afterNextRender(
      () =>
        this.host.nativeElement.querySelector<HTMLInputElement>('input[type="search"]')?.focus(),
      { injector: this.injector },
    );
  }

  protected alternarOpcion(valor: string): void {
    const orden = this.opciones().map((o) => o.valor);
    this.valores.update((actuales) =>
      actuales.includes(valor)
        ? actuales.filter((v) => v !== valor)
        : [...actuales, valor].sort((a, b) => orden.indexOf(a) - orden.indexOf(b)),
    );
  }

  protected limpiar(): void {
    this.valores.set([]);
  }

  protected teclaBusqueda(evento: KeyboardEvent): void {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      this.opcionesDom()[0]?.focus();
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      this.cerrar(true);
    }
  }

  protected teclaOpcion(evento: KeyboardEvent, indice: number): void {
    const opciones = this.opcionesDom();
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      const destino = indice + (evento.key === 'ArrowDown' ? 1 : -1);
      if (destino < 0) this.host.nativeElement.querySelector<HTMLInputElement>('input')?.focus();
      else opciones[Math.min(destino, opciones.length - 1)]?.focus();
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      this.cerrar(true);
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

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  private opcionesDom(): HTMLElement[] {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>('[role="option"]')];
  }
}
