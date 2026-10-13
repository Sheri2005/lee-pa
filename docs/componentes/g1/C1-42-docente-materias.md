# Materias del docente (C1-42)

Lista de las materias que un docente está habilitado para dictar, con opción de agregar y quitar.
Es hijo de `app-docente-form`.

---

## 1. Qué es

Muestra las materias habilitadas del docente (código, nombre y carrera responsable). Para agregar
se usa el autocompletar de materias (`app-selector-materia`); cada materia tiene un botón
**Quitar**.

| Dato                       | Valor                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| ID                         | C1-42                                                              |
| Historia                   | G1-10                                                              |
| Selector                   | `app-docente-materias`                                             |
| Clase                      | `DocenteMateriasComponent`                                         |
| Tipo                       | Hijo                                                               |
| Grupo dueño                | G1 · Gestión (Julio Claros)                                        |
| Carpeta                    | `src/app/features/gestion/docente-materias/`                       |
| Lo usa                     | `app-docente-form`                                                 |
| Usa                        | `app-selector-materia` (C1-31)                             |
| Depende de                 | `DocenteService`                                                   |
| `input` `docenteId`        | `number` (opcional). Sin valor (docente nuevo) arranca vacío       |
| `output` `materiasChange`  | `Materia[]`. Lista completa, ordenada por código                   |

El componente **no guarda por sí mismo**: cada vez que se agrega o quita una materia emite la
lista completa y el padre la guarda junto con el docente.

---

## 2. Cómo usarlo

Dentro de `app-docente-form`:

```html
<app-docente-materias
  [docenteId]="docente()?.id"
  (materiasChange)="materias.set($event)"
/>
```

```ts
import { DocenteMateriasComponent } from '../docente-materias/docente-materias';
```

- Con `docenteId` pide las materias del docente al servicio. No emite al cargarlas: solo cuando
  el usuario agrega o quita.
- **Agregar:** se busca la materia en el autocompletar y al elegirla se suma a la lista y el
  campo queda vacío para agregar otra. Si ya estaba, avisa "MAT-101 ya está en la lista." y no
  emite.
- **Quitar:** el botón elimina la materia de la lista y emite.
- Si cambia `docenteId`, se recarga la lista y se **descartan** los cambios que no se hayan
  guardado.

---

## 3. Servicio

`DocenteService.listarMaterias(docenteId)` devuelve las materias habilitadas del docente. Hoy sale
de `shared/mocks/docentes.mock.ts` (campo `materiaIds`) y de `materias.mock.ts`. Cuando exista
backend se cambia **solo el cuerpo del método** por `GET /api/docentes/:id/materias`; el
componente no se toca.

---

## 4. Archivos

```
src/app/
├── features/gestion/docente-materias/
│   ├── docente-materias.ts          ← clase del componente
│   ├── docente-materias.html        ← plantilla (Tailwind, paleta oficial)
│   └── docente-materias.spec.ts     ← 10 pruebas
└── shared/
    ├── components/selector-materia/ ← ahora tiene limpiar()
    └── services/docente.service.ts  ← incluye listarMaterias()
```

---

## 5. Pruebas

`docente-materias.spec.ts` verifica: el arranque sin docente; la carga de las materias con su
carrera; que no emite al cargar; agregar con el autocompletar (lista, emisión y campo vacío); el
orden por código; que no repite materias; quitar; la lista vacía al quitar la última; la recarga
al cambiar de docente; y el aviso de error.

Ejecutar: `npm test`.

---

## 6. Advertencias

| Tema | Detalle |
| ---- | ------- |
| **Padre pendiente** | `app-docente-form` todavía no existe, así que el componente aún no se ve en la aplicación. Se integra cuando esa página esté lista. |
| **`limpiar()` en el selector de materia** | Para agregar varias materias seguidas, `SelectorMateriaComponent` ahora tiene un método público `limpiar()` que vacía el campo sin emitir. Los demás usos no se afectan. |
| **Sin guardar** | Los cambios solo viven en el componente y en el padre hasta que este los guarde. El mock de `DocenteService` no persiste altas ni bajas. |