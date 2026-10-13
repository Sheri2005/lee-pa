import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampoMultiseleccionComponent, normalizar } from './campo-multiseleccion';

describe('CampoMultiseleccionComponent', () => {
  let fixture: ComponentFixture<CampoMultiseleccionComponent>;
  let raiz: HTMLElement;
  let valores: string[][];

  const boton = () => raiz.querySelector<HTMLButtonElement>('button')!;
  const opcion = (valor: string) =>
    raiz.querySelector<HTMLElement>(`[role="option"][data-valor="${valor}"]`)!;
  const abrir = () => {
    boton().click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampoMultiseleccionComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CampoMultiseleccionComponent);
    fixture.componentRef.setInput('idCampo', 'prueba');
    fixture.componentRef.setInput('opciones', [
      { valor: '1', etiqueta: 'Proyector' },
      { valor: '2', etiqueta: 'Pizarra digital' },
      { valor: '3', etiqueta: 'Computadoras' },
      { valor: '4', etiqueta: 'Aire acondicionado' },
    ]);
    valores = [];
    fixture.componentInstance.valores.subscribe((v) => valores.push(v));
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('elige varias opciones sin cerrar la lista y las ordena', () => {
    abrir();
    opcion('3').click();
    fixture.detectChanges();
    opcion('1').click();
    fixture.detectChanges();

    expect(valores.at(-1)).toEqual(['1', '3']);
    expect(raiz.querySelector('[role="listbox"]')).not.toBeNull();
    expect(boton().textContent).toContain('Proyector, Computadoras');
  });

  it('resume en el botón cuando hay más de dos elegidas', () => {
    fixture.componentRef.setInput('valores', ['1', '2', '3', '4']);
    fixture.detectChanges();

    expect(boton().textContent).toContain('Proyector, Pizarra digital');
    expect(boton().textContent).toContain('+2');
  });

  it('filtra con el buscador sin importar tildes ni mayúsculas', () => {
    abrir();
    const buscador = raiz.querySelector<HTMLInputElement>('input[type="search"]')!;
    buscador.value = 'PIZARRA';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(raiz.querySelectorAll('[role="option"]')).toHaveLength(1);

    buscador.value = 'xyz';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Sin resultados');
  });

  it('quita todas las elegidas', () => {
    fixture.componentRef.setInput('valores', ['1', '2']);
    abrir();
    [...raiz.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Quitar todos'))!
      .click();
    fixture.detectChanges();

    expect(valores.at(-1)).toEqual([]);
    expect(boton().textContent).toContain('Cualquiera');
  });

  it('normaliza textos', () => {
    expect(normalizar('  Cámara ')).toBe('camara');
  });
});
