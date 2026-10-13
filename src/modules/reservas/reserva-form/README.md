# C4-06 · Formulario de reserva

| Campo       | Valor                                                                            |
| ----------- | -------------------------------------------------------------------------------- |
| ID          | **C4-06**                                                                        |
| Selector    | `app-reserva-form`                                                               |
| Clase       | `ReservaFormComponent`                                                           |
| Tipo        | Página                                                                           |
| Ruta        | `/reservas/nueva` (pendiente de registrar en `app.routes.ts`, ver [Ruta](#ruta)) |
| Grupo dueño | G4 · Reservas                                                                    |
| Contiene    | C4-04, C4-09, C4-10, C4-18; C4-07, C4-08 y piezas de G3/G5 como TEMPORAL         |
| Historias   | G4-02, G4-04, G4-07                                                              |

Solicitud de reserva de un espacio fuera del horario de clases: espacio, fecha y horario, repetición semanal opcional, asistentes, motivo y recursos. Comprueba la disponibilidad de **cada fecha** y envía la solicitud a aprobación (G5).

## Archivos

```text
src/modules/reservas/reserva-form/
├── README.md
├── reserva-form.ts        # Página + validarAsistentes / validarMotivo y constantes de la política
├── reserva-form.html      # Plantilla con Tailwind
└── reserva-form.spec.ts
```

Servicios: `OcupacionService` (ocupación del espacio y lista TEMPORAL de espacios) y `ReservaService.solicitar`. Modelos: `NuevaSolicitudReserva` / `SolicitudRegistrada` en `reserva.model.ts` y `Ocupacion` / `Ocurrencia` / `ResultadoDisponibilidad` en `ocupacion.model.ts`.

## Flujo

1. **Espacio**: se elige de la lista, o llega en la URL desde la búsqueda (C4-01). Se muestran tipo, edificio, piso y capacidad.
2. **Fecha y horario** con C4-04: de lunes a viernes, 07:00–21:00, horas en pasos de 15 minutos, no en el pasado.
3. **Reserva recurrente** (interruptor): C4-09 con `[fechaInicio]` = la fecha elegida, así no se pide dos veces; C4-10 muestra cada fecha.
4. **Asistentes y motivo**.
5. **Recursos** con C4-18 para la fecha y franja.
6. **Tu solicitud** (columna derecha, fija en escritorio): resumen, resultado de la disponibilidad y **Enviar a aprobación**.

En móvil todo se apila en una columna; el resumen queda al final.

### Precarga desde la búsqueda (C4-01)

Lee los parámetros que ya envía `app-buscar-espacios` al pulsar **Reservar**:

```text
/reservas/nueva?espacioId=7&fecha=2026-11-10&horaInicio=09:00&horaFin=11:00
```

Los valores inválidos se ignoran. Precargar no muestra errores.

## Disponibilidad

- Cuando el espacio, el horario y (si se repite) la serie son válidos, el formulario espera 300 ms y pide a `OcupacionService.ocupacion(espacioId, primeraFecha, últimaFecha)` las clases y reservas del espacio.
- `evaluarDisponibilidad` compara cada fecha con esa ocupación. Solo bloquean las **clases** y las **reservas aprobadas**. Hay conflicto si los horarios se cruzan o si quedan **menos de 15 minutos** entre ambos (15 bastan, 14 no).
- Cada consulta se identifica por espacio, fechas y horario. Si el usuario cambia algo, el resultado anterior deja de valer en el acto: no habilita el envío aunque llegue tarde, y la consulta anterior se cancela (`switchMap`).
- El backend vuelve a validar al registrar; esta comprobación evita enviar solicitudes que ya se sabe que chocan.

| Estado de la consulta     | Qué se muestra                                                 | ¿Se puede enviar? |
| ------------------------- | -------------------------------------------------------------- | ----------------- |
| Falta algo                | Qué completar                                                  | No                |
| Comprobando               | «Comprobando la disponibilidad…»                               | No                |
| `null` (API sin conectar) | «No se pudo comprobar la disponibilidad…» — nunca «libre»      | No                |
| Error                     | Mensaje y **Volver a comprobar**                               | No                |
| Con conflicto             | Qué choca (puntual) o cuántas fechas (serie, detalle en C4-10) | No                |
| Libre                     | «El espacio está libre en ese horario / en las N fechas.»      | Sí                |

## Envío

- Con datos incompletos o inválidos, **Enviar** muestra todos los errores y lleva el foco al primer campo con error.
- Mientras se envía, el botón queda deshabilitado («Enviando…»): no hay doble envío.
- `ReservaService.solicitar` devuelve `null` mientras no exista la API: se muestra «No se pudo enviar…» y **nunca** un envío correcto. Solo con una respuesta real se muestra «Solicitud enviada. Queda pendiente de aprobación.» y **Nueva solicitud**.
- Si el usuario cambia la solicitud después de un error, vuelve a poder enviarla.

```ts
// Lo que se envía (NuevaSolicitudReserva)
{
  espacio_id: 7,
  hora_inicio: '09:00',
  hora_fin: '11:00',
  asistentes: 25,
  motivo: 'Taller de robótica para primer semestre',
  serie: { frecuencia: 'SEMANAL', dias_semana: ['MARTES', 'JUEVES'], fecha_desde: '2026-11-10', fecha_hasta: '2026-12-17' } /* o null */,
  fechas: ['2026-11-10', '2026-11-12', /* … */],
  recursos: [{ recurso_reservable_id: 2, cantidad: 3 }],
}
```

El solicitante lo toma el backend de la sesión. El SQL usa `recurso_id` en `reserva_recurso`; la traducción desde `recurso_reservable_id` queda para el adaptador de la API.

## Validaciones

| Campo        | Regla                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Espacio      | Obligatorio y presente en la lista de espacios.                                                                                                                                          |
| Fecha y hora | Las de C4-04 con `soloDiasHabiles`, 07:00–21:00, paso de 15 min y `fechaMin` = hoy.                                                                                                      |
| Serie        | Las de C4-09: al menos un día, hasta **90 días** (90 sí, 91 no), alguna fecha.                                                                                                           |
| Asistentes   | Empieza en 1. Entero de 1 a la capacidad del espacio (500 si aún no se conoce), máximo 3 cifras; − / + van de 5 en 5 al múltiplo anterior o siguiente (12 → 15 o 10) y recortan al tope. |
| Motivo       | De 10 a 300 caracteres, sin contar espacios de los extremos; contador visible.                                                                                                           |

Los errores de asistentes y motivo aparecen al salir del campo o al intentar enviar, nunca con el formulario vacío.

## Dependencias TEMPORALES

| Pieza futura                         | Dueño | Qué hace hoy C4-06                                                                                                       |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `app-encabezado-pagina`              | G3    | Título y descripción propios.                                                                                            |
| `app-selector-espacio` y su servicio | G3    | `campo-seleccion` con `OcupacionService.espacios()` (devuelve `null`: se muestra que la lista no está conectada).        |
| `app-validacion-disponibilidad`      | C4-07 | Resultado sencillo en la columna derecha. Recibirá `[resultado]="resultado()"` (`ResultadoDisponibilidad`).              |
| `app-espacios-alternativos`          | C4-08 | Texto «Cambia el horario o elige otro espacio.». Se conectará con `(elegir)="usarEspacio($event)"`; el método ya existe. |
| `app-boton-enviar-aprobacion`        | G5    | Botón propio **Enviar a aprobación**.                                                                                    |

C4-08 (Leonor) define en su rama `SolicitudReserva` y `DisponibilidadEspacioService.buscarAlternativas`. Este formulario no crea ni modifica ese servicio; al integrarlo se le pasará una `SolicitudReserva` armada con el espacio, la fecha, el horario, los asistentes y los recursos de este formulario.

## Ruta

Siguiendo la guía del grupo, la entrega no modifica `app.routes.ts`. Para registrarla:

```ts
{
  path: 'reservas/nueva',
  loadComponent: () =>
    import('../modules/reservas/reserva-form/reserva-form').then((m) => m.ReservaFormComponent),
}
```

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md); sin CSS propio ni hexadecimales.

| Elemento            | Clases de color                                                              |
| ------------------- | ---------------------------------------------------------------------------- |
| Tarjetas            | `bg-surface border-border`; cabecera con `border-b` y marca `bg-accent-gold` |
| Datos del espacio   | `bg-header`                                                                  |
| Interruptor         | activo `bg-primary`, inactivo `bg-text-secondary/30`                         |
| Libre / enviada     | `bg-emerald-50 text-emerald-700`                                             |
| Conflicto / errores | `bg-red-50 text-red-700`; campo culpable `border-red-700`                    |
| Sin conexión        | `bg-muted text-primary-dark`                                                 |
| Enviar              | `bg-primary`, `hover:bg-accent`; deshabilitado `bg-primary/40`               |

## Accesibilidad

- Cada campo tiene `<label>`; los errores usan `role="alert"` y `aria-describedby`; el contador del motivo es `aria-live`.
- El resultado de la disponibilidad está en una región `aria-live="polite"`. Junto al botón deshabilitado se explica por qué (`aria-describedby`).
- El interruptor es `role="switch"` con `aria-checked`. Los botones − / + tienen `aria-label`.
- Al intentar enviar con errores, el foco va al primer campo con error.
- Sin controles nativos de fecha, hora, número ni listas. Transiciones desactivadas con `motion-reduce`.

## Verificación

```sh
npx ng test --watch=false
npx ng build
```

16 pruebas con servicios falsos dentro del spec: precarga desde la URL; sin consulta conectada no marca «libre» ni deja enviar; sin lista de espacios no inventa datos; envío con la solicitud completa y sin éxito falso; éxito solo con registro real; sin doble envío; un resultado anterior no habilita una solicitud cambiada; conflicto con 15 min de separación; serie con conflicto por ocurrencia; series de 90 frente a 91 días; horas fuera del paso o del horario; capacidad y motivo; formulario vacío sin errores; reintento tras error; funciones de validación; asistentes desde 1 y − / + de 5 en 5 hasta la capacidad.

Revisado en la vista previa temporal a 390, 1280 y 1440 px (sin desplazamiento horizontal), con y sin servicios conectados.
