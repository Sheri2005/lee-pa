import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Ocupacion } from '../../../app/core/models/ocupacion.model';
import { SolicitudRegistrada } from '../../../app/core/models/reserva.model';
import { OcupacionService } from '../../../app/core/services/ocupacion.service';
import { ReservaService } from '../../../app/core/services/reserva.service';
import { hoy, sumarDias } from '../../../app/shared/components/selector-rango-fechas/rango-fechas';
import { Espacio } from '../../../app/core/models/espacio.model';
import {
  ESPERA_VALIDACION_MS,
  ReservaFormComponent,
  validarAsistentes,
  validarMotivo,
} from './reserva-form';

const espacio: Espacio = {
  id: 7,
  codigo: 'F-204',
  nombre: 'Aula F-204',
  edificio_id: 2,
  edificio: 'Bloque F',
  piso: 2,
  tipo_espacio: 'AULA',
  capacidad: 40,
  accesible: true,
  estado: true,
  recursos: [],
};

/** Un lunes dentro de dos semanas como mínimo, para no chocar con "hoy" ni con horas pasadas. */
function lunesFuturo(): string {
  const base = sumarDias(hoy(), 14);
  const dia = new Date(`${base}T12:00:00Z`).getUTCDay();
  return sumarDias(base, (8 - dia) % 7);
}

const esperarValidacion = () =>
  new Promise((resolver) => setTimeout(resolver, ESPERA_VALIDACION_MS + 50));

describe('ReservaFormComponent (C4-06)', () => {
  let fixture: ComponentFixture<ReservaFormComponent>;
  let raiz: HTMLElement;
  let ocupacion: ReturnType<typeof vi.fn<(...a: unknown[]) => Observable<Ocupacion[] | null>>>;
  let solicitar: ReturnType<
    typeof vi.fn<(...a: unknown[]) => Observable<SolicitudRegistrada | null>>
  >;
  let espacios: Observable<Espacio[] | null>;
  const lunes = lunesFuturo();

  async function crear(parametros: Record<string, string> = {}) {
    await TestBed.configureTestingModule({
      imports: [ReservaFormComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(parametros) } },
        },
        { provide: OcupacionService, useValue: { espacios: () => espacios, ocupacion } },
        { provide: ReservaService, useValue: { solicitar } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReservaFormComponent);
    raiz = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const precarga = (cambios: Record<string, string> = {}) => ({
    espacioId: '7',
    fecha: lunes,
    horaInicio: '09:00',
    horaFin: '11:00',
    ...cambios,
  });
  const enviarBtn = () => raiz.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const texto = () => raiz.textContent ?? '';
  const escribir = (selector: string, valor: string, evento = 'input') => {
    const campo = raiz.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    campo.value = valor;
    campo.dispatchEvent(new Event(evento));
    campo.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };
  const completarDetalles = () => {
    escribir('input[name="asistentes"]', '25');
    escribir('textarea[name="motivo"]', 'Taller de robótica para primer semestre');
  };
  async function estabilizar() {
    fixture.detectChanges();
    await esperarValidacion();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    ocupacion = vi.fn(() => of<Ocupacion[] | null>([]));
    solicitar = vi.fn(() => of<SolicitudRegistrada | null>(null));
    espacios = of([espacio]);
  });

  it('precarga el espacio, la fecha y el horario que llegan desde la búsqueda', async () => {
    await crear(precarga());

    expect(raiz.querySelector('app-campo-seleccion button')!.textContent).toContain('F-204');
    expect(raiz.querySelector<HTMLInputElement>('input[name="fecha"]')!.value).toBe(
      lunes.split('-').reverse().join('/'),
    );
    expect(texto()).toContain('Capacidad');
    expect(texto()).toContain('40 personas');
  });

  it('sin consulta de ocupación conectada no marca el espacio como libre ni permite enviar', async () => {
    ocupacion = vi.fn(() => of(null));
    await crear(precarga());
    completarDetalles();
    await estabilizar();

    expect(ocupacion).toHaveBeenCalledWith(7, lunes, lunes);
    expect(texto()).toContain('No se pudo comprobar la disponibilidad');
    expect(texto()).not.toContain('está libre');
    expect(enviarBtn().disabled).toBe(true);
  });

  it('sin la lista de espacios no inventa los datos del espacio', async () => {
    espacios = of(null);
    await crear(precarga());

    expect(texto()).toContain('Espacio n.º 7');
    expect(texto()).toContain('todavía no está conectada');
    expect(texto()).not.toContain('Capacidad');
  });

  it('con el espacio libre habilita el envío y manda la solicitud completa', async () => {
    await crear(precarga());
    completarDetalles();
    await estabilizar();

    expect(texto()).toContain('El espacio está libre en ese horario.');
    expect(enviarBtn().disabled).toBe(false);

    enviarBtn().click();
    fixture.detectChanges();

    expect(solicitar).toHaveBeenCalledTimes(1);
    expect(solicitar.mock.calls[0][0]).toEqual({
      espacio_id: 7,
      hora_inicio: '09:00',
      hora_fin: '11:00',
      asistentes: 25,
      motivo: 'Taller de robótica para primer semestre',
      serie: null,
      fechas: [lunes],
      recursos: [],
    });
    // Sin registro de solicitudes conectado no se anuncia un envío correcto.
    expect(texto()).toContain('No se pudo enviar');
    expect(texto()).not.toContain('Solicitud enviada');
  });

  it('anuncia el envío solo cuando el servicio registra la solicitud', async () => {
    solicitar = vi.fn(() =>
      of({ reserva_ids: [91], serie_id: null, estado: 'PENDIENTE' as const }),
    );
    await crear(precarga());
    completarDetalles();
    await estabilizar();

    enviarBtn().click();
    fixture.detectChanges();

    expect(texto()).toContain('Solicitud enviada. Queda pendiente de aprobación.');
    expect(enviarBtn()).toBeNull();
  });

  it('no envía dos veces mientras espera la respuesta', async () => {
    const respuesta = new Subject<SolicitudRegistrada | null>();
    solicitar = vi.fn(() => respuesta);
    await crear(precarga());
    completarDetalles();
    await estabilizar();

    enviarBtn().click();
    fixture.detectChanges();
    expect(enviarBtn().disabled).toBe(true);
    expect(enviarBtn().textContent).toContain('Enviando');
    enviarBtn().click();
    raiz.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(solicitar).toHaveBeenCalledTimes(1);
  });

  it('un resultado anterior no habilita el envío de una solicitud cambiada', async () => {
    await crear(precarga());
    completarDetalles();
    await estabilizar();
    expect(enviarBtn().disabled).toBe(false);

    // Un envío en la misma tarea que el cambio, antes de que se programe la nueva consulta, no sale.
    const componente = fixture.componentInstance;
    componente['fin'].set('11:30');
    componente['enviar']();
    expect(solicitar).not.toHaveBeenCalled();

    escribir('input[name="fin"]', '12:00', 'change');

    expect(enviarBtn().disabled).toBe(true);
    expect(texto()).toContain('Comprobando la disponibilidad');

    await estabilizar();
    expect(ocupacion).toHaveBeenCalledTimes(2);
    expect(enviarBtn().disabled).toBe(false);
  });

  it('muestra el conflicto y no deja enviar si una clase ocupa el espacio', async () => {
    ocupacion = vi.fn(() =>
      of([
        {
          tipo: 'CLASE',
          id: 1,
          espacio_id: 7,
          fecha: lunes,
          hora_inicio: '07:00',
          hora_fin: '08:50',
          titulo: 'Cálculo I · P1',
        } as Ocupacion,
      ]),
    );
    await crear(precarga());
    completarDetalles();
    await estabilizar();

    expect(texto()).toContain('El espacio no está libre en ese horario.');
    expect(texto()).toContain('sin los 15 min de separación');
    expect(texto()).toContain('Cambia el horario o elige otro espacio.');
    expect(enviarBtn().disabled).toBe(true);
  });

  it('una serie comprueba cada fecha y presenta los conflictos por ocurrencia', async () => {
    const tercerLunes = sumarDias(lunes, 14);
    ocupacion = vi.fn(() =>
      of([
        {
          tipo: 'RESERVA',
          estado: 'APROBADA',
          id: 5,
          espacio_id: 7,
          fecha: tercerLunes,
          hora_inicio: '10:00',
          hora_fin: '12:00',
          titulo: 'Jornada de tutorías',
        } as Ocupacion,
      ]),
    );
    await crear(precarga());
    completarDetalles();

    raiz.querySelector<HTMLButtonElement>('button[role="switch"]')!.click();
    fixture.detectChanges();
    escribir('app-recurrencia-form input[name="hasta"]', sumarDias(lunes, 21), 'change');
    await estabilizar();

    expect(ocupacion).toHaveBeenLastCalledWith(7, lunes, sumarDias(lunes, 21));
    const filas = raiz.querySelectorAll('app-ocurrencias-recurrentes ol > li');
    expect(filas.length).toBe(4);
    expect(filas[2].textContent).toContain('Con conflicto');
    expect(filas[2].textContent).toContain('Jornada de tutorías');
    expect(texto()).toContain('1 de 4 fechas tienen conflicto');
    expect(enviarBtn().disabled).toBe(true);
  });

  it('una serie abarca hasta 90 días: 90 se aceptan y 91 no', async () => {
    await crear(precarga());
    raiz.querySelector<HTMLButtonElement>('button[role="switch"]')!.click();
    fixture.detectChanges();

    escribir('app-recurrencia-form input[name="hasta"]', sumarDias(lunes, 89), 'change');
    await estabilizar();
    expect(raiz.querySelectorAll('app-ocurrencias-recurrentes ol > li').length).toBe(8);
    expect(ocupacion).toHaveBeenLastCalledWith(7, lunes, sumarDias(lunes, 84));

    ocupacion.mockClear();
    escribir('app-recurrencia-form input[name="hasta"]', sumarDias(lunes, 90), 'change');
    await estabilizar();
    expect(texto()).toContain('La serie puede abarcar hasta 90 días.');
    expect(ocupacion).not.toHaveBeenCalled();
  });

  it('no consulta con horas fuera del paso de 15 minutos ni fuera de 07:00–21:00', async () => {
    await crear(precarga({ horaInicio: '09:10' }));
    await estabilizar();
    expect(ocupacion).not.toHaveBeenCalled();
    expect(texto()).toContain('intervalos de 15 minutos');

    TestBed.resetTestingModule();
    await crear(precarga({ horaInicio: '06:45', horaFin: '08:00' }));
    await estabilizar();
    expect(ocupacion).not.toHaveBeenCalled();
    expect(texto()).toContain('07:00');
  });

  it('valida asistentes con la capacidad del espacio y el motivo', async () => {
    await crear(precarga());
    escribir('input[name="asistentes"]', '41');
    escribir('textarea[name="motivo"]', 'Corto');

    expect(texto()).toContain('El espacio admite hasta 40 personas.');
    expect(texto()).toContain('al menos 10 caracteres');
    expect(raiz.querySelector('input[name="asistentes"]')!.getAttribute('aria-invalid')).toBe(
      'true',
    );

    raiz.querySelector<HTMLButtonElement>('button[aria-label="Cinco personas menos"]')!.click();
    fixture.detectChanges();
    expect(raiz.querySelector<HTMLInputElement>('input[name="asistentes"]')!.value).toBe('40');
  });

  it('− / + de asistentes van de 5 en 5, entre 1 y la capacidad', async () => {
    await crear(precarga());
    const campo = () => raiz.querySelector<HTMLInputElement>('input[name="asistentes"]')!;
    const pulsar = (etiqueta: string) => {
      raiz.querySelector<HTMLButtonElement>(`button[aria-label="${etiqueta}"]`)!.click();
      fixture.detectChanges();
    };

    // Empieza en 1 (quien reserva) y − está deshabilitado.
    expect(campo().value).toBe('1');
    expect(
      raiz.querySelector<HTMLButtonElement>('button[aria-label="Cinco personas menos"]')!.disabled,
    ).toBe(true);
    pulsar('Cinco personas más');
    expect(campo().value).toBe('5');
    escribir('input[name="asistentes"]', '12');
    pulsar('Cinco personas más');
    expect(campo().value).toBe('15');
    pulsar('Cinco personas menos');
    pulsar('Cinco personas menos');
    expect(campo().value).toBe('5');
    pulsar('Cinco personas menos');
    expect(campo().value).toBe('1');
    escribir('input[name="asistentes"]', '38');
    pulsar('Cinco personas más');
    expect(campo().value).toBe('40');
  });

  it('no muestra errores con el formulario vacío y sin espacio no consulta', async () => {
    await crear();
    await estabilizar();

    expect(raiz.querySelector('[role="alert"]')).toBeNull();
    expect(ocupacion).not.toHaveBeenCalled();
    expect(enviarBtn().disabled).toBe(true);
    expect(texto()).toContain('Completa el espacio, la fecha y el horario');
  });

  it('si la consulta falla permite volver a comprobar', async () => {
    ocupacion = vi.fn(() => throwError(() => new Error('red')));
    await crear(precarga());
    await estabilizar();
    expect(texto()).toContain('No se pudo comprobar la disponibilidad.');

    ocupacion.mockImplementation(() => of([]));
    [...raiz.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Volver a comprobar'))!
      .click();
    await estabilizar();
    expect(texto()).toContain('El espacio está libre');
  });

  it('valida los textos y números como funciones puras', () => {
    expect(validarAsistentes('', null)).toContain('cuántas');
    expect(validarAsistentes('2.5', null)).toContain('entero');
    expect(validarAsistentes('0', null)).toContain('al menos una');
    expect(validarAsistentes('501', null)).toContain('500');
    expect(validarAsistentes('500', null)).toBeNull();
    expect(validarMotivo('   ')).toContain('Escribe');
    expect(validarMotivo('123456789')).toContain('10');
    expect(validarMotivo('1234567890')).toBeNull();
  });
});
