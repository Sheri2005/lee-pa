// C4-14 · Dueño: G4 · Reservas
// Página /reservas/calendario: ocupación de un espacio (clases de G3 y reservas de G4) por semana o por mes.
// Consume OcupacionService. app-grilla-semanal (G3) y app-calendario-mensual (C4-15) van TEMPORAL.
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { Ocupacion } from '../../../app/core/models/ocupacion.model';
import {
  bloqueaEspacio,
  OcupacionService,
  SEPARACION_MINUTOS,
} from '../../../app/core/services/ocupacion.service';
import {
  DIAS_CORTOS,
  fechaCorta,
  nombreMes,
} from '../../../app/shared/components/selector-rango-fechas/campo-fecha';
import {
  CampoSeleccionComponent,
  OpcionSeleccion,
} from '../../../app/shared/components/selector-rango-fechas/campo-seleccion';
import {
  esteMes,
  estaSemana,
  fechaValida,
  hoy,
  RangoFechas,
  sumarDias,
} from '../../../app/shared/components/selector-rango-fechas/rango-fechas';
import { Espacio } from '../../../app/core/models/espacio.model';
import { fechaConDia } from '../ocurrencias-recurrentes/ocurrencias-recurrentes';
import { ahoraEnGuayaquil } from '../selector-rango-horario/selector-rango-horario';

export type VistaCalendario = 'semana' | 'mes';
const VISTAS: readonly VistaCalendario[] = ['semana', 'mes'];

/** Horario que muestra siempre la regla del día; se amplía si alguna ocupación cae fuera. */
export const HORA_INICIO_REGLA = 7 * 60;
export const HORA_FIN_REGLA = 21 * 60;
/** Alto de una hora en la cuadrícula semanal, en rem: 07:00–21:00 ocupa 42rem. */
export const ALTO_HORA_REM = 3;
/** Por debajo de esta duración el bloque muestra hora y título en una sola línea. */
export const MINUTOS_BLOQUE_COMPACTO = 50;

export interface HorarioRegla {
  desde: number;
  hasta: number;
}

type EstadoCatalogo =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; espacios: Espacio[] }
  | { tipo: 'sin-servicio' }
  | { tipo: 'error' };

interface Consulta extends RangoFechas {
  espacioId: number;
  clave: string;
}

type EstadoCarga =
  | { tipo: 'sin-espacio' }
  | { tipo: 'cargando'; clave: string }
  | { tipo: 'sin-servicio'; clave: string }
  | { tipo: 'error'; clave: string }
  | { tipo: 'listo'; clave: string; ocupaciones: Ocupacion[] };

/** Bloque de la mini regla de un día del mes, en porcentaje del horario. */
export interface BloqueRegla {
  ocupacion: Ocupacion;
  izquierda: number;
  ancho: number;
}

/**
 * Bloque de la columna de un día en la cuadrícula semanal: `arriba` y `alto` en porcentaje del horario;
 * las ocupaciones que se solapan se reparten el ancho en `carriles`.
 */
export interface BloqueColumna {
  ocupacion: Ocupacion;
  arriba: number;
  alto: number;
  carril: number;
  carriles: number;
  /** Duración corta: hora y título en una sola línea. */
  compacto: boolean;
}

export interface DiaSemanaOcupacion {
  iso: string;
  etiqueta: string;
  /** "Lun", "Mar"… para la cabecera de la columna. */
  diaCorto: string;
  numero: number;
  hoy: boolean;
  /** Día que se eligió en la vista mensual: su columna queda resaltada. */
  elegido: boolean;
  bloques: BloqueColumna[];
}

/** Cuánto del horario de 07:00 a 21:00 ocupan las clases y reservas aprobadas de un día. */
export type NivelOcupacion = 'libre' | 'bajo' | 'medio' | 'alto';

export interface DiaMes {
  iso: string;
  numero: number;
  delMes: boolean;
  hoy: boolean;
  clases: number;
  reservas: number;
  /** Minutos ocupados por lo que bloquea el espacio (sin solapes contados dos veces). */
  minutosOcupados: number;
  nivel: NivelOcupacion;
  /** Mini regla del día, con la misma escala para todo el mes. */
  bloques: BloqueRegla[];
  etiqueta: string;
}

function enMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function porOrden(a: Ocupacion, b: Ocupacion): number {
  return a.hora_inicio.localeCompare(b.hora_inicio) || a.hora_fin.localeCompare(b.hora_fin);
}

/** `630` → `10:30`. */
export function textoHora(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

/** Horas (en minutos) que abarca la regla: 07:00–21:00, ampliadas a la hora completa si hace falta. */
export function horarioRegla(ocupaciones: readonly Ocupacion[]): HorarioRegla {
  let desde = HORA_INICIO_REGLA;
  let hasta = HORA_FIN_REGLA;
  for (const o of ocupaciones) {
    desde = Math.min(desde, Math.floor(enMinutos(o.hora_inicio) / 60) * 60);
    hasta = Math.max(hasta, Math.ceil(enMinutos(o.hora_fin) / 60) * 60);
  }
  return { desde, hasta };
}

/** Horas en punto de la cuadrícula semanal, con su posición vertical en porcentaje. */
export function horasDeColumna(horario: HorarioRegla): { etiqueta: string; arriba: number }[] {
  const horas: { etiqueta: string; arriba: number }[] = [];
  for (let minutos = horario.desde; minutos <= horario.hasta; minutos += 60) {
    horas.push({
      etiqueta: textoHora(minutos),
      arriba: ((minutos - horario.desde) / (horario.hasta - horario.desde)) * 100,
    });
  }
  return horas;
}

function enPorcentaje(minutos: number, horario: HorarioRegla): number {
  const acotado = Math.min(Math.max(minutos, horario.desde), horario.hasta);
  return ((acotado - horario.desde) / (horario.hasta - horario.desde)) * 100;
}

/** Posición de cada ocupación en la mini regla de un día del mes. */
export function bloquesDelDia(
  ocupaciones: readonly Ocupacion[],
  horario: HorarioRegla,
): BloqueRegla[] {
  return ocupaciones
    .map((ocupacion) => {
      const izquierda = enPorcentaje(enMinutos(ocupacion.hora_inicio), horario);
      return {
        ocupacion,
        izquierda,
        ancho: enPorcentaje(enMinutos(ocupacion.hora_fin), horario) - izquierda,
      };
    })
    .filter((bloque) => bloque.ancho > 0);
}

/**
 * Posición de cada ocupación en la columna de un día. Las que se solapan (por ejemplo una reserva
 * pendiente sobre una clase) se colocan una al lado de otra en carriles.
 */
export function bloquesDeColumna(
  ocupaciones: readonly Ocupacion[],
  horario: HorarioRegla,
): BloqueColumna[] {
  const bloques: BloqueColumna[] = [];
  let grupo: BloqueColumna[] = [];
  let finesCarril: number[] = [];
  let finGrupo = -1;
  const cerrarGrupo = () => {
    for (const bloque of grupo) bloque.carriles = finesCarril.length;
    grupo = [];
    finesCarril = [];
  };
  for (const ocupacion of [...ocupaciones].sort(porOrden)) {
    const inicio = enMinutos(ocupacion.hora_inicio);
    const fin = enMinutos(ocupacion.hora_fin);
    if (inicio >= finGrupo) cerrarGrupo();
    let carril = finesCarril.findIndex((finCarril) => finCarril <= inicio);
    if (carril < 0) carril = finesCarril.push(fin) - 1;
    else finesCarril[carril] = fin;
    finGrupo = Math.max(finGrupo, fin);
    const arriba = enPorcentaje(inicio, horario);
    const bloque: BloqueColumna = {
      ocupacion,
      arriba,
      alto: enPorcentaje(fin, horario) - arriba,
      carril,
      carriles: 1,
      compacto: fin - inicio < MINUTOS_BLOQUE_COMPACTO,
    };
    grupo.push(bloque);
    bloques.push(bloque);
  }
  cerrarGrupo();
  return bloques.filter((bloque) => bloque.alto > 0);
}

/** Minutos del horario ocupados por clases y reservas aprobadas, uniendo los que se solapan. */
export function minutosOcupados(ocupaciones: readonly Ocupacion[], horario: HorarioRegla): number {
  const tramos = ocupaciones
    .filter(bloqueaEspacio)
    .map((o) => [
      Math.max(enMinutos(o.hora_inicio), horario.desde),
      Math.min(enMinutos(o.hora_fin), horario.hasta),
    ])
    .filter(([inicio, fin]) => fin > inicio)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let hasta = -1;
  for (const [inicio, fin] of tramos) {
    total += Math.max(fin - Math.max(inicio, hasta), 0);
    hasta = Math.max(hasta, fin);
  }
  return total;
}

/** Libre, hasta un cuarto, hasta la mitad o más de la mitad del horario ocupado. */
export function nivelOcupacion(minutos: number, total: number): NivelOcupacion {
  if (!minutos) return 'libre';
  if (minutos <= total / 4) return 'bajo';
  if (minutos <= total / 2) return 'medio';
  return 'alto';
}

/** `270` → `4 h 30 min`. */
export function duracionTexto(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return [horas ? `${horas} h` : '', resto ? `${resto} min` : ''].filter(Boolean).join(' ');
}

/** Primer lunes y último domingo de la rejilla que muestra el mes de la fecha de referencia. */
export function rejillaDelMes(referencia: string): RangoFechas {
  const { desde, hasta } = esteMes(referencia);
  const primerDia = (new Date(`${desde}T12:00:00Z`).getUTCDay() + 6) % 7;
  const ultimoDia = (new Date(`${hasta}T12:00:00Z`).getUTCDay() + 6) % 7;
  return { desde: sumarDias(desde, -primerDia), hasta: sumarDias(hasta, 6 - ultimoDia) };
}

/**
 * Rango que se consulta: lunes a sábado de la semana, o toda la rejilla del mes (incluidos los días del mes
 * anterior y del siguiente que se ven en ella).
 */
export function rangoDeVista(vista: VistaCalendario, referencia: string): RangoFechas {
  return vista === 'semana' ? estaSemana(referencia) : rejillaDelMes(referencia);
}

/** Etiqueta del período: "12–17 oct 2026" o "Octubre 2026". */
export function tituloPeriodo(vista: VistaCalendario, referencia: string): string {
  if (vista === 'mes') return nombreMes(referencia.slice(0, 7));
  const { desde, hasta } = estaSemana(referencia);
  const formato = (iso: string, opciones: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', ...opciones })
      .format(new Date(`${iso}T12:00:00Z`))
      .replace('.', '');
  const mismoMes = desde.slice(0, 7) === hasta.slice(0, 7);
  const inicio = mismoMes
    ? formato(desde, { day: 'numeric' })
    : formato(desde, { day: 'numeric', month: 'short' });
  return `${inicio}–${formato(hasta, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

let siguienteId = 0;

@Component({
  selector: 'app-calendario-ocupacion',
  imports: [CampoSeleccionComponent],
  templateUrl: './calendario-ocupacion.html',
  host: { class: 'block' },
})
export class CalendarioOcupacionComponent {
  private readonly servicio = inject(OcupacionService);
  /** Hora actual en Guayaquil para la línea de "ahora"; se actualiza cada minuto. */
  private readonly ahora = signal(ahoraEnGuayaquil());

  protected readonly id = `calendario-ocupacion-${siguienteId++}`;
  protected readonly hoy = hoy();
  protected readonly espacioId = signal<number | null>(null);
  protected readonly vista = signal<VistaCalendario>('semana');
  /** Cualquier fecha del período que se muestra. */
  protected readonly referencia = signal(this.hoy);

  // TEMPORAL: lista de espacios hasta que G3 publique su servicio y app-selector-espacio.
  protected readonly catalogo = toSignal(
    this.servicio.espacios().pipe(
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
    return catalogo.espacios.map((e) => ({
      valor: String(e.id),
      etiqueta: `${e.codigo} · ${e.nombre}`,
      detalle: `${e.edificio} · ${e.capacidad} personas`,
    }));
  });

  protected readonly rango = computed(() => rangoDeVista(this.vista(), this.referencia()));
  protected readonly titulo = computed(() => tituloPeriodo(this.vista(), this.referencia()));
  protected readonly enPeriodoActual = computed(() => {
    const { desde, hasta } = this.vista() === 'mes' ? esteMes(this.referencia()) : this.rango();
    return this.hoy >= desde && this.hoy <= hasta;
  });

  private readonly consulta = computed<Consulta | null>(
    () => {
      const espacioId = this.espacioId();
      if (espacioId === null) return null;
      const datos = { espacioId, ...this.rango() };
      return { ...datos, clave: JSON.stringify(datos) };
    },
    { equal: (a, b) => a?.clave === b?.clave },
  );
  private readonly reintentos = signal(0);

  private readonly carga = toSignal(
    toObservable(
      computed(() => ({ consulta: this.consulta(), reintento: this.reintentos() })),
    ).pipe(
      switchMap(({ consulta }): Observable<EstadoCarga> => {
        if (!consulta) return of({ tipo: 'sin-espacio' });
        const { espacioId, desde, hasta, clave } = consulta;
        return this.servicio.ocupacion(espacioId, desde, hasta).pipe(
          map((ocupaciones): EstadoCarga =>
            ocupaciones
              ? {
                  tipo: 'listo',
                  clave,
                  ocupaciones: ocupaciones.filter((o) => o.espacio_id === espacioId),
                }
              : { tipo: 'sin-servicio', clave },
          ),
          catchError(() => of<EstadoCarga>({ tipo: 'error', clave })),
          startWith<EstadoCarga>({ tipo: 'cargando', clave }),
        );
      }),
    ),
    { initialValue: { tipo: 'sin-espacio' } as EstadoCarga },
  );

  /** Estado del período y espacio que se ven ahora: los datos de otro período no se muestran. */
  protected readonly estado = computed<EstadoCarga>(() => {
    const consulta = this.consulta();
    const carga = this.carga();
    if (!consulta) return { tipo: 'sin-espacio' };
    if (carga.tipo === 'sin-espacio' || carga.clave !== consulta.clave)
      return { tipo: 'cargando', clave: consulta.clave };
    return carga;
  });
  protected readonly ocupaciones = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'listo' ? estado.ocupaciones : [];
  });
  protected readonly totales = computed(() => {
    const ocupaciones = this.ocupaciones();
    const clases = ocupaciones.filter((o) => o.tipo === 'CLASE').length;
    return { clases, reservas: ocupaciones.length - clases };
  });

  // Vista semanal (TEMPORAL hasta app-grilla-semanal de G3).
  /** Día elegido en la vista mensual; su columna se resalta al pasar a la semana. */
  private readonly diaElegido = signal<string | null>(null);
  protected readonly horario = computed(() => horarioRegla(this.ocupaciones()));
  protected readonly horas = computed(() => horasDeColumna(this.horario()));
  protected readonly altoColumna = computed(
    () => ((this.horario().hasta - this.horario().desde) / 60) * ALTO_HORA_REM,
  );
  /** Posición de la línea de "ahora" en la columna de hoy, o `null` si queda fuera del horario. */
  protected readonly lineaAhora = computed(() => {
    const { desde, hasta } = this.horario();
    const { fecha, hora } = this.ahora();
    const minutos = enMinutos(hora);
    if (fecha !== this.hoy || minutos < desde || minutos > hasta) return null;
    return ((minutos - desde) / (hasta - desde)) * 100;
  });
  protected readonly semana = computed<DiaSemanaOcupacion[]>(() => {
    if (this.vista() !== 'semana') return [];
    const { desde } = this.rango();
    const domingo = sumarDias(desde, 6);
    const conDomingo = this.ocupaciones().some((o) => o.fecha === domingo);
    return Array.from({ length: conDomingo ? 7 : 6 }, (_, i) => {
      const iso = sumarDias(desde, i);
      return {
        iso,
        etiqueta: fechaConDia(iso),
        diaCorto: DIAS_CORTOS[i],
        numero: Number(iso.slice(8)),
        hoy: iso === this.hoy,
        elegido: iso === this.diaElegido(),
        bloques: bloquesDeColumna(
          this.ocupaciones().filter((o) => o.fecha === iso),
          this.horario(),
        ),
      };
    });
  });

  // Vista mensual (TEMPORAL hasta app-calendario-mensual, C4-15).
  protected readonly DIAS_CORTOS = DIAS_CORTOS;
  protected readonly VISTAS = VISTAS;
  protected readonly mes = computed<DiaMes[]>(() => {
    if (this.vista() !== 'mes') return [];
    const { desde, hasta } = esteMes(this.referencia());
    const { desde: inicio, hasta: fin } = this.rango();
    const horario = this.horario();
    const total = HORA_FIN_REGLA - HORA_INICIO_REGLA;
    const formato = new Intl.DateTimeFormat('es-EC', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const dias: DiaMes[] = [];
    for (let iso = inicio; iso <= fin; iso = sumarDias(iso, 1)) {
      const delDia = this.ocupaciones()
        .filter((o) => o.fecha === iso)
        .sort(porOrden);
      const clases = delDia.filter((o) => o.tipo === 'CLASE').length;
      const reservas = delDia.length - clases;
      const ocupados = minutosOcupados(delDia, {
        desde: HORA_INICIO_REGLA,
        hasta: HORA_FIN_REGLA,
      });
      const partes = [
        clases ? `${clases} ${clases === 1 ? 'clase' : 'clases'}` : '',
        reservas ? `${reservas} ${reservas === 1 ? 'reserva' : 'reservas'}` : '',
      ].filter(Boolean);
      const resumen = partes.length
        ? `${partes.join(' y ')}${ocupados ? `, ${duracionTexto(ocupados)} ocupadas` : ''}`
        : 'libre';
      dias.push({
        iso,
        numero: Number(iso.slice(8)),
        delMes: iso >= desde && iso <= hasta,
        hoy: iso === this.hoy,
        clases,
        reservas,
        minutosOcupados: ocupados,
        nivel: nivelOcupacion(ocupados, total),
        bloques: bloquesDelDia(delDia, horario),
        etiqueta: `${formato.format(new Date(`${iso}T12:00:00Z`))}: ${resumen}`,
      });
    }
    return dias;
  });

  protected readonly fechaCorta = fechaCorta;
  protected readonly duracionTexto = duracionTexto;
  protected readonly nombreMes = nombreMes;
  protected readonly bloqueaEspacio = bloqueaEspacio;
  protected readonly SEPARACION_MINUTOS = SEPARACION_MINUTOS;
  protected readonly ALTO_HORA_REM = ALTO_HORA_REM;

  constructor() {
    const reloj = setInterval(() => this.ahora.set(ahoraEnGuayaquil()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));

    const parametros = inject(ActivatedRoute, { optional: true })?.snapshot.queryParamMap;
    if (!parametros) return;
    const espacioId = Number(parametros.get('espacioId'));
    if (Number.isInteger(espacioId) && espacioId > 0) this.espacioId.set(espacioId);
    const fecha = parametros.get('fecha') ?? '';
    if (fechaValida(fecha)) this.referencia.set(fecha);
    if (parametros.get('vista') === 'mes') this.vista.set('mes');
  }

  protected elegirEspacio(valor: string): void {
    this.espacioId.set(valor ? Number(valor) : null);
  }

  protected cambiarVista(vista: VistaCalendario): void {
    this.diaElegido.set(null);
    this.vista.set(vista);
  }

  /** Semana o mes anterior (−1) o siguiente (+1). */
  protected mover(paso: number): void {
    this.diaElegido.set(null);
    if (this.vista() === 'semana') {
      this.referencia.update((fecha) => sumarDias(fecha, paso * 7));
      return;
    }
    const [anio, mes] = this.referencia().split('-').map(Number);
    const destino = new Date(Date.UTC(anio, mes - 1 + paso, 1));
    this.referencia.set(destino.toISOString().slice(0, 10));
  }

  protected irAHoy(): void {
    this.diaElegido.set(null);
    this.referencia.set(this.hoy);
  }

  /** Clic en un día del mes: muestra su semana con ese día resaltado. */
  protected verSemana(iso: string): void {
    this.referencia.set(iso);
    this.vista.set('semana');
    this.diaElegido.set(iso);
  }

  /** Clic en un día del mes anterior o siguiente que se ve en la rejilla: pasa a ese mes. */
  protected irAlMes(iso: string): void {
    this.referencia.set(iso);
  }

  protected reintentar(): void {
    this.reintentos.update((n) => n + 1);
  }
}
