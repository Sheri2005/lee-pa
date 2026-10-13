# C4-10 · Ocurrencias recurrentes

| Campo       | Valor                                         |
| ----------- | --------------------------------------------- |
| ID          | **C4-10**                                     |
| Selector    | `app-ocurrencias-recurrentes`                 |
| Clase       | `OcurrenciasRecurrentesComponent`             |
| Tipo        | Hijo                                          |
| Grupo dueño | G4 · Reservas                                 |
| Se usa en   | `app-reserva-form` (C4-06, `/reservas/nueva`) |
| Historia    | G4-06                                         |

Lista de las fechas que genera una reserva recurrente, cada una con su horario y su estado: **Disponible**, **Con conflicto** o **Por comprobar**. En las fechas con conflicto explica con qué choca (una clase o una reserva aprobada) y por qué (cruce de horario o menos de 15 minutos de separación).

No consulta servicios ni genera fechas: C4-06 genera las fechas con `generarFechas` de C4-09, las evalúa con `OcupacionService` y le pasa el resultado.

## Archivos

```text
src/modules/reservas/ocurrencias-recurrentes/
├── README.md
├── ocurrencias-recurrentes.ts        # Componente + fechaConDia / describirConflicto
├── ocurrencias-recurrentes.html      # Plantilla con Tailwind
└── ocurrencias-recurrentes.spec.ts
```

Usa `Ocurrencia` de `src/app/core/models/ocupacion.model.ts` y `SEPARACION_MINUTOS` de `src/app/core/services/ocupacion.service.ts`.

## Uso

```ts
import { OcurrenciasRecurrentesComponent } from '../ocurrencias-recurrentes/ocurrencias-recurrentes';

@Component({
  imports: [OcurrenciasRecurrentesComponent],
  template: `<app-ocurrencias-recurrentes [ocurrencias]="ocurrencias()" />`,
})
export class ReservaFormComponent {
  // Mientras no hay resultado: ocurrenciasPendientes(fechas, inicio, fin) (todas "Por comprobar").
  // Con resultado: evaluarDisponibilidad(...).ocurrencias.
  ocurrencias = computed<Ocurrencia[]>(() => /* … */);
}
```

## Contrato

| Entrada       | Tipo                    | Por defecto | Descripción                                                   |
| ------------- | ----------------------- | ----------- | ------------------------------------------------------------- |
| `ocurrencias` | `readonly Ocurrencia[]` | `[]`        | Fechas de la serie, en orden, con su estado y sus conflictos. |

Sin salidas, como indica el contrato del Excel.

```ts
interface Ocurrencia {
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm
  hora_fin: string;
  estado: 'PENDIENTE' | 'DISPONIBLE' | 'CONFLICTO';
  conflictos: { ocupacion: Ocupacion; motivo: 'CRUCE' | 'SEPARACION' }[];
}
```

## Comportamiento

- Cada fila: día y fecha (`Mar 13/10/2026`), horario y estado con **texto e icono** (no solo color). Cada fila lleva una barra de color a la izquierda según su estado (verde disponible, roja con conflicto, gris por comprobar); las de conflicto tienen además fondo rosado y la explicación debajo:
  - «Se cruza con la clase Cálculo I · P1 (08:00–10:00).»
  - «Quedan menos de 15 minutos libres con la reserva aprobada «Jornada de tutorías» (14:00–16:00).»
- Cabecera con el resumen, que se anuncia a lectores de pantalla: «12 disponibles, 2 con conflicto» o «14 fechas por comprobar».
- Cuando hay fechas comprobadas aparece el filtro **Todas (N) · Disponibles (N) · Con conflicto (N)**. Una opción sin fechas queda deshabilitada; si la elegida se queda sin fechas (por ejemplo, se resuelven los conflictos), vuelve a mostrar todas.
- Muestra 8 filas y un botón **Ver las N restantes** (una serie de 90 días de lunes a viernes llega a 65 fechas).
- Sin ocurrencias, muestra un estado vacío que indica qué falta elegir.

## Dependencias TEMPORALES

| Pieza futura              | Dueño | Qué hace hoy C4-10                                       |
| ------------------------- | ----- | -------------------------------------------------------- |
| `app-tabla-datos` (C4-20) | G4    | Lista sencilla con las columnas Fecha, Horario y Estado. |
| `app-estado-badge`        | G5    | Etiqueta propia con icono y texto.                       |

Cuando existan, se sustituyen dentro de la plantilla sin cambiar la entrada `ocurrencias`.

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md); sin CSS propio ni hexadecimales.

| Elemento      | Clases de color                                                                    |
| ------------- | ---------------------------------------------------------------------------------- |
| Tarjeta       | `bg-surface border-border`; cabecera con `border-b` y marca `bg-accent-gold`       |
| Filtro        | `bg-header`; opción activa `bg-surface text-primary`                               |
| Disponible    | `bg-emerald-50 text-emerald-700`                                                   |
| Con conflicto | `bg-red-50 text-red-700`, fila con barra `bg-red-700` a la izquierda               |
| Barra lateral | `bg-emerald-600` disponible, `bg-red-700` con conflicto, `bg-border` por comprobar |
| Por comprobar | `bg-muted text-text-secondary`                                                     |

La paleta no tiene tokens de éxito ni de error; se usan `emerald-700` y `red-700`, como en el resto del grupo.

## Accesibilidad

- Lista ordenada (`<ol>`); el estado siempre se lee como texto.
- El resumen de la cabecera es `role="status"`.
- El filtro usa botones con `aria-pressed`; **Ver las N restantes** tiene `aria-expanded` y `aria-controls`.
- Transiciones desactivadas con `motion-reduce`.

## Verificación

```sh
npx ng test --watch=false
npx ng build
```

7 pruebas: estado vacío, fecha/horario/estado en texto con su resumen, todo por comprobar sin filtro, explicación de conflictos y filtro, filtro Todas / Disponibles / Con conflicto con su cantidad, 8 filas con despliegue, y textos de separación y reservas. Revisado en la vista previa temporal a 390 y 1280 px.
