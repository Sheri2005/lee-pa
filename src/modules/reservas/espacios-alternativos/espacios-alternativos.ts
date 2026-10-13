// C4-08 · Dueño: G4 · Reservas
// Alternativas equivalentes y disponibles cuando el espacio solicitado tiene un conflicto.
import { Component, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { SolicitudReserva } from '../../../app/core/models/reserva.model';
import { Espacio } from '../../../app/core/models/espacio.model';
import { AlternativaEspacio, CercaniaEspacio } from '../../../app/core/models/ocupacion.model';
import { DisponibilidadEspacioService } from '../../../app/core/services/disponibilidad-espacio.service';
import {
  pisoLegible,
  recursosTexto,
  tipoLegible,
} from '../resultados-disponibilidad/resultados-disponibilidad';

type EstadoAlternativas =
  { tipo: 'cargando' } | { tipo: 'listo'; alternativas: AlternativaEspacio[] } | { tipo: 'error' };

export const CERCANIA: Record<CercaniaEspacio, string> = {
  MISMO_PISO: 'Mismo piso',
  MISMO_EDIFICIO: 'Mismo edificio',
  OTRO_EDIFICIO: 'Otro edificio',
};

let siguienteId = 0;

@Component({
  selector: 'app-espacios-alternativos',
  templateUrl: './espacios-alternativos.html',
})
export class EspaciosAlternativosComponent {
  readonly solicitud = input.required<SolicitudReserva>();
  readonly elegir = output<Espacio>();

  private readonly servicio = inject(DisponibilidadEspacioService);
  protected readonly id = `espacios-alternativos-${siguienteId++}`;
  protected readonly estado = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud): Observable<EstadoAlternativas> =>
        this.servicio.buscarAlternativas(solicitud).pipe(
          map((alternativas) => ({ tipo: 'listo', alternativas }) as EstadoAlternativas),
          catchError(() => of<EstadoAlternativas>({ tipo: 'error' })),
          startWith<EstadoAlternativas>({ tipo: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando' } as EstadoAlternativas },
  );
  protected readonly alternativas = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'listo' ? estado.alternativas : [];
  });
  protected readonly CERCANIA = CERCANIA;
  protected readonly tipoLegible = tipoLegible;
  protected readonly pisoLegible = pisoLegible;
  protected readonly recursosTexto = recursosTexto;
}
