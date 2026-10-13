# app-planificacion-detalle (C2-03)

Página `/planificacion/:id`: contenedor con pasos Parámetros → Estudiantes estimados → Cursos
sugeridos → Paralelos → Docentes → Materias compartidas → Enviar a aprobación. Muestra el estado
(en el encabezado) y la trazabilidad.

- **Grupo dueño:** G2 · Planificación (responsable: Raúl Garay) · **HU:** G2-03
- **Ruta:** `/planificacion/:id` · **Servicio:** `PlanificacionService.obtenerPorId()`
- **Reutiliza ya publicados:** `app-planificacion-encabezado` (C2-04), `app-parametros-planificacion`
  (C2-05), `app-asignacion-docentes` (C2-13), `app-spinner-carga`

No tiene entradas ni salidas: lee el `id` de la ruta. Un id no numérico muestra error sin consultar;
un id inexistente muestra error con «Reintentar». Al cambiar de planificación vuelve al primer paso.
Las pestañas siguen el patrón ARIA (flechas, Inicio y Fin) y cada paso se monta solo al abrirlo.

## Piezas pendientes (buscar `EDITAR` en el código)

| Paso / zona            | Hoy muestra un aviso en lugar de         | Dueño |
| ---------------------- | ---------------------------------------- | ----- |
| Cabecera de la página  | `<header>` propio → `app-encabezado-pagina` (C3-23) | G3 |
| Estudiantes estimados  | `app-estudiantes-estimados`              | G2    |
| Cursos sugeridos       | `app-sugerencia-cursos` (C2-08)          | G2    |
| Paralelos              | `app-paralelos-editor`                   | G2    |
| Materias compartidas   | `app-materias-compartidas` (C2-17)       | G2    |
| Materias compartidas   | `app-solicitudes-cupos-recibidas`        | G2    |
| Enviar a aprobación    | `app-boton-enviar-aprobacion`            | G5    |
| Trazabilidad           | `app-historial-trazabilidad`             | G5    |

Cada vez que se publique uno: importarlo en el `.ts`, reemplazar el bloque y ajustar los inputs al
contrato real (los del comentario son una suposición con `[planificacionId]`).

```shell
npm run build
npm test -- --watch=false
```
