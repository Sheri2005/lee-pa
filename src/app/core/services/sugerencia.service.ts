import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { CriterioRegla } from '../../shared/components/app-justificacion-regla/criterio-regla.model';
import { CursoPlanificado } from '../models/curso-planificado.model';
import { Materia } from '../models/materia.model';
import {
  CursoSugerido,
  MateriaExcluida,
  ParametrosPlanificacion,
  SugerenciaCursos,
} from '../models/sugerencia.model';
import { SUGERENCIA_MOCK, SemillaCurso } from '../mocks/sugerencia.mock';
import { MAXIMO_PARALELOS } from './paralelo.service';

/**
 * Paralelos que proponen las reglas (HU G2-05): estudiantes estimados ÷ cupo máximo, redondeado
 * hacia arriba, siempre que se alcance el mínimo para abrir. Si no se alcanza, 0.
 */
export function calcularParalelosSugeridos(
  estudiantesEstimados: number,
  { cupoMaximo, minimoApertura }: ParametrosPlanificacion,
): number {
  if (estudiantesEstimados < minimoApertura) return 0;
  return Math.ceil(estudiantesEstimados / Math.max(cupoMaximo, 1));
}

/** Criterios con los que se explica la sugerencia, en el orden en que se muestran (C2-10). */
export function construirJustificacion(
  semilla: SemillaCurso,
  parametros: ParametrosPlanificacion,
  paralelos: number,
): CriterioRegla[] {
  const criterios: CriterioRegla[] = [];
  if (semilla.nivel !== null) {
    criterios.push({
      etiqueta: `Nivel ${semilla.nivel} de la malla vigente`,
      cumple: parametros.nivelesOfertados.includes(semilla.nivel),
    });
  } else {
    criterios.push({ etiqueta: 'Fuera de la malla vigente', valor: 'la carrera es responsable' });
  }
  criterios.push({
    etiqueta: `Mínimo para abrir: ${parametros.minimoApertura}`,
    cumple: semilla.estudiantesEstimados >= parametros.minimoApertura,
    valor: `${semilla.estudiantesEstimados} estimados`,
  });
  criterios.push({
    etiqueta: 'Paralelos sugeridos',
    valor:
      paralelos > 0
        ? `${semilla.estudiantesEstimados} ÷ cupo ${parametros.cupoMaximo} → ${paralelos}`
        : 'no alcanza el mínimo',
  });
  if (semilla.demandaHistorica !== null) {
    criterios.push({
      etiqueta: 'Demanda histórica',
      valor: `${semilla.demandaHistorica} estudiantes`,
    });
  }
  return criterios;
}

interface EstadoCursoInterno {
  curso: CursoPlanificado;
  paralelosDecididos: number;
}

interface EstadoPlanificacionInterno {
  estado: SugerenciaCursos['estado'];
  parametros: ParametrosPlanificacion;
  cursos: EstadoCursoInterno[];
  excluidas: MateriaExcluida[];
  agregables: Materia[];
}

/**
 * Sugerencia de cursos y paralelos (Módulo 2 · Grupo 2 · HU G2-05 y G2-06).
 *
 * Mientras no exista backend aplica las reglas en memoria sobre `SUGERENCIA_MOCK`, así que las
 * decisiones se mantienen durante la sesión. Cuando exista la API solo cambia el cuerpo de cada
 * método (las reglas corren en el servidor) y el componente no se toca.
 */
@Injectable({ providedIn: 'root' })
export class SugerenciaService {
  private cache: Record<number, EstadoPlanificacionInterno> = {};
  private siguienteId = 1000;

  /** Corre las reglas (si no se han corrido) y devuelve la sugerencia de la planificación. */
  obtenerSugerencia(planificacionId: number): Observable<SugerenciaCursos> {
    const interno = this.estadoDe(planificacionId);
    if (!interno) {
      return throwError(() => new Error(`Planificación ${planificacionId} no encontrada`));
    }
    return of(this.proyectar(planificacionId, interno)).pipe(delay(300));
  }

  /** Materias que todavía se pueden agregar a mano (HU G2-06). */
  materiasAgregables(planificacionId: number): Observable<Materia[]> {
    const interno = this.estadoDe(planificacionId);
    if (!interno) return of([]);
    const yaEstan = new Set(interno.cursos.map((c) => c.curso.materia.id));
    return of(interno.agregables.filter((m) => !yaEstan.has(m.id)).map((m) => ({ ...m }))).pipe(
      delay(150),
    );
  }

  /** Acepta la sugerencia de un curso: queda ACEPTADO y se va a aperturar. */
  aceptarCurso(planificacionId: number, cursoId: number): Observable<SugerenciaCursos> {
    return this.cambiar(planificacionId, cursoId, (item) => {
      item.curso.estado = 'ACEPTADO';
      if (item.paralelosDecididos === 0) item.paralelosDecididos = 1;
    });
  }

  /** Anula un curso: no se apertura en este período. */
  anularCurso(planificacionId: number, cursoId: number): Observable<SugerenciaCursos> {
    return this.cambiar(planificacionId, cursoId, (item) => {
      item.curso.estado = 'ANULADO';
    });
  }

  /** Vuelve a dejar un curso anulado como sugerido. */
  reactivarCurso(planificacionId: number, cursoId: number): Observable<SugerenciaCursos> {
    return this.cambiar(planificacionId, cursoId, (item) => {
      item.curso.estado = item.curso.origen === 'MANUAL' ? 'ACEPTADO' : 'SUGERIDO';
    });
  }

  /** Cambia con cuántos paralelos se apertura el curso (HU G2-06). */
  cambiarParalelos(
    planificacionId: number,
    cursoId: number,
    paralelos: number,
  ): Observable<SugerenciaCursos> {
    if (!Number.isInteger(paralelos) || paralelos < 1 || paralelos > MAXIMO_PARALELOS) {
      return throwError(
        () => new Error(`El número de paralelos debe estar entre 1 y ${MAXIMO_PARALELOS}`),
      );
    }
    return this.cambiar(planificacionId, cursoId, (item) => {
      item.paralelosDecididos = paralelos;
      if (item.curso.estado === 'SUGERIDO') item.curso.estado = 'ACEPTADO';
    });
  }

  /**
   * Agrega un curso que las reglas no sugirieron (HU G2-06). Queda con origen MANUAL y su
   * motivo pasa a ser parte de la justificación.
   */
  agregarCursoManual(
    planificacionId: number,
    materiaId: number,
    paralelos: number,
    motivo: string,
  ): Observable<SugerenciaCursos> {
    const interno = this.estadoDe(planificacionId);
    if (!interno) {
      return throwError(() => new Error(`Planificación ${planificacionId} no encontrada`));
    }
    if (interno.estado !== 'BORRADOR') {
      return throwError(
        () => new Error('La planificación ya no está en borrador: no se pueden agregar cursos.'),
      );
    }
    const materia = interno.agregables.find((m) => m.id === materiaId);
    if (!materia) {
      return throwError(() => new Error('Esa materia no está disponible para agregar'));
    }
    if (interno.cursos.some((c) => c.curso.materia.id === materiaId)) {
      return throwError(() => new Error(`${materia.codigo} ya está en la planificación`));
    }
    if (!Number.isInteger(paralelos) || paralelos < 1 || paralelos > MAXIMO_PARALELOS) {
      return throwError(
        () => new Error(`El número de paralelos debe estar entre 1 y ${MAXIMO_PARALELOS}`),
      );
    }
    const texto = motivo.trim();
    if (!texto) {
      return throwError(() => new Error('Escribe el motivo por el que agregas este curso'));
    }
    interno.cursos.push({
      curso: {
        id: this.siguienteId++,
        planificacionId,
        materia: { id: materia.id, codigo: materia.codigo, nombre: materia.nombre },
        mallaMateriaId: null,
        nivel: null,
        origen: 'MANUAL',
        esCompartida: false,
        estado: 'ACEPTADO',
        justificacion: [
          { etiqueta: 'Agregado manualmente', valor: texto },
          { etiqueta: 'No salió de las reglas de sugerencia', cumple: false },
        ],
        horasSemanales: 4,
        estudiantesEstimados: 0,
        demandaHistorica: null,
        paralelosSugeridos: 0,
        cupoMaximo: interno.parametros.cupoMaximo,
        motivoManual: texto,
      },
      paralelosDecididos: paralelos,
    });
    return this.obtenerSugerencia(planificacionId);
  }

  private cambiar(
    planificacionId: number,
    cursoId: number,
    accion: (item: EstadoCursoInterno) => void,
  ): Observable<SugerenciaCursos> {
    const interno = this.estadoDe(planificacionId);
    if (!interno) {
      return throwError(() => new Error(`Planificación ${planificacionId} no encontrada`));
    }
    if (interno.estado !== 'BORRADOR') {
      return throwError(
        () =>
          new Error(
            'La planificación ya no está en borrador: los cambios en la sugerencia están cerrados.',
          ),
      );
    }
    const item = interno.cursos.find((c) => c.curso.id === cursoId);
    if (!item) {
      return throwError(() => new Error(`Curso ${cursoId} no encontrado`));
    }
    accion(item);
    return this.obtenerSugerencia(planificacionId);
  }

  /** Corre las reglas de la HU G2-05 la primera vez que se pide la planificación. */
  private estadoDe(planificacionId: number): EstadoPlanificacionInterno | null {
    if (this.cache[planificacionId]) return this.cache[planificacionId];
    const semilla = SUGERENCIA_MOCK[planificacionId];
    if (!semilla) return null;

    const cursos: EstadoCursoInterno[] = [];
    const excluidas: MateriaExcluida[] = [];

    for (const item of semilla.semillas) {
      // HU G2-08: una materia compartida la apertura su carrera responsable
      if (item.esCompartida) {
        excluidas.push({
          codigo: item.materia.codigo,
          nombre: item.materia.nombre,
          nivel: item.nivel,
          motivo: 'COMPARTIDA',
          carreraResponsable: item.materia.carreraResponsable,
        });
        continue;
      }
      // HU G2-05: solo se sugieren materias de los niveles ofertados
      if (item.nivel !== null && !semilla.parametros.nivelesOfertados.includes(item.nivel)) {
        excluidas.push({
          codigo: item.materia.codigo,
          nombre: item.materia.nombre,
          nivel: item.nivel,
          motivo: 'NIVEL_NO_OFERTADO',
        });
        continue;
      }
      const paralelos = calcularParalelosSugeridos(
        item.estudiantesEstimados,
        semilla.parametros,
      );
      cursos.push({
        curso: {
          id: this.siguienteId++,
          planificacionId,
          materia: {
            id: item.materia.id,
            codigo: item.materia.codigo,
            nombre: item.materia.nombre,
          },
          mallaMateriaId: item.mallaMateriaId,
          nivel: item.nivel,
          origen: 'SUGERIDO',
          esCompartida: false,
          estado: 'SUGERIDO',
          justificacion: construirJustificacion(item, semilla.parametros, paralelos),
          horasSemanales: item.horasSemanales,
          estudiantesEstimados: item.estudiantesEstimados,
          demandaHistorica: item.demandaHistorica,
          paralelosSugeridos: paralelos,
          cupoMaximo: semilla.parametros.cupoMaximo,
        },
        paralelosDecididos: paralelos,
      });
    }

    this.cache[planificacionId] = {
      estado: semilla.estado,
      parametros: { ...semilla.parametros },
      cursos,
      excluidas,
      agregables: semilla.agregables.map((m) => ({ ...m })),
    };
    return this.cache[planificacionId];
  }

  /** Copia defensiva: el componente no debe poder mutar el estado del servicio. */
  private proyectar(
    planificacionId: number,
    interno: EstadoPlanificacionInterno,
  ): SugerenciaCursos {
    const cursos: CursoSugerido[] = interno.cursos.map((item) => ({
      paralelosDecididos: item.paralelosDecididos,
      curso: {
        ...item.curso,
        materia: { ...item.curso.materia },
        justificacion: item.curso.justificacion.map((c) => ({ ...c })),
      },
    }));
    return {
      planificacionId,
      estado: interno.estado,
      parametros: { ...interno.parametros },
      cursos,
      excluidas: interno.excluidas.map((e) => ({ ...e })),
    };
  }
}
