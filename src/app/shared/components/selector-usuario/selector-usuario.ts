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
import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';

let siguienteId = 0;

/** Máximo de sugerencias visibles a la vez. */
const MAX_SUGERENCIAS = 8;

/** Quita tildes y mayúsculas para comparar. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/**
 * Selector de usuario (C1-14). Autocompletar por nombres o username, filtrable por rol
 * (por ejemplo, solo decanos para el formulario de facultad).
 *
 * Solo ofrece usuarios activos. Accesible con teclado: flechas para moverse, Enter para
 * elegir y Escape para cerrar la lista.
 */
@Component({
  selector: 'app-selector-usuario',
  templateUrl: './selector-usuario.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SelectorUsuarioComponent {
  private readonly servicio = inject(UsuarioService);

  /** Muestra solo usuarios con ese rol (por ejemplo 'Decano' o 'Coordinador'). */
  readonly rol = input<string>();
  /** Usuario preseleccionado (por ejemplo, el decano actual al editar). No está en la hoja. */
  readonly usuarioId = input<number | null>(null);
  /** Texto del label. */
  readonly etiqueta = input('Usuario');

  /** Emite el usuario elegido. */
  readonly usuarioChange = output<Usuario>();

  protected readonly idCampo = `selector-usuario-${siguienteId++}`;
  protected readonly idLista = `${this.idCampo}-lista`;

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly texto = signal('');
  protected readonly abierta = signal(false);
  /** Posición de la sugerencia resaltada con el teclado (-1 = ninguna). */
  protected readonly activa = signal(-1);
  protected readonly seleccionado = signal<Usuario | null>(null);

  protected readonly sugerencias = computed(() => {
    const termino = normalizar(this.texto());
    const lista = termino
      ? this.usuarios().filter(
          (u) => normalizar(u.nombres).includes(termino) || normalizar(u.username).includes(termino),
        )
      : this.usuarios();
    return lista.slice(0, MAX_SUGERENCIAS);
  });

  protected readonly idActiva = computed(() =>
    this.abierta() && this.activa() >= 0 ? `${this.idCampo}-op-${this.sugerencias()[this.activa()]?.id}` : null,
  );

  constructor() {
    // Vuelve a cargar si cambia el rol.
    effect(() => {
      const rol = this.rol();
      untracked(() => this.cargar(rol));
    });

    // Sigue a usuarioId cuando el padre lo cambia.
    effect(() => {
      this.usuarioId();
      untracked(() => this.aplicarPreseleccion());
    });
  }

  protected escribir(valor: string): void {
    this.texto.set(valor);
    this.abierta.set(true);
    this.activa.set(this.sugerencias().length > 0 ? 0 : -1);
  }

  protected teclear(evento: KeyboardEvent): void {
    const total = this.sugerencias().length;
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        if (!this.abierta()) this.abierta.set(true);
        if (total) this.activa.update((i) => (i + 1) % total);
        break;
      case 'ArrowUp':
        evento.preventDefault();
        if (total) this.activa.update((i) => (i <= 0 ? total - 1 : i - 1));
        break;
      case 'Enter':
        if (this.abierta() && this.activa() >= 0) {
          evento.preventDefault();
          this.elegir(this.sugerencias()[this.activa()]);
        }
        break;
      case 'Escape':
        this.cerrar();
        break;
    }
  }

  protected elegir(usuario: Usuario): void {
    this.seleccionado.set(usuario);
    this.texto.set(usuario.nombres);
    this.cerrar();
    this.usuarioChange.emit(usuario);
  }

  /** Al salir del campo se cierra la lista y vuelve a mostrar el usuario elegido. */
  protected cerrar(): void {
    this.abierta.set(false);
    this.activa.set(-1);
    this.texto.set(this.seleccionado()?.nombres ?? this.texto());
  }

  private cargar(rol: string | undefined): void {
    this.cargando.set(true);
    this.error.set(false);
    this.servicio.listar({ rol, soloActivos: true }).subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
        this.aplicarPreseleccion();
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  private aplicarPreseleccion(): void {
    const id = this.usuarioId();
    if (id === null) return;
    const usuario = this.usuarios().find((u) => u.id === id) ?? null;
    this.seleccionado.set(usuario);
    this.texto.set(usuario?.nombres ?? '');
  }
}
