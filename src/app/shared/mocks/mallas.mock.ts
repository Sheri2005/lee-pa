import { Malla } from '../models/malla.model';

/**
 * Mismos ids y códigos que usa `planificaciones.mock.ts` (G2). Las carreras 5, 6 y 7 son las de
 * `CarreraService`. La malla 6 es una malla anterior de Computación, ya no vigente.
 */
export const MALLAS_MOCK: Malla[] = [
  {
    id: 3,
    codigo: 'M-COMP-2024',
    nombre: 'Malla 2024',
    anioInicio: 2024,
    carreraId: 5,
    vigente: true,
  },
  {
    id: 4,
    codigo: 'M-IND-2023',
    nombre: 'Malla 2023',
    anioInicio: 2023,
    carreraId: 6,
    vigente: true,
  },
  {
    id: 5,
    codigo: 'M-ARQ-2022',
    nombre: 'Malla 2022',
    anioInicio: 2022,
    carreraId: 7,
    vigente: true,
  },
  {
    id: 6,
    codigo: 'M-COMP-2019',
    nombre: 'Malla 2019',
    anioInicio: 2019,
    carreraId: 5,
    vigente: false,
  },
];

/** Cantidad de niveles de cada malla, por id de malla. */
export const NIVELES_POR_MALLA_MOCK: Record<number, number> = {
  3: 9,
  4: 10,
  5: 10,
  6: 9,
};
