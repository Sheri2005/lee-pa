import { ChangeDetectionStrategy, Component, computed, input  } from "@angular/core";

export type TipoSpinner = 'spinner' | 'esqueleto';

@Component({
    selector: 'app-spinner-carga',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
    templateUrl: './spinner-carga.component.html',
})
export class SpinnerCargaComponent {
    tipo = input<TipoSpinner>('spinner');
    filas = input(3);
    mensaje = input('Cargando...'); //esto no esta en el CSV, es para los lectores de pantalla, nadie está obligado a usarlo.

    listaFilas = computed(() => Array.from({length: Math.max(1, this.filas())}, (_,i) => i));
}