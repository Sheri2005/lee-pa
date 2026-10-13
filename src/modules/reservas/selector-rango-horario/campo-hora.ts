// Pieza de formulario · Dueño: G4 · Reservas
// Campo de hora en formato de 24 horas (hh:mm) con una lista desplegable de horas cada `paso` minutos.
// No es un componente del catálogo: lo usa app-selector-rango-horario (C4-04).
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  signal,
} from '@angular/core';

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function minutosDe(hora: string): number | null {
  const partes = HORA.exec(hora);
  return partes ? Number(partes[1]) * 60 + Number(partes[2]) : null;
}

export function horaDe(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

/**
 * Interpreta lo que escribe el usuario en 24 horas: `9:30`, `09:30`, `930` o `0930`.
 * Devuelve `HH:mm`, `''` si está vacío, o `null` si todavía no es una hora válida.
 */
export function leerHora(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return '';
  const partes = /^(\d{1,2}):(\d{2})$/.exec(limpio) ?? /^(\d{1,2})(\d{2})$/.exec(limpio);
  if (!partes) return null;
  const hora = `${partes[1].padStart(2, '0')}:${partes[2]}`;
  return HORA.test(hora) ? hora : null;
}

@Component({
  selector: 'app-campo-hora',
  templateUrl: './campo-hora.html',
  host: {
    class: 'relative block',
    '(document:click)': 'clicFuera($event)',
    '(keydown.escape)': 'cerrar(true)',
  },
})
export class CampoHoraComponent {
  /** Hora `HH:mm`; si el usuario escribe algo que no es hora, queda ese texto para que el padre lo valide. */
  readonly valor = model('');
  /** Primera y última hora que ofrece la lista. */
  readonly min = input('00:00');
  readonly max = input('23:59');
  readonly paso = input(15);
  readonly invalido = input(false);
  readonly idCampo = input.required<string>();
  readonly nombre = input('');
  readonly describedBy = input<string | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly texto = linkedSignal(() => this.valor());
  protected readonly abierto = signal(false);
  protected readonly enfocada = signal('');

  protected readonly opciones = computed(() => {
    const desde = minutosDe(this.min()) ?? 0;
    const hasta = minutosDe(this.max()) ?? 23 * 60 + 59;
    const paso = Math.max(this.paso(), 1);
    const inicio = Math.ceil(desde / paso) * paso;
    const lista: string[] = [];
    for (let m = inicio; m <= hasta; m += paso) lista.push(horaDe(m));
    return lista;
  });

  protected escribir(evento: Event, definitivo: boolean): void {
    const texto = (evento.target as HTMLInputElement).value;
    this.texto.set(texto);
    // Mientras se escribe solo se acepta hh:mm completo; "930" o "9:30" se leen al salir del campo.
    const completa = /^\d{2}:\d{2}$/.test(texto.trim());
    const hora = definitivo || completa || !texto.trim() ? leerHora(texto) : null;
    if (hora !== null) {
      if (hora !== this.valor()) this.valor.set(hora);
      if (definitivo) this.texto.set(hora);
    } else if (definitivo && texto.trim() !== this.valor()) {
      this.valor.set(texto.trim());
    }
  }

  protected alternar(): void {
    if (this.abierto()) {
      this.cerrar(false);
      return;
    }
    const opciones = this.opciones();
    const actual = minutosDe(this.valor());
    const cercana =
      actual === null
        ? opciones[0]
        : (opciones.find((o) => (minutosDe(o) ?? 0) >= actual) ?? opciones.at(-1));
    this.enfocada.set(cercana ?? '');
    this.abierto.set(true);
    this.enfocarOpcion('center');
  }

  protected elegir(hora: string): void {
    this.valor.set(hora);
    this.texto.set(hora);
    this.cerrar(true);
  }

  protected tecla(evento: KeyboardEvent): void {
    const pasos: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -4,
      ArrowDown: 4,
      Home: -Infinity,
      End: Infinity,
    };
    if (!(evento.key in pasos)) return;
    evento.preventDefault();
    const opciones = this.opciones();
    const indice = opciones.indexOf(this.enfocada());
    const destino = Math.min(Math.max(indice + pasos[evento.key], 0), opciones.length - 1);
    this.enfocada.set(opciones[destino]);
    this.enfocarOpcion('nearest');
  }

  protected cerrar(devolverFoco: boolean): void {
    if (!this.abierto()) return;
    this.abierto.set(false);
    if (devolverFoco) this.host.nativeElement.querySelector('input')?.focus();
  }

  protected clicFuera(evento: Event): void {
    if (this.abierto() && !this.host.nativeElement.contains(evento.target as Node)) {
      this.cerrar(false);
    }
  }

  private enfocarOpcion(bloque: ScrollLogicalPosition): void {
    afterNextRender(
      () => {
        const boton = this.host.nativeElement.querySelector<HTMLButtonElement>(
          `button[data-hora="${this.enfocada()}"]`,
        );
        boton?.focus({ preventScroll: true });
        boton?.scrollIntoView?.({ block: bloque });
      },
      { injector: this.injector },
    );
  }
}
