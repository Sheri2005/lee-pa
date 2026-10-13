import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { SiacService } from '../../core/services/siac.service';
import { ResumenPanel } from '../models/panel.model';
import { CarreraService } from './carrera.service';
import { DocenteService } from './docente.service';
import { FacultadService } from './facultad.service';
import { MallaService } from './malla.service';
import { PeriodoService } from './periodo.service';

/**
 * Indicadores del panel administrativo (C1-60).
 *
 * Hoy los calcula juntando los servicios de cada catálogo. Cuando exista backend, `resumen()`
 * pasa a ser una sola llamada (`GET /api/panel/resumen`) y el panel no cambia.
 */
@Injectable({ providedIn: 'root' })
export class PanelService {
  private readonly carreras = inject(CarreraService);
  private readonly facultades = inject(FacultadService);
  private readonly mallas = inject(MallaService);
  private readonly docentes = inject(DocenteService);
  private readonly periodos = inject(PeriodoService);
  private readonly siac = inject(SiacService);

  resumen(): Observable<ResumenPanel> {
    return forkJoin({
      carreras: this.carreras.listar({ soloActivas: true }),
      facultades: this.facultades.listar({ soloActivas: true }),
      mallas: this.mallas.listar(),
      docentes: this.docentes.listar(),
      periodos: this.periodos.listar(),
      // Los mismos registros que lista app-registros-sin-siac (C5-26, G5), para que el número cuadre.
      sinSiac: this.siac.registrosSinCodigo(),
    }).pipe(
      map(({ carreras, facultades, mallas, docentes, periodos, sinSiac }) => ({
        carrerasActivas: carreras.length,
        mallasVigentes: mallas.filter((m) => m.vigente).length,
        docentesRegistrados: docentes.length,
        periodosAbiertos: periodos.filter((p) => p.estado !== 'CERRADO').length,
        registrosSinSiac: sinSiac.length,
        carrerasPorFacultad: facultades
          .map((f) => ({ facultad: f.codigo, carreras: carreras.filter((c) => c.facultadId === f.id).length }))
          .sort((a, b) => a.facultad.localeCompare(b.facultad, 'es')),
      })),
    );
  }
}
