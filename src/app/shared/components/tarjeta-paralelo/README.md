# app-tarjeta-paralelo (C2-12)

Tarjeta compacta de un paralelo: materia, código de paralelo, cupo, horas semanales, docente y tipo de espacio. Puede ser arrastrable y mostrar las horas pendientes de ubicar.

- **Grupo dueño:** G2 · Planificación (responsable: Paula Martillo)
- **Reutilizan:** G3 (paralelos por ubicar en el armado de horario) y G5 (resumen de la solicitud y exportación)
- **HU:** G2-07

Si necesitan un cambio, abran un issue para el Grupo 2. No copien el componente.

## Diseño

- Colores: usa los tokens compartidos de `src/styles.css` (guía en `TAILWIND-Y-COLORES.md`): `bg-primary` (código del paralelo), `text-primary-dark` (textos), `text-text-secondary`, `border-border`, `bg-surface`, `bg-muted` (etiquetas) y `accent-gold` (horas pendientes y docente sugerido).
- Responsive: ocupa el ancho de su contenedor; el nombre largo de la materia se recorta con "…" (el nombre completo sale al pasar el mouse) y las etiquetas bajan de línea en pantallas angostas.
- Solo Tailwind, sin CSS propio.

## Contrato

| Tipo    | Nombre          | Tipo de dato | Descripción |
| ------- | --------------- | ------------ | ----------- |
| Entrada | `paralelo`      | `Paralelo` (obligatorio) | Paralelo a mostrar |
| Entrada | `arrastrable`   | `boolean` (por defecto `false`) | Activa el arrastre y la agarradera |
| Entrada | `horasUbicadas` | `number` (opcional) | Si se envía, muestra la barra de horas ubicadas/pendientes |
| Salida  | `seleccionar`   | `Paralelo` | Al hacer clic o presionar Enter/Espacio |

El modelo `Paralelo` está en `src/app/core/models/paralelo.model.ts` y hay datos de prueba en `src/app/core/mocks/paralelos.mock.ts`.

## Uso

```ts
import { TarjetaParaleloComponent } from '../tarjeta-paralelo/tarjeta-paralelo.component';

@Component({ imports: [TarjetaParaleloComponent], ... })
```

```html
<!-- Solo lectura (G5, resumen) -->
<app-tarjeta-paralelo [paralelo]="paralelo" />

<!-- Para el armado de horario (G3) -->
<app-tarjeta-paralelo
  [paralelo]="paralelo"
  [arrastrable]="true"
  [horasUbicadas]="horasUbicadas(paralelo.id)"
  (seleccionar)="onSeleccionar($event)"
/>
```

## Arrastrar y soltar (G3)

Se usa el arrastre nativo de HTML. Al arrastrar, la tarjeta pone el paralelo completo en JSON con el tipo `PARALELO_DRAG_TYPE` (`application/x-spare-paralelo`) y su `id` como `text/plain`. En la celda de la grilla:

```ts
import { PARALELO_DRAG_TYPE } from '../tarjeta-paralelo/tarjeta-paralelo.component';

onDragOver(e: DragEvent) { e.preventDefault(); }

onDrop(e: DragEvent) {
  const paralelo: Paralelo = JSON.parse(e.dataTransfer!.getData(PARALELO_DRAG_TYPE));
}
```
