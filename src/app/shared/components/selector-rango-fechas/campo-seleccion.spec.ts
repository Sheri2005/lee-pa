import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampoSeleccionComponent } from './campo-seleccion';

describe('CampoSeleccionComponent', () => {
  let fixture: ComponentFixture<CampoSeleccionComponent>;
  let raiz: HTMLElement;
  let valores: string[];

  const boton = () => raiz.querySelector<HTMLButtonElement>('button')!;
  const lista = () => raiz.querySelector('[role="listbox"]');
  const opcion = (valor: string) =>
    raiz.querySelector<HTMLElement>(`[role="option"][data-valor="${valor}"]`)!;
  const tecla = (elemento: Element, key: string) => {
    elemento.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampoSeleccionComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CampoSeleccionComponent);
    fixture.componentRef.setInput('idCampo', 'prueba');
    fixture.componentRef.setInput('vacio', 'Todos');
    fixture.componentRef.setInput('opciones', [
      { valor: 'AULA', etiqueta: 'Aula' },
      { valor: 'LABORATORIO', etiqueta: 'Laboratorio', detalle: 'Con computadoras' },
    ]);
    valores = [];
    fixture.componentInstance.valor.subscribe((v) => valores.push(v));
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('muestra la opción vacía y abre la lista con todas las opciones', () => {
    expect(boton().textContent).toContain('Todos');
    expect(lista()).toBeNull();

    boton().click();
    fixture.detectChanges();

    expect(boton().getAttribute('aria-expanded')).toBe('true');
    expect(raiz.querySelectorAll('[role="option"]')).toHaveLength(3);
    expect(opcion('LABORATORIO').textContent).toContain('Con computadoras');
  });

  it('elige una opción, la marca y cierra la lista', () => {
    boton().click();
    fixture.detectChanges();
    opcion('LABORATORIO').click();
    fixture.detectChanges();

    expect(valores).toEqual(['LABORATORIO']);
    expect(boton().textContent).toContain('Laboratorio');
    expect(lista()).toBeNull();

    boton().click();
    fixture.detectChanges();
    expect(opcion('LABORATORIO').getAttribute('aria-selected')).toBe('true');
  });

  it('se abre con la flecha abajo y se cierra con Escape sin elegir', () => {
    tecla(boton(), 'ArrowDown');
    expect(lista()).not.toBeNull();

    tecla(lista()!, 'Escape');
    expect(lista()).toBeNull();
    expect(valores).toEqual([]);
  });

  it('elige con Enter', () => {
    boton().click();
    fixture.detectChanges();
    tecla(opcion('AULA'), 'Enter');

    expect(valores).toEqual(['AULA']);
  });

  it('se cierra al hacer clic fuera', () => {
    boton().click();
    fixture.detectChanges();
    document.body.click();
    fixture.detectChanges();

    expect(lista()).toBeNull();
  });
});
