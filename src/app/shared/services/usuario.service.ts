import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { DatosUsuario, EstadoUsuario, Usuario } from '../models/usuario.model';

/**
 * Usuarios (tablas `usuario` y `usuario_rol`). Lo usan C1-14 (selector, Jose) y las
 * pantallas de usuarios de Maximilian (C1-10 lista, C1-11 formulario).
 *
 * TEMPORAL: datos ficticios en memoria, solo para el prototipo. Cuando exista la API
 * solo cambia el interior de cada método por la llamada HTTP; las firmas se mantienen.
 * Los decanos 10 a 13 coinciden con los de FacultadService.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private usuarios: Usuario[] = [
    { id: 1, username: 'admin', email: 'admin@uees.edu.ec', nombres: 'Administrador del sistema', origen: 'LOCAL', codigoSiac: null, estado: 'A', roles: ['Administrador'] },
    { id: 10, username: 'mortiz', email: 'mortiz@uees.edu.ec', nombres: 'María Fernanda Ortiz', origen: 'SIAC', codigoSiac: 'U-0010', estado: 'A', roles: ['Decano'] },
    { id: 11, username: 'abenitez', email: 'abenitez@uees.edu.ec', nombres: 'Andrés Benítez', origen: 'SIAC', codigoSiac: 'U-0011', estado: 'A', roles: ['Decano'] },
    { id: 12, username: 'lpenafiel', email: 'lpenafiel@uees.edu.ec', nombres: 'Lucía Peñafiel', origen: 'LOCAL', codigoSiac: null, estado: 'A', roles: ['Decano', 'Docente'] },
    { id: 13, username: 'jramirez', email: 'jramirez@uees.edu.ec', nombres: 'Jorge Ramírez', origen: 'LOCAL', codigoSiac: null, estado: 'A', roles: ['Decano'] },
    { id: 14, username: 'cvelez', email: 'cvelez@uees.edu.ec', nombres: 'Carolina Vélez', origen: 'LOCAL', codigoSiac: null, estado: 'A', roles: ['Decano'] },
    { id: 20, username: 'dmunoz', email: 'dmunoz@uees.edu.ec', nombres: 'Diego Muñoz', origen: 'SIAC', codigoSiac: 'U-0020', estado: 'A', roles: ['Coordinador'] },
    { id: 21, username: 'pacosta', email: 'pacosta@uees.edu.ec', nombres: 'Paola Acosta', origen: 'LOCAL', codigoSiac: null, estado: 'A', roles: ['Coordinador', 'Docente'] },
    { id: 30, username: 'rleon', email: 'rleon@uees.edu.ec', nombres: 'Ricardo León', origen: 'SIAC', codigoSiac: 'U-0030', estado: 'A', roles: ['Docente'] },
    { id: 31, username: 'gsalazar', email: 'gsalazar@uees.edu.ec', nombres: 'Gabriela Salazar', origen: 'LOCAL', codigoSiac: null, estado: 'I', roles: ['Docente'] },
  ];
  private siguienteId = 32;

  /**
   * @param rol nombre del rol, sin distinguir mayúsculas (por ejemplo 'Decano').
   * @param soloActivos deja fuera a los usuarios con estado I.
   */
  listar(opciones: { rol?: string; soloActivos?: boolean } = {}): Observable<Usuario[]> {
    const rol = opciones.rol?.toLowerCase();
    const lista = this.usuarios.filter(
      (u) =>
        (!rol || u.roles.some((r) => r.toLowerCase() === rol)) &&
        (!opciones.soloActivos || u.estado === 'A'),
    );
    return of(lista.map(copiar));
  }

  crear(datos: DatosUsuario): Observable<Usuario> {
    const error = this.validar(datos);
    if (error) return throwError(() => new Error(error));
    const nuevo: Usuario = { ...datos, roles: [...datos.roles], id: this.siguienteId++ };
    this.usuarios = [...this.usuarios, nuevo];
    return of(copiar(nuevo));
  }

  actualizar(id: number, datos: DatosUsuario): Observable<Usuario> {
    if (!this.buscar(id)) return throwError(() => new Error('El usuario no existe.'));
    const error = this.validar(datos, id);
    if (error) return throwError(() => new Error(error));
    const actualizado: Usuario = { ...datos, roles: [...datos.roles], id };
    this.usuarios = this.usuarios.map((u) => (u.id === id ? actualizado : u));
    return of(copiar(actualizado));
  }

  cambiarEstado(id: number, estado: EstadoUsuario): Observable<Usuario> {
    const actual = this.buscar(id);
    if (!actual) return throwError(() => new Error('El usuario no existe.'));
    return this.actualizar(id, { ...actual, estado });
  }

  private buscar(id: number): Usuario | undefined {
    return this.usuarios.find((u) => u.id === id);
  }

  /** Reglas UK de la BD: username, email y codigo_siac no se repiten. */
  private validar(datos: DatosUsuario, idActual?: number): string | null {
    const otros = this.usuarios.filter((u) => u.id !== idActual);
    const igual = (a: string | null, b: string | null) =>
      !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

    if (!datos.username?.trim() || !datos.email?.trim() || !datos.nombres?.trim()) {
      return 'El username, el email y los nombres son obligatorios.';
    }
    if (otros.some((u) => igual(u.username, datos.username))) {
      return `Ya existe un usuario con el username ${datos.username}.`;
    }
    if (otros.some((u) => igual(u.email, datos.email))) {
      return `Ya existe un usuario con el email ${datos.email}.`;
    }
    if (otros.some((u) => igual(u.codigoSiac, datos.codigoSiac))) {
      return `Ya existe un usuario con el código SIAC ${datos.codigoSiac}.`;
    }
    return null;
  }
}

function copiar(u: Usuario): Usuario {
  return { ...u, roles: [...u.roles] };
}
