import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatosFacultad, Facultad } from '../../../shared/models/facultad.model';
import { FacultadService } from '../../../shared/services/facultad.service';

/** Misma forma que `OpcionesConfirmacion` de ConfirmacionService (C2-24, G2). */
interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean;
}

/** Quita tildes y mayúsculas para comparar textos en la búsqueda. */
function normalizar(texto: string | null): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Listado de facultades (C1-20). Ruta: /gestion/facultades.
 *
 * Búsqueda por código, nombre, decano o código SIAC; acciones crear, editar,
 * desactivar y reactivar. No tiene @Input ni @Output.
 *
 * TEMPORAL: ninguno de sus hijos existe aún. En la plantilla están dibujados aquí mismo
 * y marcados con comentarios TEMPORAL: encabezado (app-encabezado-pagina, G3), tabla
 * (app-tabla-datos, G4), badge (app-estado-badge, G5), formulario (app-facultad-form,
 * C1-21) y diálogo de confirmación (app-dialogo-confirmacion, G2).
 */
@Component({
  selector: 'app-facultades-lista',
  templateUrl: './facultades-lista.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacultadesListaComponent {
  private readonly servicio = inject(FacultadService);

  protected readonly facultades = signal<Facultad[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly busqueda = signal('');
  /** Mensaje para el usuario tras una acción (se anuncia con aria-live). */
  protected readonly aviso = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  /** `undefined` = formulario cerrado; `null` = crear; una facultad = editar. */
  protected readonly enFormulario = signal<Facultad | null | undefined>(undefined);

  protected readonly filtradas = computed(() => {
    const termino = normalizar(this.busqueda());
    if (!termino) return this.facultades();
    return this.facultades().filter((f) =>
      [f.codigo, f.nombre, f.decanoNombre, f.codigoSiac].some((campo) =>
        normalizar(campo).includes(termino),
      ),
    );
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.servicio.listar().subscribe({
      next: (lista) => {
        this.facultades.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudieron cargar las facultades.');
        this.cargando.set(false);
      },
    });
  }

  protected abrirCrear(): void {
    this.aviso.set(null);
    this.enFormulario.set(null);
  }

  protected abrirEditar(facultad: Facultad): void {
    this.aviso.set(null);
    this.enFormulario.set(facultad);
  }

  /** Respuesta a `(cancelar)` de app-facultad-form (C1-21). */
  cerrarForm(): void {
    this.enFormulario.set(undefined);
  }

  /** Respuesta a `(guardar)` de app-facultad-form (C1-21): crea o actualiza según el caso. */
  alGuardar(datos: DatosFacultad): void {
    const editando = this.enFormulario();
    const peticion = editando
      ? this.servicio.actualizar(editando.id, datos)
      : this.servicio.crear(datos);

    peticion.subscribe({
      next: (guardada) => {
        this.facultades.update((lista) =>
          editando ? lista.map((f) => (f.id === guardada.id ? guardada : f)) : [...lista, guardada],
        );
        this.cerrarForm();
        this.aviso.set({
          tipo: 'ok',
          texto: editando ? `Se actualizó ${guardada.nombre}.` : `Se creó ${guardada.nombre}.`,
        });
      },
      error: (e: Error) => this.aviso.set({ tipo: 'error', texto: e.message }),
    });
  }

  protected async alternarEstado(facultad: Facultad): Promise<void> {
    const desactivar = facultad.estado === 'A';
    const confirmado = await this.confirmar(
      desactivar
        ? {
            titulo: 'Desactivar facultad',
            mensaje: `¿Desactivar ${facultad.nombre}? Dejará de aparecer en los selectores de facultad.`,
            textoConfirmar: 'Desactivar',
            peligro: true,
          }
        : {
            titulo: 'Reactivar facultad',
            mensaje: `¿Reactivar ${facultad.nombre}?`,
            textoConfirmar: 'Reactivar',
          },
    );
    if (!confirmado) return;

    this.servicio.cambiarEstado(facultad.id, desactivar ? 'I' : 'A').subscribe({
      next: (cambiada) => {
        this.facultades.update((lista) => lista.map((f) => (f.id === cambiada.id ? cambiada : f)));
        this.aviso.set({
          tipo: 'ok',
          texto: `${cambiada.nombre} quedó ${desactivar ? 'inactiva' : 'activa'}.`,
        });
      },
      error: (e: Error) => this.aviso.set({ tipo: 'error', texto: e.message }),
    });
  }

  // TEMPORAL: reemplaza a ConfirmacionService.abrir() de app-dialogo-confirmacion (C2-24, G2).
  // Al integrarlo: inyectar ConfirmacionService, que confirmar() devuelva
  // `this.confirmacion.abrir(opciones)` y borrar `confirmacion`, `responder` y el panel del HTML.
  protected readonly confirmacion = signal<
    (OpcionesConfirmacion & { responder: (valor: boolean) => void }) | null
  >(null);

  private confirmar(opciones: OpcionesConfirmacion): Promise<boolean> {
    return new Promise((resolve) => this.confirmacion.set({ ...opciones, responder: resolve }));
  }

  protected responder(valor: boolean): void {
    this.confirmacion()?.responder(valor);
    this.confirmacion.set(null);
  }
  // FIN TEMPORAL
}
