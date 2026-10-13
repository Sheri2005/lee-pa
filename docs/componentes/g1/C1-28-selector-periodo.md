# Selector de período (C1-28)

Guía para los grupos G2 a G5. Explica qué hace el selector de período académico, cómo usarlo
en tus plantillas y qué recibe y emite.

---

## 1. Qué es

Un `<select>` que lista los períodos académicos (`2026-2 · Segundo período ordinario 2026
(Ordinario)`), **preselecciona** el que está en planificación o activo y **emite el período
completo**, incluido el `tipo`, para que G3 y G4 carguen las franjas horarias correctas.

| Dato                 | Valor                                                              |
| -------------------- | ------------------------------------------------------------------ |
| ID                   | C1-28                                                              |
| Historia             | G1-06                                                              |
| Selector             | `app-selector-periodo`                                             |
| Clase                | `SelectorPeriodoComponent`                                         |
| Tipo                 | Selector de dominio                                                |
| Grupo dueño          | G1 · Gestión (Julio Claros)                                        |
| Carpeta              | `src/app/shared/components/selector-periodo/`                      |
| Depende de           | `PeriodoService`                                                   |
| `input` `estados`    | `string[]` (opcional). Muestra solo períodos en esos estados       |
| `input` `tipo`       | `string` (opcional). Muestra solo períodos de ese tipo             |
| `output` `periodoChange` | `Periodo`. Emite el período completo                           |

---

## 2. Cómo usarlo

Importa la clase y ponla en el `imports` de tu componente:

```ts
import { SelectorPeriodoComponent } from '../../shared/components/selector-periodo/selector-periodo';
import { Periodo } from '../../shared/models/periodo.model';

@Component({
  imports: [SelectorPeriodoComponent],
  // ...
})
export class MiPaginaComponent {
  protected readonly periodo = signal<Periodo | null>(null);
}
```

```html
<app-selector-periodo
  [estados]="['PLANIFICACION', 'ACTIVO']"
  tipo="ORDINARIO"
  (periodoChange)="periodo.set($event)"
/>
```

- Sin `estados` ni `tipo` muestra todos los períodos.
- **Emite al cargar**: apenas llega la lista se preselecciona y se emite el primer período en
  `PLANIFICACION` o `ACTIVO`. Tu página recibe un período inicial sin que el usuario haga nada.
- Si cambias `estados` o `tipo` y el período elegido ya no está en la lista, se vuelve a
  preseleccionar.
- Los filtros no distinguen mayúsculas (`'activo'` y `'ACTIVO'` funcionan igual).

### Quién lo usa

| Grupo | Dónde                                                                          |
| ----- | ------------------------------------------------------------------------------ |
| G2    | Elegir período al crear la planificación y en disponibilidad docente; filtro de planificaciones |
| G3    | Filtro por período en el armado y en las vistas de horario (define el tipo de franjas) |
| G4    | Filtro por período en Mis reservas y en el calendario de ocupación             |
| G5    | Filtro por período en bandeja, reportes y exportación al SIAC                  |

---

## 3. Modelo y servicio

```ts
interface Periodo {
  id: number;
  codigo: string;          // '2026-2'
  nombre: string;
  tipo: 'ORDINARIO' | 'EXTRAORDINARIO';
  estado: 'PLANIFICACION' | 'ACTIVO' | 'CERRADO';
  fechaInicio: string;     // 'yyyy-MM-dd'
  fechaFin: string;        // 'yyyy-MM-dd'
  codigoSiac?: string;     // opcional
}
```

`PeriodoService.listar()` devuelve hoy datos de `shared/mocks/periodos.mock.ts` (mismos ids y
códigos que `planificaciones.mock.ts`). El servicio también tiene `crear` y `actualizar`, que usa
`app-periodos-lista` (C1-26) y que hoy trabajan en memoria. Cuando exista backend se cambia **solo
el cuerpo de cada método** por la llamada HTTP (`GET /api/periodos`, `POST`, `PUT`); los
componentes no se tocan.

---

## 4. Archivos

```
src/app/shared/
├── components/selector-periodo/
│   ├── selector-periodo.ts          ← clase del componente
│   ├── selector-periodo.html        ← plantilla (Tailwind, paleta oficial)
│   └── selector-periodo.spec.ts     ← 7 pruebas
├── mocks/periodos.mock.ts           ← datos de prueba
├── models/periodo.model.ts          ← tipo Periodo
└── services/periodo.service.ts      ← listar()
```

---

## 5. Pruebas

`selector-periodo.spec.ts` verifica: la lista con código, nombre y tipo; la preselección y la
emisión del período completo; el filtro por estados; el filtro por tipo; la emisión al cambiar
la opción; el aviso de error con el select deshabilitado; y que dos selectores en la misma
página usan ids distintos.

Ejecutar: `npm test`.

---

## 6. Advertencias

| Tema | Detalle |
| ---- | ------- |
| **Valores de `estado` y `tipo`** | Van en mayúsculas, como en `planificacion.model.ts` (`'ORDINARIO'`, `'ACTIVO'`...). El backend debe devolver exactamente esos valores. |
| **Datos mock** | Mientras no haya backend, los períodos salen del mock. |
