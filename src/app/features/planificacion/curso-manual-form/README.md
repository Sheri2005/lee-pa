# app-curso-manual-form (C2-09)

G2 · Planificación · G2-06. Diálogo para agregar una materia no sugerida con número
de paralelos y motivo. Hijo de C2-08, todavía pendiente en esta rama.

## Uso

Importar `CursoManualFormComponent` en `imports` del padre standalone y montarlo con `@if`:

```html
@if (mostrarCursoManual()) {
<app-curso-manual-form
  [planificacionId]="planificacionId()"
  (guardar)="alGuardarCurso($event)"
  (cancelar)="mostrarCursoManual.set(false)"
/>
}
```

`guardar: CursoManual` se emite después de guardar. El padre debe cerrar el diálogo
y actualizar su lista; no volver a guardar. `cancelar: void` no modifica datos.
El diálogo se abre al montarlo y se cierra cuando el padre lo desmonta.

## Dependencia de G1

Reutiliza `SelectorMateriaComponent` y `MateriaService` originales de G1, integrados
sin modificaciones desde `main` (versión de G1 `a2245c7`), en sus rutas oficiales.
El selector se importa de `shared/components/selector-materia/selector-materia`.
Usa `materiaChange`, no `formControlName`: la versión revisada no implementa CVA.
Se filtra por carrera responsable, sin limitar por malla.

Tras elegir, se muestra un resumen con «Cambiar materia»: evita conservar un ID
oculto cuando el selector de G1 borra su texto sin emitir una deselección.
El servicio vuelve a verificar la materia en el catálogo de G1 al guardar.

## Reglas del prototipo

- Solo BORRADOR y CON_CAMBIOS permiten agregar cursos.
- Materia propia obligatoria, paralelos enteros positivos y motivo no vacío.
- Máximo de 500 caracteres para el motivo: límite propuesto para acordar con backend.
- Rechaza repetir un curso manual de la misma materia en la misma planificación.
- Botón, Esc y fondo permiten cancelar; se bloquean mientras se guarda.
- Un cambio de planificación limpia el formulario y cancela el envío mock pendiente.
- No genera paralelos ni asignaciones docentes. Se guarda en memoria y se pierde al recargar.

El catálogo G1 y los mocks de materias de G2 usan IDs diferentes. Este flujo usa
G1 para elegir y validar; no convierte IDs ni reutiliza el mock de C2-07.
Al integrar C2-08 hay que unificar catálogo y cursos manuales/sugeridos para evitar
duplicados entre ambos orígenes. Actualmente solo se comprueban duplicados manuales.
La API deberá validar y persistir de forma atómica. Cancelar HTTP no deshace una
escritura que el servidor ya realizó.

## Prueba

Las dependencias oficiales de G1 y sus pruebas están incluidas. Desde la raíz:

```shell
npm run build
npm test -- --watch=false
```

Planificación 3: editable, selector G1 ofrece Taller de Diseño I. Planificación 1:
solo lectura. ID 999: error con reintento. El diálogo no tiene ruta propia.

Ejecutar `npm start` y abrir `/demo/curso-manual` para probar la página de demostración.
Agregar Taller de Diseño I con 2 paralelos y un motivo debe cerrar el diálogo y
mostrar el registro guardado. Al volver a elegir la misma materia, se bloquea el duplicado.
Retirar la ruta y `curso-manual-demo` cuando el padre C2-08 incorpore el diálogo.

C2-08 ya está publicado en su rama, pero aún no está integrado aquí. Antes de unirlos,
acordar un catálogo común, un único estado de cursos y los estados editables:
su versión actual solo admite BORRADOR, mientras C2-09 sigue el criterio de C2-05/C2-13.

[Dependencia oficial de G1](https://github.com/uees-ucom351-po2-2026/spare-frontend/tree/a2245c7f9caeedec5b8fbec2583da1a24fc2e2b4/src/app/shared/components/selector-materia).
