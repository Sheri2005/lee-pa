# Selector de docente (C1-43)

Guía para los grupos G2, G3 y G5. Explica cómo usar el autocompletar de docentes, qué recibe y
qué emite.

---

## 1. Qué es

Un campo de texto con lista desplegable: se escribe el **nombre o la identificación** del docente
y se elige de la lista. Cada opción muestra la identificación y la **carga máxima**. Si se indica
una materia, solo aparecen los docentes **habilitados** para ella.

| Dato                   | Valor                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| ID                     | C1-43                                                              |
| Historia               | G1-10                                                              |
| Selector               | `app-selector-docente`                                             |
| Clase                  | `SelectorDocenteComponent`                                         |
| Tipo                   | Selector de dominio                                                |
| Grupo dueño            | G1 · Gestión (Julio Claros)                                        |
| Carpeta                | `src/app/shared/components/selector-docente/`                      |
| Depende de             | `DocenteService`                                                   |
| `input` `materiaId`    | `number` (opcional). Solo docentes habilitados para esa materia    |
| `output` `docenteChange` | `Docente`. Emite el docente completo al elegirlo                 |

---

## 2. Cómo usarlo

```ts
import { SelectorDocenteComponent } from '../../shared/components/selector-docente/selector-docente';
import { Docente } from '../../shared/models/docente.model';

@Component({
  imports: [SelectorDocenteComponent],
  // ...
})
export class MiPaginaComponent {
  protected alElegirDocente(docente: Docente): void {
    // ...
  }
}
```

```html
<app-selector-docente [materiaId]="materiaId()" (docenteChange)="alElegirDocente($event)" />
```

- La búsqueda **no distingue tildes ni mayúsculas** y acepta **varias palabras en cualquier
  orden**: `luis andrade` encuentra `Andrade Mora Luis`.
- También busca por **identificación**.
- Muestra como máximo **10 resultados**.
- Con teclado: `↓` / `↑` mueven la selección, `Enter` elige y `Esc` cierra la lista.
- Sin `materiaId` lista a todos los docentes. Con `materiaId` solo a los habilitados; si no hay
  ninguno, avisa "No hay docentes habilitados para esta materia."
- Si cambia `materiaId` y el docente elegido ya no está habilitado, el campo se limpia.
- Solo emite al **elegir** un docente; escribir texto no emite nada.

### Quién lo usa

| Grupo | Dónde                                                                     |
| ----- | ------------------------------------------------------------------------- |
| G2    | `app-asignacion-docentes`: reasignar docente a un paralelo; `app-disponibilidad-docente`: elegir docente |
| G3    | `app-vista-horario`: vista de horario por docente                         |
| G5    | `app-reporte-carga-docente`: filtro del reporte                           |

---

## 3. Modelo y servicio

```ts
interface Docente {
  id: number;
  identificacion: string;   // cédula o documento
  nombre: string;           // apellidos y nombres
  cargaMaxima: number;      // en horas
  materiaIds: number[];     // materias para las que está habilitado
}
```

`DocenteService.listar({ materiaId? })` devuelve hoy datos de `shared/mocks/docentes.mock.ts` y
aplica el filtro. Cuando exista backend se cambia **solo el cuerpo de `listar`** por
`GET /api/docentes?materiaId=`; el componente no se toca.

---

## 4. Archivos

```
src/app/shared/
├── components/selector-docente/
│   ├── selector-docente.ts          ← clase del componente
│   ├── selector-docente.html        ← plantilla (Tailwind, paleta oficial)
│   └── selector-docente.spec.ts     ← 13 pruebas
├── mocks/docentes.mock.ts           ← datos de prueba
├── models/docente.model.ts          ← tipo Docente
└── services/
    ├── docente.service.ts           ← listar(filtros)
    └── docente.service.spec.ts      ← 4 pruebas
```

---

## 5. Pruebas

`selector-docente.spec.ts` verifica: búsqueda por nombre sin tildes ni mayúsculas; por
identificación; con varias palabras en cualquier orden; que se muestran la identificación y la
carga máxima; la emisión al elegir con el mouse; el uso con teclado; que `Esc` cierra la lista; el
filtro por materia; los avisos de "sin docentes habilitados" y "sin coincidencias"; la limpieza
del campo al cambiar de materia; el aviso de error; y los ids únicos.

`docente.service.spec.ts` verifica la lista completa, el filtro por materia, una materia sin
docentes y los datos de cada docente.

Ejecutar: `npm test`.

---

## 6. Advertencias

| Tema | Detalle |
| ---- | ------- |
| **Unidad de la carga máxima** | Se muestra en horas (`Carga máx.: 20 h`). Si el sistema la maneja en otra unidad (por ejemplo, créditos), hay que cambiar el texto en `selector-docente.html` y el comentario del modelo. |
| **Habilitados por materia** | El backend debe devolver solo los docentes habilitados cuando se pasa `materiaId`; el front no filtra por `materiaIds`. |
| **Datos de prueba** | Nombres e identificaciones del mock son ficticios. |