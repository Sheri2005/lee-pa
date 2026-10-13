# C4-18 · Recursos de la reserva

| Campo       | Valor                                         |
| ----------- | --------------------------------------------- |
| ID          | **C4-18**                                     |
| Selector    | `app-recursos-de-reserva`                     |
| Clase       | `RecursosDeReservaComponent`                  |
| Tipo        | Hijo                                          |
| Grupo dueño | G4 · Reservas                                 |
| Se usa en   | `app-reserva-form` (C4-06, `/reservas/nueva`) |
| Historia    | G4-10 (prioridad baja)                        |

En el formulario de reserva, después de elegir espacio, fecha y horario, permite **pedir equipos prestados** junto con el espacio (proyector móvil, laptops, micrófono…). Muestra cuántas unidades quedan libres en ese horario y no deja pedir más de esas.

No tiene botón de confirmar: lo elegido se envía con el botón **Enviar solicitud** del formulario completo.

## Archivos

```text
src/modules/reservas/recursos-de-reserva/
├── README.md
├── recursos-de-reserva.ts       # Componente standalone + franjaValida
├── recursos-de-reserva.html     # Plantilla con Tailwind
└── recursos-de-reserva.spec.ts

src/app/core/
├── models/reserva.model.ts                   # RecursoReservable, RecursoSolicitado, DisponibilidadRecurso
└── services/recurso-reservable.service.ts    # disponibilidad(fecha, inicio, fin)
```

`RecursoReservableService.disponibilidad` todavía no está conectado al backend: devuelve una lista vacía. Cuando exista la API (por ejemplo `GET /recursos-reservables/disponibilidad`), el backend calculará las unidades libres y solo cambiará el servicio.

## Uso

```ts
import { RecursosDeReservaComponent } from '../recursos-de-reserva/recursos-de-reserva';

@Component({
  imports: [RecursosDeReservaComponent],
  template: `
    <app-recursos-de-reserva
      [fecha]="fecha()"
      [horaInicio]="inicio()"
      [horaFin]="fin()"
      (recursosChange)="recursos.set($event)"
    />
  `,
})
export class ReservaFormComponent {
  recursos = signal<RecursoSolicitado[]>([]);
}
```

La fecha y las horas son las que el usuario eligió en `app-selector-rango-horario` del mismo formulario.

## Contrato

| Entrada      | Tipo                  | Por defecto | Descripción          |
| ------------ | --------------------- | ----------- | -------------------- |
| `fecha`      | `string` (YYYY-MM-DD) | `''`        | Fecha de la reserva. |
| `horaInicio` | `string` (HH:mm)      | `''`        | Inicio de la franja. |
| `horaFin`    | `string` (HH:mm)      | `''`        | Fin de la franja.    |

| Salida           | Tipo                  | Cuándo se emite                                                                                                              |
| ---------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `recursosChange` | `RecursoSolicitado[]` | Cada vez que cambia la selección, incluido un ajuste por cambio de franja. Solo recursos con cantidad > 0, ordenados por id. |

```ts
interface RecursoSolicitado {
  recurso_reservable_id: number;
  cantidad: number;
} // fila de la tabla reserva_recurso, sin reserva_id
```

## Reglas

- Solo consulta cuando la franja está completa: fecha válida, horas `HH:mm` e inicio anterior al fin. Antes muestra "Elige la fecha y el horario para ver los recursos disponibles".
- Se listan los recursos activos que devuelve el servicio, en dos columnas, cada uno con "N de M disponibles" y una barra de unidades libres. Al pedir unidades, la barra y el texto se reducen ("Quedan 2 de 6"; "No quedan más unidades libres" si se piden todas).
- Las unidades libres son la cantidad total menos lo prestado en reservas **APROBADAS** que se cruzan con la franja, igual que para los espacios.
- La cantidad se elige con − / + o escribiendo; si se escribe más de lo disponible se recorta y se avisa ("Solo hay 1 unidad libre").
- Si cambia la fecha u horario y quedan menos unidades, la cantidad se ajusta (o el recurso se quita) y se avisa en su tarjeta.
- Abajo se resume lo elegido: **Agregado a la reserva: Laptop × 2 · Micrófono × 1**; en la cabecera, el total de unidades.

La validación definitiva al guardar la reserva la tendrá que repetir el backend, porque otra persona puede reservar el mismo recurso mientras tanto.

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md).

| Elemento          | Clases de color                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| Tarjeta           | `bg-surface border-border`; cabecera con `border-b` y marca `bg-accent-gold` |
| Recurso           | `border-border`; con unidades pedidas `border-primary/40 bg-muted/50`        |
| Barra de unidades | `bg-primary/70` sobre `bg-border`                                            |
| Botones − / +     | `text-primary hover:bg-muted`                                                |
| Total y avisos    | `text-accent-gold`; avisos en `bg-accent-gold/10`                            |
| Resumen           | recuadro `bg-muted` con check                                                |
| Error             | `bg-red-50 text-red-700` (la paleta no tiene token de error)                 |

## Accesibilidad

- Cada campo y botón tiene `aria-label` con el nombre del recurso ("Agregar una unidad de Laptop").
- Los botones se desactivan en 0 y en el máximo disponible.
- Los avisos y el resumen se anuncian (`role="status"`, `aria-live`).

## Verificación

```sh
npm run build
npm test -- --watch=false
```

9 pruebas: 8 del componente, con un servicio de prueba dentro del propio archivo (franja incompleta o invertida, unidades libres, barra y texto que se reducen con cada unidad pedida, agregar y quitar, tope disponible, ajuste al cambiar de horario, resumen de lo agregado y `franjaValida`), y 1 de `RecursoReservableService`.
