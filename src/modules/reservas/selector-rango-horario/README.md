# C4-04 · Selector de rango horario

| Campo       | Valor                                                             |
| ----------- | ----------------------------------------------------------------- |
| ID          | **C4-04**                                                         |
| Selector    | `app-selector-rango-horario`                                      |
| Clase       | `SelectorRangoHorarioComponent`                                   |
| Tipo        | Compartido UI (sin servicios); solo lo usa el módulo de reservas  |
| Grupo dueño | G4 · Reservas                                                     |
| Se usa en   | `app-filtros-disponibilidad` (C4-02) y `app-reserva-form` (C4-06) |
| Historias   | G4-01, G4-02                                                      |

Selector de **fecha**, **hora de inicio** y **hora de fin** en formato de **24 horas**. La fecha se escribe en `dd/mm/aaaa` o se elige en un calendario; las horas se escriben (`14:30`, `930`) o se eligen de una lista cada 15 minutos. Valida el rango y marca en rojo solo el campo que causa el error.

## Archivos

```text
src/modules/reservas/selector-rango-horario/
├── README.md
├── selector-rango-horario.ts        # Componente + horaEnMinutos / diagnosticarRangoHorario / validarRangoHorario / ahoraEnGuayaquil
├── selector-rango-horario.html      # Plantilla con Tailwind
├── selector-rango-horario.spec.ts
└── campo-hora.ts / .html / .spec.ts # Pieza interna: campo de hora en 24 h con lista desplegable
```

El campo de fecha es `app-campo-fecha`, pieza de C4-05 (`app/shared/components/selector-rango-fechas/campo-fecha.ts`).

## Uso

```ts
import {
  RangoHorario,
  SelectorRangoHorarioComponent,
} from '../selector-rango-horario/selector-rango-horario';

@Component({
  imports: [SelectorRangoHorarioComponent],
  template: `
    <app-selector-rango-horario
      fechaMin="2026-10-01"
      horaMin="07:00"
      horaMax="21:00"
      [soloDiasHabiles]="true"
      (rangoChange)="guardarRango($event)"
    />
  `,
})
export class ReservaFormComponent {
  guardarRango(rango: RangoHorario) {
    // rango = { fecha: '2026-10-02', inicio: '09:00', fin: '10:30' }
  }
}
```

Para **precargar** valores (el formulario de reserva con lo que se buscó) o **limpiarlos** (botón Limpiar de `app-barra-filtros`), usar enlace doble: `[(fecha)]`, `[(inicio)]` y `[(fin)]`.

## Contrato

| Entrada           | Tipo                  | Por defecto         | Descripción                                                                                        |
| ----------------- | --------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `fechaMin`        | `string` (YYYY-MM-DD) | —                   | Primera fecha permitida (los días anteriores no se pueden elegir).                                 |
| `horaMin`         | `string` (HH:mm)      | —                   | Hora de inicio más temprana permitida.                                                             |
| `horaMax`         | `string` (HH:mm)      | —                   | Hora de fin más tardía permitida.                                                                  |
| `fecha`           | `string` (YYYY-MM-DD) | `''`                | `model()`: admite `[fecha]` y `[(fecha)]`.                                                         |
| `inicio` / `fin`  | `string` (HH:mm)      | `''`                | `model()`: admiten `[inicio]` / `[(inicio)]` y `[fin]` / `[(fin)]`.                                |
| `soloDiasHabiles` | `boolean`             | `false`             | Solo de lunes a viernes: el calendario desactiva sábados y domingos.                               |
| `pasoMinutos`     | `number`              | `15`                | Las horas deben ser múltiplos de estos minutos; la lista usa el mismo paso. `0` = sin restricción. |
| `etiqueta`        | `string`              | `'Fecha y horario'` | Título de la tarjeta.                                                                              |
| `enmarcado`       | `boolean`             | `true`              | Con `false` se muestra sin tarjeta ni título visible, para integrarlo en otra (lo usa C4-02).      |

Las cuatro últimas entradas son opcionales y se añadieron al contrato del Excel.

| Salida                                       | Tipo                     | Cuándo se emite                                                              |
| -------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `rangoChange`                                | `{ fecha, inicio, fin }` | Solo cuando el usuario deja los tres valores completos y el rango es válido. |
| `fechaChange` / `inicioChange` / `finChange` | `string`                 | Generadas por `model()` en cada cambio, aunque el rango esté incompleto.     |

Precargar valores desde el padre no emite `rangoChange`.

## Validaciones

En este orden; el mensaje aparece en un recuadro rosado con icono y **solo se marca en rojo el campo culpable**:

| Regla                                                     | Campo marcado |
| --------------------------------------------------------- | ------------- |
| Los tres campos completos                                 | Los vacíos    |
| Fecha real y no anterior a `fechaMin`                     | Fecha         |
| De lunes a viernes (si `soloDiasHabiles`)                 | Fecha         |
| Horas en formato de 24 h (`14:30`)                        | La inválida   |
| Horas en múltiplos de `pasoMinutos`                       | La inválida   |
| Inicio no antes de `horaMin`, fin no después de `horaMax` | Inicio / fin  |
| Fin posterior al inicio                                   | Fin           |
| Si la fecha es hoy, la hora de inicio no ha pasado        | Inicio        |

Con todos los campos vacíos no se muestra ningún error. Con un rango válido aparece una píldora con el resumen y la duración: `lun, 16 nov 2026 · 09:00–10:30 · 1 h 30 min`. La lista de **Hora de fin** empieza un paso después de la hora de inicio.

## Pieza interna: `app-campo-hora` (`campo-hora.ts`)

Campo de texto `hh:mm` en 24 horas con botón de reloj que abre una lista animada de horas cada `paso` minutos entre `min` y `max` (las horas en punto resaltadas). Mientras se escribe solo acepta `hh:mm` completo; `930` o `9:30` se completan a `09:30` al salir del campo. Teclado: flechas, Inicio/Fin, Enter, Escape. Funciones: `leerHora`, `minutosDe`, `horaDe`.

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md); sin CSS propio ni hexadecimales. Mismo aspecto que C4-05 y que la barra de filtros.

| Elemento  | Clases de color                                                                              |
| --------- | -------------------------------------------------------------------------------------------- |
| Tarjeta   | `bg-surface border-border`; cabecera separada con `border-b` y marca `bg-accent-gold`        |
| Etiquetas | `text-primary-dark`                                                                          |
| Campos    | `bg-surface border-border`, `hover:border-primary/40`, foco `border-primary ring-primary/10` |
| Listas    | hora elegida `bg-primary text-white`, en punto `font-semibold`, resto `text-text-secondary`  |
| Resumen   | píldora `bg-muted`                                                                           |
| Error     | recuadro `bg-red-50 text-red-700` con icono; campo culpable `border-red-700`                 |

La paleta no tiene token de error; se usa `red-700` de Tailwind, igual que C4-05.

## Verificación

```sh
npm run build
npm test -- --watch=false
```

19 pruebas: 14 del componente (rango válido, fin no posterior, fecha mínima, horas fuera del horario, fecha legible, precarga, limpieza, enlace doble, error solo en el campo culpable, resumen con duración, intervalos de 15 min, lunes a viernes, hora pasada) y 5 de `campo-hora` (lista en 24 h, elegir, horas abreviadas, escritura a medias, funciones).
