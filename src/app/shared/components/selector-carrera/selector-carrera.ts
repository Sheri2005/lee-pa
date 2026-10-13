import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Carrera } from '../../models/carrera.model';
import { CarreraService } from '../../services/carrera.service';

let siguienteId = 0;

/**
 * TEMPORAL: id del usuario que usa la aplicación, para `soloMias`. Es Diego Muñoz, coordinador
 * de Ingeniería en Computación en los datos de prueba. Reemplazar por el usuario de la sesión
 * cuando exista el login (C1-05, Maximilian).
 */
const ID_USUARIO_ACTUAL = 20;

/**
 * Selector de carrera (C1-25). Lista desplegable de carreras activas.
 *
 * Se puede filtrar por facultad (`facultadId`) y limitar a las carreras que coordina el
 * usuario (`soloMias`). Con `permitirTodas` agrega la opción "Todas", que emite `null` (filtros).
 */
@Component({
  selector: 'app-selector-carrera',
  templateUrl: './selector-carrera.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorCarreraComponent {
  private readonly servicio = inject(CarreraService);

  /** Muestra solo las carreras de esa facultad. */
  readonly facultadId = input<number | null>(null);
  /** Muestra solo las carreras que coordina el usuario actual. */
  readonly soloMias = input(false);
  /** Agrega la opción "Todas" (emite `null`). No está en la hoja: la necesitan los filtros. */
  readonly permitirTodas = input(false);
  /** Carrera preseleccionada (por ejemplo, al editar una materia). No está en la hoja. */
  readonly carreraId = input<number | null>(null);

  /** Emite la carrera elegida, o `null` si se elige "Todas". */
  readonly carreraChange = output<Carrera | null>();

  protected readonly idCampo = `selector-carrera-${siguienteId++}`;

  protected readonly carreras = signal<Carrera[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly seleccionadaId = signal<number | null>(null);

  /** '' = "Todas" o el aviso "Selecciona…". */
  protected readonly valor = computed(() => {
    const id = this.seleccionadaId();
    return id !== null && this.carreras().some((c) => c.id === id) ? String(id) : '';
  });

  constructor() {
    // Vuelve a cargar si cambia la facultad o "mis carreras".
    effect(() => {
      const facultadId = this.facultadId();
      const soloMias = this.soloMias();
      untracked(() => this.cargar(facultadId, soloMias));
    });

    effect(() => {
      const id = this.carreraId();
      untracked(() => this.seleccionadaId.set(id));
    });
  }

  protected alCambiar(valor: string): void {
    const carrera = this.carreras().find((c) => c.id === Number(valor)) ?? null;
    this.seleccionadaId.set(carrera?.id ?? null);
    this.carreraChange.emit(carrera);
  }

  private cargar(facultadId: number | null, soloMias: boolean): void {
    this.cargando.set(true);
    this.error.set(false);
    this.servicio
      .listar({
        facultadId,
        coordinadorUsuarioId: soloMias ? ID_USUARIO_ACTUAL : null,
        soloActivas: true,
      })
      .subscribe({
        next: (lista) => {
          this.carreras.set(lista);
          this.cargando.set(false);
          this.quitarSeleccionInvalida();
        },
        error: () => {
          this.error.set(true);
          this.cargando.set(false);
        },
      });
  }

  /**
   * Si al cambiar la facultad la carrera elegida ya no está en la lista, se deselecciona.
   * Con "Todas" se avisa al padre con `null` para que su filtro no quede desactualizado.
   */
  private quitarSeleccionInvalida(): void {
    const id = this.seleccionadaId();
    if (id === null || this.carreras().some((c) => c.id === id)) return;
    this.seleccionadaId.set(null);
    if (this.permitirTodas()) this.carreraChange.emit(null);
  }
}
