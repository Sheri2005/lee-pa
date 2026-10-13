import { ApplicationRef, EnvironmentInjector, Injectable, createComponent, inject } from '@angular/core';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);

  /** Abre el diálogo y devuelve true si el usuario confirma, false si cancela. */
  abrir(opciones: OpcionesConfirmacion): Promise<boolean> {
    return new Promise(resolve => {
      const ref = createComponent(DialogoConfirmacionComponent, { environmentInjector: this.injector });

      ref.setInput('titulo', opciones.titulo);
      ref.setInput('mensaje', opciones.mensaje);
      if (opciones.textoConfirmar) ref.setInput('textoConfirmar', opciones.textoConfirmar);
      if (opciones.textoCancelar) ref.setInput('textoCancelar', opciones.textoCancelar);
      if (opciones.peligro) ref.setInput('peligro', true);

      const sub = ref.instance.confirmado.subscribe(valor => {
        sub.unsubscribe();
        ref.location.nativeElement.remove();
        ref.destroy();
        resolve(valor);
      });

      this.appRef.attachView(ref.hostView);
      document.body.appendChild(ref.location.nativeElement);
    });
  }
}