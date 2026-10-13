import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { App } from './app';
import { routes } from './app.routes';

describe('App routing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('keeps the root page visually empty', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
    expect(fixture.nativeElement.querySelector('app-notificaciones')).toBeNull();
  });

  it('renders C5-14 at its report route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/reportes/cursos-paralelos');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cursos y paralelos aperturados');
    expect(fixture.nativeElement.textContent).toContain('ReporteService pendiente');
  });

  it('renders C5-15 at its occupancy report route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/reportes/ocupacion');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Reporte de ocupación');
    expect(fixture.nativeElement.textContent).toContain('ReporteService pendiente');
  });

  it('renders C5-16 at its teacher workload report route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/reportes/carga-docente');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Reporte de carga docente');
    expect(fixture.nativeElement.textContent).toContain('ReporteService pendiente');
  });

  it('renders C5-17 at its shared-subjects report route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/reportes/materias-compartidas');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Reporte de materias compartidas');
    expect(fixture.nativeElement.textContent).toContain('ReporteService pendiente');
  });

  it('renders C5-18 at its reservations report route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/reportes/reservas');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Reporte de reservas');
    expect(fixture.nativeElement.textContent).toContain('ReporteService pendiente');
  });
});
