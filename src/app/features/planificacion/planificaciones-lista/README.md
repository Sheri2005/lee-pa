# app-planificaciones-lista (C2-01)

Página `/planificacion`: lista de planificaciones por carrera y período con su estado.
Filtra por facultad, carrera, período y estado, y tiene la acción «Nueva planificación».

- **Grupo dueño:** G2 · Planificación (responsable: Raúl Garay)
- **HU:** G2-01 · **Ruta:** `/planificacion` · **Servicio:** `PlanificacionService.listar()`
- **Reutiliza ya publicados:** `app-spinner-carga`, `app-estado-vacio`

No tiene entradas ni salidas: es una página con ruta propia.

## Piezas de otros grupos pendientes (buscar `EDITAR` en el código)

| Hoy usa                         | Reemplazar por                          | Dueño |
| ------------------------------- | --------------------------------------- | ----- |
| `<header>` propio               | `app-encabezado-pagina` (C3-23)         | G3    |
| Contenedor de filtros           | `app-barra-filtros` (C4-21)             | G4    |
| `<select>` de facultad          | `app-selector-facultad` (C1-22)         | G1    |
| `<select>` de carrera           | `app-selector-carrera` (C1-25)          | G1    |
| `<select>` de período           | `app-selector-periodo` (C1-28)          | G1    |
| `<select>` de estado            | `app-selector-estado` (C5-09)           | G5    |
| `<table>`                       | `app-tabla-datos` (C4-20)               | G4    |
| `<span>` de estado              | `app-estado-badge` (C5-08)              | G5    |
| Aviso «Nueva planificación»     | `app-planificacion-nueva` (C2-02)       | G2    |
| Enlace «Abrir»                  | ruta `/planificacion/:id` (C2-03)       | G2    |

## Validación

```shell
npm run build
npm test -- --watch=false
```
