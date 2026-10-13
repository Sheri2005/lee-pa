# app-planificacion-nueva (C2-02)

Diálogo (modal) para crear una planificación. Se elige carrera y período; muestra la facultad
heredada y la malla vigente de la carrera, e impide repetir la combinación carrera + período.

- **Grupo dueño:** G2 · Planificación (responsable: Raúl Garay) · **HU:** G2-01
- **Se usa dentro de:** `app-planificaciones-lista` (C2-01)
- **Servicio:** `PlanificacionService` (`obtenerCatalogoNueva()` y `crear()`)
- **Reutiliza ya publicados:** `app-spinner-carga`

## Contrato

| Tipo   | Nombre      | Tipo de dato   | Descripción                                                    |
| ------ | ----------- | -------------- | -------------------------------------------------------------- |
| Salida | `creada`    | `Planificacion` | Se emite cuando el servicio confirma la creación (estado BORRADOR) |
| Salida | `cancelada` | `void`         | Cancelar, Esc o clic en el fondo. El padre debe desmontar el diálogo |

`cancelada` no estaba en el catálogo original: se agregó porque el padre necesita saber cuándo cerrar.

## Uso

```ts
imports: [PlanificacionNuevaComponent]
```

```html
@if (nuevaAbierta()) {
  <app-planificacion-nueva (creada)="cerrarNueva(); recargar()" (cancelada)="cerrarNueva()" />
}
```

El diálogo se monta abierto (`showModal()`); el padre lo controla con `@if`.

## Piezas pendientes de otros grupos (buscar `EDITAR` en el código)

| Hoy usa                     | Reemplazar por            | Dueño |
| --------------------------- | ------------------------- | ----- |
| `<select>` de carrera       | `app-selector-carrera`    | G1    |
| `<select>` de período       | `app-selector-periodo`    | G1    |
| Texto de la malla vigente   | `app-selector-malla`      | G1    |

## Datos de prueba

`PlanificacionService.crear()` agrega la planificación a `PLANIFICACIONES_MOCK` (se pierde al
recargar), así que la ven la lista, el detalle y la asignación de docentes. Las carreras, los
períodos y la malla vigente se derivan de las planificaciones existentes.

```shell
npm run build
npm test -- --watch=false
```
