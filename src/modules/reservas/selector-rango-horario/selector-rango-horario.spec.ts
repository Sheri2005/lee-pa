import { ComponentFixture, TestBed } from '@angular/core/testing';
import { diagnosticarRangoHorario, SelectorRangoHorarioComponent } from './selector-rango-horario';

describe('SelectorRangoHorarioComponent', () => {
  let fixture: ComponentFixture<SelectorRangoHorarioComponent>;
  let component: SelectorRangoHorarioComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorRangoHorarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectorRangoHorarioComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fechaMin', '2026-10-01');
    fixture.componentRef.setInput('horaMin', '08:00');
    fixture.componentRef.setInput('horaMax', '18:00');
    fixture.detectChanges();
  });

  it('se crea con el selector requerido', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(3);
  });

  it('emite un rango válido con fecha, inicio y fin', () => {
    const emitir = vi.spyOn(component.rangoChange, 'emit');

    cambiarCampo('fecha', '2026-10-02');
    cambiarCampo('inicio', '09:00');
    cambiarCampo('fin', '10:30');

    expect(emitir).toHaveBeenLastCalledWith({
      fecha: '2026-10-02',
      inicio: '09:00',
      fin: '10:30',
    });
  });

  it('no emite cuando la hora de fin no es posterior a la de inicio', () => {
    const emitir = vi.spyOn(component.rangoChange, 'emit');

    cambiarCampo('fecha', '2026-10-02');
    cambiarCampo('inicio', '10:00');
    cambiarCampo('fin', '10:00');

    expect(emitir).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'posterior',
    );
  });

  it('no emite una fecha anterior a la fecha mínima', () => {
    const emitir = vi.spyOn(component.rangoChange, 'emit');

    cambiarCampo('fecha', '2026-09-30');
    cambiarCampo('inicio', '09:00');
    cambiarCampo('fin', '10:00');

    expect(emitir).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'igual o posterior',
    );
  });

  it('no emite horas fuera del horario permitido', () => {
    const emitir = vi.spyOn(component.rangoChange, 'emit');

    cambiarCampo('fecha', '2026-10-02');
    cambiarCampo('inicio', '07:30');
    cambiarCampo('fin', '09:00');

    expect(emitir).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'igual o posterior a 08:00',
    );

    cambiarCampo('inicio', '17:00');
    cambiarCampo('fin', '18:30');

    expect(emitir).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'igual o anterior a 18:00',
    );
  });

  it('marca en rojo solo el campo que causa el error', () => {
    cambiarCampo('fecha', '2026-10-02');
    cambiarCampo('inicio', '10:00');
    cambiarCampo('fin', '09:00');

    expect(campo('fin').getAttribute('aria-invalid')).toBe('true');
    expect(campo('inicio').getAttribute('aria-invalid')).toBe('false');
    expect(campo('fecha').getAttribute('aria-invalid')).toBe('false');
  });

  it('muestra un resumen con la duración cuando el rango es válido', () => {
    cambiarCampo('fecha', '2026-10-02');
    cambiarCampo('inicio', '09:00');
    cambiarCampo('fin', '10:30');

    expect(fixture.nativeElement.textContent).toContain('1 h 30 min');
  });

  it('muestra la fecha mínima en formato legible', () => {
    cambiarCampo('fecha', '2026-09-30');
    cambiarCampo('inicio', '09:00');
    cambiarCampo('fin', '10:00');

    expect(alerta()?.textContent).toContain('1 oct 2026');
  });

  it('acepta valores precargados por el padre sin emitir', () => {
    const emitir = vi.spyOn(component.rangoChange, 'emit');

    fixture.componentRef.setInput('fecha', '2026-10-05');
    fixture.componentRef.setInput('inicio', '09:00');
    fixture.componentRef.setInput('fin', '10:30');
    fixture.detectChanges();

    expect(campo('fecha').value).toBe('05/10/2026');
    expect(campo('inicio').value).toBe('09:00');
    expect(campo('fin').value).toBe('10:30');
    expect(alerta()).toBeNull();
    expect(emitir).not.toHaveBeenCalled();
  });

  it('al limpiar los tres campos desde el padre oculta el error', () => {
    cambiarCampo('fecha', '2026-10-02');
    cambiarCampo('inicio', '10:00');
    cambiarCampo('fin', '09:00');
    expect(alerta()).not.toBeNull();

    fixture.componentRef.setInput('fecha', '');
    fixture.componentRef.setInput('inicio', '');
    fixture.componentRef.setInput('fin', '');
    fixture.detectChanges();

    expect(alerta()).toBeNull();
    expect(campo('fecha').value).toBe('');
  });

  it('notifica cada cambio por el enlace doble aunque el rango esté incompleto', () => {
    const fechas: string[] = [];
    component.fecha.subscribe((valor) => fechas.push(valor));

    cambiarCampo('fecha', '2026-10-02');

    expect(fechas).toEqual(['2026-10-02']);
  });

  function campo(nombre: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[name="${nombre}"]`);
  }

  function alerta(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[role="alert"]');
  }

  function cambiarCampo(nombre: string, valor: string): void {
    const input = fixture.nativeElement.querySelector(
      `input[name="${nombre}"]`,
    ) as HTMLInputElement;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('exige intervalos de 15 minutos', () => {
    cambiarCampo('fecha', '2026-10-02');
    cambiarCampo('inicio', '09:10');
    cambiarCampo('fin', '10:00');

    expect(alerta()?.textContent).toContain('intervalos de 15 minutos');
    expect(campo('inicio').getAttribute('aria-invalid')).toBe('true');
  });

  it('con soloDiasHabiles rechaza sábados y domingos', () => {
    fixture.componentRef.setInput('soloDiasHabiles', true);
    cambiarCampo('fecha', '2026-10-03');
    cambiarCampo('inicio', '09:00');
    cambiarCampo('fin', '10:00');

    expect(alerta()?.textContent).toContain('lunes a viernes');
  });

  it('valida con funciones puras la hora ya pasada', () => {
    expect(
      diagnosticarRangoHorario(
        { fecha: '2026-10-02', inicio: '09:00', fin: '10:00' },
        { ahora: { fecha: '2026-10-02', hora: '09:30' } },
      )?.campos,
    ).toEqual(['inicio']);
    expect(
      diagnosticarRangoHorario(
        { fecha: '2026-10-02', inicio: '10:00', fin: '11:00' },
        { ahora: { fecha: '2026-10-02', hora: '09:30' } },
      ),
    ).toBeNull();
  });
});
