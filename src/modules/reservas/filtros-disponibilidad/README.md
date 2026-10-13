# C4-02 · Filtros de disponibilidad

| Campo       | Valor                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID          | **C4-02**                                                                                                                                                                             |
| Selector    | `app-filtros-disponibilidad`                                                                                                                                                          |
| Clase       | `FiltrosDisponibilidadComponent`                                                                                                                                                      |
| Tipo        | Hijo                                                                                                                                                                                  |
| Grupo dueño | G4 · Reservas                                                                                                                                                                         |
| Se usa en   | `app-buscar-espacios` (C4-01, `/reservas/buscar`)                                                                                                                                     |
| Contiene    | `app-barra-filtros` (C4-21), `app-selector-rango-horario` (C4-04); `app-selector-tipo-espacio`, `app-selector-edificio` y `app-selector-recursos` (G3) — **provisionales**, ver abajo |
| Historia    | G4-01                                                                                                                                                                                 |

Filtros de la búsqueda de espacios libres: **fecha y horario** (obligatorios), **tipo de espacio**, **edificio**, **capacidad mínima** y **recursos** que debe tener el espacio. Al pulsar **Buscar** (o Enter) emite el filtro; no consulta servicios: la página de búsqueda calcula los espacios libres y se los pasa a `app-resultados-disponibilidad` (C4-03).

## Archivos

```text
src/modules/reservas/filtros-disponibilidad/
├── README.md
├── filtros-disponibilidad.ts                   # Componente standalone (reexporta FiltroDisponibilidad)
├── filtros-disponibilidad.html                 # Plantilla con Tailwind
├── filtros-disponibilidad.spec.ts
└── campo-multiseleccion.ts / .html / .spec.ts  # Pieza interna: selección múltiple con buscador
```

Las listas de tipo y edificio usan `app-campo-seleccion`, pieza de C4-05.

## Uso

```ts
import {
  FiltroDisponibilidad,
  FiltrosDisponibilidadComponent,
} from '../filtros-disponibilidad/filtros-disponibilidad';

@Component({
  imports: [FiltrosDisponibilidadComponent, ResultadosDisponibilidadComponent],
  template: `
    <app-filtros-disponibilidad (buscar)="buscar($event)" />
    <app-resultados-disponibilidad [espacios]="espacios()" [cargando]="buscando()" />
  `,
})
export class BuscarEspaciosComponent {
  buscar(filtro: FiltroDisponibilidad) {
    // consultar DisponibilidadEspacioService con el filtro
  }
}
```

## Contrato

| Entrada        | Tipo                         | Por defecto | Descripción                                                                        |
| -------------- | ---------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `fechaMin`     | `string` (YYYY-MM-DD)        | hoy         | Primera fecha que se puede elegir. Se pasa a C4-04.                                |
| `horaMin`      | `string` (HH:mm)             | `'07:00'`   | Hora de inicio más temprana (política actual). Se pasa a C4-04.                    |
| `horaMax`      | `string` (HH:mm)             | `'21:00'`   | Hora de fin más tardía (política actual). Se pasa a C4-04.                         |
| `tiposEspacio` | `readonly OpcionSeleccion[]` | `[]`        | **TEMPORAL**: opciones de tipo de espacio (`{ valor: 'AULA', etiqueta: 'Aula' }`). |
| `edificios`    | `readonly OpcionSeleccion[]` | `[]`        | **TEMPORAL**: opciones de edificio (`valor` = id del edificio).                    |
| `recursos`     | `readonly OpcionSeleccion[]` | `[]`        | **TEMPORAL**: recursos instalados en los espacios (`valor` = id del recurso).      |

Las seis entradas son opcionales y se añadieron al contrato del Excel: las tres primeras para que la página pueda pasar el horario configurado en `app-reglas-reserva` (C4-19); las tres últimas mientras no existan los selectores de G3 (ver abajo).

| Salida   | Tipo                   | Cuándo se emite                                                              |
| -------- | ---------------------- | ---------------------------------------------------------------------------- |
| `buscar` | `FiltroDisponibilidad` | Al pulsar **Buscar** o Enter, solo si el horario y la capacidad son válidos. |

El modelo está en `src/app/core/models/ocupacion.model.ts`; el componente lo reexporta, así que también se puede importar desde aquí.

```ts
interface FiltroDisponibilidad {
  fecha: string; // '2026-11-16'
  horaInicio: string; // '14:00'
  horaFin: string; // '15:30'
  tipoEspacio: string | null; // 'LABORATORIO' o null = todos
  capacidadMinima: number | null; // null = sin mínimo
  recursos: number[]; // ids de recursos instalados; el espacio debe tenerlos todos
  edificioId: number | null; // null = todos
}
```

## Distribución y comportamiento

```text
[ Fecha            ] [ Hora de inicio      ] [ Hora de fin         ]
[ Tipo ] [ Edificio ] [ − Capacidad + ] [ Recursos: Proyector… +2 ▾ ]
                                                [Limpiar] [Buscar]
```

- Las dos filas ocupan todo el ancho; **Limpiar** y **Buscar** van en una fila propia (`app-barra-filtros` con `accionesAbajo`).
- **Fecha y horario**: reglas de C4-04 con `soloDiasHabiles` (lunes a viernes), intervalos de 15 minutos, horario 07:00–21:00, sin fechas ni horas pasadas. Si se pulsa Buscar con los tres campos vacíos aparece "Elige la fecha y el horario para buscar."
- **Capacidad mínima**: opcional, botones − / + de 5 en 5, máximo 3 cifras y tope de **500** (el campo vacío muestra "Asistentes · máx. 500"; un valor mayor se ajusta al salir del campo).
- **Recursos**: lista desplegable de selección múltiple con **buscador**; el botón resume lo elegido ("Proyector, Computadoras +2"). Sirve igual con 6 recursos que con 60.
- El contador de la barra ("N activos") cuenta los filtros opcionales usados.
- **Limpiar** vacía todos los campos, incluido el horario, y oculta los errores. No emite `buscar`.

## Pieza interna: `app-campo-multiseleccion` (`campo-multiseleccion.ts`)

Botón con resumen de lo elegido y lista animada con un buscador arriba (sin importar mayúsculas ni tildes), casillas propias con check animado, "N seleccionados" y **Quitar todos**. La lista no se cierra al marcar. Teclado: flecha abajo desde el buscador, flechas entre opciones, Enter o espacio para marcar, Escape para cerrar.

Entradas: `opciones` (`{ valor, etiqueta }[]`), `valores` (`model<string[]>`), `vacio` ("Cualquiera"), `idCampo`, `nombre`.

## Componentes de otros grupos (provisionales)

Los selectores de G3 no están en `main`. Para no crear versiones propias con su nombre, la plantilla usa campos sencillos marcados `TEMPORAL`, y sus opciones las pasa la página con las entradas `tiposEspacio`, `edificios` y `recursos`:

| Campo en la plantilla    | Sustituir por                         | Grupo |
| ------------------------ | ------------------------------------- | ----- |
| **Tipo de espacio**      | `<app-selector-tipo-espacio>` (C3-10) | G3    |
| **Edificio**             | `<app-selector-edificio>` (C3-07)     | G3    |
| **Recursos del espacio** | `<app-selector-recursos>` (C3-11)     | G3    |

Al sustituirlos desaparecen esas tres entradas, porque los selectores de G3 traen sus propios datos. La salida `buscar: FiltroDisponibilidad` no cambia.

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md); el contenedor y los botones son los de `app-barra-filtros`. Sin controles nativos del navegador.

| Elemento        | Clases de color                                                                 |
| --------------- | ------------------------------------------------------------------------------- |
| Etiquetas       | `text-primary-dark`                                                             |
| Campos y listas | `bg-surface border-border`, `hover:border-primary/40`, foco `ring-primary/10`   |
| Con valor       | `border-primary/50`                                                             |
| Casilla marcada | `bg-primary text-white` con check                                               |
| Errores         | recuadro `bg-red-50 text-red-700` con icono (la paleta no tiene token de error) |

## Accesibilidad

- Cada campo tiene su `<label>`; las listas usan `aria-haspopup`, `aria-expanded` y `role="listbox"` / `role="option"` con `aria-selected`.
- Los errores marcan `aria-invalid`; el aviso de horario vacío usa `role="alert"`.
- La barra es un formulario con `role="search"`: Enter busca desde cualquier campo.

## Verificación

```sh
npm run build
npm test -- --watch=false
```

17 pruebas: 12 del componente (campos presentes, sin horario, horario inválido, búsqueda solo con horario, todos los filtros y su contador, capacidad inválida, Enter, Limpiar, fechas pasadas, fin de semana y capacidad exagerada, tope de 500 con − y +, buscador de recursos) y 5 de `campo-multiseleccion` (varias opciones, resumen "+N", buscador, quitar todos, normalización).
