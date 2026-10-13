import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  generarFechas,
  Recurrencia,
  RecurrenciaFormComponent,
  validarRecurrencia,
} from './recurrencia-form';

describe('RecurrenciaFormComponent (C4-09)', () => {
  let fixture: ComponentFixture<RecurrenciaFormComponent>;
  let raiz: HTMLElement;
  let emitidas: (Recurrencia | null)[];

  const dia = (nombre: string) =>
    raiz.querySelector<HTMLButtonElement>(`button[aria-label="${nombre}"]`)!;
  const fecha = (posicion: 0 | 1, valor: string) => {
    const campo = raiz.querySelector<HTMLInputElement>(
      `input[name="${posicion === 0 ? 'desde' : 'hasta'}"]`,
    )!;
    campo.value = valor;
    campo.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  const pulsar = (nombre: string) => {
    dia(nombre).click();
    fixture.detectChanges();
  };
  const alerta = () => raiz.querySelector('[role="alert"]');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurrenciaFormComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RecurrenciaFormComponent);
    fixture.componentRef.setInput('fechaMin', '2026-01-01');
    emitidas = [];
    fixture.componentInstance.recurrenciaChange.subscribe((r) => emitidas.push(r));
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('ofrece de lunes a viernes por defecto y el sábado si se habilita', () => {
    expect(raiz.querySelectorAll('button[aria-label][aria-pressed]')).toHaveLength(5);
    expect(dia('Sábado')).toBeNull();

    fixture.componentRef.setInput('diasHabilitados', ['LUNES', 'SABADO']);
    fixture.detectChanges();

    expect(raiz.querySelectorAll('button[aria-label][aria-pressed]')).toHaveLength(2);
    expect(dia('Sábado')).not.toBeNull();
  });

  it('reutiliza app-selector-rango-fechas cuando el inicio no viene fijado', () => {
    expect(raiz.querySelector('app-selector-rango-fechas')).not.toBeNull();

    fixture.componentRef.setInput('fechaInicio', '2026-11-10');
    fixture.detectChanges();

    expect(raiz.querySelector('app-selector-rango-fechas')).toBeNull();
    expect(raiz.querySelector('input[name="hasta"]')).not.toBeNull();
  });

  it('emite la recurrencia y muestra las fechas cuando es válida', () => {
    pulsar('Miércoles');
    pulsar('Lunes');
    fecha(0, '2026-11-09');
    fecha(1, '2026-11-25');

    expect(emitidas.at(-1)).toEqual({
      frecuencia: 'SEMANAL',
      dias_semana: ['LUNES', 'MIERCOLES'],
      fecha_desde: '2026-11-09',
      fecha_hasta: '2026-11-25',
    });
    expect(dia('Lunes').getAttribute('aria-pressed')).toBe('true');
    expect(raiz.textContent).toContain('6 reservas');
    expect(alerta()).toBeNull();
  });

  it('emite null y avisa si no hay días elegidos', () => {
    fecha(0, '2026-11-09');
    fecha(1, '2026-11-25');

    expect(emitidas.at(-1)).toBeNull();
    expect(alerta()?.textContent).toContain('Elige al menos un día');
  });

  it('al desmarcar el único día vuelve a emitir null', () => {
    fecha(0, '2026-11-09');
    fecha(1, '2026-11-25');
    pulsar('Lunes');
    expect(emitidas.at(-1)).not.toBeNull();

    pulsar('Lunes');
    expect(emitidas.at(-1)).toBeNull();
  });

  it('no permite series de más de 90 días', () => {
    pulsar('Martes');
    fecha(0, '2026-09-01');
    fecha(1, '2026-12-15');

    expect(emitidas.at(-1)).toBeNull();
    expect(alerta()?.textContent).toContain('hasta 90 días');
  });

  it('avisa si ningún día elegido cae en el rango', () => {
    pulsar('Lunes');
    fecha(0, '2026-11-10');
    fecha(1, '2026-11-13');

    expect(emitidas.at(-1)).toBeNull();
    expect(alerta()?.textContent).toContain('Ninguno de los días');
  });

  it('acepta valores precargados sin emitir', () => {
    fixture.componentRef.setInput('dias', ['MARTES']);
    fixture.componentRef.setInput('desde', '2026-10-06');
    fixture.componentRef.setInput('hasta', '2026-10-27');
    fixture.detectChanges();

    expect(dia('Martes').getAttribute('aria-pressed')).toBe('true');
    expect(raiz.textContent).toContain('4 reservas');
    expect(emitidas).toEqual([]);
  });

  it('genera las fechas y valida con funciones puras', () => {
    const serie: Recurrencia = {
      frecuencia: 'SEMANAL',
      dias_semana: ['LUNES', 'MIERCOLES'],
      fecha_desde: '2026-11-09',
      fecha_hasta: '2026-11-25',
    };

    expect(generarFechas(serie)).toEqual([
      '2026-11-09',
      '2026-11-11',
      '2026-11-16',
      '2026-11-18',
      '2026-11-23',
      '2026-11-25',
    ]);
    expect(validarRecurrencia(serie)).toBeNull();
    expect(validarRecurrencia({ ...serie, fecha_hasta: '' })).toContain('fecha inicial y la final');
    expect(validarRecurrencia(serie, 10)).toContain('hasta 10 días');
  });

  it('no deja empezar la serie antes de la fecha mínima', () => {
    fixture.componentRef.setInput('fechaMin', '2026-11-01');
    pulsar('Lunes');
    fecha(0, '2026-10-26');
    fecha(1, '2026-11-30');

    expect(emitidas.at(-1)).toBeNull();
    expect(raiz.textContent).toContain('posterior a');
  });

  it('con fecha de inicio fija solo pide hasta cuándo y marca su día', () => {
    fixture.componentRef.setInput('fechaInicio', '2026-11-10');
    fixture.detectChanges();

    expect(raiz.querySelector('input[name="desde"]')).toBeNull();
    expect(raiz.textContent).toContain('fecha de la reserva');
    expect(dia('Martes').getAttribute('aria-pressed')).toBe('true');

    fecha(1, '2026-11-24');
    expect(emitidas.at(-1)).toEqual({
      frecuencia: 'SEMANAL',
      dias_semana: ['MARTES'],
      fecha_desde: '2026-11-10',
      fecha_hasta: '2026-11-24',
    });
  });
});
