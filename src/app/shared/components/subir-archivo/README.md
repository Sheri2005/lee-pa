# C4-22 · Subir archivo

| Campo       | Valor                                                    |
| ----------- | -------------------------------------------------------- |
| ID          | **C4-22**                                                |
| Selector    | `app-subir-archivo`                                      |
| Clase       | `SubirArchivoComponent`                                  |
| Tipo        | Compartido UI (sin servicios ni datos propios)           |
| Grupo dueño | G4 · Reservas                                            |
| Lo usan     | G1, paso 2 (subir archivo) del asistente de carga masiva |

Zona para seleccionar o arrastrar un archivo de **Excel o CSV** y convertirlo en filas. Si se indican las columnas obligatorias, explica cómo debe estar el archivo, ofrece una plantilla y valida los encabezados. No guarda ni envía el archivo: todo ocurre en el navegador.

Regla de los grupos: este componente se desarrolla **una sola vez** aquí. Si otro grupo necesita un cambio, lo pide a G4 mediante un issue.

## Archivos

```text
src/app/shared/components/subir-archivo/
├── README.md
├── subir-archivo.ts       # Componente + validarArchivo, describirFormatos, filasConEncabezados,
│                          #   normalizarColumna, libroPlantilla, decodificarCsv
├── subir-archivo.html     # Plantilla con Tailwind
└── subir-archivo.spec.ts
```

## Uso

```ts
import { SubirArchivoComponent } from '<ruta>/app/shared/components/subir-archivo/subir-archivo';
```

```html
<app-subir-archivo
  [columnas]="['codigo', 'nombre', 'carrera']"
  nombrePlantilla="plantilla-materias"
  [ejemplos]="[{ codigo: 'MAT-101', nombre: 'Cálculo I', carrera: 'ING-COMP' }]"
  (filasLeidas)="previsualizar($event)"
  (error)="mostrarError($event)"
/>
```

## Contrato

| Entrada           | Tipo                                          | Por defecto                 | Descripción                                                                                  |
| ----------------- | --------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| `extensiones`     | `readonly string[]`                           | `['.xlsx', '.xls', '.csv']` | Formatos permitidos. Se muestran como «Excel o CSV».                                         |
| `tamanoMaxMB`     | `number`                                      | `5`                         | Tamaño máximo.                                                                               |
| `columnas`        | `readonly string[]`                           | `[]`                        | Columnas obligatorias de la primera fila. Se muestran, se validan y dan nombre a las claves. |
| `nombrePlantilla` | `string`                                      | `'plantilla'`               | Nombre del Excel que se descarga (sin extensión).                                            |
| `ejemplos`        | `readonly Record<string, string \| number>[]` | `[]`                        | Filas de ejemplo de la plantilla, debajo de los encabezados.                                 |

Las tres últimas son opcionales y se añadieron al contrato del Excel. Los ejemplos los pasa quien usa el componente: así el componente no tiene datos propios.

| Salida        | Tipo            | Cuándo se emite                                                         |
| ------------- | --------------- | ----------------------------------------------------------------------- |
| `filasLeidas` | `FilaArchivo[]` | Archivo válido: una fila por registro, con los encabezados como claves. |
| `error`       | `string`        | Formato, tamaño, archivo vacío, columnas faltantes o archivo dañado.    |

```ts
type FilaArchivo = Record<string, unknown>; // { nombre: 'Proyector móvil', cantidad: '4', estado: 'ACTIVO' }
```

## Cómo debe estar el archivo

El componente lo muestra al usuario en el recuadro **Cómo debe estar el archivo**:

1. La primera fila lleva los encabezados: las `columnas` indicadas o, si no se indican, el nombre de cada columna.
2. Sin títulos, logos ni celdas combinadas encima de los encabezados.
3. Si es un Excel con varias hojas, se lee solo la primera.

Con `columnas`, el botón **Descargar plantilla** genera un Excel con esos encabezados y las filas de `ejemplos`.

## Validaciones

| Situación                     | Mensaje                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Extensión no permitida        | «Ese tipo de archivo no se admite. Usa Excel o CSV.»                                           |
| Archivo vacío                 | «El archivo está vacío.»                                                                       |
| Más grande que `tamanoMaxMB`  | «El archivo supera el máximo de 5 MB.»                                                         |
| Solo encabezados              | «El archivo no contiene filas de datos.»                                                       |
| Encabezado vacío              | «El archivo debe tener en la primera fila el nombre de cada columna, sin celdas vacías.»       |
| Falta una columna obligatoria | «El archivo no tiene la columna estado. La primera fila debe tener: nombre, cantidad, estado.» |
| Archivo dañado                | «No se pudo leer el archivo. Comprueba que no esté dañado.»                                    |

- Los encabezados se comparan sin importar mayúsculas, tildes, espacios ni guiones: «NOMBRE», «Cantidad » o «Año_Inicio» valen.
- Las columnas de más se conservan; las filas vacías se ignoran.
- Los CSV se aceptan en UTF-8 (con o sin BOM) y en Windows-1252, el formato que guarda Excel en Windows: se conservan tildes y eñes.
- Al leer bien un archivo se muestra «✓ recursos.xlsx · 4 filas leídas».

## Dependencia

Usa SheetJS (`xlsx`) **0.20.3**, instalada desde `cdn.sheetjs.com`. Las versiones publicadas en npm (hasta la 0.18.5) tienen fallos de seguridad conocidos: CVE-2023-30533 y CVE-2024-22363.

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../../TAILWIND-Y-COLORES.md); sin CSS propio ni hexadecimales.

| Elemento         | Clases de color                                                                     |
| ---------------- | ----------------------------------------------------------------------------------- |
| Tarjeta          | `bg-surface border-border`; cabecera con marca `bg-accent-gold`                     |
| Zona de arrastre | `bg-filter`, borde punteado `border-border`; al arrastrar `border-primary bg-muted` |
| Cómo debe estar  | `bg-header`, checks `text-primary`, columnas `bg-surface text-primary`              |
| Archivo leído    | `bg-emerald-50 text-emerald-700`                                                    |
| Error            | `bg-red-50 text-red-700` con ícono (la paleta no tiene token de error)              |

## Accesibilidad

- El campo de archivo nativo queda oculto y se activa con una etiqueta visible; también funciona con teclado.
- Archivo leído con `role="status"`; errores con `role="alert"`.
- Las columnas obligatorias se agrupan con `aria-label="Columnas obligatorias"`.
- Cada instancia genera identificadores únicos.

## Verificación

```sh
npx ng test --watch=false
npx ng build
npx ngc -p tsconfig.app.json --noEmit
```

13 pruebas: contrato por defecto, nombres de formatos, Excel moderno y antiguo y CSV aceptados, extensión no permitida, filas leídas con su conteo, columnas obligatorias (encabezados normalizados, columna faltante, encabezado vacío), recuadro y botón de plantilla, plantilla con ejemplos, vacío o demasiado grande, CSV con tildes en UTF-8 y Windows-1252, primera hoja de un XLSX y archivo sin datos.
