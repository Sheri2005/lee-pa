import { Component, input, output, signal } from '@angular/core';
import { Usuario } from '../../../shared/models/usuario.model';

@Component({
  selector: 'app-menu-usuario',
  standalone: true,
  imports: [],
  templateUrl: './menu-usuario.html',
})
export class MenuUsuarioComponent {

  // Los datos deberán provenir del usuario autenticado mediante AuthService
  readonly usuario = input<Usuario | null>(null);

  // Comunica al componente padre las acciones de la cuenta.
  readonly solicitarCambioContrasena = output<void>();
  readonly cerrarSesion = output<void>();

  readonly menuAbierto = signal(false);

  alternarMenu(): void {
    this.menuAbierto.update((valor) => !valor);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  cambiarContrasena(): void {
    this.cerrarMenu();
    this.solicitarCambioContrasena.emit();
  }

  alCerrarSesion(): void {
    this.cerrarMenu();

    // Integración pendiente: conectar esta acción con AuthService
    this.cerrarSesion.emit();
  }
}
