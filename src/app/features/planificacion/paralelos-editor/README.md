# app-paralelos-editor (C2-11)

**Grupo 2 · Planificación — G2-07.** Por cada curso planificado lista sus paralelos
(A, B, C…) y permite definirlos: agregar, eliminar y editar cupo, tipo de espacio requerido
y recursos. Las **horas semanales vienen de la malla** y no se editan por paralelo.

- **Responsable:** Paula Martillo.
- **Se usa dentro de:** `app-planificacion-detalle` (C2-03), paso "Paralelos".
- **Reutiliza:** `app-tarjeta-paralelo` (C2-12), `app-estado-vacio` (C2-25),
  `app-spinner-carga` (C2-26) y `ConfirmacionService` → `app-dialogo-confirmacion` (C2-24).

## Reglas que aplica

| Regla (HU)                                                      | Cómo se cumple                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------- |
| Código de paralelo único por curso (G2-07)                      | `ParaleloService` asigna el primer código libre: A, B, C… (máximo 26) |
| Horas semanales tomadas de la malla (G2-07)                     | Se muestran como dato del curso; no hay control para editarlas        |
| Tipo de espacio requerido obligatorio (G2-07)                   | Todo paralelo nuevo arranca en `AULA` y el campo nunca queda vacío    |
| No aperturar materias de otra carrera responsable (G2-08)        | Si `esCompartida`, no se puede agregar y se explica por qué           |
| Cambios permitidos solo en borrador (G2-06)                      | `editable = false` deja todo en solo lectura                          |

Además compara los paralelos abiertos con los que sugirieron las reglas
(`paralelosSugeridos`) y avisa cuántos cupos faltan para los estudiantes estimados.

## Contrato

| Tipo    | Nombre             | Tipo de dato                      | Descripción                                        |
| ------- | ------------------ | --------------------------------- | -------------------------------------------------- |
| Entrada | `cursoPlanificado` | `CursoPlanificado` (obligatorio)  | Curso cuyos paralelos se editan                    |
| Entrada | `editable`         | `boolean` (por defecto `true`)    | `false` = solo lectura (planificación no BORRADOR) |
| Salida  | `paralelosChange`  | `Paralelo[]`                      | Lista completa, cada vez que los paralelos cambian |

`paralelosChange` se emite solo cuando hay un cambio real (agregar, editar o eliminar),
no en la carga inicial, para que el padre no entre en un ciclo de actualizaciones.

## Uso

Desde `features/planificacion/planificacion-detalle/`:

```ts
import { ParalelosEditorComponent } from '../paralelos-editor/paralelos-editor.component';

@Component({ imports: [ParalelosEditorComponent], ... })
```

```html
@for (curso of cursosAceptados(); track curso.id) {
  <app-paralelos-editor
    [cursoPlanificado]="curso"
    [editable]="planificacion().estado === 'BORRADOR'"
    (paralelosChange)="alCambiarParalelos(curso, $event)"
  />
}
```

Incluye carga (esqueleto), lista vacía, error con botón de reintentar y mensaje de la última
acción que no se pudo guardar. Al cambiar de curso descarta la respuesta del curso anterior.

## Datos de prueba

`ParaleloService` trabaja en memoria sobre `core/mocks/paralelos.mock.ts`, así que los cambios
se mantienen durante la sesión. Cuando exista la API solo cambia el cuerpo de cada método.

| `cursoPlanificado.id` | Resultado                                            |
| --------------------- | ---------------------------------------------------- |
| 10                    | Dos paralelos (A y B) de MAT-201, con docente        |
| 11                    | Un paralelo (A) de ICO-305, sin docente              |
| otro                  | Curso sin paralelos todavía (estado vacío)           |

## Piezas pendientes de otros grupos

- **`app-selector-tipo-espacio` (C3-10, G3):** mientras no exista, el tipo de espacio se elige
  con un `<select>` propio. Buscar `EDITAR (C3-10)` en la plantilla.
- **`app-selector-recursos` (C3-11, G3):** mientras no exista, los recursos se marcan con
  casillas sobre `core/mocks/recursos.mock.ts`. Buscar `EDITAR (C3-11)` en la plantilla.
- **`TipoEspacio`:** la lista de 4 valores sale del diccionario de datos. Confirmar con G3 si
  el tipo de espacio es una lista fija o viene de su catálogo de espacios.

## Cambios en archivos ya existentes

- `core/models/paralelo.model.ts`: se agrega `recursos?: Recurso[]` (tabla `paralelo_recurso`)
  y se exportan `ETIQUETAS_TIPO_ESPACIO` y `TIPOS_ESPACIO`, que antes estaban dentro de
  `tarjeta-paralelo.component.ts`, para que C2-11 y C2-12 usen los mismos nombres.
- `shared/components/tarjeta-paralelo/tarjeta-paralelo.component.ts`: ahora importa
  `ETIQUETAS_TIPO_ESPACIO` del modelo en vez de tener su propia copia. Mismo comportamiento.

## Diseño

Solo Tailwind con los tokens de `src/styles.css` (guía en `TAILWIND-Y-COLORES.md`), sin CSS
propio. Dos columnas desde `md`, una sola en pantallas angostas.

## Comprobación

```shell
npm run build
npm test -- --watch=false
```

Es un componente hijo sin ruta propia. Para verlo en el navegador, impórtalo en `app.ts` y
agrégalo en `app.html` con un curso de prueba (no incluir ese cambio en el commit).
