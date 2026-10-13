# Guía de colores de G1 · Gestión

Complemento de la guía oficial del proyecto, [`TAILWIND-Y-COLORES.md`](../../../TAILWIND-Y-COLORES.md),
que tiene **la paleta, los nombres de los tokens y las reglas**. Léela primero.

Aquí solo va lo propio de G1: las clases exactas que ya usan nuestras páginas (para que todo el
módulo se vea igual) y los colores de estado (activo, inactivo, advertencia).

Recordatorio rápido: nada de hexadecimales (`#75001b`) ni grises/rojos/azules de Tailwind
(`gray-600`, `red-500`…); se usan los tokens (`text-primary-dark`, `bg-muted`…). Ojo con
`text-secondary`: como clase de texto queda `text-text-secondary`.

---

## 1. Recetas listas para copiar

Son las clases que ya usan las páginas de G1 (facultades, carga masiva, bitácora).

**Título de página y migas de pan**
```html
<p class="text-sm text-text-secondary">Gestión / Facultades</p>
<h1 class="text-2xl font-semibold text-primary-dark">Facultades</h1>
<p class="mt-1 text-text-secondary">Administra las facultades y sus decanos.</p>
```

**Botón principal**
```html
<button
  type="button"
  class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
>
  Nueva facultad
</button>
```

**Botón secundario (con borde)**
```html
<button
  type="button"
  class="rounded-md border border-primary px-4 py-2 font-medium text-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
>
  Nueva carga
</button>
```

**Acción dentro de una tabla (Editar, Desactivar…)**
```html
<button type="button" class="rounded-md px-2 py-1 text-accent hover:bg-header">Editar</button>
```

**Campo de texto o select**
```html
<input
  class="rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary"
/>
```

**Panel de filtros**
```html
<div class="mt-4 flex flex-wrap items-end gap-4 rounded-md border border-border bg-filter p-4">
  …
</div>
```

**Tabla**
```html
<div class="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
  <table class="w-full text-left text-sm">
    <thead class="bg-table-header text-brand">
      <tr><th scope="col" class="px-4 py-3 font-semibold">Código</th></tr>
    </thead>
    <tbody>
      <tr class="border-t border-border hover:bg-muted">
        <td class="px-4 py-3">FI</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Mensaje de error**
```html
<!-- En un bloque -->
<div role="alert" class="rounded-md border border-accent bg-muted p-4 text-accent">
  No se pudieron cargar las facultades.
</div>

<!-- Debajo de un campo -->
<p role="alert" class="text-xs text-accent">El código es obligatorio.</p>
```

---

## 2. Estados: éxito, advertencia e inactivo

La paleta no tiene verde ni naranja, así que por ahora estos estados usan los de Tailwind. Son los
**únicos** colores fuera de la paleta, y siempre con estas mismas clases para que todo combine.

> PROPUESTA: según la regla 4 de `TAILWIND-Y-COLORES.md`, un color nuevo se acuerda con el equipo
> y se agrega como token en `src/styles.css`. Se propuso agregar `--color-success` (verde) y
> `--color-warning` (naranja). Si se aprueban, aquí se cambian `green-*` y `amber-*` por esos
> tokens.

| Estado      | Fondo         | Puntito / ícono  | Dónde se usa                        |
| ----------- | ------------- | ---------------- | ----------------------------------- |
| Éxito       | `bg-green-50` | `bg-green-600`   | "Activa" en facultades, "Activo" en períodos, "OK" en bitácora |
| Advertencia | —             | `fill-amber-500` | "Nº de errores" en bitácora         |
| Inactivo    | `bg-background` | `bg-text-secondary` | "Inactiva" en facultades, "Cerrado" en períodos |
| Pendiente   | `bg-header` (texto `text-accent-gold`) | `bg-accent-gold` | "En planificación" en períodos |

**Éxito o activo (pastilla verde con puntito)**
```html
<span class="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-0.5">
  <span class="size-2 rounded-full bg-green-600" aria-hidden="true"></span>
  Activa
</span>
```

**Inactivo (pastilla gris con puntito)**
```html
<span class="inline-flex items-center gap-2 rounded-full bg-background px-3 py-0.5 text-text-secondary">
  <span class="size-2 rounded-full bg-text-secondary" aria-hidden="true"></span>
  Inactiva
</span>
```

**Advertencia (número con círculo naranja y "!")**
```html
<span class="inline-flex items-center gap-1.5">
  3
  <svg class="size-4" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="8" class="fill-amber-500" />
    <rect x="7" y="3.5" width="2" height="6" rx="1" class="fill-white" />
    <circle cx="8" cy="12" r="1.1" class="fill-white" />
  </svg>
</span>
```

> El "!" es un dibujo (SVG) y no texto, a propósito: así las pruebas que leen el número de la
> celda siguen leyendo "3" y no "3 !".

Cuando G5 suba `app-estado-badge` (C5-08) a `main`, los estados Activo/Inactivo se reemplazan por
ese componente.

---

## 3. Antes de subir

- Busca en tus archivos `#`, `gray-`, `red-`, `blue-`: no debería aparecer ninguno, salvo los
  de la sección 2.
- Corre `ng build` y `ng test --watch=false`.
