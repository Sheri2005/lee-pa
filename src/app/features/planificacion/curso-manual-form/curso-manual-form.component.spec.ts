import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { PlanificacionService } from '../../../core/services/planificacion.service';
import { PLANIFICACIONES_MOCK } from '../../../core/mocks/planificaciones.mock';
import { ContextoCursoManual, CursoManual } from '../../../core/models/curso-manual.model';
import { MateriaService } from '../../../shared/services/materia.service';
import { Materia } from '../../../shared/models/materia.model';
import { SelectorMateriaComponent } from '../../../shared/components/selector-materia/selector-materia';
import { CursoManualFormComponent } from './curso-manual-form.component';

describe('CursoManualFormComponent', () => {
  const materia: Materia = {
    id: 7,
    codigo: 'ARQ-110',
    nombre: 'Taller de Diseño I',
    carreraResponsableId: 7,
    carreraResponsable: 'Arquitectura',
    mallaIds: [5],
  };
  const planificacion = PLANIFICACIONES_MOCK.find((p) => p.id === 3)!;
  const curso: CursoManual = {
    id: 1,
    planificacionId: 3,
    materia,
    materiaId: 7,
    numeroParalelos: 2,
    motivo: 'Demanda',
    origen: 'MANUAL',
  };
  const contexto: ContextoCursoManual = { planificacion, cursosManuales: [] };
  const obtenerContextoCursoManual = vi.fn();
  const agregarCursoManual = vi.fn();

  beforeEach(() => {
    obtenerContextoCursoManual.mockReset().mockReturnValue(of(structuredClone(contexto)));
    agregarCursoManual.mockReset().mockReturnValue(of(structuredClone(curso)));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PlanificacionService,
          useValue: { obtenerContextoCursoManual, agregarCursoManual },
        },
        { provide: MateriaService, useValue: { listar: () => of([materia]) } },
      ],
    });
  });

  async function estabilizar(f: ReturnType<typeof TestBed.createComponent>) {
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
  }
  async function crear() {
    const f = TestBed.createComponent(CursoManualFormComponent);
    f.componentRef.setInput('planificacionId', 3);
    await estabilizar(f);
    return f;
  }
  function completar(c: CursoManualFormComponent) {
    c.seleccionarMateria(materia);
    c.form.patchValue({ numeroParalelos: 2, motivo: '  Demanda  ' });
  }

  it('abre el diálogo y conecta el selector real de G1 sin filtrar por malla', async () => {
    const f = await crear();
    expect(f.nativeElement.querySelector('dialog').hasAttribute('open')).toBe(true);
    const selector = f.debugElement.query(By.directive(SelectorMateriaComponent))
      .componentInstance as SelectorMateriaComponent;
    expect(selector.carreraResponsableId()).toBe(7);
    expect(selector.mallaId()).toBeUndefined();
    selector.materiaChange.emit(materia);
    await estabilizar(f);
    expect(f.componentInstance.form.controls.materiaId.value).toBe(7);
    expect(f.nativeElement.querySelector('app-selector-materia')).toBeNull();
    expect(f.nativeElement.textContent).toContain('Cambiar materia');
  });

  it('valida selección, enteros positivos y motivo no vacío', async () => {
    const f = await crear();
    const c = f.componentInstance;
    c.guardarCurso();
    expect(agregarCursoManual).not.toHaveBeenCalled();
    completar(c);
    await estabilizar(f);
    expect(c.puedeGuardar()).toBe(true);
    for (const n of [null, 0, -1, 1.5, Infinity]) {
      c.form.controls.numeroParalelos.setValue(n);
      await estabilizar(f);
      expect(c.puedeGuardar()).toBe(false);
    }
    c.form.controls.numeroParalelos.setValue(1);
    for (const motivo of ['', '   ', 'a'.repeat(501)]) {
      c.form.controls.motivo.setValue(motivo);
      await estabilizar(f);
      expect(c.puedeGuardar()).toBe(false);
    }
  });

  it('al cambiar materia borra el ID anterior y bloquea el guardado', async () => {
    const f = await crear();
    completar(f.componentInstance);
    await estabilizar(f);
    f.componentInstance.cambiarMateria();
    await estabilizar(f);
    expect(f.componentInstance.form.controls.materiaId.value).toBeNull();
    expect(f.componentInstance.puedeGuardar()).toBe(false);
    expect(f.nativeElement.querySelector('app-selector-materia')).not.toBeNull();
  });

  it('guarda una sola vez y emite solo al confirmar, bloqueando cancelar durante el envío', async () => {
    const pendiente = new Subject<CursoManual>();
    agregarCursoManual.mockReturnValue(pendiente);
    const f = await crear();
    completar(f.componentInstance);
    await estabilizar(f);
    const guardar = vi.fn();
    const cancelar = vi.fn();
    f.componentInstance.guardar.subscribe(guardar);
    f.componentInstance.cancelar.subscribe(cancelar);
    f.componentInstance.guardarCurso();
    f.componentInstance.guardarCurso();
    f.componentInstance.solicitarCancelacion();
    expect(agregarCursoManual).toHaveBeenCalledExactlyOnceWith(3, {
      materiaId: 7,
      numeroParalelos: 2,
      motivo: 'Demanda',
    });
    expect(guardar).not.toHaveBeenCalled();
    expect(cancelar).not.toHaveBeenCalled();
    pendiente.next(curso);
    pendiente.complete();
    await estabilizar(f);
    expect(guardar).toHaveBeenCalledExactlyOnceWith(curso);
    f.componentInstance.guardarCurso();
    expect(agregarCursoManual).toHaveBeenCalledTimes(1);
  });

  it('conserva los campos y permite reintentar un guardado fallido', async () => {
    agregarCursoManual.mockReturnValue(throwError(() => new Error('No disponible')));
    const f = await crear();
    completar(f.componentInstance);
    await estabilizar(f);
    const guardar = vi.fn();
    f.componentInstance.guardar.subscribe(guardar);
    f.componentInstance.guardarCurso();
    await estabilizar(f);
    expect(f.nativeElement.textContent).toContain('No disponible');
    expect(f.componentInstance.form.controls.numeroParalelos.value).toBe(2);
    expect(f.componentInstance.puedeGuardar()).toBe(true);
    expect(guardar).not.toHaveBeenCalled();
    agregarCursoManual.mockReturnValue(of(curso));
    f.componentInstance.guardarCurso();
    expect(guardar).toHaveBeenCalledOnce();
  });

  it('no guarda duplicadas ni permite selección de otra carrera', async () => {
    obtenerContextoCursoManual.mockReturnValue(of({ ...contexto, cursosManuales: [curso] }));
    const f = await crear();
    f.componentInstance.seleccionarMateria({ ...materia, carreraResponsableId: 5 });
    expect(f.componentInstance.seleccionada()).toBeNull();
    completar(f.componentInstance);
    await estabilizar(f);
    expect(f.componentInstance.duplicada()).toBe(true);
    expect(f.componentInstance.puedeGuardar()).toBe(false);
  });

  it('muestra error de carga con reintento y bloquea planificaciones aprobadas', async () => {
    obtenerContextoCursoManual.mockReturnValue(throwError(() => new Error('Error')));
    const f = await crear();
    expect(f.nativeElement.textContent).toContain('No se pudo cargar');
    obtenerContextoCursoManual.mockReturnValue(
      of({ ...contexto, planificacion: { ...planificacion, estado: 'APROBADA' } }),
    );
    f.componentInstance.reintentar();
    await estabilizar(f);
    expect(f.nativeElement.textContent).toContain('solo lectura');
    expect(f.nativeElement.querySelector('app-selector-materia')).toBeNull();
    expect(f.componentInstance.puedeGuardar()).toBe(false);
  });

  it('limpia el formulario y cancela un envío pendiente si cambia la planificación', async () => {
    const pendiente = new Subject<CursoManual>();
    agregarCursoManual.mockReturnValue(pendiente);
    const f = await crear();
    completar(f.componentInstance);
    await estabilizar(f);
    const guardar = vi.fn();
    f.componentInstance.guardar.subscribe(guardar);
    f.componentInstance.guardarCurso();
    obtenerContextoCursoManual.mockReturnValue(
      of({ ...contexto, planificacion: { ...planificacion, id: 9 } }),
    );
    f.componentRef.setInput('planificacionId', 9);
    await estabilizar(f);
    pendiente.next(curso);
    pendiente.complete();
    expect(guardar).not.toHaveBeenCalled();
    expect(f.componentInstance.seleccionada()).toBeNull();
    expect(f.componentInstance.form.controls.motivo.value).toBe('');
    expect(f.componentInstance.guardando()).toBe(false);
  });

  it('ignora una respuesta de contexto anterior y no habilita guardar durante el cambio', async () => {
    const anterior = new Subject<ContextoCursoManual>();
    obtenerContextoCursoManual.mockReturnValue(anterior);
    const f = await crear();
    obtenerContextoCursoManual.mockReturnValue(
      of({ ...contexto, planificacion: { ...planificacion, id: 8, estado: 'APROBADA' } }),
    );
    f.componentRef.setInput('planificacionId', 8);
    await estabilizar(f);
    anterior.next(contexto);
    anterior.complete();
    await estabilizar(f);
    expect(f.componentInstance.editable()).toBe(false);
  });

  it('Esc cancela una vez sin guardar', async () => {
    const f = await crear();
    const cancelar = vi.fn();
    f.componentInstance.cancelar.subscribe(cancelar);
    const evento = new Event('cancel', { cancelable: true });
    f.componentInstance.alPresionarEsc(evento);
    f.componentInstance.solicitarCancelacion();
    expect(evento.defaultPrevented).toBe(true);
    expect(cancelar).toHaveBeenCalledOnce();
    expect(agregarCursoManual).not.toHaveBeenCalled();
  });
});
