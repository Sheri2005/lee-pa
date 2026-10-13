import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BotonExportarComponent,
  ColumnaExportacion,
} from './boton-exportar';

describe('BotonExportarComponent', () => {
  let component: BotonExportarComponent;
  let fixture: ComponentFixture<BotonExportarComponent>;

  const datos = [
    {
      codigo: 'MAT-101',
      nombre: 'Matemática I',
      estudiantes: 35,
    },
  ];

  const columnas: ColumnaExportacion[] = [
    {
      clave: 'codigo',
      encabezado: 'Código',
    },
    {
      clave: 'nombre',
      encabezado: 'Nombre',
    },
    {
      clave: 'estudiantes',
      encabezado: 'Estudiantes',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotonExportarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BotonExportarComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('datos', datos);
    fixture.componentRef.setInput('columnas', columnas);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enable export when data and columns are available', () => {
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.disabled).toBe(false);
  });

  it('should open the formats menu when clicking export', () => {
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    button.click();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector(
      '[role="menu"]',
    );

    expect(menu).toBeTruthy();
  });
});