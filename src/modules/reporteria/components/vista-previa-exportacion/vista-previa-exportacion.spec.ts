import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaPreviaExportacionComponent } from './vista-previa-exportacion';

describe('VistaPreviaExportacionComponent', () => {
  let component: VistaPreviaExportacionComponent;
  let fixture: ComponentFixture<VistaPreviaExportacionComponent>;

  const datosJson = {
    version: '1.0',
    periodo: {
      codigo_siac: '2027-1',
      nombre: 'Primer período ordinario 2027',
    },
  };

  const contenidoCsv =
    'periodo_codigo_siac;carrera_codigo_siac\n2027-1;ING-COMP';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistaPreviaExportacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      VistaPreviaExportacionComponent,
    );

    component = fixture.componentInstance;

    fixture.componentRef.setInput('datosJson', datosJson);
    fixture.componentRef.setInput(
      'contenidoCsv',
      contenidoCsv,
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show JSON preview by default', () => {
    const contenido =
      fixture.nativeElement.querySelector('pre');

    expect(contenido.textContent).toContain('"version": "1.0"');
  });

  it('should switch to CSV preview', () => {
    const tabs: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]'),
    );

    tabs[1].click();
    fixture.detectChanges();

    const contenido =
      fixture.nativeElement.querySelector('pre');

    expect(contenido.textContent).toContain(
      'periodo_codigo_siac',
    );
  });
});