import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { routes } from '../../../app.routes';
import { DatosFacultad, Facultad } from '../../../shared/models/facultad.model';
import { FacultadService } from '../../../shared/services/facultad.service';
import { FacultadesListaComponent } from './facultades-lista';

describe('FacultadesListaComponent', () => {
  let fixture: ComponentFixture<FacultadesListaComponent>;
  let el: HTMLElement;

  function crear(): void {
    fixture = TestBed.createComponent(FacultadesListaComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  const filas = () => Array.from(el.querySelectorAll('tbody tr'));
  const textoFilas = () => filas().map((f) => f.textContent ?? '');
  const boton = (nombre: string) =>
    el.querySelector<HTMLButtonElement>(`button[aria-label="${nombre}"]`)!;
  const botonPorTexto = (texto: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto)!;

  function buscar(texto: string): void {
    const input = el.querySelector<HTMLInputElement>('#buscar-facultad')!;
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  /** Espera a que se resuelva la promesa de confirmación. */
  const esperar = () => new Promise((r) => setTimeout(r));

  const datos = (cambios: Partial<DatosFacultad> = {}): DatosFacultad => ({
    codigo: 'FARQ',
    nombre: 'Facultad de Arquitectura',
    decanoUsuarioId: null,
    decanoNombre: null,
    codigoSiac: null,
    estado: 'A',
    ...cambios,
  });

  describe('con el servicio de prueba', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [FacultadesListaComponent] }).compileComponents();
      crear();
    });

    it('muestra el título y todas las facultades', () => {
      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Facultades');
      expect(filas().length).toBe(5);
    });

    it('muestra el estado A como Activa e I como Inactiva', () => {
      const derecho = textoFilas().find((t) => t.includes('Derecho'))!;
      const ingenieria = textoFilas().find((t) => t.includes('Ingeniería'))!;
      expect(derecho).toContain('Inactiva');
      expect(ingenieria).toContain('Activa');
    });

    it('muestra "Sin asignar" cuando no hay decano', () => {
      expect(textoFilas().find((t) => t.includes('Comunicación'))).toContain('Sin asignar');
    });

    it('busca sin distinguir tildes ni mayúsculas', () => {
      buscar('INGENIERIA');
      expect(filas().length).toBe(1);
      expect(textoFilas()[0]).toContain('Facultad de Ingeniería');
    });

    it('busca también por decano y por código SIAC', () => {
      buscar('peñafiel');
      expect(textoFilas()[0]).toContain('Ciencias de la Salud');
      buscar('siac-fce');
      expect(textoFilas()[0]).toContain('Ciencias Económicas');
    });

    it('muestra un mensaje cuando la búsqueda no encuentra nada', () => {
      buscar('zzz');
      expect(filas().length).toBe(1);
      expect(el.querySelector('tbody')?.textContent).toContain('No hay facultades que coincidan');
    });

    it('la tabla tiene caption y cada acción un aria-label con el nombre', () => {
      expect(el.querySelector('caption')?.textContent?.trim()).toBe('Listado de facultades');
      expect(boton('Editar Facultad de Ingeniería')).toBeTruthy();
      expect(boton('Desactivar Facultad de Ingeniería')).toBeTruthy();
      expect(boton('Reactivar Facultad de Derecho')).toBeTruthy();
    });

    it('el buscador tiene su label', () => {
      expect(el.querySelector('label[for="buscar-facultad"]')).toBeTruthy();
    });

    it('al cancelar la confirmación no desactiva', async () => {
      boton('Desactivar Facultad de Ingeniería').click();
      fixture.detectChanges();
      expect(el.querySelector('[role="alertdialog"]')?.textContent).toContain('Desactivar facultad');

      botonPorTexto('Cancelar').click();
      await esperar();
      fixture.detectChanges();
      expect(el.querySelector('[role="alertdialog"]')).toBeNull();
      expect(textoFilas().find((t) => t.includes('Ingeniería'))).toContain('Activa');
    });

    it('al confirmar desactiva y avisa', async () => {
      boton('Desactivar Facultad de Ingeniería').click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('[role="alertdialog"] button:last-child')!.click();
      await esperar();
      fixture.detectChanges();

      expect(textoFilas().find((t) => t.includes('Ingeniería'))).toContain('Inactiva');
      expect(el.querySelector('[aria-live]')?.textContent).toContain('quedó inactiva');
      expect(boton('Reactivar Facultad de Ingeniería')).toBeTruthy();
    });

    it('reactiva una facultad inactiva', async () => {
      boton('Reactivar Facultad de Derecho').click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('[role="alertdialog"] button:last-child')!.click();
      await esperar();
      fixture.detectChanges();
      expect(textoFilas().find((t) => t.includes('Derecho'))).toContain('Activa');
    });

    it('"Nueva facultad" abre el panel del formulario y Cancelar lo cierra', () => {
      botonPorTexto('Nueva facultad').click();
      fixture.detectChanges();
      expect(el.querySelector('#form-facultad-titulo')?.textContent?.trim()).toBe('Nueva facultad');

      botonPorTexto('Cancelar').click();
      fixture.detectChanges();
      expect(el.querySelector('#form-facultad-titulo')).toBeNull();
    });

    it('Editar abre el panel con el nombre de la facultad', () => {
      boton('Editar Facultad de Ingeniería').click();
      fixture.detectChanges();
      expect(el.querySelector('#form-facultad-titulo')?.textContent).toContain('Editar Facultad de Ingeniería');
    });

    it('alGuardar crea cuando el formulario se abrió con "Nueva facultad"', () => {
      botonPorTexto('Nueva facultad').click();
      fixture.componentInstance.alGuardar(datos());
      fixture.detectChanges();

      expect(filas().length).toBe(6);
      expect(el.querySelector('#form-facultad-titulo')).toBeNull();
      expect(el.querySelector('[aria-live]')?.textContent).toContain('Se creó Facultad de Arquitectura');
    });

    it('alGuardar actualiza cuando se está editando', () => {
      boton('Editar Facultad de Comunicación').click();
      fixture.componentInstance.alGuardar(
        datos({ codigo: 'FCOM', nombre: 'Facultad de Comunicación Social', codigoSiac: 'SIAC-FCOM' }),
      );
      fixture.detectChanges();

      expect(filas().length).toBe(5);
      expect(el.textContent).toContain('Facultad de Comunicación Social');
    });

    it('alGuardar muestra el error y deja el formulario abierto si el código se repite', () => {
      botonPorTexto('Nueva facultad').click();
      fixture.componentInstance.alGuardar(datos({ codigo: 'FI' }));
      fixture.detectChanges();

      expect(el.querySelector('[aria-live]')?.textContent).toContain('Ya existe una facultad con el código FI');
      expect(el.querySelector('#form-facultad-titulo')).not.toBeNull();
    });
  });

  describe('cuando el servicio falla', () => {
    let falla: boolean;

    beforeEach(async () => {
      falla = true;
      const lista: Facultad[] = [];
      await TestBed.configureTestingModule({
        imports: [FacultadesListaComponent],
        providers: [
          {
            provide: FacultadService,
            useValue: {
              listar: (): Observable<Facultad[]> =>
                falla ? throwError(() => new Error('sin red')) : of(lista),
            },
          },
        ],
      }).compileComponents();
      crear();
    });

    it('muestra el error y al reintentar carga la lista', () => {
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');

      falla = false;
      botonPorTexto('Reintentar').click();
      fixture.detectChanges();

      expect(el.querySelector('[role="alert"]')).toBeNull();
      expect(el.querySelector('tbody')?.textContent).toContain('Todavía no hay facultades registradas');
    });
  });

  describe('ruta', () => {
    it('/gestion/facultades muestra el listado', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/gestion/facultades');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('Facultades');
    });
  });
});
