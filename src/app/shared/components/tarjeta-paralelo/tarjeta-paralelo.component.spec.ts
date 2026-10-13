import { TestBed } from '@angular/core/testing';
import { TarjetaParaleloComponent } from './tarjeta-paralelo.component';
import { PARALELOS_MOCK } from '../../../core/mocks/paralelos.mock';

describe('TarjetaParaleloComponent', () => {
  function crear(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(TarjetaParaleloComponent);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra materia, código, cupo, horas, tipo de espacio y docente', () => {
    const texto = crear({ paralelo: PARALELOS_MOCK[0] }).nativeElement.textContent;
    expect(texto).toContain('Cálculo Diferencial');
    expect(texto).toContain('Paralelo A');
    expect(texto).toContain('35 cupos');
    expect(texto).toContain('4 h/sem');
    expect(texto).toContain('Aula');
    expect(texto).toContain('María Fernanda Torres');
  });

  it('indica cuando no hay docente', () => {
    const texto = crear({ paralelo: PARALELOS_MOCK[2] }).nativeElement.textContent;
    expect(texto).toContain('Sin docente asignado');
  });

  it('calcula las horas pendientes de ubicar', () => {
    const fixture = crear({ paralelo: PARALELOS_MOCK[2], horasUbicadas: 2 });
    expect(fixture.componentInstance.horasPendientes()).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('4 h pendientes');
  });

  it('no muestra progreso si no se envía horasUbicadas', () => {
    const fixture = crear({ paralelo: PARALELOS_MOCK[0] });
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeNull();
  });

  it('emite seleccionar con el paralelo al hacer clic', () => {
    const fixture = crear({ paralelo: PARALELOS_MOCK[1] });
    let emitido: unknown;
    fixture.componentInstance.seleccionar.subscribe((p) => (emitido = p));
    fixture.nativeElement.click();
    expect(emitido).toEqual(PARALELOS_MOCK[1]);
  });

  it('solo es arrastrable en modo arrastrable', () => {
    expect(crear({ paralelo: PARALELOS_MOCK[0] }).nativeElement.getAttribute('draggable')).toBe(
      'false',
    );
    expect(
      crear({
        paralelo: PARALELOS_MOCK[0],
        arrastrable: true,
      }).nativeElement.getAttribute('draggable'),
    ).toBe('true');
  });
});
