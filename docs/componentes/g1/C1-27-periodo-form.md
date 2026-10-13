# Formulario de período (C1-27)

Formulario para crear o editar un período académico. Es hijo de `app-periodos-lista`.

---

## 1. Qué es

| Dato                     | Valor                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| ID                       | C1-27                                                                 |
| Selector                 | `app-periodo-form`                                                    |
| Clase                    | `PeriodoFormComponent`                                                |
| Tipo                     | Hijo (formulario)                                                     |
| Grupo dueño              | G1 · Gestión (Julio Claros)                                           |
| Carpeta                  | `src/app/features/gestion/periodo-form/`                              |
| Lo usa                   | `app-periodos-lista`                                                  |
| Depende de               | `PeriodoService` (solo para validar que el código no se repita)       |
| `input` `periodo`        | `Periodo` (opcional). Sin valor crea uno nuevo; con valor, edita ese  |
| `output` `guardar`       | `PeriodoDatos`. Los datos del período, **sin id**                     |
| `output` `cancelar`      | `void`                                                                |

El formulario **no guarda por sí mismo**: emite `guardar` y el padre decide qué hacer. Como el
padre ya sabe qué período edita, el id no viaja en el evento.

---

## 2. Campos y reglas

| Campo            | Regla                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Código           | Obligatorio, máximo 20 caracteres y **no puede repetirse** (al editar, el propio código no cuenta) |
| Nombre           | Obligatorio, máximo 100 caracteres                                         |
| Tipo             | Ordinario o extraordinario. Por defecto, ordinario                         |
| Estado           | En planificación, activo o cerrado. Por defecto, en planificación          |
| Fecha de inicio  | Obligatoria                                                                |
| Fecha de fin     | Obligatoria y **posterior** a la de inicio (el mismo día no vale)          |
| Código SIAC 1.0  | Opcional, máximo 30 caracteres                                             |

Los errores aparecen debajo de cada campo después de tocarlo, o todos juntos al pulsar
**Guardar** con el formulario incompleto. Si es válido, emite `guardar` con los textos recortados;
un código SIAC vacío se emite como `undefined`.

---

## 3. Cómo usarlo

Dentro de `app-periodos-lista`:

```html
<app-periodo-form
  [periodo]="enEdicion() ?? undefined"
  (guardar)="guardar($event)"
  (cancelar)="cerrarFormulario()"
/>
```

```ts
import { PeriodoFormComponent } from '../periodo-form/periodo-form';
```

Si cambias `periodo` mientras el formulario está abierto, se cargan los datos del nuevo período.

---

## 4. Archivos

```
src/app/features/gestion/periodo-form/
├── periodo-form.ts          ← clase del componente (formulario reactivo)
├── periodo-form.html        ← plantilla (Tailwind, paleta oficial)
└── periodo-form.spec.ts     ← 10 pruebas
```

---

## 5. Pruebas

`periodo-form.spec.ts` verifica: que estén los 7 campos; los valores iniciales de un período
nuevo; la carga de datos al editar; los mensajes de obligatorios; la regla fin > inicio (mismo
día, antes y después); el código repetido y que al editar no choca consigo mismo; los datos
emitidos (sin id, recortados, SIAC vacío como `undefined`); el código SIAC cuando se escribe; y
`cancelar`.

Ejecutar: `npm test`.

---

## 6. Advertencias y pendientes

| Tema | Detalle |
| ---- | ------- |
| **`app-campo-codigo-siac` (G5) pendiente** | La tabla de componentes dice que este formulario usa el campo SIAC de G5. Como todavía no está en esta rama (existe en `feature/app-campo-codigo-siac`), el código SIAC es un campo de texto propio, dentro del bloque marcado con comentarios en `periodo-form.html`. El componente de G5 es un campo de formulario reactivo, así que al integrarlo se reemplaza ese bloque por `<app-campo-codigo-siac formControlName="codigoSiac" entity="periodo" [idActual]="periodo()?.id" />`. |
| **SIAC opcional** | La ficha no dice que sea obligatorio. Si lo es, agrega `Validators.required` al control `codigoSiac` en `periodo-form.ts` y su mensaje en `REQUERIDO`. |
| **Unicidad solo en el front** | El código se valida contra los períodos que devuelve `listar()`. El backend debe validarlo también. |
| **Reglas de estado sin definir** | No se valida, por ejemplo, que haya un solo período activo a la vez. Falta acordarlo con el equipo. |
