# C4-03 · Resultados de disponibilidad

| Campo       | Valor                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| ID          | **C4-03**                                                                                                                         |
| Selector    | `app-resultados-disponibilidad`                                                                                                   |
| Clase       | `ResultadosDisponibilidadComponent`                                                                                               |
| Tipo        | Hijo (propio del módulo de reservas)                                                                                              |
| Grupo dueño | G4 · Reservas                                                                                                                     |
| Se usa en   | `app-buscar-espacios` (C4-01, página `/reservas/buscar`)                                                                          |
| Contiene    | `app-tarjeta-espacio` (C3-13, G3), `app-estado-vacio` (C2-25, G2), `app-spinner-carga` (C2-26, G2) — **provisionales**, ver abajo |
| Historia    | G4-01                                                                                                                             |

Rejilla de **espacios libres** con su tarjeta y la acción **Reservar**. Si no hay resultados muestra un estado vacío, y mientras se buscan muestra un indicador de carga. No consulta servicios ni filtra: recibe los espacios que ya calculó la página de búsqueda.

## Archivos

```text
src/modules/reservas/resultados-disponibilidad/
├── README.md
├── resultados-disponibilidad.ts        # Componente standalone + tipoLegible / pisoLegible / recursosTexto
├── resultados-disponibilidad.html      # Plantilla con Tailwind
└── resultados-disponibilidad.spec.ts   # 6 pruebas
```

## Uso

```ts
import { ResultadosDisponibilidadComponent } from '../resultados-disponibilidad/resultados-disponibilidad';
import { Espacio } from '../../../app/core/models/espacio.model';

@Component({
  imports: [ResultadosDisponibilidadComponent],
  template: `
    <app-resultados-disponibilidad
      [espacios]="espacios()"
      [cargando]="buscando()"
      (reservar)="irAReservar($event)"
    />
  `,
})
export class BuscarEspaciosComponent {
  espacios = signal<Espacio[]>([]);
  buscando = signal(false);

  irAReservar(espacio: Espacio) {
    // p. ej. navegar a /reservas/nueva con espacio.id
  }
}
```

## Contrato

| Entrada    | Tipo                 | Por defecto | Descripción                                                                                                                                 |
| ---------- | -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `espacios` | `readonly Espacio[]` | `[]`        | Espacios libres que se muestran, en el orden recibido.                                                                                      |
| `cargando` | `boolean`            | `false`     | Muestra el indicador de carga en lugar de los resultados o del estado vacío. Añadida al contrato del Excel para cubrir `app-spinner-carga`. |

| Salida     | Tipo      | Cuándo se emite                                                              |
| ---------- | --------- | ---------------------------------------------------------------------------- |
| `reservar` | `Espacio` | Al pulsar **Reservar** en una tarjeta. Emite el objeto completo del espacio. |

### Modelo `Espacio` (`src/app/core/models/espacio.model.ts`)

Sigue la tabla `espacio` del modelo SQL, con el nombre del edificio y los recursos ya resueltos:

```ts
interface Espacio {
  id: number;
  codigo: string; // 'F-102'
  nombre: string; // 'Aula F-102'
  edificio_id: number;
  edificio: string; // 'Bloque F'
  piso: number; // 0 = planta baja
  tipo_espacio: string; // 'AULA' | 'LABORATORIO' | 'AUDITORIO'…
  capacidad: number;
  accesible: boolean;
  estado: boolean;
  recursos: { id: number; nombre: string }[];
}
```

Es **provisional**: el catálogo de espacios lo administra G3 · Horarios. Cuando G3 publique su modelo compartido en `src/app/core`, este archivo se sustituye por una importación de ese modelo.

## Estados

| Estado         | Condición                            | Qué se muestra                                                                                                                                  |
| -------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Cargando       | `cargando = true`                    | Tres tarjetas esqueleto animadas y el texto oculto "Buscando espacios disponibles…" (`role="status"`). La sección queda con `aria-busy="true"`. |
| Sin resultados | `cargando = false` y lista vacía     | "No hay espacios disponibles" con sugerencias: otra fecha u horario, menos asistentes o menos recursos (`role="status"`).                       |
| Con resultados | `cargando = false` y lista con datos | Título "Espacios disponibles" con el total y una tarjeta por espacio.                                                                           |

Cada tarjeta muestra:

- Tipo (insignia en mayúsculas) y código del espacio.
- Nombre, con edificio y piso ("Planta baja" si es 0) junto a un icono de ubicación.
- Capacidad y accesibilidad, en dos filas separadas por líneas. La accesibilidad siempre aparece: **Sin barreras** en dorado si el espacio es accesible, o **No adaptado** en gris si no lo es. Así todas las tarjetas tienen la misma estructura.
- Recursos en una línea separada por `·`, o "Sin equipamiento adicional". Reservan altura para dos líneas, para que los botones queden alineados.
- El botón **Reservar** con una flecha, siempre alineado al pie de la tarjeta.

Al pasar el ratón, la tarjeta se eleva un poco, su borde toma un tono suave de `primary`, aumenta la sombra y la flecha del botón se desplaza. Los iconos son SVG en línea (sin librerías) y están ocultos para lectores de pantalla.

## Componentes de otros grupos (provisionales)

El catálogo pide reutilizar tres componentes que, a la fecha (1 de octubre de 2026), **no existen en ninguna rama**. Para no crear versiones propias con su mismo nombre (regla del catálogo), C4-03 dibuja una versión sencilla **dentro de su plantilla**, marcada con comentarios `TEMPORAL`:

| Bloque en la plantilla | Sustituir por                                                                                         | Grupo |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ----- |
| Tarjetas esqueleto     | `<app-spinner-carga tipo="esqueleto" />` (C2-26)                                                      | G2    |
| Mensaje sin resultados | `<app-estado-vacio>` (C2-25)                                                                          | G2    |
| Tarjeta del espacio    | `<app-tarjeta-espacio [espacio]="espacio">` (C3-13), con el botón **Reservar** en su ranura de acción | G3    |

Al sustituirlos, el contrato de C4-03 (`espacios`, `cargando`, `reservar`) no cambia, así que la página que lo use no se toca.

## Estilos y colores

Solo clases de Tailwind con los tokens de la paleta oficial ([`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md)). Sin CSS propio ni colores hexadecimales.

| Elemento              | Clases de color                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Título de la sección  | `text-xl font-semibold text-primary-dark`; total en `rounded-md bg-muted text-primary`                                                   |
| Tarjeta               | `bg-surface border-border rounded-2xl p-6 shadow-sm`; al pasar el ratón `hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5` |
| Tipo de espacio       | `rounded-md bg-muted text-primary`, mayúsculas                                                                                           |
| Código del espacio    | `text-sm text-text-secondary`                                                                                                            |
| Nombre del espacio    | `text-xl font-semibold text-primary-dark`                                                                                                |
| Capacidad             | número en `text-2xl font-semibold text-primary-dark`                                                                                     |
| Recursos              | `text-sm text-primary-dark`                                                                                                              |
| Ubicación y etiquetas | `text-text-secondary`                                                                                                                    |
| Separadores           | `border-border`                                                                                                                          |
| Accesibilidad         | `Sin barreras`: `rounded-full bg-accent-gold/10 text-accent-gold`; `No adaptado`: `rounded-full border-border text-text-secondary`       |
| Botón Reservar        | `min-h-11 bg-primary text-white hover:bg-accent rounded-lg`, foco `outline-primary` (botón principal de la guía)                         |
| Estado vacío          | panel `bg-surface border-border rounded-2xl` con icono en círculo `bg-muted text-primary`                                                |
| Esqueletos de carga   | `bg-muted` con `animate-pulse`, con la misma forma que la tarjeta                                                                        |

Rejilla adaptable: tantas columnas de al menos 17,5 rem como quepan en el ancho disponible (1 en móvil, 3 o 4 en escritorio).

## Accesibilidad

- La sección está etiquetada por su título y cada tarjeta es un `<article>` etiquetado por el nombre del espacio.
- Los datos de la tarjeta (capacidad y recursos) usan una lista de definiciones (`<dl>`).
- La tarjeta resalta su borde también cuando el foco del teclado está en su botón (`focus-within`).
- Cada botón tiene `aria-label="Reservar <nombre del espacio>"`, para distinguirlos con lector de pantalla.
- Los estados de carga y vacío se anuncian con `role="status"`; durante la carga los esqueletos se ocultan a lectores de pantalla.
- Los identificadores internos son únicos por instancia.

## Verificación

```sh
npm run build
npm test -- --watch=false
```

6 pruebas: una tarjeta por espacio con sus datos y el total, recursos separados por `·`, planta baja, espacio sin recursos, accesibilidad ("Sin barreras" o "No adaptado"), emisión de `reservar` con el espacio completo, `aria-label` del botón, estado vacío, estado de carga (sin resultados ni estado vacío, `aria-busy`) y textos de tipo y piso. El componente se revisó en Chromium a 1280 y 390 px de ancho.
