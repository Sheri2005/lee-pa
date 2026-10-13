import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { RegistroSinSiac } from '../models/registro-sin-siac';
import {
  SiacCodeAvailabilityChecker,
  SiacCodeAvailabilityRequest,
} from '../../shared/components/campo-codigo-siac/siac-code-availability';

interface RegistroSinSiacMock extends RegistroSinSiac {
  planificacionIds: number[];
}

interface CodigoSiacMock {
  entity: string;
  id: string | number;
  code: string;
}

@Injectable({ providedIn: 'root' })
export class SiacService implements SiacCodeAvailabilityChecker {
  private readonly latenciaMs = 400;

  private readonly registrosSinCodigoMock: RegistroSinSiacMock[] = [
    {
      entidad: 'materia',
      id: 3,
      codigo: 'PRG-201',
      nombre: 'Programación II',
      planificacionIds: [1],
    },
    {
      entidad: 'materia',
      id: 4,
      codigo: 'BDD-301',
      nombre: 'Bases de Datos',
      planificacionIds: [1],
    },
    {
      entidad: 'materia',
      id: 7,
      codigo: 'ETI-101',
      nombre: 'Ética Profesional',
      planificacionIds: [2],
    },
    {
      entidad: 'periodo',
      id: 2,
      codigo: '2027-2',
      nombre: 'Segundo período ordinario 2027',
      planificacionIds: [2],
    },
    {
      entidad: 'carrera',
      id: 3,
      codigo: 'ING-IND',
      nombre: 'Ingeniería Industrial',
      planificacionIds: [2],
    },
    {
      entidad: 'docente',
      id: 5,
      codigo: '0912345678',
      nombre: 'María Torres',
      planificacionIds: [1],
    },
    {
      entidad: 'docente',
      id: 8,
      codigo: '0923456789',
      nombre: 'Luis Andrade',
      planificacionIds: [2],
    },
  ];

  private readonly codigosSiacMock: CodigoSiacMock[] = [
    {
      entity: 'periodo',
      id: 1,
      code: '2027-1',
    },
    {
      entity: 'carrera',
      id: 1,
      code: 'ING-COMP',
    },
    {
      entity: 'materia',
      id: 1,
      code: 'MAT-101',
    },
    {
      entity: 'materia',
      id: 2,
      code: 'PRG-201-SIAC',
    },
    {
      entity: 'docente',
      id: 1,
      code: 'DOC-0452',
    },
    {
      entity: 'espacio',
      id: 1,
      code: 'F-203',
    },
  ];

  registrosSinCodigo(
    planificacionId?: number,
  ): Observable<RegistroSinSiac[]> {
    const registros = this.registrosSinCodigoMock
      .filter(
        (registro) =>
          planificacionId === undefined ||
          registro.planificacionIds.includes(planificacionId),
      )
      .map(({ entidad, id, codigo, nombre }) => ({
        entidad,
        id,
        codigo,
        nombre,
      }));

    return of(registros).pipe(delay(this.latenciaMs));
  }

  checkAvailability(
    request: SiacCodeAvailabilityRequest,
  ): Observable<boolean> {
    const entity = request.entity.trim().toLowerCase();
    const code = request.code.trim().toUpperCase();

    const codigoOcupado = this.codigosSiacMock.some(
      (registro) =>
        registro.entity.toLowerCase() === entity &&
        registro.code.toUpperCase() === code &&
        registro.id !== request.currentId,
    );

    return of(!codigoOcupado).pipe(delay(this.latenciaMs));
  }
}