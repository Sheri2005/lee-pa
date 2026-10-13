import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { throwError } from 'rxjs';
import { Rol } from '../../models/rol.model';
import { RolService } from '../../services/rol.service';
import { SelectorRolComponent } from './selector-rol';

/** Formulario reactivo de prueba, como lo usaría el formulario de usuario (C1-11). */
@Component({
  imports: [ReactiveFormsModule, SelectorRolComponent],
  template: `
    <form [formGroup]="form">
      <app-selector-rol formControlName="rol" />
      <app-selector-rol formControlName="roles" [multiple]="true" etiqueta="Roles" />
    </form>
  `,
})
class FormularioPrueba {
  form = new FormGroup({
    rol: new FormControl<string | null>('Decano'),
    roles: new FormControl<string[]>(['Coordinador', 'Docente'], { nonNullable: true }),
  });
}

describe('SelectorRolComponent', () => {
  describe('solo (sin formulario)', () => {
    let fixture: ComponentFixture<SelectorRolComponent>;
    let el: HTMLElement;
    let emitidos: (Rol | Rol[])[];

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [SelectorRolComponent] }).compileComponents();
    });

    function crear(multiple = false) {
      fixture = TestBed.createComponent(SelectorRolComponent);
      fixture.componentRef.setInput('multiple', multiple);
      emitidos = [];
      fixture.componentInstance.rolChange.subscribe((r) => emitidos.push(r));
      fixture.detectChanges();
      el = fixture.nativeElement;
    }

    it('lista los 4 roles en una lista desplegable', () => {
      crear();
      const opciones = Array.from(el.querySelectorAll('option')).map((o) => o.textContent?.trim());
      expect(opciones).toEqual(['Selecciona un rol', 'Administrador', 'Coordinador', 'Decano', 'Docente']);
    });

    it('el label está asociado a la lista', () => {
      crear();
      expect(el.querySelector('label')?.getAttribute('for')).toBe(el.querySelector('select')?.id);
    });

    it('modo simple: emite el rol completo', () => {
      crear();
      const select = el.querySelector('select')!;
      select.value = 'Decano';
      select.dispatchEvent(new Event('change'));
      expect((emitidos[0] as Rol).id).toBe(3);
    });

    it('modo múltiple: casillas con leyenda y emite la lista en el orden de los roles', () => {
      crear(true);
      expect(el.querySelector('fieldset legend')?.textContent?.trim()).toBe('Rol');
      const casillas = el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      expect(casillas.length).toBe(4);

      casillas[3].click();
      casillas[1].click();
      expect((emitidos.at(-1) as Rol[]).map((r) => r.nombre)).toEqual(['Coordinador', 'Docente']);

      casillas[3].click();
      expect((emitidos.at(-1) as Rol[]).map((r) => r.nombre)).toEqual(['Coordinador']);
    });
  });

  describe('con formulario reactivo (ControlValueAccessor)', () => {
    let fixture: ComponentFixture<FormularioPrueba>;
    let el: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [FormularioPrueba] }).compileComponents();
      fixture = TestBed.createComponent(FormularioPrueba);
      fixture.detectChanges();
      el = fixture.nativeElement;
    });

    const select = () => el.querySelector('select')!;
    const casillas = () => Array.from(el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));

    it('muestra el valor inicial del formulario', () => {
      expect(select().value).toBe('Decano');
      expect(casillas().map((c) => c.checked)).toEqual([false, true, false, true]);
    });

    it('al elegir actualiza el control con el nombre del rol (como Usuario.roles)', () => {
      select().value = 'Administrador';
      select().dispatchEvent(new Event('change'));
      expect(fixture.componentInstance.form.value.rol).toBe('Administrador');
    });

    it('en modo múltiple el control recibe la lista de nombres', () => {
      casillas()[0].click();
      expect(fixture.componentInstance.form.value.roles).toEqual(['Administrador', 'Coordinador', 'Docente']);
    });

    it('si el formulario cambia el valor, el selector lo refleja', () => {
      fixture.componentInstance.form.setValue({ rol: 'Coordinador', roles: [] });
      fixture.detectChanges();
      expect(select().value).toBe('Coordinador');
      expect(casillas().every((c) => !c.checked)).toBe(true);
    });

    it('con valor null pide elegir un rol', () => {
      fixture.componentInstance.form.controls.rol.setValue(null);
      fixture.detectChanges();
      expect(select().selectedOptions[0].textContent?.trim()).toBe('Selecciona un rol');
    });

    it('marca el control como tocado al salir del campo', () => {
      expect(fixture.componentInstance.form.controls.rol.touched).toBe(false);
      select().dispatchEvent(new Event('blur'));
      expect(fixture.componentInstance.form.controls.rol.touched).toBe(true);
    });

    it('se deshabilita si el formulario lo deshabilita', () => {
      fixture.componentInstance.form.disable();
      fixture.detectChanges();
      expect(select().disabled).toBe(true);
      expect(el.querySelector('fieldset')?.disabled).toBe(true);
    });
  });

  describe('cuando el servicio falla', () => {
    it('muestra el error y deshabilita la lista', async () => {
      await TestBed.configureTestingModule({
        imports: [SelectorRolComponent],
        providers: [{ provide: RolService, useValue: { listar: () => throwError(() => new Error()) } }],
      }).compileComponents();
      const fixture = TestBed.createComponent(SelectorRolComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
      expect(el.querySelector('select')?.disabled).toBe(true);
    });
  });
});
