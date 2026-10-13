import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Carrera, DatosCarrera, EstadoCarrera } from '../models/carrera.model';

/**
 * Carreras (tabla `carrera`). Lo usan C1-25 (selector, Jose) y las pantallas de carreras de
 * Maximilian (C1-23 lista y C1-24 formulario).
 *
 * TEMPORAL: datos ficticios en memoria. Cuando exista la API solo cambia el interior de cada
 * método por la llamada HTTP; las firmas se mantienen.
 * - Las carreras 5, 6 y 7 son las mismas de las materias de prueba de Julio (`materias.mock.ts`).
 * - Las facultades son las de `FacultadService` y los coordinadores, los de `UsuarioService`.
 */
@Injectable({ providedIn: 'root' })
export class CarreraService {
  private carreras: Carrera[] = [
    { id: 1, codigo: 'ECO', nombre: 'Economía', facultadId: 2, facultadNombre: 'Facultad de Ciencias Económicas', jornada: 'MATUTINA', modalidad: 'PRESENCIAL', coordinadorUsuarioId: null, coordinadorNombre: null, codigoSiac: 'ECO', estado: 'A' },
    { id: 2, codigo: 'ENF', nombre: 'Enfermería', facultadId: 3, facultadNombre: 'Facultad de Ciencias de la Salud', jornada: 'MATUTINA', modalidad: 'PRESENCIAL', coordinadorUsuarioId: null, coordinadorNombre: null, codigoSiac: null, estado: 'A' },
    { id: 3, codigo: 'PER', nombre: 'Periodismo', facultadId: 4, facultadNombre: 'Facultad de Comunicación', jornada: 'VESPERTINA', modalidad: 'VIRTUAL', coordinadorUsuarioId: null, coordinadorNombre: null, codigoSiac: null, estado: 'A' },
    { id: 4, codigo: 'DER', nombre: 'Derecho', facultadId: 5, facultadNombre: 'Facultad de Derecho', jornada: 'NOCTURNA', modalidad: 'PRESENCIAL', coordinadorUsuarioId: null, coordinadorNombre: null, codigoSiac: 'DER', estado: 'I' },
    { id: 5, codigo: 'ING-COMP', nombre: 'Ingeniería en Computación', facultadId: 1, facultadNombre: 'Facultad de Ingeniería', jornada: 'MATUTINA', modalidad: 'PRESENCIAL', coordinadorUsuarioId: 20, coordinadorNombre: 'Diego Muñoz', codigoSiac: 'ING-COMP', estado: 'A' },
    { id: 6, codigo: 'ING-IND', nombre: 'Ingeniería Industrial', facultadId: 1, facultadNombre: 'Facultad de Ingeniería', jornada: 'VESPERTINA', modalidad: 'PRESENCIAL', coordinadorUsuarioId: 21, coordinadorNombre: 'Paola Acosta', codigoSiac: 'ING-IND', estado: 'A' },
    { id: 7, codigo: 'ARQ', nombre: 'Arquitectura', facultadId: 1, facultadNombre: 'Facultad de Ingeniería', jornada: 'MATUTINA', modalidad: 'PRESENCIAL', coordinadorUsuarioId: null, coordinadorNombre: null, codigoSiac: null, estado: 'A' },
  ];
  private siguienteId = 8;

  /**
   * @param facultadId solo las carreras de esa facultad.
   * @param coordinadorUsuarioId solo la carrera que coordina ese usuario ("mis carreras").
   * @param soloActivas deja fuera a las de estado I.
   */
  listar(
    opciones: { facultadId?: number | null; coordinadorUsuarioId?: number | null; soloActivas?: boolean } = {},
  ): Observable<Carrera[]> {
    const lista = this.carreras.filter(
      (c) =>
        (opciones.facultadId == null || c.facultadId === opciones.facultadId) &&
        (opciones.coordinadorUsuarioId == null || c.coordinadorUsuarioId === opciones.coordinadorUsuarioId) &&
        (!opciones.soloActivas || c.estado === 'A'),
    );
    return of(lista.map((c) => ({ ...c })));
  }

  crear(datos: DatosCarrera): Observable<Carrera> {
    const error = this.validar(datos);
    if (error) return throwError(() => new Error(error));
    const nueva: Carrera = { ...datos, id: this.siguienteId++ };
    this.carreras = [...this.carreras, nueva];
    return of({ ...nueva });
  }

  actualizar(id: number, datos: DatosCarrera): Observable<Carrera> {
    if (!this.buscar(id)) return throwError(() => new Error('La carrera no existe.'));
    const error = this.validar(datos, id);
    if (error) return throwError(() => new Error(error));
    const actualizada: Carrera = { ...datos, id };
    this.carreras = this.carreras.map((c) => (c.id === id ? actualizada : c));
    return of({ ...actualizada });
  }

  cambiarEstado(id: number, estado: EstadoCarrera): Observable<Carrera> {
    const actual = this.buscar(id);
    if (!actual) return throwError(() => new Error('La carrera no existe.'));
    return this.actualizar(id, { ...actual, estado });
  }

  private buscar(id: number): Carrera | undefined {
    return this.carreras.find((c) => c.id === id);
  }

  /** Reglas de la BD: facultad obligatoria; codigo, codigo_siac y coordinador no se repiten. */
  private validar(datos: DatosCarrera, idActual?: number): string | null {
    const otras = this.carreras.filter((c) => c.id !== idActual);
    const igual = (a: string | null, b: string | null) =>
      !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

    if (!datos.codigo?.trim() || !datos.nombre?.trim()) {
      return 'El código y el nombre son obligatorios.';
    }
    if (datos.facultadId == null) {
      return 'La carrera debe pertenecer a una facultad.';
    }
    if (otras.some((c) => igual(c.codigo, datos.codigo))) {
      return `Ya existe una carrera con el código ${datos.codigo}.`;
    }
    if (otras.some((c) => igual(c.codigoSiac, datos.codigoSiac))) {
      return `Ya existe una carrera con el código SIAC ${datos.codigoSiac}.`;
    }
    if (
      datos.coordinadorUsuarioId != null &&
      otras.some((c) => c.coordinadorUsuarioId === datos.coordinadorUsuarioId)
    ) {
      return 'Ese usuario ya coordina otra carrera.';
    }
    return null;
  }
}
