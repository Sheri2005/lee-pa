import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MALLAS_MOCK } from '../../../shared/mocks/mallas.mock';
import { Malla, MallaDatos } from '../../../shared/models/malla.model';
import { MallaService } from '../../../shared/services/malla.service';
import { MallaFormComponent } from './malla-form';

describe('MallaFormComponent', () => {
  async function crear(malla?: Malla) {
    await TestBed.configureTestingModule({
      imports: [MallaFormComponent],
      providers: [{ provide: MallaService, useValue: { listar: () => of(MALLAS_MOCK) } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(MallaFormComponent);
    const guardados: MallaDatos[] = [];
    let cancelados = 0;
    fixture.componentInstance.guardar.subscribe((d) => guardados.push(d));
    fixture.componentInstance.cancelar.subscribe(() => cancelados++);
    if (malla) fixture.componentRef.setInput('malla', malla);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    const campo = (nombre: string) =>
      el.querySelector(`[formControlName="${nombre}"]`) as HTMLInputElement;

    const escribir = async (nombre: string, valor: string) => {
      const c = campo(nombre);
      c.value = valor;
      c.dispatchEvent(new Event('input'));
      c.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
    };
    const enviar = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    const errores = () =>
      Array.from(el.querySelectorAll('[role="alert"]')).map((e) => e.textContent?.trim());
    const llenarValido = async () => {
      await escribir('codigo', 'M-COMP-2027');
      await escribir('nombre', 'Malla 2027');
      await escribir('anioInicio', '2027');
    };
    return {
      fixture,
      el,
      campo,
      escribir,
      enviar,
      errores,
      llenarValido,
      guardados,
      cancelados: () => cancelados,
    };
  }

  it('muestra los campos de la ficha', async () => {
    const { campo } = await crear();
    for (const nombre of ['codigo', 'nombre', 'anioInicio']) {
      expect(campo(nombre), nombre).not.toBeNull();
    }
  });

  it('para una malla nueva arranca vacío', async () => {
    const { el, campo } = await crear();
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Nueva malla');
    expect(campo('codigo').value).toBe('');
    expect(campo('nombre').value).toBe('');
    expect(campo('anioInicio').value).toBe('');
  });

  it('con una malla carga sus datos para editarla', async () => {
    const { el, campo } = await crear(MALLAS_MOCK[0]);
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Editar malla M-COMP-2024');
    expect(campo('codigo').value).toBe('M-COMP-2024');
    expect(campo('nombre').value).toBe('Malla 2024');
    expect(campo('anioInicio').value).toBe('2024');
  });

  it('no guarda y marca los obligatorios si el formulario está vacío', async () => {
    const { enviar, errores, guardados } = await crear();
    await enviar();
    expect(guardados).toHaveLength(0);
    expect(errores()).toEqual([
      'El código es obligatorio.',
      'El año de vigencia es obligatorio.',
      'El nombre es obligatorio.',
    ]);
  });

  it('valida el año de vigencia: rango y número entero', async () => {
    const { escribir, errores } = await crear();

    await escribir('anioInicio', '1999');
    expect(errores()).toEqual(['Ingresa un año entre 2000 y 2100.']);

    await escribir('anioInicio', '2101');
    expect(errores()).toEqual(['Ingresa un año entre 2000 y 2100.']);

    await escribir('anioInicio', '2024.5');
    expect(errores()).toEqual(['El año debe ser un número entero.']);

    await escribir('anioInicio', '2024');
    expect(errores()).toHaveLength(0);
  });

  it('rechaza un código que ya existe', async () => {
    const { escribir, errores, enviar, guardados, llenarValido } = await crear();
    await llenarValido();
    await escribir('codigo', 'm-ind-2023');
    expect(errores()).toEqual(['Ya existe una malla con ese código.']);
    await enviar();
    expect(guardados).toHaveLength(0);
  });

  it('al editar, el código de la propia malla no cuenta como repetido', async () => {
    const { enviar, errores, guardados } = await crear(MALLAS_MOCK[0]);
    await enviar();
    expect(errores()).toHaveLength(0);
    expect(guardados).toHaveLength(1);
  });

  it('emite los datos sin id, recortados y con el año como número', async () => {
    const { escribir, enviar, guardados, llenarValido } = await crear();
    await llenarValido();
    await escribir('codigo', '  M-COMP-2027  ');
    await enviar();
    expect(guardados).toEqual([{ codigo: 'M-COMP-2027', nombre: 'Malla 2027', anioInicio: 2027 }]);
  });

  it('emite cancelar sin guardar', async () => {
    const { el, fixture, guardados, cancelados } = await crear();
    (el.querySelector('button[type="button"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(cancelados()).toBe(1);
    expect(guardados).toHaveLength(0);
  });
});