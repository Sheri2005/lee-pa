import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { ResumenReserva } from '../../../core/models/reserva.model';
import { ReservaService } from '../../../core/services/reserva.service';
import { diasTexto, ResumenReservaComponent } from './resumen-reserva';

const ESPACIO = {
  id: 1,
  codigo: 'F-207',
  nombre: 'Aula F-207',
  edificio: 'Bloque F',
  piso: 2,
  tipo_espacio: 'AULA',
  capacidad: 35,
};

const PUNTUAL: ResumenReserva = {
  id: 1,
  estado: 'APROBADA',
  motivo: 'Induccion a docentes nuevos',
  asistentes: 28,
  solicitante: { id: 2, nombres: 'Carlos Vera' },
  espacio: ESPACIO,
  sesiones: [
    {
      reserva_id: 1,
      fecha: '2026-09-03',
      hora_inicio: '10:30',
      hora_fin: '12:00',
      estado: 'APROBADA',
    },
  ],
  serie: null,
  recursos: [{ nombre: 'Proyector movil', cantidad: 1 }],
};

const SERIE: ResumenReserva = {
  ...PUNTUAL,
  id: 11,
  espacio: { ...ESPACIO, piso: 0 },
  sesiones: ['2026-10-06', '2026-10-13', '2026-10-20', '2026-10-27'].map((fecha, i) => ({
    reserva_id: 10 + i,
    fecha,
    hora_inicio: '16:15',
    hora_fin: '17:45',
    estado: 'APROBADA' as const,
  })),
  serie: {
    id: 1,
    frecuencia: 'SEMANAL',
    dias_semana: ['MARTES'],
    fecha_desde: '2026-10-06',
    fecha_hasta: '2026-10-27',
  },
  recursos: [],
};

const RESUMENES: Record<number, ResumenReserva> = {
  1: PUNTUAL,
  11: SERIE,
  31: { ...PUNTUAL, id: 31, recursos: [{ nombre: 'Microfono inalambrico', cantidad: 3 }] },
};

const SERVICIO_DE_PRUEBA: Partial<ReservaService> = {
  obtenerResumen: (id: number) => of(RESUMENES[id] ?? null),
};

describe('ResumenReservaComponent (C4-13)', () => {
  let fixture: ComponentFixture<ResumenReservaComponent>;
  let raiz: HTMLElement;

  async function crear(reservaId: number, servicio = SERVICIO_DE_PRUEBA) {
    TestBed.configureTestingModule({
      imports: [ResumenReservaComponent],
      providers: [{ provide: ReservaService, useValue: servicio }],
    });
    fixture = TestBed.createComponent(ResumenReservaComponent);
    fixture.componentRef.setInput('reservaId', reservaId);
    raiz = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('muestra una reserva puntual con su espacio, solicitante y recursos', async () => {
    await crear(1);
    const texto = raiz.textContent!;

    expect(texto).toContain('Reserva #1');
    expect(texto).toContain('Aprobada');
    expect(texto).toContain('Aula F-207');
    expect(texto).toContain('Bloque F · Piso 2');
    expect(texto).toContain('10:30–12:00');
    expect(texto).toContain('Carlos Vera');
    expect(texto).toContain('28 personas');
    expect(texto).toContain('Induccion a docentes nuevos');
    expect(texto).toContain('Proyector movil');
    expect(texto).toContain('× 1');
    expect(texto).not.toContain('Ocurrencias');
  });

  it('en una serie muestra todas las ocurrencias y marca la actual', async () => {
    await crear(11);

    expect(raiz.textContent).toContain('Serie · 4 fechas');
    expect(raiz.textContent).toContain('Cada martes');
    expect(raiz.querySelectorAll('dd ul > li')).toHaveLength(4);
    expect(raiz.querySelector('li[aria-current="true"]')?.textContent).toContain('13 oct');
  });

  it('indica cuando la reserva no tiene recursos', async () => {
    await crear(11);

    expect(raiz.textContent).toContain('Sin recursos adicionales');
    expect(raiz.textContent).toContain('Planta baja');
  });

  it('avisa si la reserva no existe', async () => {
    await crear(999);

    expect(raiz.querySelector('[role="status"]')?.textContent).toContain(
      'No se encontró la reserva #999',
    );
  });

  it('muestra el estado de carga mientras llegan los datos', async () => {
    await crear(1, { obtenerResumen: () => NEVER });

    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('Cargando');
    expect(raiz.querySelector('article')).toBeNull();
  });

  it('muestra un error si el servicio falla', async () => {
    await crear(1, { obtenerResumen: () => throwError(() => new Error('sin conexión')) });

    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar');
  });

  it('vuelve a cargar al cambiar el id', async () => {
    await crear(1);
    fixture.componentRef.setInput('reservaId', 31);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(raiz.textContent).toContain('Reserva #31');
    expect(raiz.textContent).toContain('Microfono inalambrico');
  });

  it('une los días de la serie en texto', () => {
    expect(diasTexto(['LUNES'])).toBe('lunes');
    expect(diasTexto(['LUNES', 'MIERCOLES', 'VIERNES'])).toBe('lunes, miércoles y viernes');
  });
});
