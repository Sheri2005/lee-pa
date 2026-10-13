import { MateriaService } from '../../shared/services/materia.service';
import {
    ContextoCursoManual, CursoManual, MAX_MOTIVO_CURSO_MANUAL, SolicitudCursoManual,
} from '../models/curso-manual.model';
import { Injectable, inject } from "@angular/core";
import { defer, delay, map, Observable, of, throwError } from "rxjs";
import { Planificacion } from "../models/planificacion.model";
import { ListadoMateriasAPlanificar } from "../models/materia-a-planificar.model";
import { PLANIFICACIONES_MOCK } from "../mocks/planificaciones.mock";
import { MATERIAS_A_PLANIFICAR_MOCK } from "../mocks/materias-a-planificar.mock";
import { MALLA_NIVELES_MOCK, PARAMETROS_MOCK, PARAMETROS_POR_DEFECTO } from "../mocks/parametros-planificacion.mock";
import { CarreraCatalogo, CatalogoNuevaPlanificacion, SolicitudNuevaPlanificacion } from "../models/nueva-planificacion.model";
import { NivelMalla, ParametrosPlanificacion } from "../models/parametros-planificacion.model";

@Injectable({ providedIn: 'root'})
export class PlanificacionService {
    private readonly materiaService = inject(MateriaService);
    /** C2-09: registros manuales de esta sesión; pendientes de unificar con C2-08. */
    private readonly cursosManuales = new Map<number, CursoManual[]>();
    private siguienteCursoManualId = 1;

    /** Parámetros guardados en esta sesión (mock). */
    private readonly parametros = new Map<number, ParametrosPlanificacion>();

    /** Lista planificaciones;  si se pasan estados, solo devuelve la de esos estaods. */
    /**Cuando exista backend, se cambia el cuerpo de listar por una llamada HTTP y el componente no se toca. */
    listar(estados?: string[]): Observable<Planificacion[]> {
        const datos = estados?.length
        ? PLANIFICACIONES_MOCK.filter(p => estados.includes(p.estado))
        : PLANIFICACIONES_MOCK;
        return of(datos).pipe(delay(300));
    }

    /**
     * Materias que entran en una planificación (HU G2-02): propias de la malla vigente,
     * propias fuera de la malla y compartidas. Con backend será una llamada HTTP.
     * Con el mock, un id que no existe falla (para probar el estado de error).
     */
    obtenerMateriasAPlanificar(planificacionId: number): Observable<ListadoMateriasAPlanificar> {
        const planificacion = PLANIFICACIONES_MOCK.find(p => p.id === planificacionId);
        const materias = MATERIAS_A_PLANIFICAR_MOCK[planificacionId];
        if (!planificacion || !materias) {
            return throwError(() => new Error(`Planificación ${planificacionId} no encontrada`));
        }
        return of({
            carreraId: planificacion.carrera.id,
            materias: materias.map(item => ({
                ...item,
                materia: { ...item.materia },
                carrerasQueLaUsan: [...item.carrerasQueLaUsan],
            })),
        }).pipe(delay(300));
    }

    /** Planificación por id (C2-03). Con el mock, un id inexistente falla para probar el estado de error. */
    obtenerPorId(id: number): Observable<Planificacion> {
        return defer(() => {
            const planificacion = PLANIFICACIONES_MOCK.find(p => p.id === id);
            return planificacion
                ? of(structuredClone(planificacion))
                : throwError(() => new Error(`Planificación ${id} no encontrada`));
        }).pipe(delay(300));
    }

    /**
     * Datos del diálogo "Nueva planificación" (C2-02): carreras con su facultad y malla vigente,
     * períodos y combinaciones carrera+período que ya existen.
     * EDITAR (G1): con los selectores de G1 (carrera, período, malla) solo hará falta `existentes`.
     */
    obtenerCatalogoNueva(): Observable<CatalogoNuevaPlanificacion> {
        return defer(() => {
            const carreras = new Map<number, CarreraCatalogo>();
            const periodos = new Map<number, Planificacion['periodo']>();
            for (const p of PLANIFICACIONES_MOCK) {
                const previa = carreras.get(p.carrera.id);
                // Malla vigente = la de mayor año de inicio entre las planificaciones de la carrera.
                if (!previa || p.malla.anioInicio > previa.malla.anioInicio) {
                    carreras.set(p.carrera.id, { ...p.carrera, facultad: { ...p.facultad }, malla: { ...p.malla } });
                }
                periodos.set(p.periodo.id, { ...p.periodo });
            }
            return of({
                carreras: [...carreras.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
                periodos: [...periodos.values()].sort((a, b) => b.codigo.localeCompare(a.codigo, 'es', { numeric: true })),
                existentes: PLANIFICACIONES_MOCK.map(p => ({ carreraId: p.carrera.id, periodoId: p.periodo.id })),
            });
        }).pipe(delay(300));
    }

    /**
     * Crea una planificación en BORRADOR (C2-02). Rechaza la combinación carrera+período repetida.
     * Mock: se agrega a PLANIFICACIONES_MOCK para que lista, detalle y asignación de docentes la
     * vean; se pierde al recargar la página.
     */
    crear(solicitud: SolicitudNuevaPlanificacion): Observable<Planificacion> {
        return defer(() => {
            const base = PLANIFICACIONES_MOCK.find(p => p.carrera.id === solicitud.carreraId);
            const periodo = PLANIFICACIONES_MOCK.find(p => p.periodo.id === solicitud.periodoId)?.periodo;
            if (!base || !periodo) {
                return throwError(() => new Error('La carrera o el período seleccionado no existe.'));
            }
            const duplicada = PLANIFICACIONES_MOCK.some(
                p => p.carrera.id === solicitud.carreraId && p.periodo.id === solicitud.periodoId,
            );
            if (duplicada) {
                return throwError(() => new Error('Ya existe una planificación para esa carrera y ese período.'));
            }
            const vigente = PLANIFICACIONES_MOCK
                .filter(p => p.carrera.id === solicitud.carreraId)
                .reduce((a, b) => (b.malla.anioInicio > a.malla.anioInicio ? b : a));
            const nueva: Planificacion = {
                id: Math.max(0, ...PLANIFICACIONES_MOCK.map(p => p.id)) + 1,
                carrera: { ...base.carrera },
                facultad: { ...base.facultad },
                periodo: { ...periodo },
                malla: { ...vigente.malla },
                estado: 'BORRADOR',
            };
            PLANIFICACIONES_MOCK.push(nueva);
            return of(structuredClone(nueva));
        }).pipe(delay(300));
    }

    /** Parámetros guardados de una planificación (C2-05); si no hay, devuelve los valores por defecto. */
    obtenerParametros(planificacionId: number): Observable<ParametrosPlanificacion> {
        return defer(() => {
            const guardados = this.parametros.get(planificacionId) ?? PARAMETROS_MOCK[planificacionId];
            return of(structuredClone(guardados ?? PARAMETROS_POR_DEFECTO));
        }).pipe(delay(300));
    }

    /** Guarda los parámetros (C2-05). El backend deberá repetir estas validaciones. */
    guardarParametros(planificacionId: number, parametros: ParametrosPlanificacion): Observable<ParametrosPlanificacion> {
        return defer(() => {
            const planificacion = PLANIFICACIONES_MOCK.find(p => p.id === planificacionId);
            if (!planificacion) return throwError(() => new Error('Planificación inexistente.'));
            if (!['BORRADOR', 'CON_CAMBIOS'].includes(planificacion.estado)) {
                return throwError(() => new Error('La planificación no admite cambios.'));
            }
            if (!parametros.nivelesOfertados.length) {
                return throwError(() => new Error('Selecciona al menos un nivel a ofertar.'));
            }
            if (!Number.isInteger(parametros.cupoMaximoParalelo) || parametros.cupoMaximoParalelo < 1) {
                return throwError(() => new Error('El cupo máximo debe ser un entero positivo.'));
            }
            if (
                !Number.isInteger(parametros.minimoEstudiantesAbrir) ||
                parametros.minimoEstudiantesAbrir < 1 ||
                parametros.minimoEstudiantesAbrir > parametros.cupoMaximoParalelo
            ) {
                return throwError(() => new Error('El mínimo para abrir debe estar entre 1 y el cupo máximo.'));
            }
            const copia = structuredClone(parametros);
            copia.nivelesOfertados = [...new Set(copia.nivelesOfertados)].sort((a, b) => a - b);
            this.parametros.set(planificacionId, copia);
            return of(structuredClone(copia));
        }).pipe(delay(300));
    }

    /**
     * Malla agrupada por niveles, para mostrar qué se ofertaría (C2-05).
     * EDITAR (G1): reemplazar por `app-malla-por-niveles`; este método deja de hacer falta.
     */
    obtenerMallaPorNiveles(mallaId: number): Observable<NivelMalla[]> {
        if (!Number.isSafeInteger(mallaId) || mallaId <= 0) {
            return throwError(() => new Error('Malla inválida.'));
        }
        return of(structuredClone(MALLA_NIVELES_MOCK)).pipe(delay(300));
    }

    /** Contexto del diálogo; valida el identificador y devuelve copias del estado mock. */
    obtenerContextoCursoManual(planificacionId: number): Observable<ContextoCursoManual> {
        return defer(() => {
            this.planificacionCursoManual(planificacionId);
            return this.obtenerPorId(planificacionId).pipe(map(planificacion => ({
                planificacion,
                cursosManuales: structuredClone(this.cursosManuales.get(planificacionId) ?? []),
            })));
        });
    }

    /**
     * C2-09: registra la excepción manual usando el catálogo real del servicio de G1.
     * Durante el prototipo ambos servicios usan memoria. No genera paralelos ni docentes.
     * Con backend, confirmar pertenencia, duplicados y estado en una transacción.
     */
    agregarCursoManual(planificacionId: number, solicitud: SolicitudCursoManual): Observable<CursoManual> {
        const datos = { ...solicitud };
        return defer(() => {
            const planificacion = this.planificacionCursoManual(planificacionId);
            this.validarCursoManual(planificacion, datos);
            // Sin mallaId: una carrera puede abrir materias propias fuera de su malla.
            return this.materiaService.listar({ carreraResponsableId: planificacion.carrera.id }).pipe(
                map(materias => {
                    // Revalidar al escribir: otra operación pudo guardar mientras llegaba el catálogo.
                    const actual = this.planificacionCursoManual(planificacionId);
                    this.validarCursoManual(actual, datos);
                    const materia = materias.find(m =>
                        m.id === datos.materiaId && m.carreraResponsableId === actual.carrera.id,
                    );
                    if (!materia) throw new Error('La materia no existe o no pertenece a la carrera responsable.');
                    const existentes = this.cursosManuales.get(planificacionId) ?? [];
                    if (existentes.some(c => c.materiaId === datos.materiaId)) {
                        throw new Error('Esta materia ya tiene un curso manual en la planificación.');
                    }
                    const curso: CursoManual = {
                        id: this.siguienteCursoManualId++,
                        planificacionId,
                        materiaId: materia.id,
                        numeroParalelos: datos.numeroParalelos,
                        motivo: datos.motivo.trim(),
                        origen: 'MANUAL',
                        materia: {
                            id: materia.id, codigo: materia.codigo, nombre: materia.nombre,
                            carreraResponsableId: materia.carreraResponsableId,
                            carreraResponsable: materia.carreraResponsable,
                        },
                    };
                    this.cursosManuales.set(planificacionId, [...existentes, curso]);
                    return structuredClone(curso);
                }),
            );
        });
    }

    private planificacionCursoManual(id: number): Planificacion {
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Planificación inválida.');
        const planificacion = PLANIFICACIONES_MOCK.find(p => p.id === id);
        if (!planificacion) throw new Error('Planificación inexistente.');
        return planificacion;
    }

    private validarCursoManual(planificacion: Planificacion, datos: SolicitudCursoManual): void {
        if (!['BORRADOR', 'CON_CAMBIOS'].includes(planificacion.estado)) {
            throw new Error('La planificación no admite cambios.');
        }
        if (!Number.isSafeInteger(datos.materiaId) || datos.materiaId <= 0) {
            throw new Error('Selecciona una materia válida.');
        }
        if (!Number.isSafeInteger(datos.numeroParalelos) || datos.numeroParalelos < 1) {
            throw new Error('El número de paralelos debe ser un entero positivo.');
        }
        if (typeof datos.motivo !== 'string' || !datos.motivo.trim() || datos.motivo.length > MAX_MOTIVO_CURSO_MANUAL) {
            throw new Error(`El motivo es obligatorio y admite hasta ${MAX_MOTIVO_CURSO_MANUAL} caracteres.`);
        }
    }
}
