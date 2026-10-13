import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { Facultad } from '../../models/facultad.model';
import { FacultadService } from '../../services/facultad.service';

let siguienteId = 0;

/**
 * Selector de facultad (C1-22). Lista desplegable de facultades activas.
 *
 * Con `permitirTodas` agrega la opción "Todas", que emite `null` (para filtros).
 * Sin ella, el usuario debe elegir una facultad (para formularios).
 */
@Component({
  selector: 'app-selector-facultad',
  templateUrl: './selector-facultad.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorFacultadComponent {
  private readonly servicio = inject(FacultadService);

  /** Agrega la opción "Todas" (emite `null`). */
  readonly permitirTodas = input(false);
  /** Facultad preseleccionada (por ejemplo, al editar una carrera). No está en la hoja. */
  readonly facultadId = input<number | null>(null);

  /** Emite la facultad elegida, o `null` si se elige "Todas". */
  readonly facultadChange = output<Facultad | null>();

  /** Id único para que el label funcione aunque haya varios selectores en la página. */
  protected readonly idCampo = `selector-facultad-${siguienteId++}`;

  protected readonly facultades = signal<Facultad[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly seleccionadaId = signal<number | null>(null);

  /** Valor del <select>: '' = "Todas" o el aviso "Selecciona…". */
  protected readonly valor = computed(() => {
    const id = this.seleccionadaId();
    return id !== null && this.facultades().some((f) => f.id === id) ? String(id) : '';
  });

  constructor() {
    effect(() => this.seleccionadaId.set(this.facultadId()));

    this.servicio.listar({ soloActivas: true }).subscribe({
      next: (lista) => {
        this.facultades.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  protected alCambiar(valor: string): void {
    const facultad = this.facultades().find((f) => f.id === Number(valor)) ?? null;
    this.seleccionadaId.set(facultad?.id ?? null);
    this.facultadChange.emit(facultad);
  }
}
