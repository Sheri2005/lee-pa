# Descarga de plantilla (C1-51)

Botones para descargar la plantilla de carga masiva en CSV o Excel, con los encabezados de la
configuración y una fila de ejemplo. Es el paso 1 de `app-carga-masiva` (C1-50).

---

## 1. Qué es

| Dato        | Valor                                                              |
| ----------- | ------------------------------------------------------------------ |
| ID          | C1-51                                                              |
| Selector    | `app-descarga-plantilla`                                           |
| Clase       | `DescargaPlantillaComponent`                                       |
| Tipo        | Hijo de `app-carga-masiva`                                         |
| Grupo dueño | G1 · Gestión (Julio Claros)                                        |
| Carpeta     | `src/app/features/gestion/descarga-plantilla/`                     |
| Depende de  | `CargaMasivaService`, `shared/utils/xlsx-minimo.ts`                |
| `@Input`    | `config: PlantillaCarga` (obligatorio)                             |
| `@Output`   | `descargada: 'csv' \| 'xlsx'`, con el formato elegido              |

---

## 2. Comportamiento

- Muestra las columnas de la plantilla y marca las obligatorias.
- **Descargar CSV** baja `<nombreArchivo>.csv` (UTF-8 con BOM, para que Excel respete las tildes).
- **Descargar Excel** baja `<nombreArchivo>.xlsx`, con los mismos datos.
- Si alguna columna define `ejemplo`, la plantilla incluye una segunda fila con esos valores.
  `CargaMasivaService.validar` **ignora** esa fila si el usuario no la borra, así que nunca se
  importa por accidente.

```html
<app-descarga-plantilla [config]="config" (descargada)="alDescargar($event)" />
```

---

## 3. Notas

| Tema | Detalle |
| ---- | ------- |
| **Excel sin librería** | El `.xlsx` lo genera `xlsx-minimo.ts` (una hoja, solo texto). Se probó abriéndolo con openpyxl y LibreOffice. Si se necesita formato, fórmulas o leer `.xlsx`, usar la librería `xlsx` (la que ya usa `app-subir-archivo` del G4). |
| **Ubicación** | Antes estaba en `shared/components/carga-masiva/descarga-plantilla`; se movió a la ruta de la ficha. |
