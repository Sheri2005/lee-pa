# C4-16 · Recursos reservables

| Campo       | Valor                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| ID          | **C4-16**                                                                    |
| Selector    | `app-recursos-reservables-lista`                                             |
| Clase       | `RecursosReservablesListaComponent`                                          |
| Tipo        | Página (`/reservas/recursos`)                                                |
| Grupo dueño | G4 · Reservas                                                                |
| Contiene    | `app-recurso-reservable-form` (C4-17); piezas de G2, G3 y G5 como `TEMPORAL` |
| Servicio    | `RecursoReservableService`                                                   |
| Historia    | G4-09                                                                        |

Catálogo de los equipos que se prestan junto con un espacio (proyector móvil, laptop, micrófono…): nombre, cantidad y estado, con acciones para crear, editar, activar y desactivar.

## Archivos

```text
src/modules/reservas/recursos-reservables-lista/
├── README.md
├── recursos-reservables-lista.ts       # Página + filtro, búsqueda y orden
├── recursos-reservables-lista.html     # Plantilla con Tailwind
└── recursos-reservables-lista.spec.ts
```

## Uso y ruta

Página sin entradas ni salidas. Para registrarla (la entrega no modifica `app.routes.ts`):

```ts
{
  path: 'reservas/recursos',
  loadComponent: () =>
    import('../modules/reservas/recursos-reservables-lista/recursos-reservables-lista').then(
      (m) => m.RecursosReservablesListaComponent,
    ),
}
```

## Comportamiento

- **Filtro** en cápsula: **Todos (N) · Activos (N) · Inactivos (N)**. Una opción sin recursos queda deshabilitada; si la elegida se queda vacía, se ven todos.
- **Buscador** por nombre, sin importar mayúsculas ni tildes («microfono» encuentra «Micrófono»). Sin coincidencias: «Ningún recurso coincide con «…»».
- **Orden:** activos primero y, en cada grupo, alfabético. Al desactivar un recurso baja al grupo de inactivos.
- **Inactivos atenuados** (nombre, cantidad y estado), con el botón **Activar** en vino para que destaque.
- **Aviso** tras cambiar el estado: «✓ Laptop quedó inactivo.» (`role="status"`).
- **Nuevo recurso** y **Editar** abren C4-17. Al guardar, la lista se actualiza sin recargar.
- Si el servicio no responde (`null` mientras no exista la API), se avisa en lugar de fallar en silencio.

| `RecursoReservableService`  | Endpoint previsto                         |
| --------------------------- | ----------------------------------------- |
| `listar()`                  | `GET /recursos-reservables`               |
| `crear(datos)`              | `POST /recursos-reservables`              |
| `actualizar(recurso)`       | `PUT /recursos-reservables/{id}`          |
| `cambiarEstado(id, estado)` | `PATCH /recursos-reservables/{id}/estado` |

## Dependencias TEMPORALES

| Pieza futura            | Dueño | Qué hace hoy C4-16               |
| ----------------------- | ----- | -------------------------------- |
| `app-encabezado-pagina` | G3    | Título y descripción propios.    |
| `app-tabla-datos`       | C4-20 | Tabla sencilla con Tailwind.     |
| `app-estado-vacio`      | G2    | Mensaje y botón «Crear recurso». |
| `app-estado-badge`      | G5    | Píldora Activo / Inactivo.       |

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md); sin CSS propio ni hexadecimales.

| Elemento       | Clases de color                                                 |
| -------------- | --------------------------------------------------------------- |
| Tarjeta        | `bg-surface border-border`; cabecera con marca `bg-accent-gold` |
| Filtro         | `bg-header`; opción activa `bg-surface text-primary`            |
| Cabecera tabla | `bg-table-header`                                               |
| Activo         | `bg-emerald-50 text-emerald-700`                                |
| Inactivo       | fila atenuada (`opacity-60`), botón Activar `bg-primary`        |
| Aviso          | `bg-muted` con check `text-emerald-700`                         |

## Accesibilidad

- El filtro usa botones con `aria-pressed`; el buscador tiene etiqueta oculta «Buscar recurso».
- Los botones de cada fila llevan el nombre del recurso en `aria-label` («Desactivar Laptop»).
- El aviso de cambio usa `role="status"`; los errores, `role="alert"`; la carga, `aria-busy`.

## Verificación

```sh
npx ng test --watch=false
npx ng build
npx ngc -p tsconfig.app.json --noEmit
```

5 pruebas con un servicio falso dentro del spec: catálogo y estados, abrir el formulario para crear y editar, cambiar el estado desde la lista, orden con filtro y búsqueda sin tildes, y aviso con el recurso que pasa a inactivos.
