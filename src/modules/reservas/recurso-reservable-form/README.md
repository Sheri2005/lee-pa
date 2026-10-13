# C4-17 · Formulario de recurso reservable

| Campo       | Valor                                                          |
| ----------- | -------------------------------------------------------------- |
| ID          | **C4-17**                                                      |
| Selector    | `app-recurso-reservable-form`                                  |
| Clase       | `RecursoReservableFormComponent`                               |
| Tipo        | Diálogo                                                        |
| Grupo dueño | G4 · Reservas                                                  |
| Responsable | Justin Soledispa                                               |
| Se usa en   | `app-recursos-reservables-lista` (C4-16, `/reservas/recursos`) |
| Historia    | G4-09                                                          |

Diálogo para **crear o editar** un recurso reservable (proyector móvil, laptop, parlante…): nombre, cantidad total y estado, que son los campos de la tabla `recurso_reservable` del modelo de datos. Valida los datos y emite el resultado; la lista que lo abre (C4-16) es la que guarda con el servicio.

## Archivos

```text
src/modules/reservas/recurso-reservable-form/
├── README.md
├── recurso-reservable-form.ts        # Componente standalone + normalizarNombre
├── recurso-reservable-form.html      # Plantilla con Tailwind
└── recurso-reservable-form.spec.ts
```

`RecursoReservable` está en `src/app/core/models/reserva.model.ts`.

## Uso

```ts
import {
  DatosRecursoReservable,
  RecursoReservableFormComponent,
} from '../recurso-reservable-form/recurso-reservable-form';

@Component({
  imports: [RecursoReservableFormComponent],
  template: `
    @if (abierto()) {
      <app-recurso-reservable-form
        [recurso]="seleccionado()"
        [nombresExistentes]="nombres()"
        (guardar)="guardar($event)"
        (cancelar)="abierto.set(false)"
      />
    }
  `,
})
export class RecursosReservablesListaComponent {
  abierto = signal(false);
  seleccionado = signal<RecursoReservable | null>(null); // null = nuevo

  guardar(datos: DatosRecursoReservable) {
    // datos.id existe solo al editar
    this.abierto.set(false);
  }
}
```

El diálogo se muestra mientras está en la plantilla: la lista lo abre con **Nuevo** o **Editar** y lo cierra con `@if`. No se abre solo.

## Contrato

| Entrada             | Tipo                        | Por defecto | Descripción                                                                  |
| ------------------- | --------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `recurso`           | `RecursoReservable \| null` | `null`      | Recurso a editar. Con `null` el formulario crea uno nuevo.                   |
| `nombresExistentes` | `readonly string[]`         | `[]`        | Nombres ya registrados. Añadida al contrato del Excel para evitar repetidos. |

| Salida     | Tipo                     | Cuándo se emite                                                                                 |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `guardar`  | `DatosRecursoReservable` | Al pulsar **Crear recurso** / **Guardar cambios** con datos válidos. Lleva `id` solo al editar. |
| `cancelar` | `void`                   | Al pulsar **Cancelar**, la ✕ o la tecla Escape.                                                 |

## Campos y validaciones

| Campo    | Control                                  | Regla                                                                                                                                              |
| -------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre   | Texto                                    | Obligatorio, de 3 a 80 caracteres, sin repetir otro existente (sin importar mayúsculas, tildes ni espacios; al editar el nombre propio no cuenta). |
| Cantidad | Botones − / + y texto                    | Número entero entre 1 y 999. Un recurso nuevo empieza en 1.                                                                                        |
| Estado   | Interruptor **Disponible para reservar** | Activo por defecto. Si se desactiva, el recurso no aparece al solicitar una reserva.                                                               |

Los errores aparecen después del primer intento de guardar, junto a cada campo, y el foco va al primer campo con error. El nombre se emite sin espacios de más.

## Estilos y colores

Solo clases de Tailwind con los tokens de [`TAILWIND-Y-COLORES.md`](../../../../TAILWIND-Y-COLORES.md); sin controles nativos (casilla ni número del navegador).

| Elemento        | Clases de color                                                                     |
| --------------- | ----------------------------------------------------------------------------------- |
| Fondo           | `bg-wine-deep/40` con desenfoque; aparece con una transición                        |
| Panel           | `bg-surface border-border`; entra escalando                                         |
| Cabecera y pie  | separados con `border-b` / `border-t`; pie `bg-header/40`                           |
| Campos          | `border-border`, `hover:border-primary/40`, foco `ring-primary/10`                  |
| Interruptor     | activo `bg-primary`, inactivo `bg-text-secondary/30`                                |
| Botón principal | `bg-primary text-white hover:bg-accent`                                             |
| Botón Cancelar  | `bg-surface border-border text-primary hover:bg-header`                             |
| Errores         | `text-red-700`, campo inválido `border-red-700` (la paleta no tiene token de error) |

## Accesibilidad

- `role="dialog"` con `aria-modal="true"`, etiquetado por su título; botón ✕ con `aria-label="Cerrar"`.
- Al abrirse, el foco va al campo **Nombre**; Escape cierra.
- El interruptor es un `role="switch"` con `aria-checked`; los botones − / + tienen `aria-label`.
- Los errores se enlazan con `aria-describedby` y marcan `aria-invalid`.

## Verificación

```sh
npm run build
npm test -- --watch=false
```

11 pruebas: modo crear (cantidad 1) y editar, errores tras intentar guardar, cantidad decimal, recurso nuevo sin `id`, edición con `id` y cambio de estado, nombre repetido, botones − y +, cancelar con botón y Escape, nombre corto y normalización de nombres.
