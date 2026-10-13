# C4-05 · Selector de rango de fechas

| Campo       | Valor                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ID          | **C4-05**                                                                                                                           |
| Selector    | `app-selector-rango-fechas`                                                                                                         |
| Clase       | `SelectorRangoFechasComponent`                                                                                                      |
| Tipo        | Compartido UI (sin lógica de negocio ni servicios)                                                                                  |
| Grupo dueño | G4 · Reservas                                                                                                                       |
| Lo usan     | G1 (bitácora de importaciones), G4 (recurrencia, C4-09), G5 (bandeja de aprobación, filtros de reportes, bitácora de exportaciones) |

Selector de fechas **desde–hasta** con atajos **Esta semana**, **Este mes** y **Período**. Las fechas se escriben en formato `dd/mm/aaaa` o se eligen en un calendario propio con los colores de la paleta. Valida que la fecha final no sea anterior a la inicial y muestra un resumen del rango (`lun, 2 nov 2026 – sáb, 7 nov 2026 · 6 días`).

Regla de los grupos: este componente se desarrolla **una sola vez** aquí. Si otro grupo necesita un cambio, debe pedirlo a G4 mediante un issue; no se copia ni se crea una versión propia.

## Archivos

```text
src/app/shared/components/selector-rango-fechas/
├── README.md
├── rango-fechas.ts                 # Tipos y funciones puras (atajos, validación, formato)
├── rango-fechas.spec.ts
├── selector-rango-fechas.ts        # Componente standalone
├── selector-rango-fechas.html      # Plantilla con Tailwind
├── selector-rango-fechas.spec.ts
├── campo-fecha.ts / .html / .spec.ts      # Pieza interna: campo de fecha con calendario
└── campo-seleccion.ts / .html / .spec.ts  # Pieza interna: lista desplegable (Período)
```

`campo-fecha` y `campo-seleccion` no son componentes del catálogo: son piezas de este componente que también reutilizan C4-04, C4-09 y C4-02 del mismo grupo (ver [Piezas internas](#piezas-internas)).

## Uso

```ts
import { SelectorRangoFechasComponent } from '<ruta>/app/shared/components/selector-rango-fechas/selector-rango-fechas';
import { RangoFechas } from '<ruta>/app/shared/components/selector-rango-fechas/rango-fechas';

@Component({
  imports: [SelectorRangoFechasComponent],
  template: `
    <app-selector-rango-fechas
      etiqueta="Fechas del reporte"
      [periodos]="periodos"
      (rangoChange)="filtrar($event)"
    />
  `,
})
export class MiPagina {
  periodos = [{ id: 2, nombre: 'Ordinario II 2026', desde: '2026-09-01', hasta: '2026-12-19' }];

  filtrar(rango: RangoFechas) {
    // rango = { desde: '2026-09-01', hasta: '2026-12-19' }
  }
}
```

Si el padre necesita conocer cada cambio o **restablecer/limpiar** el rango (por ejemplo, con el botón Limpiar de una barra de filtros), debe usar enlace doble:

```html
<app-selector-rango-fechas [(desde)]="desde" [(hasta)]="hasta" (rangoChange)="buscar($event)" />
```

## Contrato

| Entrada            | Tipo                      | Por defecto         | Descripción                                                                                                  |
| ------------------ | ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `desde`            | `string` (`YYYY-MM-DD`)   | `''`                | Fecha inicial. Es `model()`: admite `[desde]` y `[(desde)]`.                                                 |
| `hasta`            | `string` (`YYYY-MM-DD`)   | `''`                | Fecha final. Es `model()`: admite `[hasta]` y `[(hasta)]`.                                                   |
| `periodos`         | `readonly PeriodoRango[]` | `[]`                | Períodos académicos para el atajo **Período**. Si está vacío, no se muestra. Se ignoran los inválidos.       |
| `fechaReferencia`  | `string` (`YYYY-MM-DD`)   | `''` (hoy)          | Día que se toma como "hoy" para los atajos y el calendario. Vacío: fecha actual en `America/Guayaquil`.      |
| `etiqueta`         | `string`                  | `'Rango de fechas'` | Título de la tarjeta.                                                                                        |
| `fechaMin`         | `string` (`YYYY-MM-DD`)   | `''`                | Primera fecha permitida: los días anteriores no se pueden elegir y se valida al escribir.                    |
| `fechaMax`         | `string` (`YYYY-MM-DD`)   | `''`                | Última fecha permitida.                                                                                      |
| `sinFinesDeSemana` | `boolean`                 | `false`             | Desactiva sábados y domingos en los calendarios.                                                             |
| `enmarcado`        | `boolean`                 | `true`              | Con `false` se muestra sin tarjeta ni título visible, para integrarlo dentro de otra tarjeta (lo usa C4-09). |
| `mostrarResumen`   | `boolean`                 | `true`              | Con `false` no muestra el resumen del rango (C4-09 muestra el suyo).                                         |

Las cinco últimas entradas son opcionales y se añadieron al contrato del Excel; sin ellas el componente se comporta como antes.

| Salida                        | Tipo          | Cuándo se emite                                                                                    |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `rangoChange`                 | `RangoFechas` | Solo cuando **ambas** fechas están completas y el rango es válido: atajo, período o cambio a mano. |
| `desdeChange` / `hastaChange` | `string`      | Generadas por `model()` en cada cambio, aunque el rango esté incompleto o sea inválido.            |

```ts
interface RangoFechas {
  desde: string;
  hasta: string;
} // fechas ISO YYYY-MM-DD
interface PeriodoRango extends RangoFechas {
  id: number | string;
  nombre: string;
}
```

## Comportamiento

| Atajo           | Rango                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------ |
| **Esta semana** | De **lunes a sábado** de la semana actual. Un domingo pertenece a la semana que termina ese día. |
| **Este mes**    | Del día 1 al último día del mes actual (considera meses de 28, 29, 30 y 31 días).                |
| **Período**     | Lista con los `periodos` recibidos y sus fechas; aplica su `desde` y `hasta`.                    |

- El atajo activo se pinta de vino con un check (`aria-pressed="true"`); si el rango coincide con un período, ese período aparece elegido.
- En el calendario de **Hasta** no se pueden elegir días anteriores a **Desde** (y al revés). La otra punta del rango se marca con un anillo vino y los días intermedios quedan sombreados.
- Validaciones: fechas reales, final igual o posterior a la inicial, y `fechaMin` / `fechaMax` si se indican. Sin límites del padre no impone ninguno: sirve para reportes históricos de G1 y G5.
- **Error solo en el extremo culpable** (con el mensaje en un recuadro rosado enlazado por `aria-describedby`):

  | Situación                                           | Extremo marcado                 |
  | --------------------------------------------------- | ------------------------------- |
  | Fecha mal escrita (aunque el otro esté vacío)       | El mal escrito (o ambos)        |
  | `Desde` antes de `fechaMin` o después de `fechaMax` | Desde                           |
  | `Hasta` después de `fechaMax` o antes de `fechaMin` | Hasta                           |
  | Rango invertido                                     | El último que cambió el usuario |

- Distribución según el **ancho de su contenedor**, no de la ventana (consultas `@container`): en una tarjeta ancha, **Desde · Hasta · Período · atajos** en una fila; en una mediana, Desde y Hasta juntos y Período y atajos en filas propias; en una columna estrecha (una barra lateral, por ejemplo), todo apilado.
- El calendario mide 19rem como máximo y nunca más que la ventana. Si desbordaría por la derecha se desplaza a la izquierda, y si no cabe debajo y hay más espacio encima se abre hacia arriba. Se recoloca al cambiar el tamaño de la ventana.
- Con **movimiento reducido** (`prefers-reduced-motion`) no hay animaciones de entrada, elevación al pasar el ratón ni escalado al pulsar.

### Origen de los períodos

Los períodos académicos los administra **G1 · Gestión** (`app-selector-periodo`, C1-28). Mientras no exista su servicio, la página que use el selector le pasa una lista de prueba. Cuando G1 publique su servicio, solo cambia de dónde obtiene la lista el componente padre; C4-05 no se modifica.

## Funciones puras (`rango-fechas.ts`)

| Función                                                | Uso                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `fechaValida(f)`                                       | `true` si `f` es una fecha ISO real (`2026-02-30` no lo es).   |
| `hoy(zona?)`                                           | Fecha actual en `America/Guayaquil`, como `YYYY-MM-DD`.        |
| `sumarDias(f, n)`                                      | Suma o resta días, cruzando meses y años.                      |
| `estaSemana(ref)`                                      | `{ desde: lunes, hasta: sábado }` de la semana de `ref`.       |
| `esteMes(ref)`                                         | `{ desde: día 1, hasta: último día }` del mes de `ref`.        |
| `validarRango(r)`                                      | Mensaje de error o `null`. Un rango incompleto no es un error. |
| `rangoCompleto(r)`                                     | Ambas fechas presentes y rango válido.                         |
| `mismoRango(a, b)`                                     | Compara dos rangos.                                            |
| `diasEnRango(r)`                                       | Número de días, contando ambos extremos.                       |
| `diagnosticarRango(r, { fechaMin, fechaMax, ultimo })` | `{ mensaje, campos }` con el extremo culpable, o `null`.       |
| `fechaLegible(f)`                                      | Formato `es-EC`, por ejemplo `jue, 1 oct 2026`.                |

Las fechas se manejan como texto `YYYY-MM-DD` y se calculan a las 12:00 UTC, para que la zona horaria del navegador no desplace el día.

## Piezas internas

Sustituyen a los controles del navegador (`<input type="date">`, `<select>`), que salen en azul y con el formato del sistema operativo.

### `app-campo-fecha` (`campo-fecha.ts`)

Campo de texto `dd/mm/aaaa` con botón de calendario. El calendario empieza en lunes, marca "hoy" en dorado y el día elegido en vino, tacha los días no permitidos, tiene **Hoy** y **Borrar**, y se abre con animación. Teclado: flechas para moverse, Re Pág / Av Pág para cambiar de mes, Escape para cerrar. Mientras se escribe solo acepta fechas completas; `5/1/2027` o `2027-01-05` se interpretan al salir del campo.

Entradas: `valor` (`model`), `min`, `max`, `otroExtremo` y `nombreExtremo` (marcan la otra punta de un rango), `sinFinesDeSemana`, `fechaHoy`, `invalido`, `idCampo`, `nombre`, `describedBy`. Funciones: `leerFecha`, `fechaCorta`, `nombreMes`.

Lo usan C4-05, C4-04 (fecha) y C4-09 ("Repetir hasta").

### `app-campo-seleccion` (`campo-seleccion.ts`)

Lista desplegable con estilo propio: botón con flecha que gira, lista animada, check en la opción elegida, texto secundario opcional por opción. Teclado: flechas, Inicio/Fin, Enter, Escape y la primera letra para saltar.

Entradas: `opciones` (`{ valor, etiqueta, detalle? }[]`), `valor` (`model`), `vacio` (texto de la opción vacía), `idCampo`, `nombre`, `invalido`.

Lo usan C4-05 (Período) y C4-02 (tipo de espacio y edificio).

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../../TAILWIND-Y-COLORES.md); sin CSS propio ni hexadecimales.

| Elemento         | Clases de color                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Tarjeta          | `bg-surface border-border`; cabecera separada con `border-b` y marca `bg-accent-gold`          |
| Etiquetas        | `text-primary-dark`                                                                            |
| Campos           | `bg-surface border-border`, `hover:border-primary/40`, foco `border-primary ring-primary/10`   |
| Atajo activo     | `bg-primary border-primary text-white`, `hover:bg-accent`                                      |
| Atajo inactivo   | `bg-surface border-border`, al pasar el ratón se eleva con `hover:bg-muted hover:text-primary` |
| Calendario       | día elegido `bg-primary`, hoy `text-accent-gold`, rango `bg-muted`, otra punta `ring-primary`  |
| Resumen          | píldora `bg-muted`                                                                             |
| Mensaje de error | recuadro `bg-red-50 text-red-700` con icono; campo inválido `border-red-700`                   |

La paleta no tiene un token de error, por eso se usa `red-700` de Tailwind. Si el equipo acuerda uno (por ejemplo `--color-danger`), basta con sustituir esas clases.

## Accesibilidad

- La tarjeta es un grupo (`role="group"`) etiquetado por su título; cada campo tiene su `<label>`.
- Un rango inválido marca con `aria-invalid` solo el campo culpable y muestra el mensaje con `role="alert"`, enlazado con `aria-describedby` únicamente desde ese campo.
- Los atajos son botones con `aria-pressed`; el calendario es un diálogo con botones etiquetados con la fecha completa.
- Escape cierra el calendario y devuelve el foco al campo; el calendario no queda cortado ni fuera de la ventana con zoom del 200 %.
- Los identificadores internos son únicos, así que pueden convivir varios selectores en la misma página.

## Verificación

```sh
npm run build
npm test -- --watch=false
```

38 pruebas: 13 del componente (atajos, período, rango inválido, valores iniciales, resumen opcional, fecha mínima, error solo en el extremo culpable, fecha mal escrita con el otro extremo vacío, precargar y limpiar, adaptación al contenedor), 9 de las funciones puras (incluido `diagnosticarRango` y que sin límites no restringe fechas históricas), 11 de `campo-fecha` (calendario, límites, rango marcado, fines de semana, fechas escritas a mano y ubicación del calendario: desborde a la derecha, columna estrecha de 320 px y apertura hacia arriba) y 5 de `campo-seleccion` (abrir, elegir, teclado, clic fuera).

Revisado en la vista previa temporal a 320, 390, 768 y 1280 px, al 200 % de zoom y dentro de una columna de 18rem, sin desplazamiento horizontal ni calendario cortado.
