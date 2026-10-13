/**
 * app-disponibilidad-docente · C2-16 · Página (/planificacion/disponibilidad)
 * Grupo dueño: G2 · Planificación (responsable: Paula Martillo). HU: G2-09.
 *
 * Registro de disponibilidad: se elige período y docente y se marcan en una matriz día × franja
 * las franjas en que el docente está disponible. Las franjas salen del catálogo del M3 según el
 * **tipo del período** (ordinario o extraordinario). Incluye copiar la disponibilidad de un
 * período anterior del mismo tipo.
 *
 * Reutiliza C2-25 (estado vacío) y C2-26 (spinner).
 * Piezas pendientes de otros grupos, ruta y ejemplo de uso en README.md (misma carpeta).
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, defer, map, of, startWith, switchMap } from 'rxjs';
import { DisponibilidadCargada } from '../../../core/models/disponibilidad.model';
import {
  DIAS_SEMANA,
  DiaSemana,
  FranjaHoraria,
  duracionHoras,
} from '../../../core/models/franja.model';
import { DisponibilidadService } from '../../../core/services/disponibilidad.service';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio.component';
import { SpinnerCargaComponent } from '../../../shared/components/spinner-carga/spinner-carga.component';

interface Clave {
  docenteId: number;
  periodoId: number;
  intento: number;
}

type EstadoPantalla =
  | { tipo: 'cargando'; clave: Clave | null }
  | { tipo: 'error'; clave: Clave }
  | { tipo: 'listo'; clave: Clave; datos: DisponibilidadCargada };

/** Una celda de la matriz: la franja de ese día y bloque, o null si no existe. */
interface Celda {
  dia: DiaSemana;
  etiquetaDia: string;
  franja: FranjaHoraria | null;
}

interface Fila {
  etiqueta: string;
  horaInicio: string;
  celdas: Celda[];
}

@Component({
  selector: 'app-disponibilidad-docente',
  imports: [EstadoVacioComponent, SpinnerCargaComponent],
  templateUrl: './disponibilidad-docente.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class DisponibilidadDocenteComponent {
  private readonly servicio = inject(DisponibilidadService);

  readonly periodos = toSignal(this.servicio.listarPeriodos(), { initialValue: [] });
  readonly docentes = toSignal(this.servicio.listarDocentes(), { initialValue: [] });

  /** Elección del usuario; null = todavía no eligió y se usa el primero de la lista. */
  private readonly periodoElegido = signal<number | null>(null);
  private readonly docenteElegido = signal<number | null>(null);
  private readonly intento = signal(0);

  readonly periodoActual = computed(
    () => this.periodos().find((p) => p.id === this.periodoElegido()) ?? this.periodos()[0] ?? null,
  );
  readonly docenteActual = computed(
    () => this.docentes().find((d) => d.id === this.docenteElegido()) ?? this.docentes()[0] ?? null,
  );

  /** Cambios sin guardar de la combinación docente + período que se está viendo. */
  private readonly borrador = signal<{ clave: Clave; seleccion: ReadonlySet<number> } | null>(
    null,
  );

  readonly guardando = signal(false);
  readonly aviso = signal<string | null>(null);
  readonly errorAccion = signal<string | null>(null);

  private readonly clave = computed<Clave | null>(() => {
    const periodo = this.periodoActual();
    const docente = this.docenteActual();
    if (!periodo || !docente) return null;
    return { docenteId: docente.id, periodoId: periodo.id, intento: this.intento() };
  });

  private readonly respuesta = toSignal(
    toObservable(this.clave).pipe(
      switchMap((clave) => {
        if (!clave) return of<EstadoPantalla>({ tipo: 'cargando', clave: null });
        return defer(() =>
          this.servicio.obtenerDisponibilidad(clave.docenteId, clave.periodoId),
        ).pipe(
          map((datos): EstadoPantalla => ({ tipo: 'listo', clave, datos })),
          catchError(() => of<EstadoPantalla>({ tipo: 'error', clave })),
          startWith<EstadoPantalla>({ tipo: 'cargando', clave }),
        );
      }),
    ),
    { initialValue: { tipo: 'cargando', clave: null } as EstadoPantalla },
  );

  /** Evita mostrar la matriz del docente anterior mientras llega la nueva respuesta. */
  readonly vista = computed<EstadoPantalla>(() => {
    const clave = this.clave();
    const respuesta = this.respuesta();
    if (!clave) return { tipo: 'cargando', clave: null };
    return respuesta.clave === clave ? respuesta : { tipo: 'cargando', clave };
  });

  private readonly franjas = computed<FranjaHoraria[]>(() => {
    const vista = this.vista();
    return vista.tipo === 'listo' ? vista.datos.franjas : [];
  });

  /** Franjas marcadas: el borrador si corresponde a esta vista, o lo que está guardado. */
  readonly seleccion = computed<ReadonlySet<number>>(() => {
    const vista = this.vista();
    if (vista.tipo !== 'listo') return new Set<number>();
    const borrador = this.borrador();
    return borrador && borrador.clave === vista.clave
      ? borrador.seleccion
      : new Set(vista.datos.franjasDisponibles);
  });

  readonly hayCambios = computed(() => {
    const vista = this.vista();
    const borrador = this.borrador();
    if (vista.tipo !== 'listo' || !borrador || borrador.clave !== vista.clave) return false;
    const guardadas = new Set(vista.datos.franjasDisponibles);
    return (
      borrador.seleccion.size !== guardadas.size ||
      [...borrador.seleccion].some((id) => !guardadas.has(id))
    );
  });

  /** Días que tienen franjas en este tipo de período (columnas de la matriz). */
  readonly dias = computed(() =>
    DIAS_SEMANA.filter(({ dia }) => this.franjas().some((f) => f.diaSemana === dia)),
  );

  /** Bloques horarios (filas), ordenados por hora de inicio. */
  readonly filas = computed<Fila[]>(() => {
    const franjas = this.franjas();
    const bloques = [...new Set(franjas.map((f) => `${f.horaInicio}|${f.horaFin}`))].sort();
    return bloques.map((bloque) => {
      const [horaInicio, horaFin] = bloque.split('|');
      return {
        etiqueta: `${horaInicio} – ${horaFin}`,
        horaInicio,
        celdas: this.dias().map(({ dia, etiqueta }) => ({
          dia,
          etiquetaDia: etiqueta,
          franja:
            franjas.find(
              (f) => f.diaSemana === dia && f.horaInicio === horaInicio && f.horaFin === horaFin,
            ) ?? null,
        })),
      };
    });
  });

  readonly totalMarcadas = computed(() => this.seleccion().size);

  /** Horas semanales que suman las franjas marcadas. */
  readonly horasMarcadas = computed(() =>
    this.franjas()
      .filter((f) => this.seleccion().has(f.id))
      .reduce((total, f) => total + duracionHoras(f), 0),
  );

  /** La disponibilidad marcada no alcanza para la carga máxima del docente. */
  readonly noAlcanzaCarga = computed(() => {
    const vista = this.vista();
    if (vista.tipo !== 'listo') return false;
    return this.horasMarcadas() < vista.datos.docente.cargaMaximaHoras;
  });

  /** Período del que se puede copiar la disponibilidad, si existe. */
  readonly periodoParaCopiar = computed(() => {
    const clave = this.clave();
    if (!clave) return null;
    return this.servicio.periodoAnteriorConDatos(clave.docenteId, clave.periodoId);
  });

  estaMarcada(franja: FranjaHoraria): boolean {
    return this.seleccion().has(franja.id);
  }

  /** Todas las franjas de ese día ya están marcadas. */
  diaCompleto(dia: DiaSemana): boolean {
    const delDia = this.franjas().filter((f) => f.diaSemana === dia);
    return delDia.length > 0 && delDia.every((f) => this.seleccion().has(f.id));
  }

  cambiarPeriodo(valor: string): void {
    this.limpiarMensajes();
    this.periodoElegido.set(Number(valor) || null);
  }

  cambiarDocente(valor: string): void {
    this.limpiarMensajes();
    this.docenteElegido.set(Number(valor) || null);
  }

  alternarFranja(franja: FranjaHoraria): void {
    this.escribirSeleccion((seleccion) => {
      const nueva = new Set(seleccion);
      if (!nueva.delete(franja.id)) nueva.add(franja.id);
      return nueva;
    });
  }

  /** Marca o desmarca de un golpe todas las franjas de un día. */
  alternarDia(dia: DiaSemana): void {
    const completo = this.diaCompleto(dia);
    const delDia = this.franjas().filter((f) => f.diaSemana === dia);
    this.escribirSeleccion((seleccion) => {
      const nueva = new Set(seleccion);
      for (const franja of delDia) {
        if (completo) nueva.delete(franja.id);
        else nueva.add(franja.id);
      }
      return nueva;
    });
  }

  limpiar(): void {
    this.escribirSeleccion(() => new Set<number>());
  }

  /** Descarta los cambios y vuelve a lo que está guardado. */
  descartar(): void {
    this.limpiarMensajes();
    this.borrador.set(null);
  }

  /** Copia la disponibilidad de un período anterior del mismo tipo (criterio opcional G2-09). */
  copiarPeriodoAnterior(): void {
    const clave = this.clave();
    if (!clave) return;
    this.limpiarMensajes();
    this.guardando.set(true);
    this.servicio.copiarDelPeriodoAnterior(clave.docenteId, clave.periodoId).subscribe({
      next: (ids) => {
        this.guardando.set(false);
        const validas = new Set(this.franjas().map((f) => f.id));
        const copiadas = ids.filter((id) => validas.has(id));
        this.escribirSeleccion(() => new Set(copiadas));
        this.aviso.set(
          `Se copiaron ${copiadas.length} franjas. Revísalas y guarda si está correcto.`,
        );
      },
      error: (error: Error) => {
        this.guardando.set(false);
        this.errorAccion.set(error.message || 'No se pudo copiar la disponibilidad.');
      },
    });
  }

  guardar(): void {
    const clave = this.clave();
    if (!clave || !this.hayCambios()) return;
    this.limpiarMensajes();
    this.guardando.set(true);
    this.servicio.guardar(clave.docenteId, clave.periodoId, [...this.seleccion()]).subscribe({
      next: (datos) => {
        this.guardando.set(false);
        this.borrador.set(null);
        this.intento.update((valor) => valor + 1);
        this.aviso.set(
          `Disponibilidad guardada: ${datos.franjasDisponibles.length} franjas en ${datos.periodo.nombre}.`,
        );
      },
      error: (error: Error) => {
        this.guardando.set(false);
        this.errorAccion.set(error.message || 'No se pudo guardar la disponibilidad.');
      },
    });
  }

  reintentar(): void {
    this.limpiarMensajes();
    this.intento.update((valor) => valor + 1);
  }

  private escribirSeleccion(
    cambio: (seleccion: ReadonlySet<number>) => ReadonlySet<number>,
  ): void {
    const vista = this.vista();
    if (vista.tipo !== 'listo') return;
    this.borrador.set({ clave: vista.clave, seleccion: cambio(this.seleccion()) });
  }

  private limpiarMensajes(): void {
    this.aviso.set(null);
    this.errorAccion.set(null);
  }
}
