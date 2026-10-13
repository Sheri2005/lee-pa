# C4-14 · Calendario de ocupación

| Campo       | Valor                                                                                 |
| ----------- | ------------------------------------------------------------------------------------- |
| ID          | **C4-14**                                                                             |
| Selector    | `app-calendario-ocupacion`                                                            |
| Clase       | `CalendarioOcupacionComponent`                                                        |
| Tipo        | Página                                                                                |
| Ruta        | `/reservas/calendario` (pendiente de registrar en `app.routes.ts`, ver [Ruta](#ruta)) |
| Grupo dueño | G4 · Reservas                                                                         |
| Servicio    | `OcupacionService`                                                                    |
| Historia    | G4-08                                                                                 |

Ocupación de un espacio: **clases** (G3) y **reservas** pendientes o aprobadas (G4), en vista **semanal** o **mensual**. No aplica la política de nuevas reservas: si hay clases en sábado o fuera de 07:00–21:00, también se muestran.

## Archivos

```text
src/modules/reservas/calendario-ocupacion/
├── README.md
├── calendario-ocupacion.ts        # Página + horarioRegla / ventanaRegla / marcasDeRegla / bloquesDelDia / rangoDeVista / tituloPeriodo
├── calendario-ocupacion.html      # Plantilla con Tailwind
└── calendario-ocupacion.spec.ts
```

## Uso y parámetros

Página con ruta propia; no tiene entradas ni salidas. Admite parámetros en la URL, por ejemplo desde una reserva o desde la búsqueda:

```text
/reservas/calendario?espacioId=7&fecha=2026-10-14&vista=mes
```

| Parámetro   | Efecto                                                       |
| ----------- | ------------------------------------------------------------ |
| `espacioId` | Espacio elegido al abrir.                                    |
| `fecha`     | Cualquier día del período que se muestra (por defecto, hoy). |
| `vista`     | `mes` abre la vista mensual (por defecto, `semana`).         |

## Comportamiento

- **Espacio y vista**: lista de espacios y conmutador **Semana / Mes**.
- **Navegación**: anterior / siguiente y **Hoy** (deshabilitado si ya se ve el período actual). Título: «12–17 oct 2026» o «Octubre 2026».
- **Semana** (lunes a sábado; el domingo solo aparece si tiene ocupación): **cuadrícula vertical** con una columna por día y las horas de 07:00 a 21:00 a la izquierda (se amplía si alguna ocupación cae fuera). Cada clase o reserva es un bloque con su horario, título y responsable dentro; la información no se repite en otra lista. Los bloques de menos de 50 minutos muestran hora y título en una línea, y al pasar el ratón se ve el detalle completo. Si dos ocupaciones se cruzan (por ejemplo, una reserva pendiente sobre una clase), se reparten el ancho de la columna. En la columna de hoy, una línea dorada marca la hora actual.
- **En anchos estrechos** (por debajo de `@3xl` del contenedor), cada día pasa a ser una lista con sus ocupaciones; es el mismo HTML, sin duplicar contenido.
- La regla de los **15 minutos libres** entre ocupaciones se indica en el subtítulo de la página; la aplica el formulario de reserva (C4-06), no se dibuja en el calendario.
- **Mes**: rejilla de lunes a domingo. Cada día muestra una mini regla de 07:00 a 21:00 con los mismos colores que la semana (cuándo está ocupado), y su fondo se oscurece según cuánto del horario ocupan las clases y reservas aprobadas: libre, hasta un cuarto, hasta la mitad o más de la mitad. En escritorio añade las horas ocupadas («3 h 40 min») o «Libre» y el número de clases y reservas. Al pulsar un día del mes se abre su semana con ese día resaltado (columna `bg-header` y número en vino); al pulsar uno del mes anterior o siguiente (atenuado) se pasa a ese mes. Al pasar el ratón, el día indica «Ver la semana».
- Consulta `OcupacionService.ocupacion(espacioId, desde, hasta)` con el rango de la vista: lunes a sábado, o toda la rejilla del mes (por ejemplo del lunes 28 de septiembre al domingo 1 de noviembre), para que los días de los meses vecinos también muestren su ocupación.

| Estado                    | Qué se muestra                                                     |
| ------------------------- | ------------------------------------------------------------------ |
| Sin espacio               | «Elige un espacio para ver sus clases y reservas.»                 |
| Cargando                  | Esqueleto animado (estático con movimiento reducido)               |
| `null` (API sin conectar) | «No se puede mostrar la ocupación…»; **no** se presenta como libre |
| Error                     | Mensaje y **Volver a cargar**                                      |
| Sin ocupación             | Cada día con «Sin clases ni reservas.»                             |

## Leyenda

| Elemento                | Aspecto                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clase                   | Bloque `bg-primary`                                                                                                                                            |
| Reserva aprobada        | Bloque dorado sólido y opaco (`accent-gold` al 45 % sobre `surface`) con texto `text-wine-deep`                                                                |
| Reserva pendiente       | Borde punteado `accent-gold`; no bloquea. En la mini regla del mes el punteado se dibuja con fondos de trazo fijo para que se vea aunque el bloque sea pequeño |
| Ocupación del día (mes) | Fondo `bg-surface`, `bg-muted`, `bg-primary/12` o `bg-primary/22`                                                                                              |

## Dependencias TEMPORALES

| Pieza futura                         | Dueño | Qué hace hoy C4-14                                                                                                                                                              |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app-encabezado-pagina`              | G3    | Título y descripción propios.                                                                                                                                                   |
| `app-selector-espacio` y su servicio | G3    | `campo-seleccion` con `OcupacionService.espacios()` (devuelve `null`).                                                                                                          |
| `app-selector-periodo`               | G1    | No se dibuja: sin datos no aporta. Se añadirá junto al espacio.                                                                                                                 |
| `app-grilla-semanal`                 | G3    | Regla horaria sencilla por día con la lista de ocupaciones.                                                                                                                     |
| `app-calendario-mensual` (C4-15)     | G4    | Rejilla mensual con mini regla y nivel de ocupación por día; si C4-15 adopta esa presentación, recibirá el mes y los eventos y emitirá `(diaSeleccionado)="verSemana($event)"`. |

## Ruta

Siguiendo la guía del grupo, la entrega no modifica `app.routes.ts`. Para registrarla:

```ts
{
  path: 'reservas/calendario',
  loadComponent: () =>
    import('../modules/reservas/calendario-ocupacion/calendario-ocupacion').then(
      (m) => m.CalendarioOcupacionComponent,
    ),
}
```

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md); sin CSS propio ni hexadecimales. Los colores mezclados (`color-mix`) y el punteado usan los tokens `--color-accent-gold` y `--color-surface`.

| Elemento      | Clases de color                                                              |
| ------------- | ---------------------------------------------------------------------------- |
| Tarjetas      | `bg-surface border-border`; cabecera con `border-b` y marca `bg-accent-gold` |
| Regla del día | `bg-header`, marcas de hora `bg-border`                                      |
| Hoy           | `text-accent-gold`, borde `border-accent-gold`                               |
| Conmutador    | `bg-header`; opción activa `bg-surface text-primary`                         |
| Error         | `bg-red-50 text-red-700`                                                     |

## Accesibilidad

- Cada día es un elemento de una lista ordenada y sus bloques, una lista con el tipo («Clase:», «Reserva aprobada:», «Reserva pendiente:») para lectores de pantalla. Las líneas de las horas y la de «ahora» son decorativas (`aria-hidden`); un día sin ocupación dice «Sin clases ni reservas.».
- Un resumen oculto `role="status"` anuncia cuántas clases y reservas hay en el período; el título del período es `aria-live`.
- Botones con `aria-label` (Semana anterior / siguiente), `aria-pressed` en el conmutador y `aria-current="date"` en hoy. Los días del mes se leen como «martes, 13 de octubre: 1 clase y 1 reserva. Ver la semana.».
- Transiciones desactivadas con `motion-reduce`.

## Verificación

```sh
npx ng test --watch=false
npx ng build
```

14 pruebas con un servicio falso dentro del spec: sin espacio no consulta; semana de lunes a sábado desde la URL; `null` no se presenta como libre; espacio de la URL sin lista; navegación y **Hoy**; vista mensual sobre toda la rejilla, con clases, reservas y horas ocupadas por día, y paso a la semana; cambio de espacio sin datos del anterior; reintento tras error; día elegido en el mes resaltado en la semana; posición y duración de los bloques en la columna y en la mini regla; reparto del ancho entre ocupaciones que se solapan y bloques cortos; horas de la cuadrícula; ampliación del horario y títulos; días de otro mes que llevan a ese mes; minutos ocupados sin solapes ni pendientes y nivel de ocupación.

Revisado en la vista previa temporal a 320, 390, 1280 y 1440 px y al 200 % de zoom, sin desplazamiento horizontal.
