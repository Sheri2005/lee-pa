import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Ocupacion } from '../../../app/core/models/ocupacion.model';
import { OcupacionService } from '../../../app/core/services/ocupacion.service';
import { Espacio } from '../../../app/core/models/espacio.model';
import {
  bloquesDeColumna,
  bloquesDelDia,
  CalendarioOcupacionComponent,
  horasDeColumna,
  minutosOcupados,
  nivelOcupacion,
  horarioRegla,
  tituloPeriodo,
} from './calendario-ocupacion';

const espacio = (id: number, codigo: string): Espacio => ({
  id,
  codigo,
  nombre: `Aula ${codigo}`,
  edificio_id: 1,
  edificio: 'Bloque F',
  piso: 1,
  tipo_espacio: 'AULA',
  capacidad: 30,
  accesible: true,
  estado: true,
  recursos: [],
});

const clase: Ocupacion = {
  tipo: 'CLASE',
  id: 1,
  espacio_id: 7,
  fecha: '2026-10-13',
  hora_inicio: '08:00',
  hora_fin: '10:00',
  titulo: 'Cálculo I · P1',
  responsable: 'Ana Pérez',
};
const pendiente: Ocupacion = {
  tipo: 'RESERVA',
  id: 4,
  espacio_id: 7,
  fecha: '2026-10-13',
  hora_inicio: '15:00',
  hora_fin: '16:00',
  titulo: 'Club de debate',
  estado: 'PENDIENTE',
};

describe('CalendarioOcupacionComponent (C4-14)', () => {
  let fixture: ComponentFixture<CalendarioOcupacionComponent>;
  let raiz: HTMLElement;
  let ocupacion: ReturnType<
    typeof vi.fn<(id: number, desde: string, hasta: string) => Observable<Ocupacion[] | null>>
  >;
  let espacios: Observable<Espacio[] | null>;

  async function crear(parametros: Record<string, string> = {}) {
    await TestBed.configureTestingModule({
      imports: [CalendarioOcupacionComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(parametros) } },
        },
        { provide: OcupacionService, useValue: { espacios: () => espacios, ocupacion } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CalendarioOcupacionComponent);
    raiz = fixture.nativeElement;
    await estabilizar();
  }
  async function estabilizar() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  const texto = () => raiz.textContent ?? '';
  const boton = (texto: string) =>
    [...raiz.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === texto || b.getAttribute('aria-label') === texto,
    )!;
  const dias = () => [...raiz.querySelectorAll<HTMLLIElement>('ol > li')];

  beforeEach(() => {
    ocupacion = vi.fn(() => of<Ocupacion[] | null>([clase, pendiente]));
    espacios = of([espacio(7, 'F-204'), espacio(8, 'F-301')]);
  });

  it('sin espacio pide elegir uno y no consulta', async () => {
    await crear();

    expect(texto()).toContain('Elige un espacio');
    expect(ocupacion).not.toHaveBeenCalled();
  });

  it('muestra la semana (lunes a sábado) del espacio y la fecha de la URL', async () => {
    await crear({ espacioId: '7', fecha: '2026-10-14' });

    expect(ocupacion).toHaveBeenCalledWith(7, '2026-10-12', '2026-10-17');
    expect(raiz.querySelector('h2[aria-live]')!.textContent).toContain('12–17 oct 2026');
    expect(dias().length).toBe(6);
    expect(dias()[1].textContent).toContain('08:00–10:00');
    expect(dias()[1].textContent).toContain('Cálculo I · P1');
    expect(dias()[1].textContent).toContain('Reserva pendiente:');
    expect(dias()[0].textContent).toContain('Sin clases ni reservas.');
  });

  it('sin consulta conectada no presenta el espacio como libre', async () => {
    ocupacion = vi.fn(() => of(null));
    await crear({ espacioId: '7', fecha: '2026-10-14' });

    expect(texto()).toContain('todavía no está conectada');
    expect(texto()).not.toContain('Sin clases ni reservas');
    expect(dias()).toEqual([]);
  });

  it('sin lista de espacios conserva el espacio de la URL sin inventar sus datos', async () => {
    espacios = of(null);
    await crear({ espacioId: '7', fecha: '2026-10-14' });

    expect(texto()).toContain('Espacio n.º 7');
    expect(ocupacion).toHaveBeenCalledWith(7, '2026-10-12', '2026-10-17');
  });

  it('navega entre semanas y vuelve a hoy', async () => {
    await crear({ espacioId: '7', fecha: '2026-10-14' });

    boton('Semana siguiente').click();
    await estabilizar();
    expect(ocupacion).toHaveBeenLastCalledWith(7, '2026-10-19', '2026-10-24');

    boton('Hoy').click();
    await estabilizar();
    expect(boton('Hoy').disabled).toBe(true);
  });

  it('cambia a la vista mensual, cuenta clases y reservas y abre la semana de un día', async () => {
    await crear({ espacioId: '7', fecha: '2026-10-14' });

    boton('Mes').click();
    await estabilizar();

    // Toda la rejilla: del lunes 28 de septiembre al domingo 1 de noviembre.
    expect(ocupacion).toHaveBeenLastCalledWith(7, '2026-09-28', '2026-11-01');
    expect(boton('Mes').getAttribute('aria-pressed')).toBe('true');
    const martes = raiz.querySelector<HTMLButtonElement>(
      'button[aria-label^="martes, 13 de octubre"]',
    )!;
    expect(martes.getAttribute('aria-label')).toContain('1 clase y 1 reserva, 2 h ocupadas');

    martes.click();
    await estabilizar();

    expect(boton('Semana').getAttribute('aria-pressed')).toBe('true');
    expect(ocupacion).toHaveBeenLastCalledWith(7, '2026-10-12', '2026-10-17');
    expect(dias()[1].getAttribute('data-elegido')).toBe('true');
    expect(dias().filter((d) => d.hasAttribute('data-elegido')).length).toBe(1);

    boton('Semana siguiente').click();
    await estabilizar();
    expect(dias().some((d) => d.hasAttribute('data-elegido'))).toBe(false);
  });

  it('al cambiar de espacio consulta el nuevo y no muestra datos del anterior', async () => {
    await crear({ espacioId: '7', fecha: '2026-10-14' });
    ocupacion.mockImplementation(() => new Observable<Ocupacion[] | null>());

    raiz.querySelector<HTMLButtonElement>('app-campo-seleccion button')!.click();
    fixture.detectChanges();
    raiz.querySelector<HTMLElement>('[role="option"][data-valor="8"]')!.click();
    await estabilizar();

    expect(ocupacion).toHaveBeenLastCalledWith(8, '2026-10-12', '2026-10-17');
    expect(texto()).not.toContain('Cálculo I');
    expect(texto()).toContain('Cargando la ocupación');
  });

  it('si la consulta falla permite volver a cargar', async () => {
    ocupacion = vi.fn(() => throwError(() => new Error('red')));
    await crear({ espacioId: '7', fecha: '2026-10-14' });
    expect(texto()).toContain('No se pudo cargar la ocupación');

    ocupacion.mockImplementation(() => of([clase]));
    boton('Volver a cargar').click();
    await estabilizar();
    expect(texto()).toContain('Cálculo I');
  });

  it('ubica cada ocupación en la columna del día, con su hora y duración', () => {
    const horario = { desde: 7 * 60, hasta: 21 * 60 };
    const [b1, b2] = bloquesDeColumna([pendiente, clase], horario);

    // Ordenadas por hora; 08:00 está a 60 de 840 minutos y dura 120.
    expect(b1.ocupacion).toBe(clase);
    expect(b1.arriba).toBeCloseTo((60 / 840) * 100);
    expect(b1.alto).toBeCloseTo((120 / 840) * 100);
    expect(b1.compacto).toBe(false);
    expect(b2.ocupacion).toBe(pendiente);
    expect([b1.carriles, b2.carriles]).toEqual([1, 1]);

    // Mini regla del mes: misma escala, en horizontal.
    const [mini] = bloquesDelDia([clase], horario);
    expect(mini.izquierda).toBeCloseTo((60 / 840) * 100);
    expect(mini.ancho).toBeCloseTo((120 / 840) * 100);
  });

  it('reparte el ancho entre las ocupaciones que se solapan y marca las cortas', () => {
    const horario = { desde: 7 * 60, hasta: 21 * 60 };
    const encima: Ocupacion = { ...pendiente, hora_inicio: '09:00', hora_fin: '09:30' };
    const despues: Ocupacion = { ...clase, id: 2, hora_inicio: '10:00', hora_fin: '11:00' };
    const [b1, b2, b3] = bloquesDeColumna([clase, encima, despues], horario);

    expect([b1.carril, b1.carriles]).toEqual([0, 2]);
    expect([b2.carril, b2.carriles]).toEqual([1, 2]);
    expect(b2.compacto).toBe(true);
    // 10:00 empieza cuando termina la clase de 08:00: vuelve a ocupar todo el ancho.
    expect([b3.carril, b3.carriles]).toEqual([0, 1]);
  });

  it('marca cada hora en punto de la cuadrícula', () => {
    const horas = horasDeColumna({ desde: 7 * 60, hasta: 10 * 60 });

    expect(horas.map((h) => h.etiqueta)).toEqual(['07:00', '08:00', '09:00', '10:00']);
    expect(horas.map((h) => Math.round(h.arriba))).toEqual([0, 33, 67, 100]);
  });

  it('amplía la regla si hay clases fuera de 07:00–21:00 y titula el período', () => {
    expect(horarioRegla([{ ...clase, hora_inicio: '06:30', hora_fin: '21:40' }])).toEqual({
      desde: 6 * 60,
      hasta: 22 * 60,
    });
    expect(horarioRegla([clase])).toEqual({ desde: 7 * 60, hasta: 21 * 60 });
    expect(tituloPeriodo('semana', '2026-10-28')).toBe('26–31 oct 2026');
    expect(tituloPeriodo('semana', '2026-09-30')).toMatch(/^28 sep.*–3 oct 2026$/);
    expect(tituloPeriodo('mes', '2026-10-28')).toBe('Octubre 2026');
  });

  it('un día del mes anterior o siguiente lleva a ese mes', async () => {
    await crear({ espacioId: '7', fecha: '2026-10-14', vista: 'mes' });

    const dia30 = raiz.querySelector<HTMLButtonElement>(
      'button[aria-label^="miércoles, 30 de septiembre"]',
    )!;
    expect(dia30.getAttribute('aria-label')).toContain('Ir a Septiembre 2026');
    dia30.click();
    await estabilizar();

    expect(raiz.querySelector('h2[aria-live]')!.textContent).toContain('Septiembre 2026');
    expect(boton('Mes').getAttribute('aria-pressed')).toBe('true');
    expect(ocupacion).toHaveBeenLastCalledWith(7, '2026-08-31', '2026-10-04');

    raiz.querySelector<HTMLButtonElement>('button[aria-label^="jueves, 1 de octubre"]')!.click();
    await estabilizar();
    expect(raiz.querySelector('h2[aria-live]')!.textContent).toContain('Octubre 2026');
  });

  it('mide la ocupación del día sin contar dos veces los solapes ni lo pendiente', () => {
    const dia = { desde: 7 * 60, hasta: 21 * 60 };
    const reserva: Ocupacion = {
      ...clase,
      tipo: 'RESERVA',
      estado: 'APROBADA',
      id: 9,
      hora_inicio: '09:00',
      hora_fin: '11:00',
    };

    // 08:00–10:00 y 09:00–11:00 se solapan: 3 h; la pendiente no ocupa.
    expect(minutosOcupados([clase, reserva, pendiente], dia)).toBe(180);
    expect(minutosOcupados([{ ...clase, hora_inicio: '06:00', hora_fin: '07:30' }], dia)).toBe(30);
    expect(nivelOcupacion(0, 840)).toBe('libre');
    expect(nivelOcupacion(210, 840)).toBe('bajo');
    expect(nivelOcupacion(420, 840)).toBe('medio');
    expect(nivelOcupacion(421, 840)).toBe('alto');
  });
});
