/**
 * app-sugerencia-cursos · C2-08 · Hijo de app-planificacion-detalle
 * Grupo dueño: G2 · Planificación (responsable: Paula Martillo). HU: G2-05 y G2-06.
 *
 * Tabla de los cursos que las reglas proponen aperturar, con número de paralelos, estudiantes
 * estimados, demanda histórica y la justificación de cada sugerencia. El coordinador puede
 * aceptar, anular, cambiar el número de paralelos o agregar un curso a mano; cada curso queda
 * marcado como SUGERIDO o MANUAL. Los cambios solo se permiten en BORRADOR.
 *
 * Reutiliza C2-07 (materias a planificar), C2-10 (justificación de regla), C2-25 (estado vacío)
 * y C2-26 (spinner), y confirma la anulación con ConfirmacionService → C2-24.
 * Piezas pendientes de otros grupos y ejemplo de uso en README.md (misma carpeta).
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
import { Observable, catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import { EstadoCurso } from '../../../core/models/curso-planificado.model';
import { Materia } from '../../../core/models/materia.model';
import { CursoSugerido, SugerenciaCursos } from '../../../core/models/sugerencia.model';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { MAXIMO_PARALELOS } from '../../../core/services/paralelo.service';
import { SugerenciaService } from '../../../core/services/sugerencia.service';
import { JustificacionReglaComponent } from '../../../shared/components/app-justificacion-regla/justificacion-regla.component';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';
import { MateriasAPlanificarComponent } from '../materias-a-planificar/materias-a-planificar.component';

interface Solicitud {
  planificacionId: number;
  intento: number;
}

type EstadoVista =
  | { tipo: 'cargando'; solicitud: Solicitud | null }
  | { tipo: 'error'; solicitud: Solicitud }
  | { tipo: 'listo'; solicitud: Solicitud; datos: SugerenciaCursos };

const ETIQUETAS_CURSO: Record<EstadoCurso, string> = {
  SUGERIDO: 'Sugerido',
  ACEPTADO: 'Aceptado',
  ANULADO: 'Anulado',
};

/**
 * Clases completas por estado (no armadas con texto dinámico) para que Tailwind las detecte.
 * EDITAR (C5-08): reemplazar por app-estado-badge cuando G5 lo publique.
 */
const CLASES_CURSO: Record<EstadoCurso, string> = {
  SUGERIDO:
    'inline-flex items-center rounded-full border border-accent-gold/40 bg-accent-gold/10 px-2.5 py-0.5 text-xs font-medium text-primary-dark',
  ACEPTADO:
    'inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-primary',
  ANULADO:
    'inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-text-secondary line-through',
};

@Component({
  selector: 'app-sugerencia-cursos',
  imports: [
    MateriasAPlanificarComponent,
    JustificacionReglaComponent,
    EstadoVacioComponent,
    SpinnerCargaComponent,
  ],
  templateUrl: './sugerencia-cursos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SugerenciaCursosComponent {
  readonly planificacionId = input.required<number>();

  /** Se emite con los cursos de la sugerencia cada vez que una decisión los cambia. */
  readonly cursosChange = output<CursoSugerido[]>();

  private readonly servicio = inject(SugerenciaService);
  private readonly confirmacion = inject(ConfirmacionService);

  private readonly intento = signal(0);
  private readonly solicitud = computed<Solicitud>(() => ({
    planificacionId: this.planificacionId(),
    intento: this.intento(),
  }));

  /** Curso sobre el que se está guardando una decisión ('manual' al agregar). */
  readonly guardando = signal<number | 'manual' | null>(null);
  readonly errorAccion = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);
  readonly formularioManualAbierto = signal(false);
  readonly verMaterias = signal(false);

  readonly etiquetasCurso = ETIQUETAS_CURSO;
  readonly clasesCurso = CLASES_CURSO;
  readonly maximoParalelos = MAXIMO_PARALELOS;

  private readonly respuesta = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) =>
        defer(() => this.servicio.obtenerSugerencia(solicitud.planificacionId)).pipe(
          map((datos): EstadoVista => ({ tipo: 'listo', solicitud, datos })),
          catchError(() => of<EstadoVista>({ tipo: 'error', solicitud })),
          startWith<EstadoVista>({ tipo: 'cargando', solicitud }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando', solicitud: null } as EstadoVista },
  );

  /** Evita mostrar la sugerencia de la planificación anterior mientras llega la nueva. */
  readonly vista = computed<EstadoVista>(() => {
    const solicitud = this.solicitud();
    const respuesta = this.respuesta();
    return respuesta.solicitud === solicitud ? respuesta : { tipo: 'cargando', solicitud };
  });

  /** Materias que todavía se pueden agregar a mano. */
  readonly agregables = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) =>
        defer(() => this.servicio.materiasAgregables(solicitud.planificacionId)).pipe(
          catchError(() => of<Materia[]>([])),
        ),
      ),
    ),
    { initialValue: [] as Materia[] },
  );

  readonly cursos = computed<CursoSugerido[]>(() => {
    const vista = this.vista();
    if (vista.tipo !== 'listo') return [];
    return [...vista.datos.cursos].sort(
      (a, b) =>
        (a.curso.nivel ?? Number.MAX_SAFE_INTEGER) - (b.curso.nivel ?? Number.MAX_SAFE_INTEGER) ||
        a.curso.materia.codigo.localeCompare(b.curso.materia.codigo, 'es', { numeric: true }),
    );
  });

  readonly parametros = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.datos.parametros : null;
  });

  readonly excluidas = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.datos.excluidas : [];
  });

  /** HU G2-06: los cambios solo se permiten mientras la planificación está en borrador. */
  readonly editable = computed(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' && vista.datos.estado === 'BORRADOR';
  });

  readonly cursosAceptados = computed(
    () => this.cursos().filter((c) => c.curso.estado === 'ACEPTADO').length,
  );

  /** Paralelos que se van a aperturar en total (solo cursos aceptados). */
  readonly paralelosTotales = computed(() =>
    this.cursos()
      .filter((c) => c.curso.estado === 'ACEPTADO')
      .reduce((total, c) => total + c.paralelosDecididos, 0),
  );

  readonly bloqueado = computed(() => !this.editable() || this.guardando() !== null);

  readonly puedeAgregarManual = computed(
    () => this.editable() && this.agregables().length > 0 && this.guardando() === null,
  );

  aceptar(item: CursoSugerido): void {
    this.ejecutar(
      item.curso.id,
      this.servicio.aceptarCurso(this.planificacionId(), item.curso.id),
    );
  }

  reactivar(item: CursoSugerido): void {
    this.ejecutar(
      item.curso.id,
      this.servicio.reactivarCurso(this.planificacionId(), item.curso.id),
    );
  }

  anular(item: CursoSugerido): void {
    if (this.bloqueado()) return;
    void this.confirmacion
      .abrir({
        titulo: `Anular ${item.curso.materia.codigo}`,
        mensaje: `${item.curso.materia.nombre} no se aperturará en este período. Sus paralelos sugeridos se pierden.`,
        textoConfirmar: 'Anular curso',
        peligro: true,
      })
      .then((confirmado) => {
        if (confirmado) {
          this.ejecutar(
            item.curso.id,
            this.servicio.anularCurso(this.planificacionId(), item.curso.id),
          );
        }
      });
  }

  cambiarParalelos(item: CursoSugerido, valor: string): void {
    const paralelos = Number(valor);
    if (paralelos === item.paralelosDecididos) return;
    if (!Number.isInteger(paralelos) || paralelos < 1 || paralelos > MAXIMO_PARALELOS) {
      this.errorAccion.set(
        `El número de paralelos de ${item.curso.materia.codigo} debe estar entre 1 y ${MAXIMO_PARALELOS}.`,
      );
      this.recargar();
      return;
    }
    this.ejecutar(
      item.curso.id,
      this.servicio.cambiarParalelos(this.planificacionId(), item.curso.id, paralelos),
    );
  }

  abrirFormularioManual(): void {
    this.limpiarMensajes();
    this.formularioManualAbierto.set(true);
  }

  cerrarFormularioManual(): void {
    this.formularioManualAbierto.set(false);
  }

  /** Agrega un curso que las reglas no sugirieron (HU G2-06). */
  agregarManual(materiaId: string, paralelos: string, motivo: string): void {
    const id = Number(materiaId);
    if (!id) {
      this.errorAccion.set('Elige la materia que quieres agregar.');
      return;
    }
    this.guardando.set('manual');
    this.errorAccion.set(null);
    this.servicio
      .agregarCursoManual(this.planificacionId(), id, Number(paralelos), motivo)
      .subscribe({
        next: (datos) => {
          this.guardando.set(null);
          this.formularioManualAbierto.set(false);
          this.aviso.set('Curso agregado a mano. Queda registrado con origen MANUAL.');
          this.recargar();
          this.cursosChange.emit(datos.cursos);
        },
        error: (error: Error) => {
          this.guardando.set(null);
          this.errorAccion.set(error.message || 'No se pudo agregar el curso.');
        },
      });
  }

  reintentar(): void {
    this.limpiarMensajes();
    this.recargar();
  }

  alternarMaterias(): void {
    this.verMaterias.update((valor) => !valor);
  }

  private recargar(): void {
    this.intento.update((valor) => valor + 1);
  }

  private limpiarMensajes(): void {
    this.aviso.set(null);
    this.errorAccion.set(null);
  }

  private ejecutar(referencia: number, operacion: Observable<SugerenciaCursos>): void {
    if (this.bloqueado()) return;
    this.guardando.set(referencia);
    this.limpiarMensajes();
    operacion.subscribe({
      next: (datos) => {
        this.guardando.set(null);
        this.recargar();
        this.cursosChange.emit(datos.cursos);
      },
      error: (error: Error) => {
        this.guardando.set(null);
        this.errorAccion.set(error.message || 'No se pudo guardar la decisión.');
        this.recargar();
      },
    });
  }
}
