import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecursoSolicitado } from '../../../app/core/models/reserva.model';
import { RecursoReservableService } from '../../../app/core/services/recurso-reservable.service';
import { franjaValida, RecursosDeReservaComponent } from './recursos-de-reserva';

const RECURSOS = [
  { id: 1, nombre: 'Proyector movil', cantidad: 4, estado: true },
  { id: 2, nombre: 'Parlante portatil', cantidad: 3, estado: true },
  { id: 3, nombre: 'Microfono inalambrico', cantidad: 6, estado: true },
  { id: 4, nombre: 'Laptop', cantidad: 8, estado: true },
  { id: 5, nombre: 'Camara para videoconferencia', cantidad: 2, estado: true },
  { id: 6, nombre: 'Extension electrica', cantidad: 10, estado: true },
];
/** Prestado en una reserva aprobada de 14:30 a 17:30: 3 micrófonos y 1 cámara. */
const PRESTADO_EN_LA_TARDE: Record<number, number> = { 3: 3, 5: 1 };

const SERVICIO_DE_PRUEBA: Partial<RecursoReservableService> = {
  disponibilidad: (_fecha: string, inicio: string, fin: string) =>
    of(
      RECURSOS.map((recurso) => ({
        recurso,
        disponibles:
          recurso.cantidad -
          (inicio < '17:30' && '14:30' < fin ? (PRESTADO_EN_LA_TARDE[recurso.id] ?? 0) : 0),
      })),
    ),
};

describe('RecursosDeReservaComponent (C4-18)', () => {
  let fixture: ComponentFixture<RecursosDeReservaComponent>;
  let raiz: HTMLElement;
  let emitidos: RecursoSolicitado[][];

  const campo = (recurso: string) =>
    raiz.querySelector<HTMLInputElement>(`input[aria-label="Cantidad de ${recurso}"]`)!;
  const boton = (accion: 'Agregar' | 'Quitar', recurso: string) =>
    raiz.querySelector<HTMLButtonElement>(
      `button[aria-label="${accion} una unidad de ${recurso}"]`,
    )!;
  const fila = (recurso: string) => campo(recurso).closest('li')!;

  async function franja(fecha: string, inicio: string, fin: string) {
    fixture.componentRef.setInput('fecha', fecha);
    fixture.componentRef.setInput('horaInicio', inicio);
    fixture.componentRef.setInput('horaFin', fin);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function pulsar(accion: 'Agregar' | 'Quitar', recurso: string) {
    boton(accion, recurso).click();
    fixture.detectChanges();
  }

  function escribir(recurso: string, valor: string) {
    campo(recurso).value = valor;
    campo(recurso).dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecursosDeReservaComponent],
      providers: [{ provide: RecursoReservableService, useValue: SERVICIO_DE_PRUEBA }],
    }).compileComponents();
    fixture = TestBed.createComponent(RecursosDeReservaComponent);
    emitidos = [];
    fixture.componentInstance.recursosChange.subscribe((r) => emitidos.push(r));
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('pide fecha y horario antes de consultar', async () => {
    expect(raiz.textContent).toContain('Elige la fecha y el horario');

    await franja('2026-11-27', '16:00', '15:00');
    expect(raiz.textContent).toContain('Elige la fecha y el horario');
    expect(raiz.querySelector('ul')).toBeNull();
  });

  it('muestra las unidades libres de cada recurso activo en la franja', async () => {
    await franja('2026-11-27', '15:00', '16:00');

    expect(raiz.querySelectorAll('ul > li')).toHaveLength(6);
    expect(fila('Microfono inalambrico').textContent).toContain('3 de 6 disponibles');
    expect(fila('Camara para videoconferencia').textContent).toContain('1 de 2 disponibles');
  });

  it('agrega y quita unidades con los botones y emite la selección', async () => {
    await franja('2026-11-27', '15:00', '16:00');

    pulsar('Agregar', 'Laptop');
    pulsar('Agregar', 'Laptop');
    pulsar('Agregar', 'Proyector movil');

    expect(emitidos.at(-1)).toEqual([
      { recurso_reservable_id: 1, cantidad: 1 },
      { recurso_reservable_id: 4, cantidad: 2 },
    ]);
    expect(raiz.textContent).toContain('3 unidades pedidas');

    pulsar('Quitar', 'Proyector movil');
    expect(emitidos.at(-1)).toEqual([{ recurso_reservable_id: 4, cantidad: 2 }]);
    expect(boton('Quitar', 'Proyector movil').disabled).toBe(true);
  });

  it('la barra y el texto se reducen con cada unidad pedida', async () => {
    await franja('2026-11-27', '15:00', '16:00');
    const barra = () => fila('Microfono inalambrico').querySelector<HTMLElement>('span > span')!;

    // 3 libres de 6: la barra empieza al 50 %.
    expect(barra().style.width).toBe('50%');

    pulsar('Agregar', 'Microfono inalambrico');
    expect(fila('Microfono inalambrico').textContent).toContain('Quedan 2 de 6');
    expect(parseFloat(barra().style.width)).toBeCloseTo(33.33, 1);

    pulsar('Agregar', 'Microfono inalambrico');
    pulsar('Agregar', 'Microfono inalambrico');
    expect(fila('Microfono inalambrico').textContent).toContain('No quedan más unidades libres');
    expect(barra().style.width).toBe('0%');

    pulsar('Quitar', 'Microfono inalambrico');
    expect(fila('Microfono inalambrico').textContent).toContain('Quedan 1 de 6');
  });

  it('no deja pedir más de lo disponible', async () => {
    await franja('2026-11-27', '15:00', '16:00');

    escribir('Camara para videoconferencia', '5');

    expect(campo('Camara para videoconferencia').value).toBe('1');
    expect(fila('Camara para videoconferencia').textContent).toContain('Solo hay 1 unidad libre');
    expect(boton('Agregar', 'Camara para videoconferencia').disabled).toBe(true);
    expect(emitidos.at(-1)).toEqual([{ recurso_reservable_id: 5, cantidad: 1 }]);
  });

  it('ajusta lo pedido si en el nuevo horario quedan menos unidades', async () => {
    await franja('2026-11-27', '08:00', '09:00');
    escribir('Camara para videoconferencia', '2');
    expect(emitidos.at(-1)).toEqual([{ recurso_reservable_id: 5, cantidad: 2 }]);

    await franja('2026-11-27', '15:00', '16:00');

    expect(emitidos.at(-1)).toEqual([{ recurso_reservable_id: 5, cantidad: 1 }]);
    expect(campo('Camara para videoconferencia').value).toBe('1');
    expect(fila('Camara para videoconferencia').textContent).toContain('Se ajustó a 1');
  });

  it('valida la franja con una función pura', () => {
    expect(franjaValida('2026-11-27', '15:00', '16:00')).toEqual({
      fecha: '2026-11-27',
      inicio: '15:00',
      fin: '16:00',
    });
    expect(franjaValida('2026-11-27', '16:00', '16:00')).toBeNull();
    expect(franjaValida('2026-02-30', '15:00', '16:00')).toBeNull();
    expect(franjaValida('2026-11-27', '7:00', '16:00')).toBeNull();
  });

  it('muestra un resumen de lo agregado a la reserva', async () => {
    await franja('2026-11-27', '15:00', '16:00');
    pulsar('Agregar', 'Laptop');
    pulsar('Agregar', 'Laptop');

    expect(raiz.textContent).toContain('Agregado a la reserva');
    expect(raiz.textContent).toContain('Laptop × 2');
  });
});
