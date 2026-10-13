import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuLateralComponent } from '../menu-lateral/menu-lateral';
import { BarraSuperiorComponent } from '../../../features/gestion/barra-superior/barra-superior';

@Component({
  imports: [RouterOutlet, MenuLateralComponent, BarraSuperiorComponent],
  standalone: true,
  selector: 'app-shell-layout',
  styleUrl: './shell-layout.css',
  templateUrl: './shell-layout.html',
})
export class ShellLayoutComponent {
  readonly menuColapsado = signal(false);

  alternarMenu(): void {
    this.menuColapsado.update((valor) => !valor);
  }
}
