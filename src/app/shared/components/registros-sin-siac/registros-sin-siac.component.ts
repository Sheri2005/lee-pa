import { Component, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { EntidadSiac, RegistroSinSiac } from '../../../core/models/registro-sin-siac';
import { SiacService } from '../../../core/services/siac.service';

type EstadoCarga =
  { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; registros: RegistroSinSiac[] };

interface GrupoEntidad {
  entidad: EntidadSiac;
  titulo: string;
  registros: RegistroSinSiac[];
}

const TITULOS: Record<EntidadSiac, string> = {
  materia: 'Materias',
  periodo: 'Períodos',
  carrera: 'Carreras',
  docente: 'Docentes',
};

const ORDEN: EntidadSiac[] = ['periodo', 'carrera', 'materia', 'docente'];

@Component({
  selector: 'app-registros-sin-siac',
  templateUrl: './registros-sin-siac.component.html',
})
export class RegistrosSinSiacComponent {
  private readonly siacService = inject(SiacService);

  readonly planificacionId = input<number>();
  readonly irARegistro = output<{ entidad: EntidadSiac; id: number }>();

  protected readonly estado = toSignal(
    toObservable(this.planificacionId).pipe(
      switchMap((id) =>
        this.siacService.registrosSinCodigo(id).pipe(
          map((registros): EstadoCarga => ({ tipo: 'listo', registros })),
          catchError(() => of<EstadoCarga>({ tipo: 'error' })),
          startWith<EstadoCarga>({ tipo: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando' } as EstadoCarga },
  );

  protected readonly grupos = computed<GrupoEntidad[]>(() => {
    const estado = this.estado();
    if (estado.tipo !== 'listo') {
      return [];
    }

    return ORDEN.map((entidad) => ({
      entidad,
      titulo: TITULOS[entidad],
      registros: estado.registros.filter((r) => r.entidad === entidad),
    })).filter((grupo) => grupo.registros.length > 0);
  });

  protected readonly total = computed(() =>
    this.grupos().reduce((suma, grupo) => suma + grupo.registros.length, 0),
  );

  protected completar(registro: RegistroSinSiac): void {
    this.irARegistro.emit({ entidad: registro.entidad, id: registro.id });
  }
}