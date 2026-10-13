// Pieza de formulario · Dueño: G4 · Reservas
// Campo de fecha con calendario propio (colores de la paleta, semana de lunes a domingo, formato dd/mm/aaaa).
// Pieza interna de C4-05; también la usan C4-04 y C4-09. No es un componente del catálogo.
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
import { fechaValida, hoy, sumarDias } from './rango-fechas';

export const DIAS_CORTOS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/** `2026-11-16` → `16/11/2026`. Si no es una fecha válida, devuelve el texto tal cual. */
export function fechaCorta(iso: string): string {
  if (!fechaValida(iso)) return iso;
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Interpreta lo que escribe el usuario: `dd/mm/aaaa`, `d-m-aaaa` o `aaaa-mm-dd`.
 * Devuelve la fecha ISO, `''` si está vacío, o `null` si todavía no es una fecha válida.
 */
export function leerFecha(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return '';
  let iso = '';
  const dma = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(limpio);
  const amd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(limpio);
  if (dma) iso = `${dma[3]}-${dma[2].padStart(2, '0')}-${dma[1].padStart(2, '0')}`;
  else if (amd) iso = `${amd[1]}-${amd[2].padStart(2, '0')}-${amd[3].padStart(2, '0')}`;
  return fechaValida(iso) ? iso : null;
}

/** Nombre del mes con mayúscula inicial: `2026-11` → `Noviembre 2026`. */
export function nombreMes(anioMes: string): string {
  const texto = new Intl.DateTimeFormat('es-EC', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${anioMes}-01T12:00:00Z`));
  return (texto.charAt(0).toUpperCase() + texto.slice(1)).replace(' de ', ' ');
}

function sumarMeses(anioMes: string, meses: number): string {
  const [anio, mes] = anioMes.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1 + meses, 1));
  return fecha.toISOString().slice(0, 7);
}

/** 0 = lunes … 6 = domingo. */
function diaSemana(iso: string): number {
  return (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7;
}

interface DiaCalendario {
  iso: string;
  numero: number;
  delMes: boolean;
  deshabilitado: boolean;
  seleccionado: boolean;
  /** La otra punta del rango (por ejemplo "Desde" mientras se elige "Hasta"). */
  extremo: boolean;
  /** Entre las dos puntas del rango. */
  enRango: boolean;
  hoy: boolean;
  etiqueta: string;
}

@Component({
  selector: 'app-campo-fecha',
  templateUrl: './campo-fecha.html',
  host: {
    class: 'relative block',
    '(document:click)': 'clicFuera($event)',
    '(keydown.escape)': 'cerrar(true)',
    '(window:resize)': 'ubicar()',
  },
})
export class CampoFechaComponent {
  /** Fecha ISO `YYYY-MM-DD`; si el usuario escribe algo que no es fecha, queda ese texto para que el padre lo valide. */
  readonly valor = model('');
  readonly min = input('');
  readonly max = input('');
  readonly invalido = input(false);
  /** id del `<input>`, para enlazarlo con su `<label for>`. */
  readonly idCampo = input.required<string>();
  readonly nombre = input('');
  readonly describedBy = input<string | null>(null);
  /** Fecha que se marca como "hoy". Vacío: fecha actual en Guayaquil. */
  readonly fechaHoy = input('');
  /** Fecha de la otra punta de un rango; se marca en el calendario junto con los días intermedios. */
  readonly otroExtremo = input('');
  /** Nombre de la otra punta ("Desde", "Hasta") para la leyenda del calendario. */
  readonly nombreExtremo = input('');
  /** Desactiva sábados y domingos. */
  readonly sinFinesDeSemana = input(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly texto = linkedSignal(() => fechaCorta(this.valor()));
  protected readonly abierto = signal(false);
  protected readonly mes = signal(hoy().slice(0, 7));
  protected readonly enfocado = signal('');
  /**
   * Ubicación del calendario respecto al campo: se desplaza a la izquierda si desbordaría la ventana por la
   * derecha y se abre hacia arriba si no cabe debajo y hay más espacio encima.
   */
  protected readonly posicion = signal({ izquierda: 0, arriba: false });

  protected readonly DIAS_CORTOS = DIAS_CORTOS;
  private readonly hoyIso = computed(() =>
    fechaValida(this.fechaHoy()) ? this.fechaHoy() : hoy(),
  );
  protected readonly titulo = computed(() => nombreMes(this.mes()));
  protected readonly fechaCorta = fechaCorta;

  protected readonly semanas = computed<DiaCalendario[][]>(() => {
    const primero = `${this.mes()}-01`;
    const inicio = sumarDias(primero, -diaSemana(primero));
    const formato = new Intl.DateTimeFormat('es-EC', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const semanas: DiaCalendario[][] = [];
    for (let s = 0; s < 6; s++) {
      const semana: DiaCalendario[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = sumarDias(inicio, s * 7 + d);
        semana.push({
          iso,
          numero: Number(iso.slice(8)),
          delMes: iso.startsWith(this.mes()),
          deshabilitado: this.fueraDeLimites(iso),
          seleccionado: iso === this.valor(),
          extremo: iso === this.otroExtremo() && iso !== this.valor(),
          enRango: this.enRango(iso),
          hoy: iso === this.hoyIso(),
          etiqueta: formato.format(new Date(`${iso}T12:00:00Z`)),
        });
      }
      semanas.push(semana);
    }
    return semanas;
  });

  protected escribir(evento: Event, definitivo: boolean): void {
    const texto = (evento.target as HTMLInputElement).value;
    this.texto.set(texto);
    // Mientras se escribe solo se aceptan fechas completas; las abreviadas se leen al salir del campo.
    const completa = /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/.test(texto.trim());
    const iso = definitivo || completa || !texto.trim() ? leerFecha(texto) : null;
    if (iso !== null) {
      if (iso !== this.valor()) this.valor.set(iso);
    } else if (definitivo && texto.trim() !== this.valor()) {
      this.valor.set(texto.trim());
    }
  }

  protected alternar(): void {
    if (this.abierto()) {
      this.cerrar(false);
      return;
    }
    const base = fechaValida(this.valor())
      ? this.valor()
      : fechaValida(this.otroExtremo())
        ? this.otroExtremo()
        : fechaValida(this.min()) && this.min() > this.hoyIso()
          ? this.min()
          : this.hoyIso();
    this.mes.set(base.slice(0, 7));
    this.enfocado.set(base);
    this.posicion.set({ izquierda: 0, arriba: false });
    this.abierto.set(true);
    this.ubicar();
    this.enfocarDia();
  }

  protected elegir(dia: DiaCalendario): void {
    if (dia.deshabilitado) return;
    this.valor.set(dia.iso);
    this.cerrar(true);
  }

  protected cambiarMes(meses: number): void {
    this.mes.update((mes) => sumarMeses(mes, meses));
    this.enfocado.set(`${this.mes()}-01`);
  }

  protected teclaDia(evento: KeyboardEvent): void {
    const pasos: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    let destino: string | null = null;
    if (evento.key in pasos) destino = sumarDias(this.enfocado(), pasos[evento.key]);
    if (evento.key === 'PageUp' || evento.key === 'PageDown') {
      const mes = sumarMeses(this.enfocado().slice(0, 7), evento.key === 'PageUp' ? -1 : 1);
      destino = `${mes}-${this.enfocado().slice(8)}`;
      if (!fechaValida(destino)) destino = `${mes}-01`;
    }
    if (!destino) return;
    evento.preventDefault();
    this.enfocado.set(destino);
    this.mes.set(destino.slice(0, 7));
    this.enfocarDia();
  }

  protected elegirHoy(): void {
    if (this.fueraDeLimites(this.hoyIso())) return;
    this.valor.set(this.hoyIso());
    this.cerrar(true);
  }

  protected hoyPermitido(): boolean {
    return !this.fueraDeLimites(this.hoyIso());
  }

  protected borrar(): void {
    this.valor.set('');
    this.texto.set('');
    this.cerrar(true);
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

  protected ubicar(): void {
    if (!this.abierto()) return;
    afterNextRender(
      () => {
        const panel = this.host.nativeElement.querySelector<HTMLElement>('[role="dialog"]');
        if (!panel) return;
        const margen = 8;
        const campo = this.host.nativeElement.getBoundingClientRect();
        const anchoVentana = document.documentElement.clientWidth;
        const sobrante = campo.left + panel.offsetWidth - (anchoVentana - margen);
        const izquierda = sobrante > 0 ? -Math.min(sobrante, Math.max(campo.left - margen, 0)) : 0;
        const debajo = window.innerHeight - campo.bottom;
        const arriba = debajo < panel.offsetHeight + margen && campo.top > debajo;
        this.posicion.set({ izquierda, arriba });
      },
      { injector: this.injector },
    );
  }

  private fueraDeLimites(iso: string): boolean {
    return (
      (fechaValida(this.min()) && iso < this.min()) ||
      (fechaValida(this.max()) && iso > this.max()) ||
      (this.sinFinesDeSemana() && diaSemana(iso) >= 5)
    );
  }

  private enRango(iso: string): boolean {
    const a = this.valor();
    const b = this.otroExtremo();
    if (!fechaValida(a) || !fechaValida(b)) return false;
    return iso > (a < b ? a : b) && iso < (a < b ? b : a);
  }

  private enfocarDia(): void {
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLButtonElement>(`button[data-fecha="${this.enfocado()}"]`)
          ?.focus(),
      { injector: this.injector },
    );
  }
}
