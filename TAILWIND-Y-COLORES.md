# Tailwind CSS y colores de la aplicación

Esta guía define los nombres compartidos para usar Tailwind CSS y la paleta visual de la aplicación. Los tokens están declarados en `src/styles.css` con la sintaxis de **Tailwind CSS 4**.

## Cómo usar los colores

Tailwind crea utilidades a partir de los tokens `--color-*` de `@theme`. Por ejemplo, `--color-primary` habilita `bg-primary`, `text-primary`, `border-primary`, `ring-primary` y otras utilidades de color.

```html
<button class="rounded-md bg-primary px-4 py-2 text-white hover:bg-accent">
  Guardar
</button>

<section class="border border-border bg-surface text-primary-dark">
  Contenido de una tarjeta
</section>
```

Usa las clases directamente en las plantillas Angular (`.html`) o en atributos de plantilla. Para estados, combina las variantes de Tailwind, por ejemplo `hover:bg-accent`, `focus:ring-2` o `disabled:opacity-50`.

## Paleta oficial

| Uso | Nombre del token | Clases Tailwind habituales | Color | Hex |
| --- | --- | --- | --- | --- |
| Color primario y botones | `primary` | `bg-primary`, `text-primary`, `border-primary` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#75001B;border:1px solid #999;border-radius:3px"></span> Vino oscuro | `#75001B` |
| Texto principal | `primary-dark` | `text-primary-dark`, `bg-primary-dark` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#5A0015;border:1px solid #999;border-radius:3px"></span> Vino muy oscuro | `#5A0015` |
| Acento principal | `accent` | `bg-accent`, `text-accent`, `border-accent` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#9A1232;border:1px solid #999;border-radius:3px"></span> Vino medio | `#9A1232` |
| Texto destacado en tabla | `brand` | `text-brand`, `bg-brand` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#621324;border:1px solid #999;border-radius:3px"></span> Vino UEES | `#621324` |
| Vino profundo | `wine-deep` | `text-wine-deep`, `bg-wine-deep` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#4A0011;border:1px solid #999;border-radius:3px"></span> Vino profundo | `#4A0011` |
| Texto secundario | `text-secondary` | `text-text-secondary` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#6F666A;border:1px solid #999;border-radius:3px"></span> Gris cálido | `#6F666A` |
| Fondo general | `background` | `bg-background` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#FAF7F8;border:1px solid #999;border-radius:3px"></span> Blanco rosado | `#FAF7F8` |
| Tarjetas y campos | `surface` | `bg-surface` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#FFFFFF;border:1px solid #999;border-radius:3px"></span> Blanco cálido | `#FFFFFF` |
| Bordes e inputs | `border` | `border-border`, `divide-border` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#EFE6EA;border:1px solid #999;border-radius:3px"></span> Gris rosado claro | `#EFE6EA` |
| Fondo secundario y estados suaves | `muted` | `bg-muted` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#F8EEF2;border:1px solid #999;border-radius:3px"></span> Rosa muy claro | `#F8EEF2` |
| Fondo de encabezados | `header` | `bg-header` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#FCF4F6;border:1px solid #999;border-radius:3px"></span> Rosa casi blanco | `#FCF4F6` |
| Fondo de grupos de filtros | `filter` | `bg-filter` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#FFFDFD;border:1px solid #999;border-radius:3px"></span> Blanco rosado suave | `#FFFDFD` |
| Cabecera de tabla | `table-header` | `bg-table-header` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#FCF6F8;border:1px solid #999;border-radius:3px"></span> Rosa pálido | `#FCF6F8` |
| Acento dorado de filtros | `accent-gold` | `bg-accent-gold`, `text-accent-gold`, `border-accent-gold` | <span style="display:inline-block;width:2.5rem;height:1rem;background:#B7731E;border:1px solid #999;border-radius:3px"></span> Oro oscuro | `#B7731E` |

## Ejemplos para componentes

### Botón principal

```html
<button class="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
  Crear horario
</button>
```

### Tarjeta y texto secundario

```html
<article class="rounded-lg border border-border bg-surface p-4">
  <h2 class="font-semibold text-primary-dark">Planificación actual</h2>
  <p class="mt-1 text-sm text-text-secondary">Período académico vigente</p>
</article>
```

### Tabla

```html
<thead class="bg-table-header text-brand">
  <!-- Encabezados -->
</thead>
<tr class="border-b border-border hover:bg-muted">
  <!-- Celdas -->
</tr>
```

## Convenciones del equipo

1. Para los colores definidos aquí, usa sus utilidades semánticas (`bg-primary`, `text-text-secondary`) en vez de repetir códigos hexadecimales en plantillas.
2. Mantén la intención del color: `primary` para acciones principales; `accent` para interacción o énfasis; `background`, `surface` y `muted` para superficies; `border` para separadores.
3. No uses `brand` y `primary` como sinónimos: `primary` es el color de acción y `brand` es el tono institucional asignado al texto destacado de tabla.
4. Si hace falta un color global nuevo, acuerda primero el nombre con el equipo y agrégalo como `--color-<nombre>` dentro de `@theme` en `src/styles.css`.
5. Evita inventar colores arbitrarios (`bg-[#...]`) para elementos de la interfaz cuando exista un token adecuado.

## Nota sobre el nombre `border`

La paleta usa `border` para el token de bordes. Escribe la utilidad completa, por ejemplo `border-border` para el color. `border` por sí sola controla el ancho del borde en Tailwind.
