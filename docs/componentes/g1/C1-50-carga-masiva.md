# Carga masiva (C1-50)

Contenedor reutilizable con un asistente de 4 pasos para importar CSV/Excel. Lo usan
`app-carga-masiva-pagina` (G1), `app-estudiantes-estimados` (G2) y `app-carga-espacios-franjas` (G3).

---

## 1. Qué es

| Dato                 | Valor                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| ID                   | C1-50                                                                                   |
| Selector             | `app-carga-masiva`                                                                      |
| Clase                | `CargaMasivaComponent`                                                                  |
| Tipo                 | Contenedor reutilizable                                                                 |
| Grupo dueño          | G1 · Gestión (Julio Claros)                                                             |
| Carpeta              | `src/app/shared/components/carga-masiva/`                                               |
| Depende de           | `CargaMasivaService`, `app-descarga-plantilla`, `app-subir-archivo` (G4), `app-previsualizacion-carga`, `app-resumen-importacion` |
| `@Input`             | `config: PlantillaCarga` (obligatorio)                                                  |
| `@Output`            | `importacionFinalizada: ResumenImportacion`                                             |

Pasos: **1** descargar plantilla → **2** subir archivo → **3** previsualizar y validar fila por
fila → **4** confirmar y ver resumen. **Las filas inválidas nunca se guardan**: solo se importan
las que pasan la validación; el botón se deshabilita si no hay ninguna válida o faltan columnas
obligatorias.

---

## 2. Cómo se configura (`PlantillaCarga`)

```ts
const config: PlantillaCarga = {
  nombre: 'Estudiantes estimados',
  nombreArchivo: 'plantilla-estudiantes-estimados', // sin extensión
  endpoint: '/api/estudiantes-estimados/importar',
  extensiones: ['.csv', '.xlsx'], // opcional
  tamanoMaxMB: 5, // opcional
  columnas: [
    { clave: 'materia', etiqueta: 'Materia', obligatorio: true, ejemplo: 'Cálculo I' },
    {
      clave: 'cantidad',
      etiqueta: 'Cantidad',
      obligatorio: true,
      validador: (v) => (/^\d+$/.test(v) ? null : 'Cantidad debe ser un número entero.'),
    },
  ],
};
```

```html
<app-carga-masiva [config]="config" (importacionFinalizada)="alTerminar($event)" />
```

- Los encabezados del archivo se reconocen por `etiqueta` o por `clave`, sin importar
  mayúsculas ni tildes.
- Un `validador` devuelve el mensaje de error o `null`; solo se llama con valores no vacíos.
- Las filas totalmente vacías se ignoran, y también la fila de ejemplo si el usuario no la borra.

---

## 3. Archivos

```
src/app/shared/
├── models/carga-masiva.model.ts          ← PlantillaCarga, FilaValidada, ResumenImportacion
├── services/carga-masiva.service.ts      ← plantilla CSV/Excel, validación e importación (mock)
├── utils/xlsx-minimo.ts                  ← generador de .xlsx sin dependencias
└── components/carga-masiva/
    ├── carga-masiva.{ts,html,spec.ts}    ← contenedor (C1-50)
    └── resumen-importacion/              ← paso 4
src/app/features/gestion/descarga-plantilla/      ← paso 1 (C1-51)
src/app/features/gestion/previsualizacion-carga/  ← paso 3 (C1-53)
```

---

## 4. Advertencias y pendientes

| Tema | Detalle |
| ---- | ------- |
| **`app-subir-archivo` (G4)** | Es el paso 2. En esta rama hay un **stub temporal** (`shared/components/subir-archivo/subir-archivo.ts`, solo CSV) con el mismo contrato que la versión del G4 (`origin/leonor-molina`). Reemplazarlo con `git checkout origin/leonor-molina -- src/app/shared/components/subir-archivo` y `npm i xlsx`. |
| **Importación simulada** | `CargaMasivaService.importar` responde en memoria. Con backend: `POST config.endpoint` con los `datos` de las filas válidas. |
| **Plantilla** | Se descarga en CSV o Excel (C1-51), con encabezados y una fila de ejemplo. |
