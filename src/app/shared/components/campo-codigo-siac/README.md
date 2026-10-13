# Campo de código SIAC 1.0

Componente standalone compartido del Grupo 5. Implementa `ControlValueAccessor` y un validador asíncrono de unicidad configurable por entidad.

## Uso en un formulario reactivo

```ts
import { FormControl, FormGroup } from '@angular/forms';
import { CampoCodigoSiacComponent } from './shared/components/campo-codigo-siac';

export class MateriaFormComponent {
  readonly form = new FormGroup({
    codigoSiac: new FormControl('', { nonNullable: true }),
  });
}
```

Importa `CampoCodigoSiacComponent` en el componente standalone consumidor y úsalo así:

```html
<app-campo-codigo-siac
  formControlName="codigoSiac"
  entity="materia"
  [idActual]="materiaId"
  [required]="false"
/>
```

`entity` identifica la entidad para la consulta de unicidad. `idActual` es opcional y permite que el backend excluya el registro que se está editando. El campo es opcional por defecto, de acuerdo con el modelo actual; la propiedad `required` lo hace obligatorio.

## Conexión con el servicio SIAC

El control no fija la URL, los parámetros HTTP ni el formato de respuesta. El catálogo propone `GET /siac/existe`, pero esos detalles deben acordarse con el grupo responsable del servicio. Cuando el contrato esté definido, implementa `SiacCodeAvailabilityChecker` y regístralo en los proveedores de la aplicación:

```ts
{
  provide: SIAC_CODE_AVAILABILITY_CHECKER,
  useExisting: SiacCodeAvailabilityService,
}
```

El adaptador recibe `{ entity, code, currentId? }` y devuelve un `Observable<boolean>`: `true` significa que el código está disponible. Si la comprobación falla, el control devuelve el error `siacCodeCheckUnavailable` para que el formulario no guarde un código sin verificar. Mientras no haya adaptador, el prototipo sigue siendo utilizable y el campo indica que la validación de unicidad está pendiente de conexión.
