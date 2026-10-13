# C4-08 · Espacios alternativos

| Campo       | Valor                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------- |
| ID          | **C4-08**                                                                                    |
| Selector    | `app-espacios-alternativos`                                                                  |
| Clase       | `EspaciosAlternativosComponent`                                                              |
| Tipo        | Hijo                                                                                         |
| Grupo dueño | G4 · Reservas                                                                                |
| Se usa en   | `app-reserva-form` (C4-06), cuando el espacio pedido tiene conflicto                         |
| Contiene    | `app-tarjeta-espacio` (G3), `app-justificacion-regla` y `app-estado-vacio` (G2) — `TEMPORAL` |
| Servicio    | `DisponibilidadEspacioService.buscarAlternativas`                                            |
| Historia    | G4-05                                                                                        |

Propone espacios equivalentes y libres cuando el solicitado está ocupado: tipo, capacidad, recursos, prioridad de la facultad y cercanía, cada uno con su justificación y el botón **Usar este**.

## Archivos

```text
src/modules/reservas/espacios-alternativos/
├── README.md
├── espacios-alternativos.ts       # Componente standalone + CERCANIA
├── espacios-alternativos.html     # Plantilla con Tailwind
└── espacios-alternativos.spec.ts
```

Modelos en `src/app/core/models/`: `Espacio` (`espacio.model.ts`, TEMPORAL de G3) y `AlternativaEspacio` / `CercaniaEspacio` (`ocupacion.model.ts`). La tarjeta reutiliza `tipoLegible`, `pisoLegible` y `recursosTexto` de C4-03 para verse igual que los resultados de la búsqueda.

## Uso

```html
<app-espacios-alternativos [solicitud]="solicitud()" (elegir)="usarEspacio($event)" />
```

C4-06 ya tiene el método `usarEspacio(espacio)`, que cambia el espacio y vuelve a comprobar la disponibilidad.

## Contrato

| Tipo    | Nombre                        | Descripción                                             |
| ------- | ----------------------------- | ------------------------------------------------------- |
| Entrada | `solicitud: SolicitudReserva` | Fecha, horario, asistentes, tipo y recursos requeridos. |
| Salida  | `elegir: Espacio`             | Espacio elegido con **Usar este**.                      |

```ts
interface AlternativaEspacio {
  espacio: Espacio;
  justificacion: string; // «Mismo tipo y piso, capacidad para 35 personas…»
  prioridadFacultad: boolean; // edificio prioritario de la facultad (prioridad_espacio, G3)
  cercania: 'MISMO_PISO' | 'MISMO_EDIFICIO' | 'OTRO_EDIFICIO';
}
```

## Comportamiento

- Cada tarjeta muestra tipo, código, nombre, edificio y piso, capacidad, recursos instalados y el recuadro **Por qué se recomienda** con la justificación.
- El recuadro lleva siempre **dos etiquetas**, una debajo de la otra:
  - Facultad: **Edificio de tu facultad** (vino) o **Fuera de tu facultad** (gris).
  - Cercanía: **Mismo piso**, **Mismo edificio** u **Otro edificio**.
- **Sin metros:** el modelo de datos (Anexo A) no guarda coordenadas de los edificios, así que la cercanía se expresa por edificio y piso, que el backend sí puede calcular.
- Los recuadros estiran su alto para que todas las tarjetas de una fila midan igual y el botón quede alineado.
- Estados: cargando (esqueleto), error, sin alternativas y listo.

| `DisponibilidadEspacioService`  | Endpoint previsto             |
| ------------------------------- | ----------------------------- |
| `buscarAlternativas(solicitud)` | `POST /reservas/alternativas` |

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md); sin CSS propio ni hexadecimales.

| Elemento                  | Clases de color                                                     |
| ------------------------- | ------------------------------------------------------------------- |
| Tarjeta                   | `bg-surface border-border`, igual que C4-03                         |
| Recuadro de justificación | `bg-accent-gold/5 border-accent-gold/20`, título `text-accent-gold` |
| Edificio de tu facultad   | `border-primary/25 text-primary`                                    |
| Fuera de tu facultad      | `border-border text-text-secondary`                                 |
| Usar este                 | `bg-primary text-white hover:bg-accent`                             |

## Accesibilidad

- Cada tarjeta es un `<article>` etiquetado con el nombre del espacio; el botón dice «Usar Aula 206».
- Las etiquetas son una lista con `aria-label="Criterios"`; los íconos son decorativos.
- Carga con `role="status"` y `aria-busy`; error con `role="alert"`.

## Verificación

```sh
npx ng test --watch=false
npx ng build
npx ngc -p tsconfig.app.json --noEmit
```

3 pruebas con un servicio falso dentro del spec: alternativas con sus dos etiquetas (facultad y cercanía, sin metros) y `elegir`, estado vacío y error del servicio.
