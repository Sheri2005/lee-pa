import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { SelectorMateriaComponent } from '../../../shared/components/selector-materia/selector-materia';
import { Materia } from '../../../shared/models/materia.model';
import { DocenteService } from '../../../shared/services/docente.service';

let siguienteId = 0;

/**
 * Materias habilitadas de un docente (C1-42). Hijo de `app-docente-form`.
 *
 * Muestra las materias que el docente puede dictar, y permite agregar (con el autocompletar
 * `app-selector-materia`) y quitar. No guarda por sí mismo: cada cambio emite `materiasChange`
 * con la lista completa y el padre la guarda junto con el docente.
 *
 * Sin `docenteId` (docente nuevo) arranca vacío.
 */
@Component({
  selector: 'app-docente-materias',
  imports: [SelectorMateriaComponent],
  templateUrl: './docente-materias.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class DocenteMateriasComponent {
  private readonly docenteService = inject(DocenteService);

  /** Docente cuyas materias se muestran. Sin valor, la lista arranca vacía. */
  readonly docenteId = input<number>();

  /** Emite la lista completa de materias (ordenada por código) cada vez que se agrega o quita una. */
  readonly materiasChange = output<Materia[]>();

  protected readonly idTitulo = `docente-materias-${siguienteId++}`;
  protected readonly cargando = signal(false);
  protected readonly error = signal(false);
  protected readonly aviso = signal('');

  private readonly selector = viewChild(SelectorMateriaComponent);

  // Vuelve a pedir las materias cuando cambia el docente.
  private readonly cargadas = toSignal(
    toObservable(this.docenteId).pipe(
      tap((id) => {
        this.error.set(false);
        this.aviso.set('');
        this.cargando.set(id != null);
      }),
      switchMap((id) =>
        id == null
          ? of([] as Materia[])
          : this.docenteService.listarMaterias(id).pipe(
              catchError(() => {
                this.error.set(true);
                return of([] as Materia[]);
              }),
            ),
      ),
      tap(() => this.cargando.set(false)),
    ),
    { initialValue: [] as Materia[] },
  );

  /** Materias que se muestran: parten de las cargadas y cambian al agregar o quitar. */
  protected readonly materias = linkedSignal(() => this.cargadas());

  protected agregar(materia: Materia): void {
    this.selector()?.limpiar();
    if (this.materias().some((m) => m.id === materia.id)) {
      this.aviso.set(`${materia.codigo} ya está en la lista.`);
      return;
    }
    this.aviso.set('');
    this.cambiar([...this.materias(), materia]);
  }

  protected quitar(materia: Materia): void {
    this.aviso.set('');
    this.cambiar(this.materias().filter((m) => m.id !== materia.id));
  }

  private cambiar(lista: Materia[]): void {
    const ordenada = [...lista].sort((a, b) => a.codigo.localeCompare(b.codigo));
    this.materias.set(ordenada);
    this.materiasChange.emit(ordenada);
  }
}