# Previsualización de carga (C1-53)

Tabla con las filas leídas del archivo, el estado OK/Error de cada una y el motivo del error, con
filtro «solo errores» y contador. Es el paso 3 de `app-carga-masiva` (C1-50).

---

## 1. Qué es

| Dato        | Valor                                                                          |
| ----------- | ------------------------------------------------------------------------------ |
| ID          | C1-53                                                                          |
| Selector    | `app-previsualizacion-carga`                                                   |
| Clase       | `PrevisualizacionCargaComponent`                                               |
| Tipo        | Hijo de `app-carga-masiva`                                                     |
| Grupo dueño | G1 · Gestión (Julio Claros)                                                    |
| Carpeta     | `src/app/features/gestion/previsualizacion-carga/`                             |
| Depende de  | `app-tabla-datos` (G4) y `app-estado-badge` (G5), todavía no disponibles       |
| `@Input`    | `filas: FilaValidada[]` (obligatorio), `columnas: ColumnaPlantilla[]` (obligatorio), `faltantes: string[]` |

---

## 2. Comportamiento

- Una fila de tabla por fila leída: número de fila en el archivo, los datos por columna, **Estado**
  (`OK` / `Error`) y **Motivo** (los errores de validación).
- Contador: «N filas · X válidas · Y con errores». Las filas con errores no se importan.
- Filtro «Mostrar solo filas con errores»: aparece solo si hay filas con errores.
- Si el archivo no trae columnas obligatorias, avisa arriba de la tabla (`role="alert"`).
- Dibuja como máximo 200 filas; el contador y la importación cuentan todas.
- El estado se distingue por texto (`OK` / `Error`), no solo por color.

```html
<app-previsualizacion-carga [columnas]="config.columnas" [filas]="filas" [faltantes]="faltantes" />
```

---

## 3. Pendiente: G4 y G5

La ficha indica que usa `app-tabla-datos` (G4) y `app-estado-badge` (G5). Al momento de escribir
esto no existen en ninguna rama, así que la tabla y el badge están **dentro del template** de este
componente. Cuando G4 y G5 los entreguen, reemplazar:

| Hoy (en el template)                              | Por                  |
| ------------------------------------------------- | -------------------- |
| `<table>` con encabezados y filas                 | `app-tabla-datos`    |
| `<span>` con `OK` / `Error`                       | `app-estado-badge`   |

El contador, el filtro y el aviso de columnas faltantes se quedan en este componente.
