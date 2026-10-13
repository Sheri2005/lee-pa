import { TestBed } from '@angular/core/testing';
import { firstValueFrom, throwError } from 'rxjs';
import { AsignacionDocenteService } from '../../../core/services/asignacion-docente.service';
import { AsignacionDocentesComponent } from './asignacion-docentes.component';

describe('AsignacionDocentesComponent', () => {
  async function crear(id = 3) {
    const fixture = TestBed.createComponent(AsignacionDocentesComponent);
    fixture.componentRef.setInput('planificacionId', id);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 250));
    fixture.detectChanges();
    return fixture;
  }

  it('presenta paralelos y estados sin mostrar paralelos de otras planificaciones', async () => {
    const fixture = await crear();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('tbody tr').length).toBe(3);
    expect(host.textContent).toContain('CONFIRMADO');
    expect(host.textContent).toContain('SUGERIDO');
    expect(host.textContent).toContain('SIN_ASIGNAR');
  });

  it('acepta la sugerencia una sola vez y emite después de confirmar', async () => {
    const fixture = await crear();
    const emitido = vi.fn();
    fixture.componentInstance.asignacionChange.subscribe(emitido);
    const estado = fixture.componentInstance.vista();
    if (estado.tipo !== 'listo') throw new Error('Falta el panel');
    fixture.componentInstance.aceptar(estado.panel.filas[1]);
    fixture.componentInstance.aceptar(estado.panel.filas[1]);
    expect(emitido).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(emitido).toHaveBeenCalledTimes(1);
    expect(emitido.mock.calls[0][0]).toMatchObject({
      planificacionId: 3,
      paraleloId: 2,
      estado: 'CONFIRMADO',
    });
  });

  it('muestra sobrecarga y deshabilita la confirmación manual', async () => {
    const fixture = await crear();
    const estado = fixture.componentInstance.vista();
    if (estado.tipo !== 'listo') throw new Error('Falta el panel');
    fixture.componentInstance.abrir(estado.panel.filas[0]);
    fixture.componentInstance.docenteManualId.set(24);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('quedaría sobrecargado');
    const confirmar = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Confirmar docente'),
    )!;
    expect(confirmar.disabled).toBe(true);
    fixture.componentInstance.confirmarManual();
    expect(TestBed.inject(AsignacionDocenteService).revision()).toBe(0);
  });

  it('permite reasignar manualmente y cierra el editor después de confirmar', async () => {
    const fixture = await crear();
    const estado = fixture.componentInstance.vista();
    if (estado.tipo !== 'listo') throw new Error('Falta el panel');
    fixture.componentInstance.abrir(estado.panel.filas[0]);
    fixture.componentInstance.docenteManualId.set(12);
    fixture.componentInstance.confirmarManual();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(fixture.componentInstance.paraleloActivo()).toBeNull();
    const panel = await firstValueFrom(TestBed.inject(AsignacionDocenteService).listar(3));
    expect(panel.filas[0].paralelo.docente?.id).toBe(12);
  });

  it('muestra error de guardado sin emitir éxito', async () => {
    const fixture = await crear();
    const s = TestBed.inject(AsignacionDocenteService);
    vi.spyOn(s, 'confirmar').mockReturnValue(throwError(() => new Error('No disponible')));
    const emitido = vi.fn();
    fixture.componentInstance.asignacionChange.subscribe(emitido);
    const estado = fixture.componentInstance.vista();
    if (estado.tipo !== 'listo') throw new Error('Falta el panel');
    fixture.componentInstance.aceptar(estado.panel.filas[1]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No disponible');
    expect(emitido).not.toHaveBeenCalled();
    expect(fixture.componentInstance.guardando()).toBe(false);
  });

  it('cancela un guardado pendiente al cambiar de planificación', async () => {
    const fixture = await crear();
    const emitido = vi.fn();
    fixture.componentInstance.asignacionChange.subscribe(emitido);
    const estado = fixture.componentInstance.vista();
    if (estado.tipo !== 'listo') throw new Error('Falta el panel');
    fixture.componentInstance.aceptar(estado.panel.filas[1]);
    fixture.componentRef.setInput('planificacionId', 2);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(TestBed.inject(AsignacionDocenteService).revision()).toBe(0);
    expect(emitido).not.toHaveBeenCalled();
  });

  it('muestra solo lectura en planificaciones aprobadas', async () => {
    const fixture = await crear(1);
    expect(fixture.nativeElement.textContent).toContain('solo lectura');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('distingue lista vacía y error de consulta', async () => {
    const fixture = await crear(2);
    expect(fixture.nativeElement.textContent).toContain('No hay paralelos');
    fixture.componentRef.setInput('planificacionId', 999);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 250));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar');
  });
});
