# app-materias-a-planificar (C2-07)

**Grupo 2 · Planificación — G2-02.** Lista las materias que entran en una planificación,
agrupadas por origen:

1. **De la malla vigente:** la carrera es la responsable (se planifican y se aperturan).
2. **Responsable fuera de la malla:** la carrera es la dueña aunque no estén en su malla
   (se planifican y se aperturan). No tienen nivel ni horas, porque esos datos vienen de la malla.
3. **Compartidas:** la responsable es otra carrera. No se aperturan aquí, solo se solicitan
   cupos en sus paralelos (ver `app-materias-compartidas`, C2-17). Se marcan con
   `app-indicador-materia-compartida`.

Cada grupo se ordena por nivel y código; los grupos sin materias no se muestran.

- **Responsable:** Paula Martillo.
- **Se usa dentro de:** `app-sugerencia-cursos` (C2-08).
- **Reutiliza:** `app-indicador-materia-compartida` (C2-20), `app-estado-vacio` (C2-25) y
  `app-spinner-carga` (C2-26).

## Contrato

| Tipo    | Nombre            | Tipo de dato           | Descripción                         |
| ------- | ----------------- | ---------------------- | ----------------------------------- |
| Entrada | `planificacionId` | `number` (obligatorio) | Planificación cuyas materias se ven |
| Salida  | —                 | —                      | El componente es solo de lectura    |

## Uso

Desde el componente padre en `features/planificacion/sugerencia-cursos/`:

```ts
import { MateriasAPlanificarComponent } from '../materias-a-planificar/materias-a-planificar.component';

@Component({ imports: [MateriasAPlanificarComponent], ... })
```

```html
<app-materias-a-planificar [planificacionId]="planificacionId" />
```

Incluye carga (esqueleto), lista vacía y error con botón de reintentar. Al cambiar
`planificacionId` descarta la respuesta de la planificación anterior.

## Datos de prueba

`PlanificacionService.obtenerMateriasAPlanificar(id)` lee
`core/mocks/materias-a-planificar.mock.ts` (datos ficticios, todavía sin backend). Cuando
exista la API solo cambia el cuerpo del método; el componente no se toca.

| `planificacionId` | Resultado                                                                  |
| ----------------- | -------------------------------------------------------------------------- |
| 1 y 4             | Computación: 4 de la malla, 1 fuera de la malla y 2 compartidas            |
| 2                 | Industrial: 3 de la malla y 1 compartida (la misma materia es propia aquí) |
| 3                 | Arquitectura: sin materias (estado vacío)                                  |
| otro              | Error con opción de reintentar                                             |

## Piezas pendientes de otros grupos

- **`app-tabla-datos` (C4-20, G4):** el catálogo indica que este componente la contiene. Mientras
  G4 no la publique se usa una tabla simple con Tailwind. Buscar `EDITAR (C4-20)` en la
  plantilla para reemplazarla.
- **Modelo `Materia`:** `core/models/materia.model.ts` es una proyección mínima. Integrar con el
  modelo de G1 cuando esté disponible.

## Diseño

Solo Tailwind con los tokens de `src/styles.css` (guía en `TAILWIND-Y-COLORES.md`), sin CSS propio.
En pantallas angostas la tabla se desplaza horizontalmente.

## Comprobación

```shell
npm run build
npm test -- --watch=false
```

Es un componente hijo sin ruta propia. Para verlo en el navegador, impórtalo en `app.ts` y
agrégalo en `app.html` con `[planificacionId]="1"` (no incluir ese cambio en el commit).
