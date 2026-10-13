# C4-12 · Detalle de reserva

| Campo       | Valor                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| ID          | **C4-12**                                                                                                       |
| Selector    | `app-reserva-detalle`                                                                                           |
| Clase       | `ReservaDetalleComponent`                                                                                       |
| Tipo        | Diálogo                                                                                                         |
| Grupo dueño | G4 · Reservas                                                                                                   |
| Se usa en   | `app-mis-reservas` (C4-11)                                                                                      |
| Contiene    | `app-resumen-reserva` (C4-13); `app-historial-trazabilidad` (G5) y `app-dialogo-confirmacion` (G2) — `TEMPORAL` |
| Servicio    | `ReservaService.obtenerResumen`                                                                                 |
| Historia    | G4-03                                                                                                           |

Diálogo que abre _Mis reservas_ para ver una reserva: su resumen (C4-13), la trazabilidad de la aprobación y, si corresponde, la cancelación de esa fecha o de toda la serie.

## Archivos

```text
src/modules/reservas/reserva-detalle/
├── README.md
├── reserva-detalle.ts       # Componente + reservaCancelable / fechasCancelables / hoyEnGuayaquil
├── reserva-detalle.html     # Plantilla con Tailwind
└── reserva-detalle.spec.ts
```

## Uso

```html
@if (abierta(); as id) {
<app-reserva-detalle
  [reservaId]="id"
  [usuarioActualId]="usuario.id"
  (cerrar)="abierta.set(null)"
  (cancelar)="cancelar(id, $event)"
/>
}
```

## Contrato

| Entrada           | Tipo             | Descripción                                                                            |
| ----------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `reservaId`       | `number`         | Obligatoria. Id de la fecha (reserva) que se abre.                                     |
| `usuarioActualId` | `number \| null` | Opcional, añadida al contrato del Excel: para comprobar que la reserva es del usuario. |

| Salida     | Tipo                 | Cuándo se emite                                                                                                              |
| ---------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `cancelar` | `'FECHA' \| 'SERIE'` | Tras confirmar. **Cambia el contrato del Excel** (antes `void`): indica si se cancela solo la fecha abierta o toda la serie. |
| `cerrar`   | `void`               | Añadida al contrato: ✕, botón _Cerrar_, Escape o clic fuera del diálogo.                                                     |

El componente solo emite: quien lo usa (C4-11) llama al servicio para cancelar.

## Cancelación

| Regla                                 | Detalle                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Quién puede                           | Solo quien hizo la reserva (`usuarioActualId` = solicitante).                                      |
| Qué fecha                             | La abierta debe estar **pendiente o aprobada** y ser **de hoy en adelante** (`America/Guayaquil`). |
| Aprobación de una serie               | Se aprueba o rechaza **completa** (G5); todas sus fechas tienen el mismo estado.                   |
| Serie con más de una fecha cancelable | Se elige **Solo esta fecha** (por defecto) o **Toda la serie** («Las N fechas pendientes»).        |
| Fechas pasadas                        | No cambian, ni con «Toda la serie».                                                                |

Mientras se confirma, el botón _Cancelar reserva_ del pie se oculta para no repetir la acción.

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md); sin CSS propio ni hexadecimales.

| Elemento               | Clases de color                                                    |
| ---------------------- | ------------------------------------------------------------------ |
| Fondo                  | `bg-wine-deep/40` con desenfoque                                   |
| Diálogo                | `bg-background`, cabecera y pie `bg-surface`, título `text-[15px]` |
| Confirmación           | tarjeta `bg-surface border-border` con marca `bg-accent-gold`      |
| Opción elegida         | `border-primary ring-primary bg-header`                            |
| Confirmar              | `bg-primary hover:bg-accent`                                       |
| Cancelar reserva (pie) | `bg-red-50 text-red-700` (la paleta no tiene token de error)       |

## Accesibilidad

- `role="dialog"` con `aria-modal`; al abrirse el foco pasa al diálogo.
- Escape cierra primero la confirmación y luego el diálogo; clic fuera también cierra.
- Las opciones de cancelación son botones `role="radio"` dentro de un `role="radiogroup"`, con `aria-checked`.
- El estado se muestra en texto legible («Aprobada»), no en mayúsculas del modelo.

## Verificación

```sh
npx ng test --watch=false
npx ng build
npx ngc -p tsconfig.app.json --noEmit
```

8 pruebas con un servicio falso dentro del spec: diálogo con resumen y trazabilidad, reglas de cancelación, en una serie solo cuenta la fecha abierta, elección entre esta fecha y toda la serie, confirmación antes de emitir, cerrar con botón y Escape, Escape cierra primero la confirmación, y estado legible con foco y clic fuera.
