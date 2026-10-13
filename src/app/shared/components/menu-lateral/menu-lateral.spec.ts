import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MenuConfigService } from '../../services/menu-config.service';
import { PermisosService } from '../../services/permisos.service';
import { MenuLateralComponent } from './menu-lateral';

@Component({ template: '' })
class Vacio {}

describe('MenuLateralComponent', () => {
  let config: MenuConfigService;
  let permisos: PermisosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuLateralComponent],
      providers: [
        provideRouter([
          { path: 'gestion/usuarios', component: Vacio },
          { path: 'gestion/carreras', component: Vacio },
          { path: 'horarios/espacios', component: Vacio },
        ]),
      ],
    }).compileComponents();

    config = TestBed.inject(MenuConfigService);
    permisos = TestBed.inject(PermisosService);

    config.registrar({
      id: 'gestion',
      etiqueta: 'Gestión',
      orden: 1,
      items: [
        {
          etiqueta: 'Usuarios',
          ruta: '/gestion/usuarios',
          icono: 'usuarios',
          permiso: 'usuario.ver',
        },
        {
          etiqueta: 'Carreras',
          ruta: '/gestion/carreras',
          icono: 'carreras',
          permiso: 'carrera.ver',
        },
      ],
    });
    config.registrar({
      id: 'horarios',
      etiqueta: 'Horarios',
      orden: 2,
      items: [
        {
          etiqueta: 'Espacios',
          ruta: '/horarios/espacios',
          icono: 'horarios',
          permiso: 'espacio.ver',
        },
      ],
    });
  });

  function crear(colapsado = false) {
    const fixture = TestBed.createComponent(MenuLateralComponent);
    fixture.componentRef.setInput('colapsado', colapsado);
    fixture.detectChanges();
    return fixture;
  }

  const textos = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('a')).map((a) => a.textContent?.trim());

  it('muestra solo las opciones a las que el rol tiene acceso', () => {
    permisos.establecer(['usuario.ver']);
    const el: HTMLElement = crear().nativeElement;
    expect(textos(el)).toEqual(['Usuarios']);
  });

  it('oculta los grupos que quedan sin opciones', () => {
    permisos.establecer(['usuario.ver']);
    const el: HTMLElement = crear().nativeElement;
    const titulos = Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(titulos).toEqual(['Gestión']);
  });

  it('muestra todos los grupos en orden cuando hay todos los permisos', () => {
    permisos.establecer(['usuario.ver', 'carrera.ver', 'espacio.ver']);
    const el: HTMLElement = crear().nativeElement;
    expect(textos(el)).toEqual(['Usuarios', 'Carreras', 'Espacios']);
  });

  it('no muestra nada sin permisos', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.querySelectorAll('a').length).toBe(0);
  });

  it('una opción sin permiso requerido es visible para todos', () => {
    config.registrar({
      id: 'comun',
      etiqueta: 'Común',
      orden: 0,
      items: [{ etiqueta: 'Inicio', ruta: '/gestion/usuarios', icono: 'inicio' }],
    });
    const el: HTMLElement = crear().nativeElement;
    expect(textos(el)).toEqual(['Inicio']);
  });

  it('resalta la opción activa', async () => {
    permisos.establecer(['usuario.ver', 'carrera.ver']);
    const fixture = crear();
    const router = TestBed.inject((await import('@angular/router')).Router);
    await router.navigateByUrl('/gestion/carreras');
    fixture.detectChanges();
    const activos = fixture.nativeElement.querySelectorAll('a[aria-current="page"]');
    expect(activos.length).toBe(1);
    expect(activos[0].textContent.trim()).toBe('Carreras');
  });

  it('emite navegar con la ruta al hacer clic', () => {
    permisos.establecer(['usuario.ver']);
    const fixture = crear();
    const emitidas: string[] = [];
    fixture.componentInstance.navegar.subscribe((r) => emitidas.push(r));
    fixture.nativeElement.querySelector('a').click();
    expect(emitidas).toEqual(['/gestion/usuarios']);
  });

  it('en modo colapsado oculta las etiquetas visualmente pero las deja para lectores de pantalla', () => {
    permisos.establecer(['usuario.ver']);
    const el: HTMLElement = crear(true).nativeElement;
    const enlace = el.querySelector('a')!;
    expect(enlace.getAttribute('title')).toBe('Usuarios');
    expect(enlace.querySelector('span')!.classList.contains('sr-only')).toBe(true);
  });
});
