import { ComponentFixture, TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { Carrera } from '../../models/carrera.model';
import { CarreraService } from '../../services/carrera.service';
import { SelectorCarreraComponent } from './selector-carrera';

describe('SelectorCarreraComponent', () => {
  let fixture: ComponentFixture<SelectorCarreraComponent>;
  let emitidos: (Carrera | null)[];

  function crear(
    entradas: { facultadId?: number | null; soloMias?: boolean; permitirTodas?: boolean; carreraId?: number | null } = {},
  ) {
    fixture = TestBed.createComponent(SelectorCarreraComponent);
    for (const [nombre, valor] of Object.entries(entradas)) fixture.componentRef.setInput(nombre, valor);
    emitidos = [];
    fixture.componentInstance.carreraChange.subscribe((c) => emitidos.push(c));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const select = () => (fixture.nativeElement as HTMLElement).querySelector('select')!;
  const opciones = () => Array.from(select().options).map((o) => o.textContent?.trim());

  function elegir(valor: string) {
    select().value = valor;
    select().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  describe('con el servicio de prueba', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [SelectorCarreraComponent] }).compileComponents();
    });

    it('lista solo las carreras activas', () => {
      crear();
      expect(opciones()).toContain('ING-COMP · Ingeniería en Computación');
      expect(opciones().some((o) => o?.includes('Derecho'))).toBe(false);
    });

    it('sin permitirTodas pide elegir una carrera', () => {
      crear();
      expect(opciones()[0]).toBe('Selecciona una carrera');
      expect(select().value).toBe('');
    });

    it('con permitirTodas muestra "Todas" y la emite como null', () => {
      crear({ permitirTodas: true });
      expect(select().selectedOptions[0].textContent?.trim()).toBe('Todas');
      elegir('5');
      elegir('');
      expect(emitidos.at(-1)).toBeNull();
    });

    it('emite la carrera completa al elegirla', () => {
      crear();
      elegir('6');
      expect(emitidos.map((c) => c?.codigo)).toEqual(['ING-IND']);
    });

    it('filtra por facultad', () => {
      crear({ facultadId: 1 });
      expect(opciones().slice(1)).toEqual([
        'ING-COMP · Ingeniería en Computación',
        'ING-IND · Ingeniería Industrial',
        'ARQ · Arquitectura',
      ]);
    });

    it('al cambiar de facultad se vuelve a filtrar', () => {
      crear({ facultadId: 1 });
      fixture.componentRef.setInput('facultadId', 3);
      fixture.detectChanges();
      expect(opciones().slice(1)).toEqual(['ENF · Enfermería']);
    });

    it('si la carrera elegida no es de la nueva facultad, se deselecciona y avisa con null', () => {
      crear({ permitirTodas: true });
      elegir('5');
      fixture.componentRef.setInput('facultadId', 3);
      fixture.detectChanges();
      expect(select().value).toBe('');
      expect(emitidos.at(-1)).toBeNull();
    });

    it('soloMias muestra solo la carrera del coordinador actual (TEMPORAL: usuario 20)', () => {
      const el = crear({ soloMias: true });
      expect(opciones().slice(1)).toEqual(['ING-COMP · Ingeniería en Computación']);
      expect(el.textContent).not.toContain('No coordinas');
    });

    it('soloMias junto con otra facultad avisa que no coordina ninguna', () => {
      const el = crear({ soloMias: true, facultadId: 3 });
      expect(opciones().length).toBe(1);
      expect(el.textContent).toContain('No coordinas ninguna carrera activa');
    });

    it('preselecciona carreraId sin emitir', () => {
      crear({ carreraId: 7 });
      expect(select().value).toBe('7');
      expect(emitidos).toEqual([]);
    });

    it('el label está asociado y cada selector tiene un id distinto', () => {
      const el = crear();
      expect(el.querySelector('label')?.getAttribute('for')).toBe(select().id);
      const primero = select().id;
      crear();
      expect(select().id).not.toBe(primero);
    });
  });

  describe('cuando el servicio falla', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SelectorCarreraComponent],
        providers: [{ provide: CarreraService, useValue: { listar: () => throwError(() => new Error()) } }],
      }).compileComponents();
    });

    it('muestra el error y deshabilita el selector', () => {
      const el = crear();
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
      expect(select().disabled).toBe(true);
    });
  });
});
