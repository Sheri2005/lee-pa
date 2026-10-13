// C4-06 · Dueño: G4 · Reservas
// Página /reservas/nueva: solicitud de reserva de un espacio, puntual o semanal. Comprueba la disponibilidad de
// cada fecha y envía la solicitud a aprobación (G5). Coordina C4-04, C4-09, C4-10 y C4-18.
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of, startWith, Subscription, switchMap, timer } from 'rxjs';
import { ResultadoDisponibilidad } from '../../../app/core/models/ocupacion.model';
import {
  DiaSemana,
  NuevaSolicitudReserva,
  RecursoSolicitado,
  SolicitudRegistrada,
} from '../../../app/core/models/reserva.model';
import {
  evaluarDisponibilidad,
  OcupacionService,
  ocurrenciasPendientes,
} from '../../../app/core/services/ocupacion.service';
import { ReservaService } from '../../../app/core/services/reserva.service';
import {
  CampoSeleccionComponent,
  OpcionSeleccion,
} from '../../../app/shared/components/selector-rango-fechas/campo-seleccion';
import {
  fechaLegible,
  fechaValida,
  hoy,
} from '../../../app/shared/components/selector-rango-fechas/rango-fechas';
import { OcurrenciasRecurrentesComponent } from '../ocurrencias-recurrentes/ocurrencias-recurrentes';
import {
  DIAS_HABILES,
  DIAS_SEMANA,
  generarFechas,
  MAXIMO_DIAS_SERIE,
  Recurrencia,
  RecurrenciaFormComponent,
  validarRecurrencia,
} from '../recurrencia-form/recurrencia-form';
import { RecursosDeReservaComponent } from '../recursos-de-reserva/recursos-de-reserva';
import { Espacio } from '../../../app/core/models/espacio.model';
import { pisoLegible, tipoLegible } from '../resultados-disponibilidad/resultados-disponibilidad';
import {
  ahoraEnGuayaquil,
  diagnosticarRangoHorario,
  LimitesRangoHorario,
  SelectorRangoHorarioComponent,
} from '../selector-rango-horario/selector-rango-horario';

/** Política del módulo para solicitar reservas. */
export const HORA_MINIMA = '07:00';
export const HORA_MAXIMA = '21:00';
export const PASO_MINUTOS = 15;
/** Tope de asistentes cuando todavía no se conoce la capacidad del espacio. */
export const ASISTENTES_MAXIMO = 500;
/** Los botones − / + de asistentes van de 5 en 5; escribiendo se admite cualquier número. */
export const PASO_ASISTENTES = 5;
export const MOTIVO_MINIMO = 10;
export const MOTIVO_MAXIMO = 300;
/** Espera tras el último cambio antes de comprobar la disponibilidad. */
export const ESPERA_VALIDACION_MS = 300;

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

type EstadoCatalogo =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; espacios: Espacio[] }
  | { tipo: 'sin-servicio' }
  | { tipo: 'error' };

/** Datos que determinan la disponibilidad; `clave` identifica la consulta. */
interface Consulta {
  espacioId: number;
  fechas: string[];
  inicio: string;
  fin: string;
  clave: string;
}

export type EstadoValidacion =
  | { tipo: 'incompleta' }
  | { tipo: 'validando'; clave: string }
  | { tipo: 'sin-servicio'; clave: string }
  | { tipo: 'error'; clave: string }
  | { tipo: 'listo'; clave: string; resultado: ResultadoDisponibilidad };

type EstadoEnvio =
  | { tipo: 'inactivo' }
  | { tipo: 'enviando'; clave: string }
  | { tipo: 'enviada'; clave: string; registro: SolicitudRegistrada }
  | { tipo: 'sin-servicio'; clave: string }
  | { tipo: 'error'; clave: string };

/** Mensaje de error del número de asistentes, o `null`. */
export function validarAsistentes(texto: string, capacidad: number | null): string | null {
  const limpio = texto.trim();
  if (!limpio) return 'Indica cuántas personas asistirán.';
  if (!/^\d+$/.test(limpio)) return 'Escribe un número entero de personas.';
  const numero = Number(limpio);
  if (numero < 1) return 'Debe asistir al menos una persona.';
  if (capacidad !== null && numero > capacidad)
    return `El espacio admite hasta ${capacidad} ${capacidad === 1 ? 'persona' : 'personas'}.`;
  if (numero > ASISTENTES_MAXIMO) return `Se admiten hasta ${ASISTENTES_MAXIMO} personas.`;
  return null;
}

/** Mensaje de error del motivo, o `null`. */
export function validarMotivo(texto: string): string | null {
  const largo = texto.trim().length;
  if (!largo) return 'Escribe el motivo de la reserva.';
  if (largo < MOTIVO_MINIMO) return `Describe el motivo con al menos ${MOTIVO_MINIMO} caracteres.`;
  if (largo > MOTIVO_MAXIMO) return `El motivo admite hasta ${MOTIVO_MAXIMO} caracteres.`;
  return null;
}

let siguienteId = 0;

@Component({
  selector: 'app-reserva-form',
  imports: [
    CampoSeleccionComponent,
    OcurrenciasRecurrentesComponent,
    RecurrenciaFormComponent,
    RecursosDeReservaComponent,
    SelectorRangoHorarioComponent,
  ],
  templateUrl: './reserva-form.html',
  host: { class: 'block' },
})
export class ReservaFormComponent {
  private readonly ocupacionService = inject(OcupacionService);
  private readonly reservaService = inject(ReservaService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly id = `reserva-form-${siguienteId++}`;
  protected readonly HORA_MINIMA = HORA_MINIMA;
  protected readonly HORA_MAXIMA = HORA_MAXIMA;
  protected readonly PASO_MINUTOS = PASO_MINUTOS;
  protected readonly MOTIVO_MAXIMO = MOTIVO_MAXIMO;
  protected readonly MAXIMO_DIAS_SERIE = MAXIMO_DIAS_SERIE;
  protected readonly DIAS_HABILES = DIAS_HABILES;
  protected readonly fechaMinima = hoy();

  // Solicitud. Los valores que llegan en la URL desde app-buscar-espacios (C4-01) solo precargan el formulario.
  protected readonly espacioId = signal<number | null>(null);
  protected readonly fecha = signal('');
  protected readonly inicio = signal('');
  protected readonly fin = signal('');
  protected readonly repetir = signal(false);
  protected readonly dias = signal<DiaSemana[]>([]);
  protected readonly hasta = signal('');
  /** Empieza en 1: al menos asiste quien reserva. */
  protected readonly asistentes = signal('1');
  protected readonly motivo = signal('');
  protected readonly recursos = signal<RecursoSolicitado[]>([]);

  /** Campos que el usuario ya dejó; sus errores se muestran desde entonces. */
  protected readonly tocados = signal<ReadonlySet<'asistentes' | 'motivo'>>(new Set());
  /** Tras intentar enviar se muestran todos los errores. */
  protected readonly intentado = signal(false);
  private readonly reintentos = signal(0);
  private readonly envio = signal<EstadoEnvio>({ tipo: 'inactivo' });
  private suscripcionEnvio?: Subscription;

  // Catálogo de espacios: TEMPORAL hasta que G3 publique su servicio y app-selector-espacio.
  protected readonly catalogo = toSignal(
    this.ocupacionService.espacios().pipe(
      map((espacios): EstadoCatalogo =>
        espacios ? { tipo: 'listo', espacios } : { tipo: 'sin-servicio' },
      ),
      catchError(() => of<EstadoCatalogo>({ tipo: 'error' })),
    ),
    { initialValue: { tipo: 'cargando' } as EstadoCatalogo },
  );
  protected readonly espacio = computed(() => {
    const catalogo = this.catalogo();
    return catalogo.tipo === 'listo'
      ? (catalogo.espacios.find((e) => e.id === this.espacioId()) ?? null)
      : null;
  });
  protected readonly opcionesEspacio = computed<OpcionSeleccion[]>(() => {
    const catalogo = this.catalogo();
    if (catalogo.tipo !== 'listo') return [];
    return catalogo.espacios
      .filter((e) => e.estado)
      .map((e) => ({
        valor: String(e.id),
        etiqueta: `${e.codigo} · ${e.nombre}`,
        detalle: `${e.edificio}, ${pisoLegible(e.piso).toLowerCase()} · ${e.capacidad} personas`,
      }));
  });

  private readonly limites: Omit<LimitesRangoHorario, 'ahora'> = {
    fechaMin: this.fechaMinima,
    horaMin: HORA_MINIMA,
    horaMax: HORA_MAXIMA,
    soloDiasHabiles: true,
    pasoMinutos: PASO_MINUTOS,
  };

  // Errores de cada parte de la solicitud.
  protected readonly errorEspacio = computed(() => {
    if (this.espacioId() === null) return 'Elige el espacio que quieres reservar.';
    const catalogo = this.catalogo();
    if (catalogo.tipo === 'listo' && !this.espacio())
      return 'Ese espacio no está disponible para reservas; elige otro.';
    return null;
  });
  /** La hora actual se lee en cada cambio de fecha u horas, como en C4-04: no queda fija al abrir la página. */
  protected readonly errorHorario = computed(
    () =>
      diagnosticarRangoHorario(
        { fecha: this.fecha(), inicio: this.inicio(), fin: this.fin() },
        { ...this.limites, ahora: ahoraEnGuayaquil() },
      )?.mensaje ?? null,
  );
  protected readonly recurrencia = computed<Recurrencia>(() => ({
    frecuencia: 'SEMANAL',
    dias_semana: DIAS_SEMANA.map((d) => d.valor).filter((d) => this.dias().includes(d)),
    fecha_desde: this.fecha(),
    fecha_hasta: this.hasta(),
  }));
  protected readonly errorRecurrencia = computed(() =>
    this.repetir()
      ? validarRecurrencia(this.recurrencia(), MAXIMO_DIAS_SERIE, this.fechaMinima)
      : null,
  );
  protected readonly errorAsistentes = computed(() =>
    validarAsistentes(this.asistentes(), this.espacio()?.capacidad ?? null),
  );
  protected readonly errorMotivo = computed(() => validarMotivo(this.motivo()));
  protected readonly topeAsistentes = computed(
    () => this.espacio()?.capacidad ?? ASISTENTES_MAXIMO,
  );
  protected readonly numeroAsistentes = computed(() => {
    const numero = Number(this.asistentes().trim());
    return Number.isInteger(numero) ? numero : 0;
  });

  protected readonly mostrarErrorAsistentes = computed(
    () => !!this.errorAsistentes() && (this.intentado() || this.tocados().has('asistentes')),
  );
  protected readonly mostrarErrorMotivo = computed(
    () => !!this.errorMotivo() && (this.intentado() || this.tocados().has('motivo')),
  );

  /** Fechas que se piden: la de la reserva, o las que genera la serie. */
  protected readonly fechas = computed(() => {
    if (this.errorHorario()) return [];
    if (!this.repetir()) return [this.fecha()];
    return this.errorRecurrencia() ? [] : generarFechas(this.recurrencia());
  });

  private readonly consulta = computed<Consulta | null>(
    () => {
      const espacioId = this.espacioId();
      const fechas = this.fechas();
      if (espacioId === null || this.errorEspacio() || !fechas.length) return null;
      const datos = { espacioId, fechas, inicio: this.inicio(), fin: this.fin() };
      return { ...datos, clave: JSON.stringify(datos) };
    },
    { equal: (a, b) => a?.clave === b?.clave },
  );

  private readonly validacion = toSignal(
    toObservable(
      computed(() => ({ consulta: this.consulta(), reintento: this.reintentos() })),
    ).pipe(
      switchMap(({ consulta }): Observable<EstadoValidacion> => {
        if (!consulta) return of({ tipo: 'incompleta' });
        const { espacioId, fechas, inicio, fin, clave } = consulta;
        return timer(ESPERA_VALIDACION_MS).pipe(
          switchMap(() =>
            this.ocupacionService.ocupacion(espacioId, fechas[0], fechas[fechas.length - 1]),
          ),
          map((ocupaciones): EstadoValidacion =>
            ocupaciones
              ? {
                  tipo: 'listo',
                  clave,
                  resultado: evaluarDisponibilidad(espacioId, fechas, inicio, fin, ocupaciones),
                }
              : { tipo: 'sin-servicio', clave },
          ),
          catchError(() => of<EstadoValidacion>({ tipo: 'error', clave })),
          startWith<EstadoValidacion>({ tipo: 'validando', clave }),
        );
      }),
    ),
    { initialValue: { tipo: 'incompleta' } as EstadoValidacion },
  );

  /** Estado de la validación de la solicitud actual: una respuesta de otra solicitud no cuenta. */
  protected readonly estadoValidacion = computed<EstadoValidacion>(() => {
    const consulta = this.consulta();
    const validacion = this.validacion();
    if (!consulta) return { tipo: 'incompleta' };
    if (validacion.tipo === 'incompleta' || validacion.clave !== consulta.clave)
      return { tipo: 'validando', clave: consulta.clave };
    return validacion;
  });
  protected readonly resultado = computed(() => {
    const estado = this.estadoValidacion();
    return estado.tipo === 'listo' ? estado.resultado : null;
  });
  protected readonly ocurrencias = computed(
    () =>
      this.resultado()?.ocurrencias ??
      ocurrenciasPendientes(this.fechas(), this.inicio(), this.fin()),
  );
  protected readonly conflictos = computed(
    () => this.ocurrencias().filter((o) => o.estado === 'CONFLICTO').length,
  );

  /** Lo que se enviará; `null` mientras falte algo o tenga errores. */
  protected readonly solicitud = computed<NuevaSolicitudReserva | null>(() => {
    const espacioId = this.espacioId();
    if (
      espacioId === null ||
      this.errorEspacio() ||
      !this.fechas().length ||
      this.errorAsistentes() ||
      this.errorMotivo()
    )
      return null;
    return {
      espacio_id: espacioId,
      hora_inicio: this.inicio(),
      hora_fin: this.fin(),
      asistentes: Number(this.asistentes().trim()),
      motivo: this.motivo().trim(),
      serie: this.repetir() ? this.recurrencia() : null,
      fechas: this.fechas(),
      recursos: this.recursos(),
    };
  });
  private readonly claveSolicitud = computed(() => JSON.stringify(this.solicitud()));
  /** Estado del envío de la solicitud actual; si el usuario la cambia, vuelve a estar sin enviar. */
  protected readonly estadoEnvio = computed<EstadoEnvio>(() => {
    const envio = this.envio();
    return envio.tipo !== 'inactivo' && envio.clave === this.claveSolicitud()
      ? envio
      : { tipo: 'inactivo' };
  });

  /** Solo se envía una solicitud cuya disponibilidad se comprobó y que no se está enviando o ya se envió. */
  protected readonly envioHabilitado = computed(
    () =>
      !!this.resultado()?.disponible &&
      this.estadoEnvio().tipo !== 'enviando' &&
      this.estadoEnvio().tipo !== 'enviada',
  );

  /** Por qué no se puede enviar todavía (se anuncia junto al botón). */
  protected readonly motivoBloqueo = computed(() => {
    const envio = this.estadoEnvio();
    if (envio.tipo === 'enviando') return 'Enviando la solicitud…';
    if (envio.tipo === 'enviada') return 'Esta solicitud ya se envió.';
    switch (this.estadoValidacion().tipo) {
      case 'incompleta':
        return this.repetir()
          ? 'Completa el espacio, el horario y la repetición para comprobar la disponibilidad.'
          : 'Completa el espacio, la fecha y el horario para comprobar la disponibilidad.';
      case 'validando':
        return 'Comprobando la disponibilidad…';
      case 'sin-servicio':
        return 'No se puede enviar sin comprobar la disponibilidad.';
      case 'error':
        return 'No se puede enviar sin comprobar la disponibilidad.';
    }
    if (!this.resultado()?.disponible) return 'Resuelve los conflictos para poder enviar.';
    return '';
  });

  // Resumen.
  protected readonly resumenFechas = computed(() => {
    const fechas = this.fechas();
    if (!fechas.length) return '';
    if (fechas.length === 1) return fechaLegible(fechas[0]);
    return `${fechas.length} reservas, del ${fechaLegible(fechas[0])} al ${fechaLegible(fechas[fechas.length - 1])}`;
  });
  protected readonly totalRecursos = computed(() =>
    this.recursos().reduce((total, r) => total + r.cantidad, 0),
  );

  protected readonly fechaLegible = fechaLegible;
  protected readonly tipoLegible = tipoLegible;
  protected readonly pisoLegible = pisoLegible;

  constructor() {
    const parametros = inject(ActivatedRoute, { optional: true })?.snapshot.queryParamMap;
    if (!parametros) return;
    const espacioId = Number(parametros.get('espacioId'));
    if (Number.isInteger(espacioId) && espacioId > 0) this.espacioId.set(espacioId);
    const fecha = parametros.get('fecha') ?? '';
    if (fechaValida(fecha)) this.fecha.set(fecha);
    const inicio = parametros.get('horaInicio') ?? '';
    const fin = parametros.get('horaFin') ?? '';
    if (HORA.test(inicio)) this.inicio.set(inicio);
    if (HORA.test(fin)) this.fin.set(fin);
  }

  protected elegirEspacio(valor: string): void {
    this.espacioId.set(valor ? Number(valor) : null);
  }

  /** Para app-espacios-alternativos (C4-08): "Usar este" cambia el espacio y se vuelve a comprobar. */
  protected usarEspacio(espacio: Espacio): void {
    this.espacioId.set(espacio.id);
  }

  protected cambiarRepetir(): void {
    this.repetir.update((repetir) => !repetir);
  }

  protected escribirAsistentes(evento: Event): void {
    this.asistentes.set((evento.target as HTMLInputElement).value);
  }

  /** − / + saltan al múltiplo de 5 anterior o siguiente (12 → 15 o 10), entre 1 y el tope. */
  protected sumarAsistentes(sentido: 1 | -1): void {
    const actual = this.numeroAsistentes();
    const destino =
      sentido > 0
        ? (Math.floor(actual / PASO_ASISTENTES) + 1) * PASO_ASISTENTES
        : (Math.ceil(actual / PASO_ASISTENTES) - 1) * PASO_ASISTENTES;
    const nuevo = Math.min(Math.max(destino, 1), this.topeAsistentes());
    this.asistentes.set(String(nuevo));
    this.tocar('asistentes');
  }

  protected escribirMotivo(evento: Event): void {
    this.motivo.set((evento.target as HTMLTextAreaElement).value);
  }

  protected tocar(campo: 'asistentes' | 'motivo'): void {
    if (!this.tocados().has(campo)) this.tocados.update((t) => new Set([...t, campo]));
  }

  protected reintentar(): void {
    this.reintentos.update((n) => n + 1);
  }

  protected enviar(): void {
    this.intentado.set(true);
    const solicitud = this.solicitud();
    if (!solicitud) {
      this.enfocarPrimerError();
      return;
    }
    if (!this.envioHabilitado()) return;

    const clave = this.claveSolicitud();
    this.envio.set({ tipo: 'enviando', clave });
    this.suscripcionEnvio?.unsubscribe();
    this.suscripcionEnvio = this.reservaService
      .solicitar(solicitud)
      .pipe(
        map((registro): EstadoEnvio =>
          registro ? { tipo: 'enviada', clave, registro } : { tipo: 'sin-servicio', clave },
        ),
        catchError(() => of<EstadoEnvio>({ tipo: 'error', clave })),
      )
      .subscribe((estado) => this.envio.set(estado));
  }

  /** Vacía el formulario para una nueva solicitud. */
  protected nuevaSolicitud(): void {
    this.suscripcionEnvio?.unsubscribe();
    this.espacioId.set(null);
    this.fecha.set('');
    this.inicio.set('');
    this.fin.set('');
    this.repetir.set(false);
    this.dias.set([]);
    this.hasta.set('');
    this.asistentes.set('1');
    this.motivo.set('');
    this.tocados.set(new Set());
    this.intentado.set(false);
    this.envio.set({ tipo: 'inactivo' });
  }

  private enfocarPrimerError(): void {
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLElement>('[aria-invalid="true"], [data-error-campo]')
          ?.focus(),
      { injector: this.injector },
    );
  }
}
