import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { BitacoraExportacionesComponent } from './bitacora-exportaciones';

describe('BitacoraExportacionesComponent', () => {
  let component: BitacoraExportacionesComponent;
  let fixture: ComponentFixture<BitacoraExportacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BitacoraExportacionesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      BitacoraExportacionesComponent,
    );

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display export records', () => {
    const rows =
      fixture.nativeElement.querySelectorAll('tbody tr');

    expect(rows.length).toBe(5);
  });

  it('should filter records by format', () => {
    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector(
        '#formato-exportacion',
      );

    select.value = 'JSON';
    select.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    const rows =
      fixture.nativeElement.querySelectorAll('tbody tr');

    expect(rows.length).toBe(3);
  });

  it('should filter records using the search input', () => {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector(
        '#busqueda-exportacion',
      );

    input.value = 'Carlos Mendoza';
    input.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const rows =
      fixture.nativeElement.querySelectorAll('tbody tr');

    expect(rows.length).toBe(1);
  });
});