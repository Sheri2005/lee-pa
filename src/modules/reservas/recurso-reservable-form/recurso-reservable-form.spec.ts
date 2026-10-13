import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DatosRecursoReservable,
  normalizarNombre,
  RecursoReservableFormComponent,
} from './recurso-reservable-form';

describe('RecursoReservableFormComponent (C4-17)', () => {
  let fixture: ComponentFixture<RecursoReservableFormComponent>;
  let raiz: HTMLElement;
  let guardados: DatosRecursoReservable[];
  let cancelaciones: number;

  const campo = (nombre: string) =>
    raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
  const interruptor = () => raiz.querySelector<HTMLButtonElement>('button[role="switch"]')!;
  const escribir = (nombre: string, valor: string) => {
    campo(nombre).value = valor;
    campo(nombre).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const enviar = () => {
    raiz.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecursoReservableFormComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RecursoReservableFormComponent);
    guardados = [];
    cancelaciones = 0;
    fixture.componentInstance.guardar.subscribe((datos) => guardados.push(datos));
    fixture.componentInstance.cancelar.subscribe(() => cancelaciones++);
    raiz = fixture.nativeElement;
  });

  it('en modo crear empieza con nombre vacío, cantidad 1 y activo', () => {
    fixture.detectChanges();

    expect(raiz.querySelector('h2')?.textContent).toContain('Nuevo recurso reservable');
    expect(campo('nombre').value).toBe('');
    expect(campo('cantidad').value).toBe('1');
    expect(interruptor().getAttribute('aria-checked')).toBe('true');
    expect(raiz.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true');
  });

  it('en modo editar precarga el recurso', () => {
    fixture.componentRef.setInput('recurso', {
      id: 7,
      nombre: 'Puntero laser',
      cantidad: 5,
      estado: false,
    });
    fixture.detectChanges();

    expect(raiz.querySelector('h2')?.textContent).toContain('Editar recurso reservable');
    expect(campo('nombre').value).toBe('Puntero laser');
    expect(campo('cantidad').value).toBe('5');
    expect(interruptor().getAttribute('aria-checked')).toBe('false');
  });

  it('permite volver de edición a creación cuando el padre limpia el recurso', () => {
    fixture.componentRef.setInput('recurso', {
      id: 7,
      nombre: 'Puntero laser',
      cantidad: 5,
      estado: false,
    });
    fixture.detectChanges();

    fixture.componentRef.setInput('recurso', null);
    fixture.detectChanges();

    expect(raiz.querySelector('h2')?.textContent).toContain('Nuevo recurso reservable');
    expect(campo('nombre').value).toBe('');
    expect(campo('cantidad').value).toBe('1');
    expect(interruptor().getAttribute('aria-checked')).toBe('true');
  });

  it('no guarda y muestra los errores si faltan datos', () => {
    fixture.detectChanges();
    expect(raiz.textContent).not.toContain('Escribe el nombre');

    escribir('cantidad', '0');
    enviar();

    expect(guardados).toEqual([]);
    expect(raiz.textContent).toContain('Escribe el nombre del recurso.');
    expect(raiz.textContent).toContain('entre 1 y 999');
    expect(campo('nombre').getAttribute('aria-invalid')).toBe('true');
  });

  it('rechaza cantidades decimales', () => {
    fixture.detectChanges();
    escribir('nombre', 'Laptop');
    escribir('cantidad', '2.5');
    enviar();

    expect(guardados).toEqual([]);
  });

  it('emite los datos limpios de un recurso nuevo, sin id', () => {
    fixture.detectChanges();
    escribir('nombre', '  Parlante   portatil ');
    escribir('cantidad', '3');
    enviar();

    expect(guardados).toEqual([{ nombre: 'Parlante portatil', cantidad: 3, estado: true }]);
  });

  it('al editar conserva el id y el cambio de estado', () => {
    fixture.componentRef.setInput('recurso', {
      id: 4,
      nombre: 'Laptop',
      cantidad: 8,
      estado: true,
    });
    fixture.detectChanges();
    escribir('cantidad', '10');
    interruptor().click();
    fixture.detectChanges();
    enviar();

    expect(guardados).toEqual([{ id: 4, nombre: 'Laptop', cantidad: 10, estado: false }]);
  });

  it('no permite repetir un nombre existente, salvo el del propio recurso', () => {
    fixture.componentRef.setInput('nombresExistentes', ['Laptop', 'Proyector móvil']);
    fixture.detectChanges();
    escribir('nombre', 'proyector movil');
    escribir('cantidad', '2');
    enviar();

    expect(guardados).toEqual([]);
    expect(raiz.textContent).toContain('Ya existe un recurso con ese nombre.');

    fixture.componentRef.setInput('recurso', {
      id: 4,
      nombre: 'Laptop',
      cantidad: 8,
      estado: true,
    });
    fixture.detectChanges();
    enviar();

    expect(guardados).toEqual([{ id: 4, nombre: 'Laptop', cantidad: 8, estado: true }]);
  });

  it('los botones − y + ajustan la cantidad entre 1 y 999', () => {
    fixture.detectChanges();
    const sumar = raiz.querySelector<HTMLButtonElement>('button[aria-label="Sumar una unidad"]')!;
    const restar = raiz.querySelector<HTMLButtonElement>('button[aria-label="Restar una unidad"]')!;

    expect(restar.disabled).toBe(true);

    sumar.click();
    sumar.click();
    fixture.detectChanges();
    expect(campo('cantidad').value).toBe('3');

    restar.click();
    restar.click();
    fixture.detectChanges();
    expect(campo('cantidad').value).toBe('1');
    expect(restar.disabled).toBe(true);
  });

  it('emite cancelar con el botón y con Escape', () => {
    fixture.detectChanges();
    [...raiz.querySelectorAll('button')].find((b) => b.textContent?.includes('Cancelar'))!.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancelaciones).toBe(2);
    expect(guardados).toEqual([]);
  });

  it('normaliza nombres sin tildes, mayúsculas ni espacios de más', () => {
    expect(normalizarNombre('  Cámara   para Video ')).toBe('camara para video');
  });

  it('exige al menos 3 caracteres en el nombre', () => {
    fixture.detectChanges();
    escribir('nombre', 'TV');
    escribir('cantidad', '2');
    enviar();

    expect(guardados).toEqual([]);
    expect(raiz.textContent).toContain('al menos 3 caracteres');
  });
});
