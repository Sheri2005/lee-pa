import { Component, output } from '@angular/core';
import { MenuUsuarioComponent } from '../menu-usuario/menu-usuario';
import { Usuario } from '../../../shared/models/usuario.model';

@Component({
  selector: 'app-barra-superior',
  standalone: true,
  imports: [MenuUsuarioComponent],
  templateUrl: './barra-superior.html',
})
export class BarraSuperiorComponent {

  readonly alternarMenu = output<void>();

  // TEMPORAL: usuario utilizado para probar C1-04
  // Reemplazar por la información de AuthService cuando esté disponible
  readonly usuarioPrueba: Usuario = {
    id: 1,
    username: 'admin',
    email: 'admin@uees.edu.ec',
    nombres: 'Administrador del sistema',
    origen: 'LOCAL',
    codigoSiac: null,
    estado: 'A',
    roles: ['Administrador'],
  };

  toggleMenu(): void {
    this.alternarMenu.emit();
  }

  // Pendiente: conectar con la funcionalidad de cambio de contraseña.
  solicitarCambioContrasena(): void {
  }

  // Pendiente: implementar el cierre de sesión utilizando AuthService.
  solicitarCierreSesion(): void {
  }
}