import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

@Component({
    selector: 'app-estado-vacio',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {class: 'block'},
    templateUrl: './estado-vacio.component.html',
})

export class EstadoVacioComponent { 
    icono = input('📭');
    mensaje = input.required<string>();
    textoAccion = input<string>();

    accion = output<void>();
}