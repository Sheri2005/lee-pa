import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { of } from 'rxjs';

import { SiacService } from '../../../../app/core/services/siac.service';
import { ExportacionSiacComponent } from './exportacion-siac';

describe('ExportacionSiacComponent', () => {
  let component: ExportacionSiacComponent;
  let fixture: ComponentFixture<ExportacionSiacComponent>;

  const siacServiceMock = {
    registrosSinCodigo: (planificacionId?: number) => {
      if (planificacionId === 1) {
        return of([
          {
            entidad: 'materia' as const,
            id: 3,
            codigo: 'PRG-201',
            nombre: 'Programación II',
          },
          {
            entidad: 'materia' as const,
            id: 4,
            codigo: 'BDD-301',
            nombre: 'Bases de Datos',
          },
          {
            entidad: 'docente' as const,
            id: 5,
            codigo: '0912345678',
            nombre: 'María Torres',
          },
        ]);
      }

      return of([]);
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportacionSiacComponent],
      providers: [
        {
          provide: SiacService,
          useValue: siacServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ExportacionSiacComponent,
    );

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show missing SIAC records for an approved planning', () => {
    expect(
      fixture.nativeElement.textContent,
    ).toContain('Exportación bloqueada');

    expect(
      fixture.nativeElement.textContent,
    ).toContain('3 registros sin código SIAC');
  });

  it('should block a planning that is not approved', () => {
    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('#planificacion');

    select.value = '2';
    select.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    expect(
      fixture.nativeElement.textContent,
    ).toContain(
      'La planificación todavía no puede exportarse',
    );
  });

  it('should allow preview for an approved planning without missing SIAC codes', () => {
    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('#planificacion');

    select.value = '3';
    select.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    expect(
      fixture.nativeElement.textContent,
    ).toContain('Validación completada');

    expect(
      fixture.nativeElement.textContent,
    ).toContain('Generar vista previa');
  });
});