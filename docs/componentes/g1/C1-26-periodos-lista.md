# Listado de períodos (C1-26)

Página del módulo Gestión que muestra los períodos académicos con su tipo, fechas y estado, y
permite crearlos y editarlos con `app-periodo-form` (C1-27).

---

## 1. Qué es

| Dato             | Valor                                                              |
| ---------------- | ------------------------------------------------------------------ |
| ID               | C1-26                                                              |
| Selector         | `app-periodos-lista`                                               |
| Clase            | `PeriodosListaComponent`                                           |
| Tipo             | Página (tiene ruta propia)                                         |
| **Ruta**         | **`/gestion/periodos`**                                            |
| Grupo dueño      | G1 · Gestión (Julio Claros)                                        |
| Carpeta          | `src/app/features/gestion/periodos-lista/`                         |
| Depende de       | `PeriodoService`, `app-periodo-form` (C1-27)                       |
| `@Input` / `@Output` | Ninguno                                                        |

Lo que ve el usuario: el título **Períodos académicos** y una tabla con código, nombre, tipo,
inicio, fin y estado (**En planificación**, **Activo**, **Cerrado**), con los períodos más
recientes primero. También muestra mensajes de carga, de lista vacía y de error.

- **Nuevo período** (arriba a la derecha) abre el formulario vacío sobre la tabla.
- **Editar** (al final de cada fila) abre el formulario con los datos de ese período.
- Al guardar, el formulario se cierra, aparece "Período guardado." y la tabla se recarga. Si el
  guardado falla, se avisa y el formulario queda abierto para reintentar.

---

## 2. Cómo se conecta con el resto

- La ruta está declarada en `src/app/app.routes.ts` como **hija de `ShellLayout`**, igual que
  `/acceso-denegado`, y se carga de forma perezosa (`loadComponent`).
- La opción **Períodos** del menú lateral ya apunta a `/gestion/periodos` (`gestion.menu.ts`).
- Los datos vienen de `PeriodoService` (`listar`, `crear` y `actualizar`). Hoy trabaja en memoria
  sobre el mock `periodos.mock.ts`: los cambios se pierden al recargar la página.

---

## 3. Archivos

```
src/app/
├── app.routes.ts                              ← declara la ruta /gestion/periodos
└── features/gestion/
    ├── periodos-lista/
    │   ├── periodos-lista.ts                  ← clase del componente
    │   ├── periodos-lista.html                ← plantilla (Tailwind, paleta oficial)
    │   └── periodos-lista.spec.ts             ← 12 pruebas
    └── periodo-form/                          ← formulario hijo (ver C1-27)
```

---

## 4. Pruebas

`periodos-lista.spec.ts` verifica: el título y una fila por período; tipo, fechas
(`dd/MM/yyyy`) y estado de cada período; el orden (más recientes primero); el mensaje de lista
vacía; el aviso de error; que **Nuevo período** y **Editar** abren el formulario (vacío o con los
datos); que **Cancelar** lo cierra sin guardar; que guardar crea o actualiza (por id), cierra el
formulario y refresca la tabla; el aviso si falla el guardado; y que la ruta `/gestion/periodos`
muestra la página.

Ejecutar: `npm test`.

---

## 5. Advertencias y pendientes

| Tema | Detalle |
| ---- | ------- |
| **Componentes de otros grupos pendientes** | La tabla de componentes dice que esta página usa `app-encabezado-pagina` (G3), `app-tabla-datos` (G4) y `app-estado-badge` (G5). Como todavía no están en esta rama, el encabezado, la tabla y la etiqueta de estado están dibujados dentro de la página, en bloques marcados con comentarios en `periodos-lista.html`. Al integrarlos se reemplazan esos bloques conservando las columnas y los botones **Nuevo período** y **Editar**. |
| **Sin eliminar** | La ficha no pide borrar períodos, así que no hay esa opción. |
| **Sin guard de permisos** | La ruta no exige `periodo.ver`. Cuando el equipo acuerde el guard (ver `C1-07-app-acceso-denegado.md`), se agrega `canActivate` a la ruta. |
| **Datos mock** | Mientras no haya backend, los períodos salen de `shared/mocks/periodos.mock.ts` y los cambios viven solo en memoria. |
