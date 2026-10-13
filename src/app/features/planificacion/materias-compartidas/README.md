# app-materias-compartidas (C2-17)

**Grupo 2 · Planificación — G2-08.** Vista de la **carrera dependiente**: las materias
compartidas de su malla, qué carrera es la responsable, si esa carrera ya las planificó y qué
paralelos abrió. Si todavía no las planificó, lo advierte; si ya hay paralelos con espacio,
permite solicitar cupos en ellos.

Aquí **nunca se aperturan paralelos**: eso le corresponde a la carrera responsable
(ver `app-paralelos-editor`, C2-11, que bloquea la apertura de materias compartidas).

- **Responsable:** Paula Martillo.
- **Se usa dentro de:** `app-planificacion-detalle` (C2-03), paso "Materias compartidas".
- **Reutiliza:** `app-indicador-materia-compartida` (C2-20), `app-estado-vacio` (C2-25) y
  `app-spinner-carga` (C2-26).

## Reglas que aplica

| Regla (HU G2-08)                                        | Cómo se cumple                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| No aperturar materias de otra carrera responsable       | La única acción disponible es solicitar cupos; no hay "abrir paralelo" |
| Advertir si la responsable aún no la planificó          | Aviso arriba con el conteo, y la fila muestra "Esperando a <carrera>"  |
| Registrar cupos solicitados por paralelo                | La solicitud se guarda contra un `paraleloId` y queda `PENDIENTE`      |

Además compara los cupos ya solicitados con los estudiantes estimados y avisa cuántos faltan.
El formulario se prellena con esa diferencia, sin pasarse de los cupos libres del paralelo.

## Contrato

| Tipo    | Nombre            | Tipo de dato           | Descripción                                   |
| ------- | ----------------- | ---------------------- | --------------------------------------------- |
| Entrada | `planificacionId` | `number` (obligatorio) | Planificación de la carrera dependiente       |
| Salida  | —                 | —                      | Las solicitudes se registran por el servicio  |

## Uso

Desde `features/planificacion/planificacion-detalle/`:

```ts
import { MateriasCompartidasComponent } from '../materias-compartidas/materias-compartidas.component';

@Component({ imports: [MateriasCompartidasComponent], ... })
```

```html
<app-materias-compartidas [planificacionId]="planificacionId" />
```

Incluye carga (esqueleto), lista vacía, error con botón de reintentar, confirmación de la
solicitud enviada y el motivo exacto cuando el servicio la rechaza. Al cambiar
`planificacionId` descarta la respuesta de la planificación anterior.

## Datos de prueba

`SolicitudCupoService` trabaja en memoria sobre `core/mocks/materias-compartidas.mock.ts`, así
que las solicitudes se mantienen durante la sesión. Cuando exista la API solo cambia el cuerpo
de cada método; el componente no se toca.

| `planificacionId` | Resultado                                                                       |
| ----------------- | ------------------------------------------------------------------------------- |
| 1                 | Computación: una planificada con 2 paralelos, una en borrador y una sin planificar |
| 2                 | Industrial: una compartida con solicitud pendiente y casi sin cupos             |
| 3                 | Arquitectura: sin materias compartidas (estado vacío)                           |
| otro              | Error con opción de reintentar                                                  |

## Piezas pendientes de otros grupos

- **`app-tabla-datos` (C4-20, G4):** el catálogo indica que este componente la contiene.
  Mientras G4 no la publique se usa una tabla simple. Buscar `EDITAR (C4-20)` en la plantilla.
- **`app-estado-badge` (C5-08, G5):** el estado de la carrera responsable se pinta con una
  píldora propia. Buscar `EDITAR (C5-08)` en la plantilla y en el componente.
- **`app-solicitud-cupos-form` (C2-18, Grupo 2):** ese diálogo es de otro integrante del grupo.
  Mientras no exista, la solicitud se hace con un formulario en línea dentro de la fila.
  Buscar `EDITAR (C2-18)` en la plantilla: al reemplazarlo, el componente solo tiene que abrir
  el diálogo y llamar a `SolicitudCupoService.solicitarCupos()` con su resultado.

## Diseño

Solo Tailwind con los tokens de `src/styles.css` (guía en `TAILWIND-Y-COLORES.md`), sin CSS
propio. En pantallas angostas la tabla se desplaza horizontalmente.

## Comprobación

```shell
npm run build
npm test -- --watch=false
```

Es un componente hijo sin ruta propia. Para verlo en el navegador, impórtalo en `app.ts` y
agrégalo en `app.html` con `[planificacionId]="1"` (no incluir ese cambio en el commit).
