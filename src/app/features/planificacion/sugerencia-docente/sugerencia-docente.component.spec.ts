import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { PARALELOS_MOCK } from '../../../core/mocks/paralelos.mock';
import { SugerenciaDocente } from '../../../core/models/asignacion-docente.model';
import { AsignacionDocenteService } from '../../../core/services/asignacion-docente.service';
import { SugerenciaDocenteComponent } from './sugerencia-docente.component';

describe('SugerenciaDocenteComponent', () => {
  const obtenerCandidatos = vi.fn();
  let revision = signal(0);

  function datos(id = 1): SugerenciaDocente {
    return {
      paralelo: structuredClone(PARALELOS_MOCK.find((item) => item.id === id)!),
      candidatos: [
        {
          docente: { id: 12, nombres: 'Jorge Andrade', cargaMaxima: 24 },
          cargaSinParalelo: 8,
          cargaProyectada: 12,
        },
      ],
    };
  }

  beforeEach(() => {
    obtenerCandidatos.mockReset();
    revision = signal(0);
    TestBed.configureTestingModule({
      providers: [{ provide: AsignacionDocenteService, useValue: { obtenerCandidatos, revision } }],
    });
  });

  async function crear() {
    const fixture = TestBed.createComponent(SugerenciaDocenteComponent);
    fixture.componentRef.setInput('paraleloId', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra carga mientras espera la respuesta', async () => {
    obtenerCandidatos.mockReturnValue(new Subject<SugerenciaDocente>());
    const fixture = await crear();
    expect(fixture.nativeElement.textContent).toContain('Cargando candidatos');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('renueva candidatos al confirmar otra asignación, aunque el paralelo no cambie', async () => {
    obtenerCandidatos
      .mockReturnValueOnce(of(datos()))
      .mockReturnValueOnce(of({ ...datos(), candidatos: [] }));
    const fixture = await crear();
    expect(fixture.nativeElement.textContent).toContain('Jorge Andrade');
    revision.set(1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay docentes');
    expect(obtenerCandidatos).toHaveBeenCalledTimes(2);
  });

  it('reutiliza ambos hijos y emite el docente al elegirlo sin guardar una asignación', async () => {
    obtenerCandidatos.mockReturnValue(of(datos()));
    const fixture = await crear();
    const elegido = vi.fn();
    fixture.componentInstance.docenteElegido.subscribe(elegido);
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('app-indicador-carga-docente')?.textContent).toContain('12 / 24 h');
    expect(host.querySelector('app-justificacion-regla')?.textContent).toContain('Habilitado');
    host.querySelector<HTMLButtonElement>('button')!.click();
    expect(elegido).toHaveBeenCalledExactlyOnceWith(datos().candidatos[0].docente);
    fixture.componentInstance.elegir(999);
    expect(elegido).toHaveBeenCalledTimes(1);
  });

  it('muestra el estado vacío sin botones de selección', async () => {
    obtenerCandidatos.mockReturnValue(of({ ...datos(), candidatos: [] }));
    const fixture = await crear();
    expect(fixture.nativeElement.textContent).toContain('No hay docentes');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('permite reintentar después de un error', async () => {
    obtenerCandidatos
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValueOnce(of(datos()));
    const fixture = await crear();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Jorge Andrade');
    expect(obtenerCandidatos).toHaveBeenCalledTimes(2);
  });

  it('descarta respuestas del paralelo anterior cuando cambia la entrada', async () => {
    const anterior = new Subject<SugerenciaDocente>();
    const actual = new Subject<SugerenciaDocente>();
    obtenerCandidatos.mockReturnValueOnce(anterior).mockReturnValueOnce(actual);
    const fixture = await crear();
    fixture.componentRef.setInput('paraleloId', 2);
    fixture.detectChanges();
    await fixture.whenStable();
    anterior.next(datos());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Jorge Andrade');
    actual.next({ ...datos(2), candidatos: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay docentes');
    expect(obtenerCandidatos).toHaveBeenLastCalledWith(2);
  });

  it('impide elegir candidatos obsoletos antes de que llegue la nueva respuesta', async () => {
    obtenerCandidatos
      .mockReturnValueOnce(of(datos()))
      .mockReturnValueOnce(new Subject<SugerenciaDocente>());
    const fixture = await crear();
    const elegido = vi.fn();
    fixture.componentInstance.docenteElegido.subscribe(elegido);
    fixture.componentRef.setInput('paraleloId', 2);
    fixture.componentInstance.elegir(12);
    expect(elegido).not.toHaveBeenCalled();
  });
});
