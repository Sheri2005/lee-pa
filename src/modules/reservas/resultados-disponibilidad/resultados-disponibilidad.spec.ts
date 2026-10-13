import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Espacio } from '../../../app/core/models/espacio.model';
import {
  ResultadosDisponibilidadComponent,
  pisoLegible,
  tipoLegible,
} from './resultados-disponibilidad';

const ESPACIOS: Espacio[] = [
  {
    id: 3,
    codigo: 'F-102',
    nombre: 'Aula F-102',
    edificio_id: 1,
    edificio: 'Bloque F',
    piso: 1,
    tipo_espacio: 'AULA',
    capacidad: 40,
    accesible: true,
    estado: true,
    recursos: [
      { id: 1, nombre: 'Proyector' },
      { id: 4, nombre: 'Aire acondicionado' },
    ],
  },
  {
    id: 36,
    codigo: 'LAB-INNOV',
    nombre: 'Laboratorio de Innovacion',
    edificio_id: 1,
    edificio: 'Bloque F',
    piso: 0,
    tipo_espacio: 'LABORATORIO',
    capacidad: 25,
    accesible: false,
    estado: true,
    recursos: [],
  },
];

describe('ResultadosDisponibilidadComponent (C4-03)', () => {
  let fixture: ComponentFixture<ResultadosDisponibilidadComponent>;
  let raiz: HTMLElement;
  let reservados: Espacio[];

  const tarjetas = () => raiz.querySelectorAll('article');
  const estado = () => raiz.querySelector('[role="status"]');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadosDisponibilidadComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ResultadosDisponibilidadComponent);
    reservados = [];
    fixture.componentInstance.reservar.subscribe((e) => reservados.push(e));
    raiz = fixture.nativeElement;
  });

  it('muestra una tarjeta por espacio con sus datos y el total', () => {
    fixture.componentRef.setInput('espacios', ESPACIOS);
    fixture.detectChanges();

    expect(tarjetas().length).toBe(2);
    expect(raiz.querySelector('h2')?.textContent).toContain('2');
    const primera = tarjetas()[0].textContent!;
    expect(primera).toContain('Aula F-102');
    expect(primera).toContain('Bloque F · Piso 1');
    expect(primera).toContain('40 personas');
    expect(primera).toContain('Sin barreras');
    expect(primera).not.toContain('No adaptado');
    expect(primera).toContain('Proyector · Aire acondicionado');
    const segunda = tarjetas()[1].textContent!;
    expect(segunda).toContain('Planta baja');
    expect(segunda).toContain('Laboratorio');
    expect(segunda).toContain('Sin equipamiento adicional');
    expect(segunda).toContain('No adaptado');
    expect(segunda).not.toContain('Sin barreras');
    expect(estado()).toBeNull();
  });

  it('emite el espacio completo al pulsar Reservar', () => {
    fixture.componentRef.setInput('espacios', ESPACIOS);
    fixture.detectChanges();

    tarjetas()[1].querySelector('button')!.click();

    expect(reservados).toEqual([ESPACIOS[1]]);
  });

  it('identifica cada botón por el nombre del espacio', () => {
    fixture.componentRef.setInput('espacios', ESPACIOS);
    fixture.detectChanges();

    expect(tarjetas()[0].querySelector('button')!.getAttribute('aria-label')).toBe(
      'Reservar Aula F-102',
    );
  });

  it('muestra el estado vacío si no hay espacios', () => {
    fixture.detectChanges();

    expect(tarjetas().length).toBe(0);
    expect(estado()?.textContent).toContain('No hay espacios disponibles');
  });

  it('mientras carga no muestra resultados ni estado vacío', () => {
    fixture.componentRef.setInput('espacios', ESPACIOS);
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();

    expect(tarjetas().length).toBe(0);
    expect(estado()?.textContent).toContain('Buscando espacios');
    expect(raiz.querySelector('section')!.getAttribute('aria-busy')).toBe('true');
  });

  it('traduce tipo y piso a texto legible', () => {
    expect(tipoLegible('AULA')).toBe('Aula');
    expect(tipoLegible('SALA_REUNIONES')).toBe('Sala_reuniones');
    expect(pisoLegible(0)).toBe('Planta baja');
    expect(pisoLegible(2)).toBe('Piso 2');
  });
});
