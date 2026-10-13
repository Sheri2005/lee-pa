import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Pantalla 403 (C1-07). Ruta: /acceso-denegado.
 *
 * Los guards de permisos de todos los módulos redirigen aquí cuando el rol del
 * usuario no tiene acceso. No recibe datos: solo informa y ofrece volver al inicio.
 *
 * NOTA: según la tabla de componentes debe contener `app-estado-vacio` (G2). Mientras
 * ese componente no exista, el contenido se dibuja aquí mismo; al integrarlo, reemplaza
 * el bloque marcado en la plantilla por `<app-estado-vacio>` conservando el botón.
 */
@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink],
  templateUrl: './acceso-denegado.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccesoDenegadoComponent {}
