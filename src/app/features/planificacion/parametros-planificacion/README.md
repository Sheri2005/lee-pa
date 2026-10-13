# app-parametros-planificacion (C2-05)

Formulario de parámetros de una planificación: niveles a ofertar (con vista de la malla), cupo
máximo por paralelo y mínimo de estudiantes para abrir un paralelo.

- **Grupo dueño:** G2 · Planificación (responsable: Raúl Garay) · **HU:** G2-03
- **Se usa dentro de:** `app-planificacion-detalle` (C2-03), paso «Parámetros»
- **Servicio:** `PlanificacionService` (`obtenerParametros`, `guardarParametros`, `obtenerMallaPorNiveles`)
- **Reutiliza ya publicados:** `app-spinner-carga`

## Contrato

| Tipo    | Nombre             | Tipo de dato                | Descripción                                                  |
| ------- | ------------------ | --------------------------- | ------------------------------------------------------------ |
| Entrada | `planificacion`    | `Planificacion` (obligatorio) | Planificación a configurar                                 |
| Salida  | `parametrosChange` | `ParametrosPlanificacion`   | Parámetros ya guardados (después de que el servicio confirma) |

```html
<app-parametros-planificacion [planificacion]="p" (parametrosChange)="alCambiarParametros($event)" />
```

## Reglas del formulario

- Al menos un nivel; cupo y mínimo son enteros positivos; el cupo va de 1 a 100 (tope del
  prototipo, acordar el real); el mínimo no puede superar el cupo.
- Solo se edita en BORRADOR y CON_CAMBIOS (igual que C2-13); en los demás estados es de solo lectura.
- «Guardar» solo se habilita si hay cambios y el formulario es válido.
- Al cambiar `planificacion` se descartan los datos y avisos de la anterior.

## Piezas pendientes de otros grupos (buscar `EDITAR` en el código)

| Hoy usa                                   | Reemplazar por            | Dueño |
| ----------------------------------------- | ------------------------- | ----- |
| Casillas por nivel                        | `app-selector-nivel`      | G1    |
| Lista de materias de cada nivel           | `app-malla-por-niveles`   | G1    |

Al integrarlos, `PlanificacionService.obtenerMallaPorNiveles()` deja de hacer falta.

```shell
npm run build
npm test -- --watch=false
```
