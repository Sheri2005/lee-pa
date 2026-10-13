# C4-13 · Resumen de reserva

| Campo       | Valor                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| ID          | **C4-13**                                                                                                |
| Selector    | `app-resumen-reserva`                                                                                    |
| Clase       | `ResumenReservaComponent`                                                                                |
| Tipo        | Hijo reutilizable                                                                                        |
| Grupo dueño | G4 · Reservas                                                                                            |
| Responsable | Justin Soledispa                                                                                         |
| Lo usan     | `app-reserva-detalle` (C4-12, G4) y `app-solicitud-detalle` (G5, cuando la solicitud es de tipo RESERVA) |
| Contiene    | `app-tarjeta-espacio` (C3-13, G3) y `app-estado-badge` (C5-08, G5) — **provisionales**, ver abajo        |
| Historias   | G4-07, G5-05                                                                                             |

Resumen de **solo lectura** de una reserva: espacio, fecha y horas (o todas las ocurrencias si es una serie), solicitante, asistentes, motivo, recursos y estado. Recibe solo el id y obtiene los datos con `ReservaService`, así el grupo que lo use no tiene que saber cómo se arma una reserva.

Usa detección de cambios `OnPush`, por lo que puede integrarse en detalles de reserva o de solicitud sin añadir ciclos de renderizado innecesarios.

## Archivos

```text
src/app/shared/components/resumen-reserva/
├── README.md
├── resumen-reserva.ts       # Componente standalone + diasTexto / pisoTexto / tipoTexto
├── resumen-reserva.html     # Plantilla con Tailwind
└── resumen-reserva.spec.ts

src/app/core/
├── models/reserva.model.ts          # Modelos del módulo: Reserva, ReservaSerie, ResumenReserva, RecursoReservable…
└── services/reserva.service.ts      # ReservaService.obtenerResumen(id)
```

El modelo y el servicio están en `src/app/core`, como pide el Excel para lo que usan varios componentes: el modelo lo comparten C4-09, C4-13, C4-17 y C4-18.

## Uso

```ts
import { ResumenReservaComponent } from '<ruta>/app/shared/components/resumen-reserva/resumen-reserva';

@Component({
  imports: [ResumenReservaComponent],
  template: `<app-resumen-reserva [reservaId]="solicitud.referencia_id" />`,
})
export class SolicitudDetalleComponent {}
```

## Contrato

| Entrada     | Tipo     | Descripción                                   |
| ----------- | -------- | --------------------------------------------- |
| `reservaId` | `number` | Obligatoria. Id de la reserva que se muestra. |

No tiene salidas: es de solo lectura. Las acciones (cancelar, aprobar…) las pone el componente que lo contiene.

## Qué muestra

- **Cabecera**: "Reserva #id", una píldora **↻ Serie · N fechas** si pertenece a una serie, y el estado a la derecha.
- **Espacio**: tipo, código, nombre, edificio, piso y capacidad.
- **Fecha y hora** (reserva puntual) u **Ocurrencias** (serie): tarjetas compactas en dos columnas con fecha, horario y estado de cada ocurrencia; la del id recibido queda resaltada (`aria-current`). En una serie se indica "Cada martes · mar, 6 oct 2026 al mar, 27 oct 2026".
- **Solicitante** y **asistentes**, **motivo** y, al pie separado por una línea, los **recursos** pedidos ("Laptop × 4") o "Sin recursos adicionales".

La tarjeta mide lo que su contenido y aparece con una animación suave.

## Estados

| Estado        | Qué se muestra                                                             |
| ------------- | -------------------------------------------------------------------------- |
| Cargando      | Esqueleto animado y texto oculto "Cargando la reserva…" (`role="status"`). |
| Listo         | La tarjeta con el resumen.                                                 |
| No encontrada | "No se encontró la reserva #id" (`role="status"`).                         |
| Error         | "No se pudo cargar la reserva…" (`role="alert"`).                          |

Al cambiar `reservaId` se vuelve a cargar; una respuesta anterior que llegue tarde se descarta.

## Conexión con la API

`ReservaService.obtenerResumen(id)` todavía no está conectado al backend: devuelve `null`, así que el componente muestra "No se encontró la reserva". Cuando exista la API solo cambia el servicio (por ejemplo `GET /reservas/{id}/resumen`); el componente no se modifica.

## Componentes de otros grupos (provisionales)

A la fecha no están en `main`. Para no crear versiones propias con su nombre, la plantilla dibuja una versión sencilla marcada con comentarios `TEMPORAL`:

| Bloque en la plantilla | Sustituir por                                           | Grupo |
| ---------------------- | ------------------------------------------------------- | ----- |
| Insignia de estado     | `<app-estado-badge [estado]="r.estado" />` (C5-08)      | G5    |
| Bloque del espacio     | `<app-tarjeta-espacio [espacio]="r.espacio" />` (C3-13) | G3    |

El campo `espacio` de `ResumenReserva` también es provisional hasta que G3 publique su modelo `Espacio`.

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../../TAILWIND-Y-COLORES.md).

| Elemento           | Clases de color                                                    |
| ------------------ | ------------------------------------------------------------------ |
| Tarjeta            | `bg-surface border-border`; cabecera con `border-b` y marca dorada |
| Píldora de serie   | `bg-muted text-primary`                                            |
| Bloque del espacio | `bg-muted`; tipo en `bg-surface text-primary`                      |
| Ocurrencia actual  | `bg-header border-primary/40`                                      |
| Estado Pendiente   | `bg-accent-gold/10 text-accent-gold`                               |
| Estado Cancelada   | `bg-muted text-text-secondary`                                     |
| Estado Aprobada    | `bg-emerald-50 text-emerald-700`                                   |
| Estado Rechazada   | `bg-red-50 text-red-700`                                           |

La paleta no tiene tokens de éxito ni de error, por eso Aprobada y Rechazada usan la paleta estándar de Tailwind. Estos colores desaparecen de aquí cuando se use `app-estado-badge` de G5.

## Accesibilidad

- La tarjeta es un `<article>` etiquetado "Reserva N"; los datos usan una lista de definiciones (`<dl>`).
- El estado se expresa con texto, no solo con color.
- Los estados de carga, no encontrada y error se anuncian con `role="status"` o `role="alert"`.

## Verificación

```sh
npm run build
npm test -- --watch=false
```

9 pruebas: 8 del componente, con un servicio de prueba dentro del propio archivo (reserva puntual, serie con ocurrencia actual, sin recursos, no encontrada, cargando, error, cambio de id y `diasTexto`), y 1 de `ReservaService`.
