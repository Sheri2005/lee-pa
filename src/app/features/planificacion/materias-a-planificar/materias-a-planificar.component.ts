/**
 * app-materias-a-planificar · C2-07 · Hijo de app-sugerencia-cursos
 * Grupo dueño: G2 · Planificación (responsable: Paula Martillo). HU: G2-02.
 * Lista las materias que entran en una planificación, agrupadas por origen: propias de la
 * malla vigente, propias fuera de la malla y compartidas (otra carrera es la responsable).
 * Reutiliza C2-20 (indicador de materia compartida), C2-25 (estado vacío) y C2-26 (spinner).
 * Piezas pendientes de otros grupos y ejemplo de uso en README.md (misma carpeta).
 */
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import {
  ListadoMateriasAPlanificar,
  MateriaAPlanificar,
  OrigenMateria,
} from '../../../core/models/materia-a-planificar.model';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { IndicadorMateriaCompartidaComponent } from '../../../shared/components/indicador-materia-compartida/indicador-materia-compartida.component';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';

interface Solicitud {
  planificacionId: number;
  intento: number;
}

type EstadoListado =
  | { tipo: 'cargando'; solicitud: Solicitud | null }
  | { tipo: 'error'; solicitud: Solicitud }
  | { tipo: 'listo'; solicitud: Solicitud; datos: ListadoMateriasAPlanificar };

interface GrupoMaterias {
  origen: OrigenMateria;
  titulo: string;
  descripcion: string;
  items: MateriaAPlanificar[];
}

/** Orden en que se muestran los grupos (los que no tengan materias no se muestran). */
const DEFINICION_GRUPOS: ReadonlyArray<Omit<GrupoMaterias, 'items'>> = [
  {
    origen: 'PROPIA_EN_MALLA',
    titulo: 'De la malla vigente',
    descripcion: 'Tu carrera es la responsable: se planifican y se aperturan aquí.',
  },
  {
    origen: 'PROPIA_FUERA_DE_MALLA',
    titulo: 'Responsable fuera de la malla',
    descripcion:
      'Tu carrera es la dueña aunque no estén en su malla: se planifican y se aperturan aquí.',
  },
  {
    origen: 'COMPARTIDA',
    titulo: 'Compartidas',
    descripcion:
      'Otra carrera es la responsable: no se aperturan aquí, solo se solicitan cupos en sus paralelos.',
  },
];

/** Por nivel de la malla (las que no tienen nivel, al final) y luego por código. */
function compararMaterias(a: MateriaAPlanificar, b: MateriaAPlanificar): number {
  const nivelA = a.nivel ?? Number.MAX_SAFE_INTEGER;
  const nivelB = b.nivel ?? Number.MAX_SAFE_INTEGER;
  return (
    nivelA - nivelB || a.materia.codigo.localeCompare(b.materia.codigo, 'es', { numeric: true })
  );
}

@Component({
  selector: 'app-materias-a-planificar',
  imports: [IndicadorMateriaCompartidaComponent, EstadoVacioComponent, SpinnerCargaComponent],
  templateUrl: './materias-a-planificar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class MateriasAPlanificarComponent {
  readonly planificacionId = input.required<number>();

  private readonly servicio = inject(PlanificacionService);
  private readonly intento = signal(0);
  private readonly solicitud = computed<Solicitud>(() => ({
    planificacionId: this.planificacionId(),
    intento: this.intento(),
  }));

  private readonly respuesta = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) =>
        defer(() => this.servicio.obtenerMateriasAPlanificar(solicitud.planificacionId)).pipe(
          map((datos): EstadoListado => ({ tipo: 'listo', solicitud, datos })),
          catchError(() => of<EstadoListado>({ tipo: 'error', solicitud })),
          startWith<EstadoListado>({ tipo: 'cargando', solicitud }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando', solicitud: null } as EstadoListado },
  );

  /** Evita mostrar materias de la planificación anterior mientras llega la nueva respuesta. */
  readonly vista = computed<EstadoListado>(() => {
    const solicitud = this.solicitud();
    const respuesta = this.respuesta();
    return respuesta.solicitud === solicitud ? respuesta : { tipo: 'cargando', solicitud };
  });

  /** Carrera dueña de la planificación; el indicador la usa para saber si la materia es propia. */
  readonly carreraId = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.datos.carreraId : undefined;
  });

  readonly total = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.datos.materias.length : 0;
  });

  readonly hayCompartidas = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' && vista.datos.materias.some((m) => m.origen === 'COMPARTIDA');
  });

  readonly grupos = computed<GrupoMaterias[]>(() => {
    const vista = this.vista();
    if (vista.tipo !== 'listo') return [];
    return DEFINICION_GRUPOS.map((grupo) => ({
      ...grupo,
      items: vista.datos.materias
        .filter((item) => item.origen === grupo.origen)
        .sort(compararMaterias),
    })).filter((grupo) => grupo.items.length > 0);
  });

  reintentar(): void {
    this.intento.update((valor) => valor + 1);
  }
}
