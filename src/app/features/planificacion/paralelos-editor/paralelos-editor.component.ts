/**
 * app-paralelos-editor · C2-11 · Hijo de app-planificacion-detalle
 * Grupo dueño: G2 · Planificación (responsable: Paula Martillo). HU: G2-07.
 *
 * Por cada curso planificado lista sus paralelos (A, B, C…) y permite agregarlos, eliminarlos
 * y editar su cupo, tipo de espacio requerido y recursos. Las horas semanales vienen de la
 * malla y no se editan. Una materia compartida no se apertura aquí (HU G2-08).
 *
 * Reutiliza C2-12 (tarjeta de paralelo), C2-25 (estado vacío) y C2-26 (spinner), y confirma el
 * borrado con ConfirmacionService → C2-24.
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
import { CursoPlanificado } from '../../../core/models/curso-planificado.model';
import {
  ETIQUETAS_TIPO_ESPACIO,
  Paralelo,
  TIPOS_ESPACIO,
  TipoEspacio,
} from '../../../core/models/paralelo.model';
import { Recurso } from '../../../core/models/recurso.model';
import { ConfirmacionService } from '../../../core/services/confirmacion.service';
import { MAXIMO_PARALELOS, ParaleloService } from '../../../core/services/paralelo.service';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';
import { TarjetaParaleloComponent } from '../../../shared/components/tarjeta-paralelo/tarjeta-paralelo.component';

interface Solicitud {
  cursoId: number;
  intento: number;
}

type EstadoEditor =
  | { tipo: 'cargando'; solicitud: Solicitud | null }
  | { tipo: 'error'; solicitud: Solicitud }
  | { tipo: 'listo'; solicitud: Solicitud; paralelos: Paralelo[] };

/** Límites del cupo por paralelo en el prototipo (el backend los validará de verdad). */
const CUPO_MINIMO = 1;
const CUPO_MAXIMO = 500;

@Component({
  selector: 'app-paralelos-editor',
  imports: [TarjetaParaleloComponent, EstadoVacioComponent, SpinnerCargaComponent],
  templateUrl: './paralelos-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ParalelosEditorComponent {
  /** Curso cuyos paralelos se editan. */
  readonly cursoPlanificado = input.required<CursoPlanificado>();
  /** false deja el editor en solo lectura: los cambios solo se permiten en BORRADOR (HU G2-06). */
  readonly editable = input(true);

  /** Se emite con la lista completa cada vez que los paralelos del curso cambian. */
  readonly paralelosChange = output<Paralelo[]>();

  private readonly servicio = inject(ParaleloService);
  private readonly confirmacion = inject(ConfirmacionService);

  private readonly intento = signal(0);
  private readonly solicitud = computed<Solicitud>(() => ({
    cursoId: this.cursoPlanificado().id,
    intento: this.intento(),
  }));

  /** Paralelo que se está guardando ('nuevo' al agregar); deshabilita sus controles. */
  readonly guardando = signal<number | 'nuevo' | null>(null);
  /** Mensaje de la última acción que no se pudo completar. */
  readonly errorAccion = signal<string | null>(null);

  readonly tiposEspacio = TIPOS_ESPACIO;
  readonly etiquetasEspacio = ETIQUETAS_TIPO_ESPACIO;
  readonly recursosDisponibles = this.servicio.recursosDisponibles();
  readonly cupoMinimo = CUPO_MINIMO;
  readonly cupoMaximo = CUPO_MAXIMO;

  private readonly respuesta = toSignal(
    toObservable(this.solicitud).pipe(
      switchMap((solicitud) =>
        defer(() => this.servicio.listarPorCurso(solicitud.cursoId)).pipe(
          map((paralelos): EstadoEditor => ({ tipo: 'listo', solicitud, paralelos })),
          catchError(() => of<EstadoEditor>({ tipo: 'error', solicitud })),
          startWith<EstadoEditor>({ tipo: 'cargando', solicitud }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando', solicitud: null } as EstadoEditor },
  );

  /** Evita mostrar los paralelos del curso anterior mientras llega la nueva respuesta. */
  readonly vista = computed<EstadoEditor>(() => {
    const solicitud = this.solicitud();
    const respuesta = this.respuesta();
    return respuesta.solicitud === solicitud ? respuesta : { tipo: 'cargando', solicitud };
  });

  readonly paralelos = computed<Paralelo[]>(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.paralelos : [];
  });

  /** Cupo ofertado por el curso: suma de los cupos de sus paralelos. */
  readonly cupoTotal = computed(() =>
    this.paralelos().reduce((total, paralelo) => total + paralelo.cupo, 0),
  );

  /** Estudiantes estimados que se quedarían sin cupo con los paralelos actuales. */
  readonly cuposFaltantes = computed(() =>
    Math.max(this.cursoPlanificado().estudiantesEstimados - this.cupoTotal(), 0),
  );

  /** Diferencia entre los paralelos abiertos y los que sugirieron las reglas (HU G2-05). */
  readonly diferenciaSugerida = computed(
    () => this.paralelos().length - this.cursoPlanificado().paralelosSugeridos,
  );

  /** Una materia compartida la apertura su carrera responsable, no esta planificación. */
  readonly esCompartida = computed(() => this.cursoPlanificado().esCompartida);

  readonly puedeAgregar = computed(
    () =>
      this.editable() &&
      !this.esCompartida() &&
      this.vista().tipo === 'listo' &&
      this.paralelos().length < MAXIMO_PARALELOS &&
      this.guardando() === null,
  );

  /** true cuando los controles de edición deben estar deshabilitados. */
  readonly controlesBloqueados = computed(() => !this.editable() || this.guardando() !== null);

  tieneRecurso(paralelo: Paralelo, recurso: Recurso): boolean {
    return (paralelo.recursos ?? []).some((r) => r.id === recurso.id);
  }

  nombresRecursos(paralelo: Paralelo): string {
    const recursos = paralelo.recursos ?? [];
    return recursos.length ? recursos.map((r) => r.nombre).join(', ') : 'Ninguno';
  }

  agregar(): void {
    if (!this.puedeAgregar()) return;
    this.ejecutar('nuevo', this.servicio.agregar(this.cursoPlanificado()));
  }

  cambiarCupo(paralelo: Paralelo, valor: string): void {
    const cupo = Number(valor);
    if (!Number.isInteger(cupo) || cupo < CUPO_MINIMO || cupo > CUPO_MAXIMO) {
      this.errorAccion.set(
        `El cupo del paralelo ${paralelo.codigo} debe ser un número entre ${CUPO_MINIMO} y ${CUPO_MAXIMO}.`,
      );
      this.recargar();
      return;
    }
    if (cupo === paralelo.cupo) return;
    this.ejecutar(paralelo.id, this.servicio.actualizar(paralelo.id, { cupo }));
  }

  cambiarTipoEspacio(paralelo: Paralelo, valor: string): void {
    const tipoEspacioRequerido = valor as TipoEspacio;
    if (tipoEspacioRequerido === paralelo.tipoEspacioRequerido) return;
    this.ejecutar(paralelo.id, this.servicio.actualizar(paralelo.id, { tipoEspacioRequerido }));
  }

  alternarRecurso(paralelo: Paralelo, recurso: Recurso, marcado: boolean): void {
    const actuales = paralelo.recursos ?? [];
    const recursos = marcado
      ? [...actuales, recurso]
      : actuales.filter((r) => r.id !== recurso.id);
    this.ejecutar(paralelo.id, this.servicio.actualizar(paralelo.id, { recursos }));
  }

  eliminar(paralelo: Paralelo): void {
    if (!this.editable() || this.guardando() !== null) return;
    void this.confirmacion
      .abrir({
        titulo: `Eliminar el paralelo ${paralelo.codigo}`,
        mensaje: `Se quita el paralelo ${paralelo.codigo} de ${paralelo.materia.nombre}. Si ya tenía docente sugerido, se pierde esa sugerencia.`,
        textoConfirmar: 'Eliminar paralelo',
        peligro: true,
      })
      .then((confirmado) => {
        if (confirmado) this.ejecutar(paralelo.id, this.servicio.eliminar(paralelo.id));
      });
  }

  reintentar(): void {
    this.errorAccion.set(null);
    this.recargar();
  }

  private recargar(): void {
    this.intento.update((valor) => valor + 1);
  }

  /** Corre la operación, refresca la lista y avisa al padre; deja el mensaje si falla. */
  private ejecutar(referencia: number | 'nuevo', operacion: Observable<Paralelo[]>): void {
    this.guardando.set(referencia);
    this.errorAccion.set(null);
    operacion.subscribe({
      next: (paralelos) => {
        this.guardando.set(null);
        this.recargar();
        this.paralelosChange.emit(paralelos);
      },
      error: (error: Error) => {
        this.guardando.set(null);
        this.errorAccion.set(error.message || 'No se pudo guardar el cambio.');
        this.recargar();
      },
    });
  }
}
