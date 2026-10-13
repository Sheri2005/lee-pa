import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { AccesoDenegadoComponent } from './acceso-denegado';

describe('AccesoDenegadoComponent', () => {
  describe('contenido', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AccesoDenegadoComponent],
        providers: [provideRouter([])],
      }).compileComponents();
    });

    function crear(): HTMLElement {
      const fixture = TestBed.createComponent(AccesoDenegadoComponent);
      fixture.detectChanges();
      return fixture.nativeElement;
    }

    it('muestra el título principal y el código 403', () => {
      const el = crear();
      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Acceso denegado');
      expect(el.textContent).toContain('403');
    });

    it('explica que no tiene permiso', () => {
      expect(crear().textContent).toContain('No tienes permiso');
    });

    it('ofrece volver al inicio', () => {
      const enlace = crear().querySelector('a')!;
      expect(enlace.textContent?.trim()).toBe('Volver al inicio');
      expect(enlace.getAttribute('href')).toBe('/');
    });

    it('asocia la sección con su título para lectores de pantalla', () => {
      const el = crear();
      const seccion = el.querySelector('section')!;
      const idTitulo = seccion.getAttribute('aria-labelledby')!;
      expect(el.querySelector(`#${idTitulo}`)?.tagName).toBe('H1');
    });
  });

  describe('ruta', () => {
    it('/acceso-denegado muestra la pantalla 403', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/acceso-denegado');
      const el: HTMLElement = harness.routeNativeElement!;
      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Acceso denegado');
    });
  });
});
