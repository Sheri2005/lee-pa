import {
  ChangeDetectionStrategy, Component, ElementRef, afterNextRender,
  booleanAttribute, input, output, viewChild,
} from '@angular/core';

let siguienteId = 0;

@Component({
  selector: 'app-dialogo-confirmacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialogo-confirmacion.component.html',
})
export class DialogoConfirmacionComponent {
  titulo = input.required<string>();
  mensaje = input.required<string>();
  textoConfirmar = input('Confirmar');
  textoCancelar = input('Cancelar');
  peligro = input(false, { transform: booleanAttribute });

  confirmado = output<boolean>();

  private dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly idTitulo = `dlg-titulo-${siguienteId}`;
  readonly idMensaje = `dlg-mensaje-${siguienteId++}`;

  constructor() {
    afterNextRender(() => this.dialogo().nativeElement.showModal());
  }

  claseConfirmar() {
    // Clases completas para que Tailwind las detecte
    return this.peligro()
      ? 'rounded-md bg-wine-deep px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
      : 'rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
  }

  alClickFondo(evento: MouseEvent) {
    // Si el clic cae en el propio <dialog> (no en su contenido), fue en el fondo oscuro
    if (evento.target === this.dialogo().nativeElement) this.responder(false);
  }

  responder(valor: boolean) {
    this.dialogo().nativeElement.close();
    this.confirmado.emit(valor);
  }
}