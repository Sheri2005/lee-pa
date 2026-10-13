# Selector de nivel (C1-39)

Guía para los grupos G2, G3 y G5. Explica cómo usar el selector de niveles de una malla, qué
recibe y qué emite.

---

## 1. Qué es

Muestra los niveles (1..n) de una malla como **chips** y permite elegir **uno** o **varios**.
Con un solo nivel funciona como radios; en modo múltiple, como casillas.

| Dato                   | Valor                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| ID                     | C1-39                                                              |
| Historia               | G1-09                                                              |
| Selector               | `app-selector-nivel`                                               |
| Clase                  | `SelectorNivelComponent`                                           |
| Tipo                   | Selector de dominio                                                |
| Grupo dueño            | G1 · Gestión (Julio Claros)                                        |
| Carpeta                | `src/app/shared/components/selector-nivel/`                        |
| Depende de             | `MallaService`                                                     |
| `input` `mallaId`      | `number` (opcional). Malla de la que se muestran los niveles       |
| `input` `multiple`     | `boolean`, por defecto `false`. Permite elegir varios niveles      |
| `output` `nivelesChange` | `number[]`. Niveles elegidos, ordenados de menor a mayor         |

---

## 2. Cómo usarlo

```ts
import { SelectorNivelComponent } from '../../shared/components/selector-nivel/selector-nivel';

@Component({
  imports: [SelectorNivelComponent],
  // ...
})
export class MiPaginaComponent {
  protected readonly niveles = signal<number[]>([]);
}
```

```html
<!-- Un solo nivel -->
<app-selector-nivel [mallaId]="mallaId()" (nivelesChange)="niveles.set($event)" />

<!-- Varios niveles -->
<app-selector-nivel [mallaId]="mallaId()" multiple (nivelesChange)="niveles.set($event)" />
```

- **Siempre emite una lista**, también en modo simple (`[3]`). Sin selección emite `[]`; úsalo
  como "todos los niveles" si tu pantalla lo necesita como filtro.
- **No preselecciona nada.**
- **Sin `mallaId`** queda deshabilitado con el aviso "Elige una malla para ver sus niveles."
- Si cambia `mallaId` y algún nivel elegido ya no existe, se descarta y se emite lo que queda.
- Si pasas de `multiple` a simple con varios elegidos, se queda solo el menor y se emite.
- El botón **Limpiar selección** aparece cuando hay algo elegido y emite `[]`.
- Con `multiple` basta escribir el atributo; también funciona `[multiple]="true"`.

### Quién lo usa

| Grupo | Dónde                                                                 |
| ----- | --------------------------------------------------------------------- |
| G2    | `app-parametros-planificacion`: elegir los niveles a ofertar          |
| G3    | `app-vista-horario`: filtro por nivel en la vista de horario por carrera |
| G5    | `app-reporte-cursos-paralelos`: filtro por nivel en el reporte        |

---

## 3. Servicio

`MallaService.listarNiveles(mallaId)` devuelve los números de nivel de la malla (`[1, 2, ... n]`).
Hoy los datos salen de `shared/mocks/mallas.mock.ts` (`NIVELES_POR_MALLA_MOCK`). Cuando exista
backend se cambia **solo el cuerpo del método** por `GET /api/mallas/:id/niveles`; el componente
no se toca.

---

## 4. Archivos

```
src/app/shared/
├── components/selector-nivel/
│   ├── selector-nivel.ts          ← clase del componente
│   ├── selector-nivel.html        ← plantilla (chips, Tailwind, paleta oficial)
│   └── selector-nivel.spec.ts     ← 10 pruebas
├── mocks/mallas.mock.ts           ← incluye NIVELES_POR_MALLA_MOCK
└── services/malla.service.ts      ← incluye listarNiveles()
```

---

## 5. Pruebas

`selector-nivel.spec.ts` verifica: el aviso sin malla; los niveles 1..n; la selección simple
(radios, un solo nivel); la múltiple (casillas, emitidos ordenados, desmarcar); "Limpiar
selección"; el descarte de niveles al cambiar de malla; el paso de múltiple a simple; la malla sin
niveles; el aviso de error; y que dos selectores en la misma página no comparten el grupo.

Ejecutar: `npm test`.

---

## 6. Advertencias

| Tema | Detalle |
| ---- | ------- |
| **Niveles de ejemplo** | Los mocks dan 9 niveles a la malla 3 y 10 a las mallas 4 y 5. Ajústalos si no coinciden con la realidad. |
| **Origen de los niveles** | El backend debe devolver los niveles reales de la malla (los mismos que arma `app-malla-por-niveles`). |