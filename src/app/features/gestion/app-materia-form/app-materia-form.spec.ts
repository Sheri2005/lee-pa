import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MateriaFormComponent } from './app-materia-form';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('MateriaFormComponent', () => {
  let component: MateriaFormComponent;
  let fixture: ComponentFixture<MateriaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MateriaFormComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(MateriaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate form fields', () => {
    component.materiaForm.setValue({
      codigo: 'MAT-01',
      nombre: 'Matemática',
      descripcion: 'Curso base',
      estado: 'Activa',
      carreraId: 5,
      codigoSiac: 'SIAC-01'
    });
    expect(component.materiaForm.valid).toBeTruthy();
  });
});