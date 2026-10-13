import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecursoReservableService } from '../../../app/core/services/recurso-reservable.service';
import { RecursosReservablesListaComponent } from './recursos-reservables-lista';

const RECURSOS = [
  { id: 1, nombre: 'Proyector móvil', cantidad: 5, estado: true },
  { id: 2, nombre: 'Micrófono', cantidad: 8, estado: false },
];
class ServicioFalso {
  listar() {
    return of(RECURSOS);
  }
  crear(datos: { nombre: string; cantidad: number; estado: boolean }) {
    return of({ id: 3, ...datos });
  }
  actualizar(recurso: unknown) {
    return of(recurso);
  }
  cambiarEstado() {
    return of(true);
  }
}

describe('RecursosReservablesListaComponent (C4-16)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecursosReservablesListaComponent],
      providers: [{ provide: RecursoReservableService, useClass: ServicioFalso }],
    }).compileComponents();
  });
  it('muestra el catálogo y sus estados', () => {
    const fixture = TestBed.createComponent(RecursosReservablesListaComponent);
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('Proyector móvil');
    expect(texto).toContain('Micrófono');
    expect(texto).toContain('Activo');
    expect(texto).toContain('Inactivo');
  });
  it('abre el formulario para crear y editar', () => {
    const fixture = TestBed.createComponent(RecursosReservablesListaComponent);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    [...raiz.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Nuevo recurso')!
      .click();
    fixture.detectChanges();
    expect(raiz.querySelector('app-recurso-reservable-form')).toBeTruthy();
    [...raiz.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Cancelar')!
      .click();
    fixture.detectChanges();
    [...raiz.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Editar')!
      .click();
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Editar recurso reservable');
  });
  it('actualiza el estado desde la lista', () => {
    const fixture = TestBed.createComponent(RecursosReservablesListaComponent);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    [...raiz.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Desactivar')!
      .click();
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Inactivo');
  });

  it('ordena activos primero, filtra por estado y busca sin importar mayúsculas ni tildes', () => {
    const fixture = TestBed.createComponent(RecursosReservablesListaComponent);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    const nombres = () =>
      [...raiz.querySelectorAll('tbody tr td:first-child')].map((td) => td.textContent?.trim());
    const pulsar = (texto: string) => {
      [...raiz.querySelectorAll<HTMLButtonElement>('button')]
        .find((b) => b.textContent?.trim() === texto)!
        .click();
      fixture.detectChanges();
    };

    expect(nombres()).toEqual(['Proyector móvil', 'Micrófono']);
    pulsar('Inactivos (1)');
    expect(nombres()).toEqual(['Micrófono']);
    pulsar('Todos (2)');

    const buscador = raiz.querySelector<HTMLInputElement>('input[name="buscar-recurso"]')!;
    buscador.value = 'MICROFONO';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(nombres()).toEqual(['Micrófono']);

    buscador.value = 'pizarra';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Ningún recurso coincide con «pizarra»');
  });

  it('avisa del cambio de estado y el recurso pasa al grupo de inactivos', () => {
    const fixture = TestBed.createComponent(RecursosReservablesListaComponent);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;

    raiz
      .querySelector<HTMLButtonElement>('button[aria-label="Desactivar Proyector móvil"]')!
      .click();
    fixture.detectChanges();

    expect(raiz.querySelector('[role="status"]')?.textContent).toContain(
      'Proyector móvil quedó inactivo.',
    );
    expect(raiz.textContent).toContain('Inactivos (2)');
  });
});
