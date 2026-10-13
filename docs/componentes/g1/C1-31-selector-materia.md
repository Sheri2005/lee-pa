# Selector de materia (C1-31)

Guía para los grupos G2 y G5 (y para el resto de G1). Explica cómo usar el autocompletar de
materias, qué recibe y qué emite.

---

## 1. Qué es

Un campo de texto con lista desplegable: se escribe el **código o el nombre** de la materia y
se elige de la lista. Cada opción muestra la **carrera responsable** junto al nombre. Se puede
limitar a una carrera responsable o a una malla.

| Dato                       | Valor                                                       |
| -------------------------- | ----------------------------------------------------------- |
| ID                         | C1-31                                                       |
| Historia                   | G1-07                                                       |
| Selector                   | `app-selector-materia`                                      |
| Clase                      | `SelectorMateriaComponent`                                  |
| Tipo                       | Selector de dominio                                         |
| Grupo dueño                | G1 · Gestión (Julio Claros)                                 |
| Carpeta                    | `src/app/shared/components/selector-materia/`               |
| Depende de                 | `MateriaService`                                            |
| `input` `carreraResponsableId` | `number` (opcional). Solo materias de esa carrera       |
| `input` `mallaId`          | `number` (opcional). Solo materias de esa malla             |
| `output` `materiaChange`   | `Materia`. Emite la materia completa al elegirla            |

---

## 2. Cómo usarlo

```ts
import { SelectorMateriaComponent } from '../../shared/components/selector-materia/selector-materia';
import { Materia } from '../../shared/models/materia.model';

@Component({
  imports: [SelectorMateriaComponent],
  // ...
})
export class MiPaginaComponent {
  protected alElegirMateria(materia: Materia): void {
    // ...
  }
}
```

```html
<app-selector-materia
  [carreraResponsableId]="carreraId()"
  [mallaId]="mallaId()"
  (materiaChange)="alElegirMateria($event)"
/>
```

- La búsqueda **no distingue tildes ni mayúsculas**: `calculo` encuentra `Cálculo I`.
- Muestra como máximo **10 resultados**.
- Con teclado: `↓` / `↑` mueven la selección, `Enter` elige y `Esc` cierra la lista.
- Si cambias `carreraResponsableId` o `mallaId` y la materia elegida ya no está en la lista, el
  campo se limpia.
- Solo emite al **elegir** una materia; escribir texto no emite nada.

### Quién lo usa

| Grupo | Dónde                                                                 |
| ----- | --------------------------------------------------------------------- |
| G1    | `app-malla-materia-form`, `app-requisitos-editor`, `app-docente-materias` |
| G2    | `app-curso-manual-form`: agregar un curso manual y registrar estudiantes estimados |
| G5    | `app-reporte-materias-compartidas`: filtro del reporte                |

---

## 3. Modelo y servicio

```ts
interface Materia {
  id: number;
  codigo: string;               // 'MAT-101'
  nombre: string;
  carreraResponsableId: number;
  carreraResponsable: string;   // nombre; se muestra en la lista
  mallaIds: number[];           // mallas en las que se dicta
}
```

`MateriaService.listar({ carreraResponsableId?, mallaId? })` devuelve hoy datos de
`shared/mocks/materias.mock.ts` y aplica los filtros. Cuando exista backend se cambia **solo el
cuerpo de `listar`** por `GET /api/materias?carreraResponsableId=&mallaId=`; el componente no se
toca. El backend debe devolver `carreraResponsable` (el nombre), no solo su id.

---

## 4. Archivos

```
src/app/shared/
├── components/selector-materia/
│   ├── selector-materia.ts          ← clase del componente
│   ├── selector-materia.html        ← plantilla (Tailwind, paleta oficial)
│   └── selector-materia.spec.ts     ← 8 pruebas
├── mocks/materias.mock.ts           ← datos de prueba
├── models/materia.model.ts          ← tipo Materia
└── services/materia.service.ts      ← listar(filtros)
```

---

## 5. Pruebas

`selector-materia.spec.ts` verifica: búsqueda por código; búsqueda por nombre sin tildes ni
mayúsculas; que se muestra la carrera responsable; la emisión al elegir con el mouse; el uso con
teclado (`↓` + `Enter`); que `Esc` cierra la lista; que los filtros llegan al servicio; y el
aviso de error.

Ejecutar: `npm test`.
