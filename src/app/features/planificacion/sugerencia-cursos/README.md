# app-sugerencia-cursos (C2-08)

**Grupo 2 · Planificación — G2-05 y G2-06.** Tabla de los cursos que las reglas proponen
aperturar, con número de paralelos, estudiantes estimados, demanda histórica y la
**justificación visible** de cada sugerencia. El coordinador puede aceptar, anular, cambiar el
número de paralelos o agregar un curso a mano. Los cambios solo se permiten en BORRADOR.

- **Responsable:** Paula Martillo.
- **Se usa dentro de:** `app-planificacion-detalle` (C2-03), paso "Cursos sugeridos".
- **Reutiliza:** `app-materias-a-planificar` (C2-07), `app-justificacion-regla` (C2-10),
  `app-estado-vacio` (C2-25), `app-spinner-carga` (C2-26) y `ConfirmacionService` → C2-24.

## Reglas que aplica

Las reglas viven en `SugerenciaService`, en dos funciones puras y probadas aparte:

| Regla (HU)                                                       | Dónde está                                        |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| Solo niveles ofertados (G2-05)                                   | Las demás materias salen en "quedaron fuera"      |
| Paralelos = estimados ÷ cupo, hacia arriba, si alcanza el mínimo | `calcularParalelosSugeridos()`                    |
| Muestra la justificación de cada sugerencia (G2-05)              | `construirJustificacion()` + C2-10 en modo compacto |
| Registra si el curso es sugerido o manual (G2-06)                | `curso.origen` = `SUGERIDO` / `MANUAL`            |
| Cambios permitidos solo en borrador (G2-06)                      | `editable` se deriva de `estado === 'BORRADOR'`   |
| Una materia compartida no genera curso propio (G2-08)            | Se excluye y se apunta a C2-17                    |

Ejemplo de justificación, igual al del documento del profesor: *Nivel 3 de la malla vigente ✔ ·
Mínimo para abrir: 10 → 62 estimados ✔ · Paralelos sugeridos: 62 ÷ cupo 35 → 2 · Demanda
histórica: 58 estudiantes.*

## Contrato

| Tipo    | Nombre            | Tipo de dato           | Descripción                                        |
| ------- | ----------------- | ---------------------- | -------------------------------------------------- |
| Entrada | `planificacionId` | `number` (obligatorio) | Planificación cuya sugerencia se trabaja           |
| Salida  | `cursosChange`    | `CursoSugerido[]`      | Cursos de la sugerencia tras cada decisión         |

`cursosChange` se emite solo cuando una decisión cambia los cursos (aceptar, anular, reactivar,
cambiar paralelos o agregar manual), no en la carga inicial.

No recibe `editable` como entrada: lo deduce del estado que devuelve el servicio, para que no se
pueda editar por error una planificación ya enviada a aprobación.

## Uso

Desde `features/planificacion/planificacion-detalle/`:

```ts
import { SugerenciaCursosComponent } from '../sugerencia-cursos/sugerencia-cursos.component';

@Component({ imports: [SugerenciaCursosComponent], ... })
```

```html
<app-sugerencia-cursos
  [planificacionId]="planificacionId"
  (cursosChange)="alCambiarCursos($event)"
/>
```

Incluye carga (esqueleto), lista vacía, error con botón de reintentar y el motivo exacto cuando
el servicio rechaza una decisión. Al cambiar `planificacionId` descarta la respuesta anterior.

## Datos de prueba

`SugerenciaService` corre las reglas en memoria sobre `core/mocks/sugerencia.mock.ts`, así que
las decisiones se mantienen durante la sesión. El mock guarda los **datos de entrada** de cada
materia (nivel, estimados, demanda, si es compartida) y el servicio decide, igual que lo hará el
backend; cuando exista la API solo cambia el cuerpo de cada método.

| `planificacionId` | Resultado                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------ |
| 1                 | Borrador: 4 cursos (3, 2, 1 y 0 paralelos), 2 materias excluidas y 2 agregables a mano     |
| 2                 | Enviada a aprobación: todo en solo lectura                                                 |
| 3                 | Sin materias en la malla (estado vacío)                                                    |
| otro              | Error con opción de reintentar                                                             |

En la planificación 1, ICO-402 llega con 7 estimados y el mínimo es 10: se sugiere con 0
paralelos y, si se acepta, pasa a 1.

## Piezas pendientes de otros grupos

- **`app-curso-manual-form` (C2-09, Grupo 2):** ese diálogo es de otro integrante del grupo.
  Mientras no exista, agregar un curso a mano se hace con un formulario en línea. Buscar
  `EDITAR (C2-09)` en la plantilla: al reemplazarlo, el componente solo tiene que abrir el
  diálogo y llamar a `SugerenciaService.agregarCursoManual()` con su resultado.
- **`app-estado-badge` (C5-08, G5):** el estado del curso se pinta con una píldora propia.
  Buscar `EDITAR (C5-08)` en la plantilla y en el componente.

## Diseño

Solo Tailwind con los tokens de `src/styles.css` (guía en `TAILWIND-Y-COLORES.md`), sin CSS
propio. En pantallas angostas la tabla se desplaza horizontalmente. Las materias a planificar
(C2-07) y el detalle de las materias excluidas se muestran solo cuando se piden, para que la
tabla principal no quede enterrada.

## Comprobación

```shell
npm run build
npm test -- --watch=false
```

Las reglas tienen su propia suite en `core/services/sugerencia.service.spec.ts` (21 pruebas),
separada de las 13 del componente.

Es un componente hijo sin ruta propia. Para verlo en el navegador, impórtalo en `app.ts` y
agrégalo en `app.html` con `[planificacionId]="1"` (no incluir ese cambio en el commit).
