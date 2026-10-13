import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PERIODOS_MOCK } from '../../../shared/mocks/periodos.mock';
import { Periodo, PeriodoDatos } from '../../../shared/models/periodo.model';
import { PeriodoService } from '../../../shared/services/periodo.service';
import { PeriodoFormComponent } from './periodo-form';

describe('PeriodoFormComponent', () => {
  async function crear(periodo?: Periodo) {
    await TestBed.configureTestingModule({
      imports: [PeriodoFormComponent],
      providers: [{ provide: PeriodoService, useValue: { listar: () => of(PERIODOS_MOCK) } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(PeriodoFormComponent);
    const guardados: PeriodoDatos[] = [];
    let cancelados = 0;
    fixture.componentInstance.guardar.subscribe((d) => guardados.push(d));
    fixture.componentInstance.cancelar.subscribe(() => cancelados++);
    if (periodo) fixture.componentRef.setInput('periodo', periodo);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    const campo = (nombre: string) =>
      el.querySelector(`[formControlName="${nombre}"]`) as HTMLInputElement | HTMLSelectElement;

    const escribir = async (nombre: string, valor: string) => {
      const c = campo(nombre);
      c.value = valor;
      c.dispatchEvent(new Event(c.tagName === 'SELECT' ? 'change' : 'input'));
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
      await escribir('codigo', '2027-2');
      await escribir('nombre', 'Segundo período ordinario 2027');
      await escribir('fechaInicio', '2027-09-06');
      await escribir('fechaFin', '2028-01-14');
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
    for (const nombre of [
      'codigo',
      'nombre',
      'tipo',
      'fechaInicio',
      'fechaFin',
      'estado',
      'codigoSiac',
    ]) {
      expect(campo(nombre), nombre).not.toBeNull();
    }
  });

  it('para un período nuevo arranca vacío, ordinario y en planificación', async () => {
    const { el, campo } = await crear();
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Nuevo período');
    expect(campo('codigo').value).toBe('');
    expect(campo('tipo').value).toBe('ORDINARIO');
    expect(campo('estado').value).toBe('PLANIFICACION');
  });

  it('con un período carga sus datos para editarlo', async () => {
    const { el, campo } = await crear(PERIODOS_MOCK[1]);
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Editar período 2026-2');
    expect(campo('codigo').value).toBe('2026-2');
    expect(campo('nombre').value).toBe('Segundo período ordinario 2026');
    expect(campo('estado').value).toBe('ACTIVO');
    expect(campo('fechaInicio').value).toBe('2026-09-07');
    expect(campo('fechaFin').value).toBe('2027-01-15');
  });

  it('no guarda y marca los obligatorios si el formulario está vacío', async () => {
    const { enviar, errores, guardados } = await crear();
    await enviar();
    expect(guardados).toHaveLength(0);
    expect(errores()).toEqual([
      'El código es obligatorio.',
      'El nombre es obligatorio.',
      'La fecha de inicio es obligatoria.',
      'La fecha de fin es obligatoria.',
    ]);
  });

  it('exige que la fecha de fin sea posterior a la de inicio', async () => {
    const { escribir, enviar, errores, guardados, llenarValido } = await crear();
    await llenarValido();

    await escribir('fechaFin', '2027-09-06'); // mismo día
    await enviar();
    expect(errores()).toContain('La fecha de fin debe ser posterior a la de inicio.');
    expect(guardados).toHaveLength(0);

    await escribir('fechaFin', '2027-09-01'); // antes
    expect(errores()).toContain('La fecha de fin debe ser posterior a la de inicio.');

    await escribir('fechaFin', '2027-09-07'); // después
    expect(errores()).toHaveLength(0);
  });

  it('rechaza un código que ya existe', async () => {
    const { escribir, errores, enviar, guardados, llenarValido } = await crear();
    await llenarValido();
    await escribir('codigo', '2026-2');
    expect(errores()).toEqual(['Ya existe un período con ese código.']);
    await enviar();
    expect(guardados).toHaveLength(0);
  });

  it('al editar, el código del propio período no cuenta como repetido', async () => {
    const { enviar, errores, guardados } = await crear(PERIODOS_MOCK[1]);
    await enviar();
    expect(errores()).toHaveLength(0);
    expect(guardados).toHaveLength(1);
  });

  it('emite los datos sin id, recortados y con el SIAC vacío como undefined', async () => {
    const { escribir, enviar, guardados, llenarValido } = await crear();
    await llenarValido();
    await escribir('codigo', '  2027-2  ');
    await escribir('tipo', 'EXTRAORDINARIO');
    await escribir('estado', 'ACTIVO');
    await enviar();
    expect(guardados).toEqual([
      {
        codigo: '2027-2',
        nombre: 'Segundo período ordinario 2027',
        tipo: 'EXTRAORDINARIO',
        estado: 'ACTIVO',
        fechaInicio: '2027-09-06',
        fechaFin: '2028-01-14',
        codigoSiac: undefined,
      },
    ]);
  });

  it('incluye el código SIAC cuando se escribe', async () => {
    const { escribir, enviar, guardados, llenarValido } = await crear();
    await llenarValido();
    await escribir('codigoSiac', 'PER-2027-2');
    await enviar();
    expect(guardados[0].codigoSiac).toBe('PER-2027-2');
  });

  it('emite cancelar sin guardar', async () => {
    const { el, fixture, guardados, cancelados } = await crear();
    (el.querySelector('button[type="button"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(cancelados()).toBe(1);
    expect(guardados).toHaveLength(0);
  });
});
