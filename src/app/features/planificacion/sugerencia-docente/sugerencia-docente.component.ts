/**
 * app-sugerencia-docente · C2-14 · Hijo de app-asignacion-docentes
 * Grupo dueño: G2 · Planificación. HU: G2-10.
 * Reutiliza C2-15 (carga docente) y C2-10 (justificación de reglas).
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import {
  CandidatoDocente,
  Docente,
  SugerenciaDocente,
} from '../../../core/models/asignacion-docente.model';
import { AsignacionDocenteService } from '../../../core/services/asignacion-docente.service';
import { IndicadorCargaDocenteComponent } from '../../../shared/components/indicador-carga-docente/indicador-carga-docente.component';
import { JustificacionReglaComponent } from '../../../shared/components/app-justificacion-regla/justificacion-regla.component';
import { CriterioRegla } from '../../../shared/components/app-justificacion-regla/criterio-regla.model';

interface Solicitud {
  paraleloId: number;
  intento: number;
  revision: number;
}

type EstadoSugerencia =
  | { tipo: 'cargando'; solicitud: Solicitud | null }
  | { tipo: 'error'; solicitud: Solicitud; mensaje: string }
  | { tipo: 'listo'; solicitud: Solicitud; datos: SugerenciaDocente };

@Component({
  selector: 'app-sugerencia-docente',
  imports: [IndicadorCargaDocenteComponent, JustificacionReglaComponent],
  templateUrl: './sugerencia-docente.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SugerenciaDocenteComponent {
  readonly paraleloId = input.required<number>();
  readonly docenteElegido = output<Docente>();

  private readonly servicio = inject(AsignacionDocenteService);
  private readonly intento = signal(0);
  private readonly solicitud = computed(() => ({
    paraleloId: this.paraleloId(),
    intento: this.intento(),
    revision: this.servicio.revision(),
  }));

  private readonly respuesta = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) =>
        defer(() => this.servicio.obtenerCandidatos(solicitud.paraleloId)).pipe(
          map((datos): EstadoSugerencia => ({
            tipo: 'listo',
            solicitud,
            datos,
          })),
          catchError(() =>
            of<EstadoSugerencia>({
              tipo: 'error',
              solicitud,
              mensaje:
                'No se pudieron cargar los candidatos. Verifica el paralelo e intenta nuevamente.',
            }),
          ),
          startWith<EstadoSugerencia>({ tipo: 'cargando', solicitud }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando', solicitud: null } as EstadoSugerencia },
  );

  /** Evita mostrar/elegir un candidato anterior mientras cambia el paralelo o se reintenta. */
  readonly vista = computed<EstadoSugerencia>(() => {
    const solicitud = this.solicitud();
    const respuesta = this.respuesta();
    return respuesta.solicitud === solicitud ? respuesta : { tipo: 'cargando', solicitud };
  });

  reintentar(): void {
    this.intento.update((valor) => valor + 1);
  }

  elegir(docenteId: number): void {
    const vista = this.vista();
    if (vista.tipo !== 'listo') return;
    const candidato = vista.datos.candidatos.find((item) => item.docente.id === docenteId);
    if (candidato) this.docenteElegido.emit({ ...candidato.docente });
  }

  criterios(candidato: CandidatoDocente): CriterioRegla[] {
    // El servicio devuelve exclusivamente candidatos que cumplen estas reglas.
    return [
      { etiqueta: 'Habilitado para la materia', cumple: true },
      { etiqueta: 'Disponible para el paralelo', cumple: true },
      {
        etiqueta: 'Carga dentro del máximo',
        cumple: candidato.cargaProyectada <= candidato.docente.cargaMaxima,
        valor: `${candidato.cargaProyectada} / ${candidato.docente.cargaMaxima} h`,
      },
    ];
  }
}
