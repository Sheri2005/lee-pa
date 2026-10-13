import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SolicitudReserva } from '../../../app/core/models/reserva.model';
import { DisponibilidadEspacioService } from '../../../app/core/services/disponibilidad-espacio.service';
import { EspaciosAlternativosComponent } from './espacios-alternativos';

const SOLICITUD: SolicitudReserva = {
  espacio_id: 1,
  fecha: '2026-10-20',
  hora_inicio: '10:00',
  hora_fin: '11:00',
  asistentes: 20,
  tipo_espacio: 'AULA',
  recursos_requeridos: [1],
};
const ESPACIO = {
  id: 2,
  codigo: 'F-204',
  nombre: 'Aula 204',
  edificio_id: 1,
  edificio: 'Edificio F',
  piso: 2,
  tipo_espacio: 'AULA',
  capacidad: 30,
  accesible: true,
  estado: true,
  recursos: [{ id: 1, nombre: 'Proyector' }],
};

describe('EspaciosAlternativosComponent (C4-08)', () => {
  it('muestra alternativas y emite elegir', async () => {
    await TestBed.configureTestingModule({
      imports: [EspaciosAlternativosComponent],
      providers: [
        {
          provide: DisponibilidadEspacioService,
          useValue: {
            buscarAlternativas: () =>
              of([
                {
                  espacio: ESPACIO,
                  justificacion: 'Cumple capacidad y recursos.',
                  prioridadFacultad: true,
                  cercania: 'MISMO_EDIFICIO',
                },
                {
                  espacio: { ...ESPACIO, id: 3, nombre: 'Aula 102', edificio: 'Bloque C' },
                  justificacion: 'Cumple capacidad y recursos; está en otro bloque.',
                  prioridadFacultad: false,
                  cercania: 'OTRO_EDIFICIO',
                },
              ]),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EspaciosAlternativosComponent);
    fixture.componentRef.setInput('solicitud', SOLICITUD);
    let elegido: unknown;
    fixture.componentInstance.elegir.subscribe((espacio) => (elegido = espacio));
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.textContent).toContain('Cumple capacidad y recursos.');
    expect(raiz.textContent).toContain('30 personas');
    // Cada tarjeta muestra siempre la facultad y la cercanía, sin metros.
    const criterios = [...raiz.querySelectorAll('ul[aria-label="Criterios"]')].map((c) =>
      c.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(criterios).toEqual([
      'Edificio de tu facultad Mismo edificio',
      'Fuera de tu facultad Otro edificio',
    ]);
    expect(raiz.textContent).not.toContain('Distancia');
    raiz.querySelector<HTMLButtonElement>('button[aria-label="Usar Aula 204"]')!.click();
    expect(elegido).toEqual(ESPACIO);
  });

  it('muestra estado vacío', async () => {
    await TestBed.configureTestingModule({
      imports: [EspaciosAlternativosComponent],
      providers: [
        { provide: DisponibilidadEspacioService, useValue: { buscarAlternativas: () => of([]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EspaciosAlternativosComponent);
    fixture.componentRef.setInput('solicitud', SOLICITUD);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No encontramos espacios equivalentes',
    );
  });

  it('muestra error del servicio', async () => {
    await TestBed.configureTestingModule({
      imports: [EspaciosAlternativosComponent],
      providers: [
        {
          provide: DisponibilidadEspacioService,
          useValue: { buscarAlternativas: () => throwError(() => new Error('fallo')) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EspaciosAlternativosComponent);
    fixture.componentRef.setInput('solicitud', SOLICITUD);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No se pudieron cargar las alternativas',
    );
  });
});
