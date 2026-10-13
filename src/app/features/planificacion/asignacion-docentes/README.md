# app-asignacion-docentes (C2-13)

G2 · Planificación · G2-10/G2-11. Recibe `planificacionId: number` y emite
`asignacionChange: CambioAsignacion` después de confirmar una asignación.

```html
<app-asignacion-docentes [planificacionId]="3" (asignacionChange)="alCambiarAsignacion($event)" />
```

Importar `AsignacionDocentesComponent` en el `imports` del padre standalone.
No tiene ruta propia. Usa C2-14 para sugerencias y C2-15 para carga docente.

## Prototipo

- Los cambios viven en memoria y se pierden al recargar.
- Aceptar una sugerencia o reasignar actualiza las cargas de ambos docentes.
- La carga suma solo asignaciones confirmadas del mismo período y excluye el paralelo
  que se está evaluando; una sugerencia pendiente no reserva horas.
- Se permite el límite exacto. La sobrecarga se avisa y bloquea al confirmar.
- Política propuesta: solo BORRADOR y CON_CAMBIOS admiten cambios.
- Planificación 3: editable, tres paralelos. 2: vacía. 1: solo lectura. 999: error.

## Dependencias pendientes

Los comentarios `EDITAR` marcan HTML temporal de esta vista, siguiendo el patrón de C2-01:
tabla → `app-tabla-datos` (G4); selector → `app-selector-docente` (G1);
estado → `app-estado-badge` (G5). No se crean copias de esos componentes.
El prototipo todavía no cumple esa integración final del catálogo.

El servicio usa un fixture local, no el catálogo real ni disponibilidad de horarios.
Conectar DocenteService y disponibilidad cuando sus contratos estén publicados;
el backend debe validar las reglas y persistir de forma atómica.

```shell
npm run build
npm test -- --watch=false
```

## Prueba visual temporal

El arranque actual está vacío y el padre `app-planificacion-detalle` aún no está
integrado. Para verlo temporalmente, importar en `src/app/app.ts`:

```typescript
import { AsignacionDocentesComponent } from './features/planificacion/asignacion-docentes/asignacion-docentes.component';
```

Agregar `imports: [AsignacionDocentesComponent]` al decorador de `App` y usar en
`src/app/app.html`:

```html
<app-asignacion-docentes [planificacionId]="3" />
```

Ejecutar `npm start`. Aceptar a Jorge en el paralelo 2 debe actualizar su carga a
12 h. Al abrir el paralelo 1, su proyección será de 16 h. Elegir a Luis manualmente
muestra 26/24 h y bloquea confirmar. Recargar restablece los datos. Retirar este
montaje temporal al terminar y conectar el componente con el padre real.

El servicio comparte estado solo entre C2-13 y C2-14; otros servicios mock de
paralelos todavía no se sincronizan con él.

## Compatibilidad con G1

No se incluyen modelos, servicios ni componentes copiados de Gestión. El indicador
de materia compartida declara localmente los dos campos de vista que necesita para
eliminar un import a un archivo inexistente; no reemplaza el modelo `Materia` de G1.
