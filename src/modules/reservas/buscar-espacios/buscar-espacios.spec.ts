import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { DisponibilidadEspacioService } from '../../../app/core/services/disponibilidad-espacio.service';
import { Espacio } from '../../../app/core/models/espacio.model';
import { FiltroDisponibilidad } from '../../../app/core/models/ocupacion.model';
import { BuscarEspaciosComponent } from './buscar-espacios';

const FILTROS: FiltroDisponibilidad = {
  fecha: '2026-11-16',
  horaInicio: '14:00',
  horaFin: '15:30',
  tipoEspacio: 'AULA',
  capacidadMinima: 20,
  recursos: [1],
  edificioId: 2,
};

const ESPACIO: Espacio = {
  id: 7,
  codigo: 'A-201',
  nombre: 'Aula A-201',
  edificio_id: 2,
  edificio: 'Bloque A',
  piso: 2,
  tipo_espacio: 'AULA',
  capacidad: 30,
  accesible: true,
  estado: true,
  recursos: [{ id: 1, nombre: 'Proyector' }],
};

describe('BuscarEspaciosComponent (C4-01)', () => {
  let fixture: ComponentFixture<BuscarEspaciosComponent>;
  let componente: BuscarEspaciosComponent;
  let raiz: HTMLElement;
  let navegar: ReturnType<typeof vi.fn>;

  async function crear(
    servicio: Partial<DisponibilidadEspacioService> = { buscar: () => of([ESPACIO]) },
  ) {
    navegar = vi.fn().mockResolvedValue(true);
    await TestBed.configureTestingModule({
      imports: [BuscarEspaciosComponent],
      providers: [
        { provide: DisponibilidadEspacioService, useValue: servicio },
        { provide: Router, useValue: { navigate: navegar } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BuscarEspaciosComponent);
    componente = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  }

  it('integra los filtros y los resultados de disponibilidad', async () => {
    await crear();

    expect(raiz.querySelector('app-filtros-disponibilidad')).not.toBeNull();
    expect(raiz.querySelector('app-resultados-disponibilidad')).not.toBeNull();
    expect(raiz.querySelector('h1')?.textContent).toContain('Buscar espacios');
  });

  it('consulta el servicio y muestra los espacios encontrados', async () => {
    const buscar = vi.fn(() => of([ESPACIO]));
    await crear({ buscar });

    componente.buscar(FILTROS);
    fixture.detectChanges();

    expect(buscar).toHaveBeenCalledWith(FILTROS);
    expect(raiz.textContent).toContain('Aula A-201');
    expect(raiz.querySelector('app-resultados-disponibilidad h2')?.textContent).toContain('1');
  });

  it('mantiene el indicador mientras la consulta está pendiente', async () => {
    await crear({ buscar: () => NEVER });

    componente.buscar(FILTROS);
    fixture.detectChanges();

    expect(raiz.textContent).toContain('Buscando espacios disponibles');
  });

  it('muestra un error si falla la consulta', async () => {
    await crear({ buscar: () => throwError(() => new Error('sin conexión')) });

    componente.buscar(FILTROS);
    fixture.detectChanges();

    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo consultar la disponibilidad',
    );
  });

  it('lleva los datos del espacio y del horario al flujo de nueva reserva', async () => {
    await crear();
    componente.buscar(FILTROS);
    fixture.detectChanges();

    componente.reservar(ESPACIO);

    expect(navegar).toHaveBeenCalledWith(['/reservas/nueva'], {
      queryParams: {
        espacioId: 7,
        fecha: '2026-11-16',
        horaInicio: '14:00',
        horaFin: '15:30',
      },
    });
  });
});
