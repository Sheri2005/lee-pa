# app-disponibilidad-docente (C2-16)

**Grupo 2 · Planificación — G2-09.** Página para registrar la disponibilidad de un docente en
un período: se elige período y docente y se marcan en una matriz **día × franja** las franjas
en que puede dictar. Las franjas salen del catálogo del M3 según el **tipo del período**
(ordinario o extraordinario), tal como pide la HU.

Esto es lo que después usa la asignación de docentes (C2-13 y C2-14): solo se sugiere un
docente si tiene disponibilidad registrada en el período.

- **Responsable:** Paula Martillo.
- **Ruta prevista:** `/planificacion/disponibilidad` (ver "Ruta" más abajo).
- **Reutiliza:** `app-estado-vacio` (C2-25) y `app-spinner-carga` (C2-26).

## Reglas que aplica

| Criterio (HU G2-09)                          | Cómo se cumple                                                       |
| -------------------------------------------- | -------------------------------------------------------------------- |
| Usa las franjas del tipo de período (M3)     | Las franjas se piden por `periodo.tipo`; al cambiar de período cambia la matriz |
| Selección por grilla día / franja            | Matriz de casillas; el encabezado de cada día marca o desmarca la columna completa |
| Copiar disponibilidad del período anterior   | Botón "Copiar de <período>", solo si hay un período anterior del mismo tipo con datos |

Además compara las horas marcadas con la carga máxima del docente y avisa si no alcanzan,
porque entonces no se le podrían asignar todos sus paralelos.

## Contrato

No tiene entradas ni salidas: es una página que trabaja contra `DisponibilidadService`.
Los cambios quedan en un borrador local hasta que se presiona **Guardar disponibilidad**;
"Descartar cambios" vuelve a lo guardado y al cambiar de docente o período el borrador se
descarta solo.

## Ruta

Esta rama **no modifica `src/app/app.routes.ts`** a propósito: hoy está vacío y el profesor
pidió solo componentes, así que tocarlo generaría conflictos con los demás grupos. Cuando el
equipo arme la navegación, la entrada es:

```ts
{
  path: 'planificacion/disponibilidad',
  loadComponent: () =>
    import('./features/planificacion/disponibilidad-docente/disponibilidad-docente.component')
      .then((m) => m.DisponibilidadDocenteComponent),
}
```

Debe quedar como ruta hija de `app-shell-layout` (C1-01, G1), igual que las demás páginas.

## Datos de prueba

`DisponibilidadService` trabaja en memoria sobre `core/mocks/disponibilidad.mock.ts`, así que lo
que se guarda se mantiene durante la sesión. Cuando exista la API solo cambia el cuerpo de cada
método; la pantalla no se toca.

| Período          | Franjas                                  | Caso que cubre                                  |
| ---------------- | ---------------------------------------- | ----------------------------------------------- |
| Semestre 2026-1  | Ordinario: lunes a viernes, 5 bloques    | María Torres ya tiene 4 franjas guardadas       |
| Verano 2026      | Extraordinario: lunes a sábado, 3 bloques | Matriz distinta al cambiar el tipo de período   |
| Semestre 2025-2  | Ordinario                                | Origen del botón "copiar del período anterior"  |

Con María Torres en 2026-1 se puede probar el copiado desde 2025-2; con Jorge Andrade, el aviso
de que no hay período anterior con datos.

## Piezas pendientes de otros grupos

- **`app-matriz-franjas` (C3-03, G3):** el catálogo indica que esta página la contiene. Mientras
  G3 no la publique, la matriz es una tabla de casillas propia. Buscar `EDITAR (C3-03)` en la
  plantilla; al reemplazarla, lo único que cambia es el bloque de la tabla.
- **`app-selector-periodo` (C1-28, G1)** y **`app-selector-docente` (C1-43, G1):** hoy son dos
  `<select>` propios sobre los mocks. Buscar `EDITAR (C1-28)` y `EDITAR (C1-43)`.
- **`app-encabezado-pagina` (C3-23, G3):** encabezado provisional. Buscar `EDITAR (C3-23)`.
- **Catálogos del M1 y M3:** períodos, docentes (con `carga_maxima_horas`) y franjas horarias
  vienen de otros módulos; `core/mocks/disponibilidad.mock.ts` los imita con la misma forma.

## Diseño

Solo Tailwind con los tokens de `src/styles.css` (guía en `TAILWIND-Y-COLORES.md`), sin CSS
propio. En pantallas angostas la matriz se desplaza horizontalmente y los días se abrevian
(Lun, Mar…). Cada casilla es un `checkbox` con etiqueta para lectores de pantalla, y el
encabezado del día usa `aria-pressed` para indicar si la columna está completa.

## Comprobación

```shell
npm run build
npm test -- --watch=false
```

Como todavía no tiene ruta, para verla en el navegador impórtala en `app.ts` y agrégala en
`app.html` como `<app-disponibilidad-docente />` (no incluir ese cambio en el commit).
