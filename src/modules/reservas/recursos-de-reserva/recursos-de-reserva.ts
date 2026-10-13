// C4-18 · Dueño: G4 · Reservas
// Agregar recursos reservables y su cantidad a una reserva, validando las unidades libres en la franja.
// Hijo de app-reserva-form (C4-06). Consulta RecursoReservableService.
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { DisponibilidadRecurso, RecursoSolicitado } from '../../../app/core/models/reserva.model';
import { RecursoReservableService } from '../../../app/core/services/recurso-reservable.service';
import { fechaValida } from '../../../app/shared/components/selector-rango-fechas/rango-fechas';

type EstadoCarga =
  | { tipo: 'sin-franja' }
  | { tipo: 'cargando' }
  | { tipo: 'listo'; lista: DisponibilidadRecurso[] }
  | { tipo: 'error' };

interface Franja {
  fecha: string;
  inicio: string;
  fin: string;
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

let siguienteId = 0;

/** Franja completa y coherente, o `null` si todavía no se puede consultar. */
export function franjaValida(fecha: string, inicio: string, fin: string): Franja | null {
  return fechaValida(fecha) && HORA.test(inicio) && HORA.test(fin) && inicio < fin
    ? { fecha, inicio, fin }
    : null;
}

@Component({
  selector: 'app-recursos-de-reserva',
  templateUrl: './recursos-de-reserva.html',
})
export class RecursosDeReservaComponent {
  /** YYYY-MM-DD */
  readonly fecha = input('');
  /** HH:mm */
  readonly horaInicio = input('');
  /** HH:mm */
  readonly horaFin = input('');

  /** Recursos con cantidad mayor que 0, cada vez que cambia la selección. */
  readonly recursosChange = output<RecursoSolicitado[]>();

  private readonly servicio = inject(RecursoReservableService);

  protected readonly id = `recursos-de-reserva-${siguienteId++}`;

  /** Cantidad pedida por id de recurso. */
  protected readonly cantidades = signal<Record<number, number>>({});
  /** Avisos por id de recurso: tope alcanzado o ajuste al cambiar de franja. */
  protected readonly avisos = signal<Record<number, string>>({});

  private readonly franja = computed(
    () => franjaValida(this.fecha(), this.horaInicio(), this.horaFin()),
    {
      equal: (a, b) =>
        a === b || (!!a && !!b && a.fecha === b.fecha && a.inicio === b.inicio && a.fin === b.fin),
    },
  );

  protected readonly carga = toSignal(
    toObservable(this.franja).pipe(
      switchMap((franja): Observable<EstadoCarga> => {
        if (!franja) return of({ tipo: 'sin-franja' });
        return this.servicio.disponibilidad(franja.fecha, franja.inicio, franja.fin).pipe(
          tap((lista) => this.ajustarA(lista)),
          map((lista): EstadoCarga => ({ tipo: 'listo', lista })),
          catchError(() => of<EstadoCarga>({ tipo: 'error' })),
          startWith<EstadoCarga>({ tipo: 'cargando' }),
        );
      }),
    ),
    { initialValue: { tipo: 'sin-franja' } as EstadoCarga },
  );

  protected readonly lista = computed(() => {
    const carga = this.carga();
    return carga.tipo === 'listo' ? carga.lista : [];
  });

  /** Lo agregado a la reserva, en el orden de la lista: "Laptop × 2". */
  protected readonly agregados = computed(() =>
    this.lista()
      .filter((d) => this.cantidades()[d.recurso.id])
      .map((d) => `${d.recurso.nombre} × ${this.cantidades()[d.recurso.id]}`),
  );

  protected readonly totalUnidades = computed(() =>
    Object.values(this.cantidades()).reduce((total, cantidad) => total + cantidad, 0),
  );

  protected cantidad(id: number): number {
    return this.cantidades()[id] ?? 0;
  }

  /** Unidades que siguen libres después de lo pedido: la barra y el texto se reducen al agregar. */
  protected restantes(disponibilidad: DisponibilidadRecurso): number {
    return Math.max(disponibilidad.disponibles - this.cantidad(disponibilidad.recurso.id), 0);
  }

  protected cambiar(disponibilidad: DisponibilidadRecurso, valor: number): void {
    const { recurso, disponibles } = disponibilidad;
    const entero = Number.isFinite(valor) ? Math.trunc(valor) : 0;
    const nueva = Math.min(Math.max(entero, 0), disponibles);

    this.avisos.update((avisos) => {
      const { [recurso.id]: _, ...resto } = avisos;
      return entero > disponibles
        ? {
            ...resto,
            [recurso.id]: `Solo hay ${disponibles} ${disponibles === 1 ? 'unidad libre' : 'unidades libres'}.`,
          }
        : resto;
    });
    this.fijar(recurso.id, nueva);
    this.emitir();
  }

  protected escrito(disponibilidad: DisponibilidadRecurso, evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    this.cambiar(disponibilidad, campo.value === '' ? 0 : Number(campo.value));
    // Si se recortó el valor, el campo debe mostrar el valor real.
    campo.value = String(this.cantidad(disponibilidad.recurso.id));
  }

  /** Recorta lo pedido a lo que queda libre en la nueva franja y avisa de cada ajuste. */
  private ajustarA(lista: DisponibilidadRecurso[]): void {
    const avisos: Record<number, string> = {};
    let cambio = false;

    for (const [clave, pedida] of Object.entries(this.cantidades())) {
      const id = Number(clave);
      const disponibles = lista.find((d) => d.recurso.id === id)?.disponibles ?? 0;
      if (pedida > disponibles) {
        const nombre = lista.find((d) => d.recurso.id === id)?.recurso.nombre ?? 'El recurso';
        avisos[id] = disponibles
          ? `Se ajustó a ${disponibles} porque en este horario no hay más unidades libres.`
          : `${nombre} no tiene unidades libres en este horario; se quitó de la reserva.`;
        this.fijar(id, disponibles);
        cambio = true;
      }
    }

    this.avisos.set(avisos);
    if (cambio) this.emitir();
  }

  private fijar(id: number, cantidad: number): void {
    this.cantidades.update((cantidades) => {
      const { [id]: _, ...resto } = cantidades;
      return cantidad > 0 ? { ...resto, [id]: cantidad } : resto;
    });
  }

  private emitir(): void {
    this.recursosChange.emit(
      Object.entries(this.cantidades())
        .map(([id, cantidad]) => ({ recurso_reservable_id: Number(id), cantidad }))
        .sort((a, b) => a.recurso_reservable_id - b.recurso_reservable_id),
    );
  }
}
