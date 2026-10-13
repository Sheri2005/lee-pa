import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ResumenReserva } from '../../../app/core/models/reserva.model';
import { ReservaService } from '../../../app/core/services/reserva.service';
import {
  AlcanceCancelacion,
  fechasCancelables,
  reservaCancelable,
  ReservaDetalleComponent,
} from './reserva-detalle';

const RESERVA: ResumenReserva = {
  id: 12,
  estado: 'PENDIENTE',
  motivo: 'Reunión de proyecto',
  asistentes: 8,
  solicitante: { id: 4, nombres: 'Leonor Molina' },
  espacio: {
    id: 3,
    codigo: 'F-203',
    nombre: 'Sala de reuniones',
    edificio: 'Edificio F',
    piso: 2,
    tipo_espacio: 'SALA',
    capacidad: 12,
  },
  sesiones: [
    {
      reserva_id: 12,
      fecha: '2099-10-20',
      hora_inicio: '10:00',
      hora_fin: '11:00',
      estado: 'PENDIENTE',
    },
  ],
  serie: null,
  recursos: [],
};

class ReservaServiceFalso {
  obtenerResumen() {
    return of(RESERVA);
  }
}

describe('ReservaDetalleComponent (C4-12)', () => {
  let fixture: ComponentFixture<ReservaDetalleComponent>;
  let raiz: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservaDetalleComponent],
      providers: [{ provide: ReservaService, useClass: ReservaServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(ReservaDetalleComponent);
    fixture.componentRef.setInput('reservaId', 12);
    fixture.componentRef.setInput('usuarioActualId', 4);
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('muestra diálogo, resumen y trazabilidad', () => {
    expect(raiz.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true');
    expect(raiz.textContent).toContain('Trazabilidad');
    expect(raiz.querySelector('app-resumen-reserva')).toBeTruthy();
  });

  it('solo permite cancelar una reserva propia, futura y pendiente o aprobada', () => {
    expect(reservaCancelable(RESERVA, 12, 4, '2099-01-01')).toBe(true);
    expect(reservaCancelable(RESERVA, 12, 99, '2099-01-01')).toBe(false);
    expect(reservaCancelable(RESERVA, 12, 4, '2100-01-01')).toBe(false);
    const rechazada = {
      ...RESERVA,
      sesiones: [{ ...RESERVA.sesiones[0], estado: 'RECHAZADA' as const }],
    };
    expect(reservaCancelable(rechazada, 12, 4, '2099-01-01')).toBe(false);
  });

  it('en una serie solo mira la fecha abierta, no las demás', () => {
    const serie = {
      ...RESERVA,
      sesiones: [
        { ...RESERVA.sesiones[0], reserva_id: 11, fecha: '2099-10-13' },
        { ...RESERVA.sesiones[0], reserva_id: 12, fecha: '2099-10-20' },
      ],
    };
    // Hoy es 15/10: la del 13 ya pasó aunque la del 20 siga pendiente.
    expect(reservaCancelable(serie, 11, 4, '2099-10-15')).toBe(false);
    expect(reservaCancelable(serie, 12, 4, '2099-10-15')).toBe(true);
  });

  it('muestra el estado legible, mueve el foco al diálogo y cierra con clic fuera', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const dialogo = raiz.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(raiz.textContent).toContain('Pendiente');
    expect(raiz.textContent).not.toContain('PENDIENTE');
    expect(document.activeElement).toBe(dialogo);

    let cierres = 0;
    fixture.componentInstance.cerrar.subscribe(() => cierres++);
    dialogo.click();
    expect(cierres).toBe(0);
    (dialogo.parentElement as HTMLElement).click();
    expect(cierres).toBe(1);
  });

  it('en una serie deja elegir entre solo esta fecha y toda la serie', async () => {
    const serie: ResumenReserva = {
      ...RESERVA,
      serie: {
        id: 3,
        frecuencia: 'SEMANAL',
        dias_semana: ['MARTES'],
        fecha_desde: '2026-01-06',
        fecha_hasta: '2099-10-27',
      },
      sesiones: [
        { ...RESERVA.sesiones[0], reserva_id: 10, fecha: '2026-01-06', estado: 'APROBADA' },
        { ...RESERVA.sesiones[0], reserva_id: 12, fecha: '2099-10-20', estado: 'APROBADA' },
        { ...RESERVA.sesiones[0], reserva_id: 13, fecha: '2099-10-27', estado: 'APROBADA' },
      ],
    };
    // La del 06/01/2026 ya pasó: no cuenta para cancelar.
    expect(fechasCancelables(serie, '2099-01-01').map((s) => s.reserva_id)).toEqual([12, 13]);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ReservaDetalleComponent],
      providers: [{ provide: ReservaService, useValue: { obtenerResumen: () => of(serie) } }],
    }).compileComponents();
    const f = TestBed.createComponent(ReservaDetalleComponent);
    f.componentRef.setInput('reservaId', 12);
    f.componentRef.setInput('usuarioActualId', 4);
    f.detectChanges();
    const r = f.nativeElement as HTMLElement;
    const emitidos: AlcanceCancelacion[] = [];
    f.componentInstance.cancelar.subscribe((a) => emitidos.push(a));
    const boton = (texto: string) =>
      [...r.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
        b.textContent?.includes(texto),
      )!;

    boton('Cancelar reserva').click();
    f.detectChanges();
    expect(r.textContent).toContain('¿Qué quieres cancelar?');
    expect(r.querySelector('[role="radio"][aria-checked="true"]')?.textContent).toContain(
      'Solo esta fecha',
    );

    boton('Toda la serie').click();
    f.detectChanges();
    expect(r.textContent).toContain('Las 2 fechas pendientes');
    boton('Cancelar 2 fechas').click();
    expect(emitidos).toEqual(['SERIE']);
  });

  it('pide confirmación antes de emitir cancelar', () => {
    let cancelaciones = 0;
    fixture.componentInstance.cancelar.subscribe(() => cancelaciones++);
    [...raiz.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Cancelar reserva')!
      .click();
    fixture.detectChanges();
    expect(cancelaciones).toBe(0);
    expect(raiz.textContent).toContain('¿Cancelar esta reserva?');
    [...raiz.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Sí, cancelar esta fecha'))!
      .click();
    expect(cancelaciones).toBe(1);
  });

  it('emite cerrar con el botón y Escape', () => {
    let cierres = 0;
    fixture.componentInstance.cerrar.subscribe(() => cierres++);
    raiz.querySelector<HTMLButtonElement>('button[aria-label="Cerrar"]')!.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cierres).toBe(2);
  });

  it('Escape cierra primero la confirmación', () => {
    let cierres = 0;
    fixture.componentInstance.cerrar.subscribe(() => cierres++);
    [...raiz.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Cancelar reserva')!
      .click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(cierres).toBe(0);
    expect(raiz.textContent).not.toContain('¿Cancelar esta reserva?');
  });
});
