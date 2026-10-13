# app-sugerencia-docente (C2-14)

Grupo 2 · Planificación · G2-10. Recibe `paraleloId: number` y emite
`docenteElegido: Docente`. El padre C2-13 confirma la asignación.

```html
<app-sugerencia-docente [paraleloId]="1" (docenteElegido)="alElegirDocente($event)" />
```

Importar `SugerenciaDocenteComponent` en el padre standalone. No tiene ruta propia.
Reutiliza C2-15 para carga proyectada y C2-10 para justificación de reglas.

## Comportamiento

- Lista activos habilitados y disponibles, ordenados por menor carga.
- Excluye candidatos que excederían el máximo; admite el límite exacto.
- Descarta consultas anteriores al cambiar de paralelo o reintentar.
- Reconsulta cuando cambia `AsignacionDocenteService.revision`, evitando cargas
  obsoletas después de una asignación en C2-13.
- Tiene estados de carga, error con reintento y lista vacía.

## Datos de prueba

El servicio comparte estado en memoria con C2-13 y usa
`core/mocks/asignacion-planificacion.mock.ts`. Al recargar se restablecen los datos.
Habilitación y disponibilidad son simuladas; no hay API ni cruces de horarios reales.

Al inicio, el paralelo 1 ofrece Jorge (12 h), María (20 h) y Ana (24 h);
el paralelo 3 ofrece Jorge (14 h). Las opciones cambian al confirmar asignaciones.
El paralelo 999 muestra error. Las pruebas cubren también el estado sin candidatos.

El modelo mínimo `Docente` debe coordinarse con G1 cuando publique el contrato.
La API deberá revalidar las reglas y guardar de forma atómica.

```shell
npm run build
npm test -- --watch=false
```
