# Formulario de malla (C1-33)

Formulario para crear o editar una malla curricular. Es hijo de `app-mallas-lista`.

---

## 1. Qué es

| Dato                | Valor                                                                |
| ------------------- | -------------------------------------------------------------------- |
| ID                  | C1-33                                                                |
| Selector            | `app-malla-form`                                                     |
| Clase               | `MallaFormComponent`                                                 |
| Tipo                | Hijo (formulario)                                                    |
| Grupo dueño         | G1 · Gestión (Julio Claros)                                          |
| Carpeta             | `src/app/features/gestion/malla-form/`                               |
| Lo usa              | `app-mallas-lista`                                                   |
| Depende de          | `MallaService` (solo para validar que el código no se repita)        |
| `input` `malla`     | `Malla` (opcional). Sin valor crea una nueva; con valor, edita esa   |
| `output` `guardar`  | `MallaDatos`. Los datos de la malla, **sin id**                      |
| `output` `cancelar` | `void`                                                               |

El formulario **no guarda por sí mismo**: emite `guardar` y el padre decide qué hacer. Como el
padre ya sabe qué malla edita, el id no viaja en el evento.

---

## 2. Campos y reglas

| Campo            | Regla                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Código           | Obligatorio, máximo 20 caracteres y **no puede repetirse** (al editar, el propio código no cuenta) |
| Nombre           | Obligatorio, máximo 100 caracteres                                         |
| Año de vigencia  | Obligatorio, número entero entre 2000 y 2100. Se guarda en `anioInicio`    |

Los errores aparecen debajo de cada campo después de tocarlo, o todos juntos al pulsar
**Guardar** con el formulario incompleto. Si es válido, emite `guardar` con los textos recortados
y el año como número.

---

## 3. Cómo usarlo

Dentro de `app-mallas-lista`:

```html
<app-malla-form
  [malla]="enEdicion() ?? undefined"
  (guardar)="guardar($event)"
  (cancelar)="cerrarFormulario()"
/>
```

```ts
import { MallaFormComponent } from '../malla-form/malla-form';
```

Si cambias `malla` mientras el formulario está abierto, se cargan los datos de la nueva malla.

---

## 4. Modelo y servicio

```ts
interface Malla {
  id: number;
  codigo: string;
  nombre: string;
  anioInicio: number; // año de vigencia
  carreraId: number;  // FK a carrera: toda malla pertenece a una carrera
  vigente: boolean;
}

// Lo que captura el formulario y emite `guardar`
type MallaDatos = Pick<Malla, 'codigo' | 'nombre' | 'anioInicio'>;
```

El formulario solo edita código, nombre y año de vigencia. La carrera se indica al crear
(`MallaService.crear(datos, carreraId)`, que deja la malla vigente) y `actualizar` conserva la
carrera y la vigencia de la malla.

`MallaService` tiene `listar`, `listarNiveles`, `crear` y `actualizar`. Hoy trabajan en memoria
sobre `shared/mocks/mallas.mock.ts` (mismos ids y códigos que `planificaciones.mock.ts`; las
carreras 5, 6 y 7 son las de `CarreraService`). Cuando exista backend se cambia **solo el cuerpo de
cada método** por la llamada HTTP (`GET /api/mallas`, `POST`, `PUT`); los componentes no se tocan.

---

## 5. Archivos

```
src/app/
├── features/gestion/malla-form/
│   ├── malla-form.ts          ← clase del componente (formulario reactivo)
│   ├── malla-form.html        ← plantilla (Tailwind, paleta oficial)
│   └── malla-form.spec.ts     ← 9 pruebas
└── shared/
    ├── mocks/mallas.mock.ts
    ├── models/malla.model.ts
    └── services/malla.service.ts
```

---

## 6. Pruebas

`malla-form.spec.ts` verifica: que estén los 3 campos; el formulario vacío de una malla nueva; la
carga de datos al editar; los mensajes de obligatorios; el rango y el número entero del año; el
código repetido y que al editar no choca consigo mismo; los datos emitidos (sin id, recortados,
año numérico); y `cancelar`.

Ejecutar: `npm test`.

---

## 7. Advertencias y pendientes

| Tema | Detalle |
| ---- | ------- |
| **Padre pendiente** | `app-mallas-lista` todavía no existe, así que el formulario aún no se ve en la aplicación. Se integra cuando esa página esté lista. |
| **Nombre del campo** | La ficha dice "año de vigencia"; el campo se llama `anioInicio` para coincidir con `planificacion.model.ts` (G2). |
| **Unicidad solo en el front** | El código se valida contra las mallas que devuelve `listar()`. El backend debe validarlo también. |