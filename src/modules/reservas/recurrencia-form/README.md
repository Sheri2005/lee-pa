# C4-09 · Formulario de recurrencia

| Campo       | Valor                                         |
| ----------- | --------------------------------------------- |
| ID          | **C4-09**                                     |
| Selector    | `app-recurrencia-form`                        |
| Clase       | `RecurrenciaFormComponent`                    |
| Tipo        | Hijo (formulario)                             |
| Grupo dueño | G4 · Reservas                                 |
| Responsable | Justin Soledispa                              |
| Se usa en   | `app-reserva-form` (C4-06, `/reservas/nueva`) |
| Contiene    | `app-selector-rango-fechas` (C4-05)           |
| Historia    | G4-06                                         |

Recurrencia **semanal** de una reserva: días de la semana y rango de fechas (por ejemplo, todos los martes de octubre). Muestra cuántas reservas se generarán y sus fechas. No consulta disponibilidad: eso lo hace el formulario de reserva con las fechas que genera.

## Archivos

```text
src/modules/reservas/recurrencia-form/
├── README.md
├── recurrencia-form.ts        # Componente standalone + generarFechas / validarRecurrencia
├── recurrencia-form.html      # Plantilla con Tailwind
└── recurrencia-form.spec.ts
```

Usa `DiaSemana` y `ReservaSerie` de `src/app/core/models/reserva.model.ts`, y `app-campo-fecha` de C4-05.

## Uso

Dentro del formulario de reserva, pasando la fecha de la reserva para no pedirla dos veces:

```ts
import {
  generarFechas,
  Recurrencia,
  RecurrenciaFormComponent,
} from '../recurrencia-form/recurrencia-form';

@Component({
  imports: [RecurrenciaFormComponent],
  template: `
    <app-recurrencia-form [fechaInicio]="fecha()" (recurrenciaChange)="recurrencia.set($event)" />
  `,
})
export class ReservaFormComponent {
  fecha = signal('2026-11-10'); // la elegida en app-selector-rango-horario
  recurrencia = signal<Recurrencia | null>(null);
  fechas = computed(() => (this.recurrencia() ? generarFechas(this.recurrencia()!) : []));
}
```

## Dos formas de uso

| Con `fechaInicio`                                                                                                    | Sin `fechaInicio`                                                       |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| La serie empieza en la fecha de la reserva, que se muestra fija ("Empieza: mar, 10 nov 2026 · fecha de la reserva"). | Se elige **Desde** y **Hasta** con `app-selector-rango-fechas` (C4-05). |
| Solo se pide **Repetir hasta**; el calendario marca el inicio y los días intermedios.                                | Atajos **Esta semana**, **Este mes** y **Período**.                     |
| El día de la semana de esa fecha queda elegido.                                                                      | Ningún día elegido al inicio.                                           |

## Contrato

| Entrada           | Tipo                      | Por defecto     | Descripción                                                         |
| ----------------- | ------------------------- | --------------- | ------------------------------------------------------------------- |
| `fechaInicio`     | `string` (YYYY-MM-DD)     | `''`            | Fecha de la reserva que se repite. Si se indica, es el inicio fijo. |
| `fechaMin`        | `string` (YYYY-MM-DD)     | hoy             | La serie no puede empezar antes.                                    |
| `diasHabilitados` | `readonly DiaSemana[]`    | lunes a viernes | Días que se pueden elegir. Política actual: de lunes a viernes.     |
| `maxDias`         | `number`                  | `90`            | Días máximos que puede abarcar la serie.                            |
| `periodos`        | `readonly PeriodoRango[]` | `[]`            | Se pasan a C4-05 para su atajo **Período**.                         |
| `fechaReferencia` | `string`                  | `''` (hoy)      | Se pasa a C4-05 para calcular sus atajos.                           |
| `dias`            | `DiaSemana[]`             | `[]`            | `model()`: días elegidos.                                           |
| `desde` / `hasta` | `string` (YYYY-MM-DD)     | `''`            | `model()`: rango de la serie.                                       |

| Salida              | Tipo                  | Cuándo se emite                                                                |
| ------------------- | --------------------- | ------------------------------------------------------------------------------ |
| `recurrenciaChange` | `Recurrencia \| null` | En cada cambio del usuario: la recurrencia si es válida, o `null` si no lo es. |

`Recurrencia` es una serie de reserva sin `id` (tabla `reserva_serie`):

```ts
{ frecuencia: 'SEMANAL', dias_semana: ['LUNES', 'MIERCOLES'], fecha_desde: '2026-11-09', fecha_hasta: '2026-11-25' }
```

Los días se emiten siempre en orden de lunes a sábado. Precargar valores no emite.

## Validaciones

| Regla                                | Mensaje                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| Al menos un día                      | Elige al menos un día de la semana.                          |
| Rango completo                       | Elige la fecha inicial y la final de la serie.               |
| Fecha final no anterior a la inicial | Lo muestra C4-05; aquí no se repite.                         |
| No empezar antes de `fechaMin`       | La serie no puede empezar antes de …                         |
| Hasta `maxDias` días                 | La serie puede abarcar hasta 90 días.                        |
| Al menos una fecha generada          | Ninguno de los días elegidos cae dentro del rango de fechas. |

Con todo vacío no se muestra ningún error. Cuando la recurrencia es válida se muestra un recuadro con el total ("6 reservas") y las fechas, hasta 6 y "y N más". El resumen propio de C4-05 se oculta para no repetir información.

## Funciones puras

| Función                                    | Uso                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `generarFechas(recurrencia)`               | Fechas `YYYY-MM-DD` de la serie, en orden. La usarán C4-06 y C4-10 para cada ocurrencia. |
| `validarRecurrencia(r, maxDias, fechaMin)` | Mensaje de error o `null`.                                                               |

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md). Mismo patrón de tarjeta que la barra de filtros.

| Elemento       | Clases de color                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| Tarjeta        | `bg-surface border-border`; cabecera con `border-b` y marca `bg-accent-gold`    |
| Día elegido    | `bg-primary border-primary text-white`, `hover:bg-accent`                       |
| Día sin elegir | `bg-surface border-border`, al pasar el ratón se eleva con `hover:bg-muted`     |
| Inicio fijo    | `bg-muted border-border`                                                        |
| Resumen        | recuadro `bg-muted` con icono de repetir                                        |
| Error          | recuadro `bg-red-50 text-red-700` con icono (la paleta no tiene token de error) |

## Accesibilidad

- Los días son botones con `aria-pressed` y el nombre completo en `aria-label` ("Miércoles").
- La tarjeta y el grupo de días están etiquetados; el error usa `role="alert"` y el resumen `aria-live="polite"`.

## Verificación

```sh
npm run build
npm test -- --watch=false
```

10 pruebas: días habilitados, recurrencia válida con su resumen, sin días, desmarcar el último día, más de 90 días, ningún día dentro del rango, precarga sin emitir, fecha mínima, inicio fijo con su día elegido y las funciones `generarFechas` / `validarRecurrencia`.
