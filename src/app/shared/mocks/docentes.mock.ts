import { Docente } from '../models/docente.model';

/** Los `materiaIds` coinciden con los ids de `materias.mock.ts`. Nombres e identificaciones son ficticios. */
export const DOCENTES_MOCK: Docente[] = [
  {
    id: 1,
    identificacion: '0912345671',
    nombre: 'Andrade Mora Luis',
    cargaMaxima: 20,
    materiaIds: [1, 2, 5],
  },
  {
    id: 2,
    identificacion: '0912345689',
    nombre: 'Bravo Intriago Carla',
    cargaMaxima: 16,
    materiaIds: [1, 3],
  },
  {
    id: 3,
    identificacion: '0912345697',
    nombre: 'Cedeño Loor Pablo',
    cargaMaxima: 12,
    materiaIds: [4],
  },
  {
    id: 4,
    identificacion: '0912345705',
    nombre: 'Delgado Ponce Sofía',
    cargaMaxima: 20,
    materiaIds: [4, 5],
  },
  {
    id: 5,
    identificacion: '0912345713',
    nombre: 'Espinoza Vera Daniel',
    cargaMaxima: 8,
    materiaIds: [6],
  },
  {
    id: 6,
    identificacion: '0912345721',
    nombre: 'Franco Zambrano Elena',
    cargaMaxima: 16,
    materiaIds: [7],
  },
  {
    id: 7,
    identificacion: '0912345739',
    nombre: 'Gómez Alvarado Ricardo',
    cargaMaxima: 20,
    materiaIds: [1, 2, 3],
  },
];