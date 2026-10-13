import { ComponentFixture, TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { Facultad } from '../../models/facultad.model';
import { FacultadService } from '../../services/facultad.service';
import { SelectorFacultadComponent } from './selector-facultad';

describe('SelectorFacultadComponent', () => {
  let fixture: ComponentFixture<SelectorFacultadComponent>;
  let emitidos: (Facultad | null)[];

  function crear(entradas: { permitirTodas?: boolean; facultadId?: number | null } = {}) {
    fixture = TestBed.createComponent(SelectorFacultadComponent);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    emitidos = [];
    fixture.componentInstance.facultadChange.subscribe((f) => emitidos.push(f));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const select = () => (fixture.nativeElement as HTMLElement).querySelector('select')!;
  const opciones = () => Array.from(select().options).map((o) => o.textContent?.trim());

  function elegir(valor: string): void {
    select().value = valor;
    select().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  describe('con el servicio de prueba', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [SelectorFacultadComponent] }).compileComponents();
    });

    it('lista solo las facultades activas', () => {
      crear();
      expect(opciones()).toContain('FI · Facultad de Ingeniería');
      expect(opciones().some((o) => o?.includes('Derecho'))).toBe(false);
    });

    it('sin permitirTodas pide elegir una facultad', () => {
      crear();
      expect(opciones()[0]).toBe('Selecciona una facultad');
      expect(opciones()).not.toContain('Todas');
      expect(select().value).toBe('');
    });

    it('con permitirTodas muestra "Todas" seleccionada', () => {
      crear({ permitirTodas: true });
      expect(opciones()[0]).toBe('Todas');
      expect(select().selectedOptions[0].textContent?.trim()).toBe('Todas');
    });

    it('emite la facultad completa al elegirla', () => {
      crear();
      elegir('2');
      expect(emitidos.length).toBe(1);
      expect(emitidos[0]?.codigo).toBe('FCE');
    });

    it('emite null al elegir "Todas"', () => {
      crear({ permitirTodas: true });
      elegir('1');
      elegir('');
      expect(emitidos.at(-1)).toBeNull();
    });

    it('no emite nada al cargar', () => {
      crear({ permitirTodas: true, facultadId: 1 });
      expect(emitidos).toEqual([]);
    });

    it('preselecciona la facultad de facultadId', () => {
      crear({ facultadId: 3 });
      expect(select().value).toBe('3');
    });

    it('si facultadId es de una facultad inactiva no la selecciona', () => {
      crear({ facultadId: 5 });
      expect(select().value).toBe('');
    });

    it('sigue a facultadId cuando el padre lo cambia', () => {
      crear({ facultadId: 1 });
      fixture.componentRef.setInput('facultadId', 2);
      fixture.detectChanges();
      expect(select().value).toBe('2');
    });

    it('el label está asociado al select', () => {
      const el = crear();
      expect(el.querySelector('label')?.getAttribute('for')).toBe(select().id);
    });

    it('cada selector tiene un id distinto', () => {
      crear();
      const primero = select().id;
      crear();
      expect(select().id).not.toBe(primero);
    });
  });

  describe('cuando el servicio falla', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SelectorFacultadComponent],
        providers: [{ provide: FacultadService, useValue: { listar: () => throwError(() => new Error()) } }],
      }).compileComponents();
    });

    it('muestra el error y deshabilita el selector', () => {
      const el = crear();
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
      expect(select().disabled).toBe(true);
    });
  });
});
