# C4-21 · Barra de filtros · `app-barra-filtros`

Componente compartido del Grupo 4 · Reservas. Lo reutilizan G1, G2, G3 y G5 en sus listados.

Contenedor de filtros en fila con los botones **Limpiar** y **Buscar**. Cada pantalla coloca sus
propios campos dentro de la barra.

## Entradas y salidas

| Tipo    | Nombre           | Descripción                                                               |
| ------- | ---------------- | ------------------------------------------------------------------------- |
| Input   | `titulo`         | Texto de la cabecera. Valor por defecto: `'Filtros'`.                     |
| Input   | `filtrosActivos` | Número de filtros aplicados. Si es mayor que 0 se muestra un contador.    |
| Input   | `accionesAbajo`  | Opcional (`false`). Con `true`, Limpiar y Buscar van en su propia fila.   |
| Output  | `buscar`         | Se emite al pulsar **Buscar** o al presionar Enter dentro de un campo.    |
| Output  | `limpiar`        | Se emite al pulsar **Limpiar**. La pantalla restablece sus propios datos. |
| Content | `<ng-content>`   | Campos de filtro: inputs, selects o selectores de dominio.                |

La barra no almacena los valores de los filtros; solo los presenta y notifica cuándo buscar o
limpiar.

## Uso

```ts
import { BarraFiltrosComponent } from '<ruta>/app/shared/components/barra-filtros/barra-filtros';

@Component({
  imports: [FormsModule, BarraFiltrosComponent],
})
```

```html
<app-barra-filtros
  titulo="Filtrar reservas"
  [filtrosActivos]="activos"
  (buscar)="buscar()"
  (limpiar)="limpiar()"
>
  <label class="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
    Estado
    <select
      name="estado"
      [(ngModel)]="filtros.estado"
      class="min-h-[43px] rounded-lg border border-border bg-surface px-3 text-sm font-normal text-primary-dark focus:border-primary focus:outline-none"
    >
      <option value="">Todos</option>
      <option value="PENDIENTE">Pendiente</option>
      <option value="APROBADA">Aprobada</option>
    </select>
  </label>

  <label class="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
    Fecha
    <input
      name="fecha"
      type="date"
      [(ngModel)]="filtros.fecha"
      class="min-h-[43px] rounded-lg border border-border bg-surface px-3 text-sm font-normal text-primary-dark focus:border-primary focus:outline-none"
    />
  </label>
</app-barra-filtros>
```

Cada campo ocupa una columna de la grilla (mínimo 11 rem) y pasa a la siguiente línea cuando no hay
espacio.

Con formularios reactivos, colocar `[formGroup]` en el propio `<app-barra-filtros>` o en un
contenedor externo, no en un `<form>`, ya que la barra es un formulario y no deben anidarse.

## Botones abajo (`accionesAbajo`)

Por defecto los botones van a la derecha de los filtros, en la misma fila. Con muchos filtros en varias filas (por ejemplo `app-filtros-disponibilidad`, C4-02) conviene `[accionesAbajo]="true"`: los filtros usan todo el ancho y **Limpiar** y **Buscar** pasan a una fila propia, abajo a la derecha, separada por una línea.

```html
<app-barra-filtros titulo="Buscar espacios disponibles" [accionesAbajo]="true">…</app-barra-filtros>
```

## En móvil

Por debajo de `md` (768 px) los campos y los botones se pliegan y la cabecera muestra un botón
**Mostrar** / **Ocultar** (`aria-expanded`, `aria-controls`). Empieza plegada; el contador de
filtros activos sigue visible en la cabecera. Desde `md` los filtros siempre están desplegados y el
botón no aparece.

## Paleta

Solo tokens de [`TAILWIND-Y-COLORES.md`](../../../../../TAILWIND-Y-COLORES.md), sin hexadecimales.

| Uso                         | Clases                                  |
| --------------------------- | --------------------------------------- |
| Contenedor                  | `bg-filter border-border`               |
| Título                      | `text-primary-dark`                     |
| Marca y contador de activos | `bg-accent-gold`, `text-accent-gold`    |
| Botón Buscar                | `bg-primary text-white hover:bg-accent` |
| Botón Limpiar y Mostrar     | `text-primary hover:bg-header`          |
| Foco                        | `outline-accent`                        |
| Separadores y bordes        | `border-border`                         |
