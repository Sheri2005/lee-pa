import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { CargaMasivaComponent } from '../../../shared/components/carga-masiva/carga-masiva';
import { CargaMasivaPaginaComponent } from './carga-masiva-pagina';

describe('CargaMasivaPaginaComponent', () => {
  let fixture: ComponentFixture<CargaMasivaPaginaComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaMasivaPaginaComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CargaMasivaPaginaComponent);
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  const opciones = () => Array.from(el.querySelectorAll('fieldset label'));
  const radio = (nombre: string) =>
    opciones()
      .find((l) => l.textContent?.trim() === nombre)!
      .querySelector('input') as HTMLInputElement;
  const asistente = () =>
    fixture.debugElement.query((d) => d.componentInstance instanceof CargaMasivaComponent)
      ?.componentInstance as CargaMasivaComponent | undefined;

  async function elegir(nombre: string) {
    const r = radio(nombre);
    r.checked = true;
    r.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  it('muestra el título de la página', () => {
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Carga masiva');
  });

  it('enlaza a la bitácora de importaciones', () => {
    expect(el.querySelector('header a')?.getAttribute('href')).toBe('/gestion/carga-masiva/bitacora');
  });

  it('ofrece las 5 entidades del módulo 1', () => {
    expect(opciones().map((l) => l.textContent?.trim())).toEqual([
      'Usuarios',
      'Docentes',
      'Períodos',
      'Materias',
      'Materias por malla',
    ]);
  });

  it('las opciones son radios con una leyenda (accesibles con teclado)', () => {
    expect(el.querySelector('fieldset legend')?.textContent).toContain('¿Qué quieres importar?');
    expect(el.querySelectorAll('fieldset input[type="radio"][name="entidad"]').length).toBe(5);
  });

  it('empieza con Usuarios y el asistente muestra sus columnas', () => {
    expect(radio('Usuarios').checked).toBe(true);
    expect(el.querySelector('app-carga-masiva')?.textContent).toContain('username');
  });

  it('al elegir otra entidad el asistente usa su plantilla', async () => {
    await elegir('Períodos');
    const texto = el.querySelector('app-carga-masiva')?.textContent ?? '';
    expect(texto).toContain('fecha_inicio');
    expect(texto).not.toContain('username');
  });

  it('al cambiar de entidad el asistente se reinicia (es una instancia nueva)', async () => {
    const antes = asistente();
    await elegir('Docentes');
    expect(asistente()).toBeTruthy();
    expect(asistente()).not.toBe(antes);
  });

  it('/gestion/carga-masiva muestra la página', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/gestion/carga-masiva');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('Carga masiva');
  });
});
