# app-planificacion-encabezado (C2-04)

Cabecera compacta de una planificación: carrera, facultad, período, malla vigente y estado.

- **Grupo dueño:** G2 · Planificación (responsable: Raúl Garay)
- **Reutilizado por:** G3 (`app-armado-horario`, `app-resumen-horario`) y G5 (`app-exportacion-siac`)
- **Usa internamente:** `app-estado-badge` (G5, C5-08), pendiente de integrar

## Entradas

| Nombre | Tipo | Obligatorio |
|---|---|---|
| `planificacion` | `Planificacion` | Sí |

Sin salidas ni servicios: solo muestra el objeto recibido.

## Uso

```ts
imports: [PlanificacionEncabezadoComponent]
```

```html
<app-planificacion-encabezado [planificacion]="planificacion" />
```

## Reglas

- No copiar el componente: se importa desde `src/app/shared/components/planificacion-encabezado`.
- Para pedir cambios, abrir un issue dirigido a G2.