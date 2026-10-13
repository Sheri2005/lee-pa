import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarraSuperiorComponent } from './barra-superior';

describe('BarraSuperiorComponent', () => {
  let component: BarraSuperiorComponent;
  let fixture: ComponentFixture<BarraSuperiorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarraSuperiorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarraSuperiorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el nombre del sistema', () => {
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.textContent).toContain('Sistema Universitario');
  });

  it('debe emitir el evento alternarMenu', () => {
    let emitido = false;

    component.alternarMenu.subscribe(() => {
      emitido = true;
    });

    component.toggleMenu();

    expect(emitido).toBe(true);
  });
});