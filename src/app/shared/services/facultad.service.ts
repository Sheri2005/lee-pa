import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { DatosFacultad, EstadoFacultad, Facultad } from '../models/facultad.model';

/**
 * Facultades (tabla `facultad`). Lo usan C1-20 (lista), C1-21 (formulario) y
 * C1-22 (selector).
 *
 * TEMPORAL: datos de prueba en memoria. Cuando exista la API solo cambia el interior
 * de cada método por la llamada HTTP; las firmas se mantienen.
 */
@Injectable({ providedIn: 'root' })
export class FacultadService {
  private facultades: Facultad[] = [
    { id: 1, codigo: 'FI', nombre: 'Facultad de Ingeniería', decanoUsuarioId: 10, decanoNombre: 'María Fernanda Ortiz', codigoSiac: 'SIAC-FI', estado: 'A' },
    { id: 2, codigo: 'FCE', nombre: 'Facultad de Ciencias Económicas', decanoUsuarioId: 11, decanoNombre: 'Andrés Benítez', codigoSiac: 'SIAC-FCE', estado: 'A' },
    { id: 3, codigo: 'FCS', nombre: 'Facultad de Ciencias de la Salud', decanoUsuarioId: 12, decanoNombre: 'Lucía Peñafiel', codigoSiac: null, estado: 'A' },
    { id: 4, codigo: 'FCOM', nombre: 'Facultad de Comunicación', decanoUsuarioId: null, decanoNombre: null, codigoSiac: 'SIAC-FCOM', estado: 'A' },
    { id: 5, codigo: 'FDER', nombre: 'Facultad de Derecho', decanoUsuarioId: 13, decanoNombre: 'Jorge Ramírez', codigoSiac: null, estado: 'I' },
  ];
  private siguienteId = 6;

  listar(opciones: { soloActivas?: boolean } = {}): Observable<Facultad[]> {
    const lista = opciones.soloActivas
      ? this.facultades.filter((f) => f.estado === 'A')
      : this.facultades;
    return of(lista.map((f) => ({ ...f })));
  }

  crear(datos: DatosFacultad): Observable<Facultad> {
    const error = this.validar(datos);
    if (error) return throwError(() => new Error(error));
    const nueva: Facultad = { ...datos, id: this.siguienteId++ };
    this.facultades = [...this.facultades, nueva];
    return of({ ...nueva });
  }

  actualizar(id: number, datos: DatosFacultad): Observable<Facultad> {
    if (!this.buscar(id)) return throwError(() => new Error('La facultad no existe.'));
    const error = this.validar(datos, id);
    if (error) return throwError(() => new Error(error));
    const actualizada: Facultad = { ...datos, id };
    this.facultades = this.facultades.map((f) => (f.id === id ? actualizada : f));
    return of({ ...actualizada });
  }

  cambiarEstado(id: number, estado: EstadoFacultad): Observable<Facultad> {
    const actual = this.buscar(id);
    if (!actual) return throwError(() => new Error('La facultad no existe.'));
    return this.actualizar(id, { ...actual, estado });
  }

  private buscar(id: number): Facultad | undefined {
    return this.facultades.find((f) => f.id === id);
  }

  /** Reglas UK de la BD: codigo, codigo_siac y decano_usuario_id no se repiten. */
  private validar(datos: DatosFacultad, idActual?: number): string | null {
    const otras = this.facultades.filter((f) => f.id !== idActual);
    const igual = (a: string | null, b: string | null) =>
      !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

    if (!datos.codigo?.trim() || !datos.nombre?.trim()) {
      return 'El código y el nombre son obligatorios.';
    }
    if (otras.some((f) => igual(f.codigo, datos.codigo))) {
      return `Ya existe una facultad con el código ${datos.codigo}.`;
    }
    if (otras.some((f) => igual(f.codigoSiac, datos.codigoSiac))) {
      return `Ya existe una facultad con el código SIAC ${datos.codigoSiac}.`;
    }
    if (datos.decanoUsuarioId != null && otras.some((f) => f.decanoUsuarioId === datos.decanoUsuarioId)) {
      return 'Ese usuario ya es decano de otra facultad.';
    }
    return null;
  }
}
