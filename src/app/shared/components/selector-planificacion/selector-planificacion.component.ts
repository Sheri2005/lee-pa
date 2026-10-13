import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { catchError, map, of, retry, startWith, switchMap } from "rxjs";
import { Planificacion } from "../../../core/models/planificacion.model";
import { PlanificacionService } from "../../../core/services/planificacion.service";

interface Carga {
    cargando: boolean;
    error: boolean;
    items: Planificacion[];
}

let siguienteId = 0;

@Component({
    selector: 'app-selector-planificacion',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block'},
    templateUrl: './selector-planificacion.component.html',

})
export class SelectorPlanificacionComponent {
    private servicio = inject(PlanificacionService);

    estados = input<string[]>();
    etiqueta = input('Planificación');

    planificacionChange = output<Planificacion>();

    readonly idSelect = `sel-plan-${siguienteId++}`;
    private seleccionadaId = signal<number | null>(null);

    carga = toSignal(
        toObservable(this.estados).pipe(
            switchMap(estados =>
                this.servicio.listar(estados).pipe(
                    map((items): Carga => ({ cargando: false, error: false, items})),
                    startWith<Carga>({cargando:true, error: false, items: []}),
                    catchError(() => of<Carga>({ cargando: false, error:true, items: []})),
                ),
            ),
        ),
        {initialValue: {cargando: true, error:false, items: []} as Carga},
    );

    // Si el filtro de estados cambia y la planificación elegida ya noe stá en la lista, vuelve al placeholder
    seleccionValida = computed(() => {
        const id = this.seleccionadaId();
        return id !== null && this.carga().items.some(p => p.id === id) ? id : null;
    });

    textoPlaceholder = computed(() => {
        const c = this.carga();
        if (c.cargando) return 'Cargando...';
        if (c.error) return 'Error al cargar';
        return c.items.length ? 'Selecciona una planificación' : 'No hay planificaciones disponibles';
    });

    seleccionar(valor: string){
        const elegida = this.carga().items.find(p => p.id === Number(valor));
        if (!elegida) return;
        this.seleccionadaId.set(elegida.id);
        this.planificacionChange.emit(elegida);
    }
}