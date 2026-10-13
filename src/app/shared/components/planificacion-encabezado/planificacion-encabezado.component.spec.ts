import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Planificacion } from '../../../core/models/planificacion.model';
import { PlanificacionEncabezadoComponent } from './planificacion-encabezado.component';

const planificacionEjemplo: Planificacion = {
  id: 1,
  carrera: { id: 10, codigo: 'ISC', nombre: 'Ingeniería en Sistemas' },
  facultad: { id: 2, codigo: 'FING', nombre: 'Facultad de Ingeniería' },
  periodo: { id: 5, codigo: '2027-1', nombre: 'Primer período ordinario 2027', tipo: 'ORDINARIO' },
  malla: { id: 7, codigo: 'M-2024', nombre: 'Malla 2024', anioInicio: 2024 },
  estado: 'BORRADOR',
};

describe('PlanificacionEncabezadoComponent', () => {
  let fixture: ComponentFixture<PlanificacionEncabezadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanificacionEncabezadoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanificacionEncabezadoComponent);
    fixture.componentRef.setInput('planificacion', planificacionEjemplo);
    await fixture.whenStable();
  });

  it('muestra carrera, facultad, período, malla y estado', () => {
    const texto: string = fixture.nativeElement.textContent;
    expect(texto).toContain('Ingeniería en Sistemas');
    expect(texto).toContain('Facultad de Ingeniería');
    expect(texto).toContain('2027-1');
    expect(texto).toContain('Malla 2024');
    expect(texto).toContain('BORRADOR');
  });
});