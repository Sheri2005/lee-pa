// C4-01 · Responsable: Justin Soledispa · Dueño: G4 · Reservas
// Página /reservas/buscar: coordina los filtros, la consulta y los resultados de disponibilidad.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { DisponibilidadEspacioService } from '../../../app/core/services/disponibilidad-espacio.service';
import { Espacio } from '../../../app/core/models/espacio.model';
import { FiltroDisponibilidad } from '../../../app/core/models/ocupacion.model';
import { FiltrosDisponibilidadComponent } from '../filtros-disponibilidad/filtros-disponibilidad';
import { ResultadosDisponibilidadComponent } from '../resultados-disponibilidad/resultados-disponibilidad';

type EstadoBusqueda =
  | { tipo: 'inicial'; filtros: null; espacios: readonly Espacio[] }
  | { tipo: 'cargando'; filtros: FiltroDisponibilidad; espacios: readonly Espacio[] }
  | { tipo: 'listo'; filtros: FiltroDisponibilidad; espacios: readonly Espacio[] }
  | { tipo: 'error'; filtros: FiltroDisponibilidad; espacios: readonly Espacio[] };

@Component({
  selector: 'app-buscar-espacios',
  imports: [FiltrosDisponibilidadComponent, ResultadosDisponibilidadComponent],
  templateUrl: './buscar-espacios.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscarEspaciosComponent {
  private readonly disponibilidad = inject(DisponibilidadEspacioService);
  private readonly router = inject(Router);
  private readonly solicitudes = new Subject<FiltroDisponibilidad>();

  protected readonly estado = toSignal(
    this.solicitudes.pipe(
      switchMap((filtros): Observable<EstadoBusqueda> =>
        this.disponibilidad.buscar(filtros).pipe(
          map((espacios): EstadoBusqueda => ({
            tipo: 'listo',
            filtros,
            espacios,
          })),
          catchError(() => of<EstadoBusqueda>({ tipo: 'error', filtros, espacios: [] })),
          startWith<EstadoBusqueda>({ tipo: 'cargando', filtros, espacios: [] }),
        ),
      ),
    ),
    {
      initialValue: {
        tipo: 'inicial',
        filtros: null,
        espacios: [],
      } as EstadoBusqueda,
    },
  );

  protected readonly espacios = computed(() => this.estado().espacios);
  protected readonly cargando = computed(() => this.estado().tipo === 'cargando');
  protected readonly error = computed(() => this.estado().tipo === 'error');

  buscar(filtros: FiltroDisponibilidad): void {
    this.solicitudes.next(filtros);
  }

  reservar(espacio: Espacio): void {
    const filtros = this.estado().filtros;
    void this.router.navigate(['/reservas/nueva'], {
      queryParams: {
        espacioId: espacio.id,
        fecha: filtros?.fecha,
        horaInicio: filtros?.horaInicio,
        horaFin: filtros?.horaFin,
      },
    });
  }
}
