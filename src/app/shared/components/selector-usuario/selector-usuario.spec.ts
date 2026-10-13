import { ComponentFixture, TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { SelectorUsuarioComponent } from './selector-usuario';

describe('SelectorUsuarioComponent', () => {
  let fixture: ComponentFixture<SelectorUsuarioComponent>;
  let el: HTMLElement;
  let emitidos: Usuario[];

  function crear(entradas: { rol?: string; usuarioId?: number | null; etiqueta?: string } = {}) {
    fixture = TestBed.createComponent(SelectorUsuarioComponent);
    for (const [nombre, valor] of Object.entries(entradas)) fixture.componentRef.setInput(nombre, valor);
    emitidos = [];
    fixture.componentInstance.usuarioChange.subscribe((u) => emitidos.push(u));
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  const campo = () => el.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  const opciones = () =>
    Array.from(el.querySelectorAll('[role="option"]')).map((o) => o.textContent?.replace(/\s+/g, ' ').trim());

  function escribir(texto: string) {
    campo().value = texto;
    campo().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function tecla(key: string) {
    campo().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  }

  describe('con el servicio de prueba', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [SelectorUsuarioComponent] }).compileComponents();
    });

    it('el label está asociado al campo y usa la etiqueta recibida', () => {
      crear({ etiqueta: 'Decano' });
      const label = el.querySelector('label')!;
      expect(label.textContent?.trim()).toBe('Decano');
      expect(label.getAttribute('for')).toBe(campo().id);
    });

    it('la lista está cerrada hasta que el usuario escribe', () => {
      crear();
      expect(el.querySelector('[role="listbox"]')).toBeNull();
      expect(campo().getAttribute('aria-expanded')).toBe('false');
    });

    it('sugiere por nombre sin distinguir tildes ni mayúsculas', () => {
      crear();
      escribir('PENAFIEL');
      expect(opciones()).toEqual(['Lucía Peñafiel · lpenafiel']);
      expect(campo().getAttribute('aria-expanded')).toBe('true');
    });

    it('sugiere también por username', () => {
      crear();
      escribir('dmun');
      expect(opciones()).toEqual(['Diego Muñoz · dmunoz']);
    });

    it('con rol muestra solo usuarios de ese rol', () => {
      crear({ rol: 'Decano' });
      escribir('a');
      expect(opciones()).not.toContain('Paola Acosta · pacosta');
      expect(opciones()).toContain('Carolina Vélez · cvelez');
    });

    it('no ofrece usuarios inactivos', () => {
      crear();
      escribir('salazar');
      expect(opciones()).toEqual([]);
      expect(el.querySelector('[role="listbox"]')?.textContent).toContain('No hay usuarios que coincidan');
    });

    it('muestra como máximo 8 sugerencias', () => {
      crear();
      escribir('');
      campo().dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      expect(opciones().length).toBe(8);
    });

    it('al hacer clic en una sugerencia la elige y la emite', () => {
      crear();
      escribir('ortiz');
      el.querySelector('[role="option"]')!.dispatchEvent(new MouseEvent('mousedown', { cancelable: true }));
      fixture.detectChanges();

      expect(emitidos.map((u) => u.id)).toEqual([10]);
      expect(campo().value).toBe('María Fernanda Ortiz');
      expect(el.querySelector('[role="listbox"]')).toBeNull();
    });

    it('con el teclado: flechas para moverse y Enter para elegir', () => {
      crear({ rol: 'Coordinador' });
      escribir('');
      tecla('ArrowDown');
      expect(campo().getAttribute('aria-activedescendant')).toBe(`${campo().id}-op-21`);
      tecla('ArrowUp');
      expect(campo().getAttribute('aria-activedescendant')).toBe(`${campo().id}-op-20`);
      tecla('Enter');
      expect(emitidos.map((u) => u.username)).toEqual(['dmunoz']);
    });

    it('Escape cierra la lista sin elegir', () => {
      crear();
      escribir('ortiz');
      tecla('Escape');
      expect(el.querySelector('[role="listbox"]')).toBeNull();
      expect(emitidos).toEqual([]);
    });

    it('al salir del campo vuelve a mostrar el usuario elegido', () => {
      crear({ usuarioId: 11 });
      escribir('algo a medias');
      campo().dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(campo().value).toBe('Andrés Benítez');
    });

    it('preselecciona usuarioId sin emitir', () => {
      crear({ usuarioId: 12 });
      expect(campo().value).toBe('Lucía Peñafiel');
      expect(emitidos).toEqual([]);
    });

    it('sigue a usuarioId cuando el padre lo cambia', () => {
      crear({ usuarioId: 10 });
      fixture.componentRef.setInput('usuarioId', 13);
      fixture.detectChanges();
      expect(campo().value).toBe('Jorge Ramírez');
    });

    it('cada selector tiene ids distintos', () => {
      crear();
      const primero = campo().id;
      crear();
      expect(campo().id).not.toBe(primero);
    });
  });

  describe('cuando el servicio falla', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SelectorUsuarioComponent],
        providers: [{ provide: UsuarioService, useValue: { listar: () => throwError(() => new Error()) } }],
      }).compileComponents();
    });

    it('muestra el error y deshabilita el campo', () => {
      crear();
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
      expect(campo().disabled).toBe(true);
    });
  });
});
