# Resumen de importación (C1-54)

Guía para el equipo. Explica el último paso del asistente de carga masiva.

> **Autoría:** Julio hizo la primera versión junto con su asistente C1-50. Jose Luis agregó
> las pruebas, el enlace a la bitácora y la marca TEMPORAL de las tarjetas.

---

## 1. Qué es

Es el **paso 4** del asistente de carga masiva (`app-carga-masiva`, C1-50). Aparece después de
importar y muestra el resultado.

| Dato                 | Valor                                                          |
| -------------------- | -------------------------------------------------------------- |
| ID                   | C1-54                                                          |
| Selector             | `app-resumen-importacion`                                      |
| Clase                | `ResumenImportacionComponent`                                  |
| Tipo                 | Hijo                                                           |
| Se usa dentro de     | `app-carga-masiva` (C1-50)                                     |
| Grupo dueño          | G1 · Gestión (Jose Luis Hidalgo)                               |
| Carpeta              | `src/app/shared/components/carga-masiva/resumen-importacion/`  |

Lo que ve el usuario:

- tres tarjetas: **Filas leídas**, **Importadas** y **Rechazadas**;
- si hubo rechazos, la lista **Filas no importadas**, con el número de fila y el motivo;
- el botón **Cargar otro archivo**, que reinicia el asistente;
- el enlace **Ver bitácora de importaciones**, que lleva a C1-56.

**No lo usas directamente**: ya viene dentro del asistente C1-50. Si tu página usa
`<app-carga-masiva>`, el resumen aparece solo al terminar.

---

## 2. Entradas y salidas

| Tipo   | Nombre       | Descripción |
| ------ | ------------ | ----------- |
| Input  | `resumen`    | `ResumenImportacion` (obligatorio): `total`, `importadas`, `rechazadas` y `errores[]` (`fila`, `mensaje`). |
| Output | `nuevaCarga` | Se emite al pulsar **Cargar otro archivo**. El asistente vuelve al paso 1. |

---

## 3. Diferencias con la hoja de componentes

| Hoja | Implementación | Motivo |
| ---- | -------------- | ------ |
| Salida `confirmar` y botón "confirmar importación" | No hay confirmación aquí: se confirma en el **paso 3** del asistente ("Importar N filas válidas"), y la salida es `nuevaCarga` | Diseño de Julio: el usuario confirma mientras ve la previsualización, no después de importar |
| Carpeta sugerida `src/app/features/gestion/resumen-importacion/` | Está en `src/app/shared/components/carga-masiva/resumen-importacion/` | Va junto al asistente C1-50, que es el único que lo usa |
| Contiene `app-tarjeta-indicador` (C5-19, G5) | Las tarjetas están dibujadas aquí, marcadas como TEMPORAL | C5-19 existe en la rama de G5, pero todavía no está en `main` |

---

## 4. Piezas provisionales (TEMPORAL)

| Pieza | Reemplazar por | Dónde |
| ----- | -------------- | ----- |
| Las tres tarjetas | `app-tarjeta-indicador` (C5-19, G5), una por valor: `titulo` y `valor` | `resumen-importacion.html`, bloque marcado |

---

## 5. Archivos

```
src/app/shared/components/carga-masiva/resumen-importacion/
├── resumen-importacion.ts          ← clase (usa RouterLink para el enlace)
├── resumen-importacion.html        ← plantilla
└── resumen-importacion.spec.ts     ← 5 pruebas
```

---

## 6. Pruebas

`resumen-importacion.spec.ts` verifica que:

- se muestran los tres totales;
- aparece el motivo de cada fila no importada;
- la lista se oculta si no hubo errores;
- **Cargar otro archivo** emite `nuevaCarga`;
- el enlace lleva a `/gestion/carga-masiva/bitacora`.

Ejecutar: `npm test`.

---

## 7. Advertencia para quien use el asistente

Por el enlace a la bitácora, este componente necesita el **router**. En la aplicación ya está
configurado, pero en tus **pruebas** que creen `app-carga-masiva` debes agregar:

```ts
providers: [provideRouter([])]
```
