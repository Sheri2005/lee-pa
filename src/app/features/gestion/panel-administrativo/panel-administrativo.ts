import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Route, Router } from '@angular/router';
import { EntidadSiac } from '../../../core/models/registro-sin-siac';
import { GraficoComponent, GraficoSerie } from '../../../shared/components/grafico/grafico';
import { RegistrosSinSiacComponent } from '../../../shared/components/registros-sin-siac/registros-sin-siac.component';
import {
  TarjetaIndicadorColor,
  TarjetaIndicadorComponent,
} from '../../../shared/components/tarjeta-indicador/tarjeta-indicador';
import { ResumenPanel } from '../../../shared/models/panel.model';
import { PanelService } from '../../../shared/services/panel.service';

interface Indicador {
  titulo: string;
  valor: number;
  icono: string;
  detalle: string;
  color: TarjetaIndicadorColor;
  /** Página a la que lleva la tarjeta. */
  ruta: string;
}

/** Página del catálogo de cada entidad que lista app-registros-sin-siac. */
const RUTA_ENTIDAD: Record<EntidadSiac, string> = {
  periodo: '/gestion/periodos',
  carrera: '/gestion/carreras',
  materia: '/gestion/materias',
  docente: '/gestion/docentes',
};

/**
 * Panel administrativo (C1-60). Ruta: /gestion/panel.
 *
 * Indicadores del Administrador: carreras activas, mallas vigentes, docentes registrados,
 * períodos abiertos y registros sin código SIAC 1.0; un gráfico de carreras activas por facultad
 * y la lista de registros sin código SIAC.
 *
 * TEMPORAL: el encabezado (app-encabezado-pagina, C3-23, G3) está dibujado aquí. Las tarjetas y
 * la lista llevan a la página de cada catálogo solo si su ruta ya existe (carreras, mallas,
 * materias y docentes todavía no tienen página).
 */
@Component({
  selector: 'app-panel-administrativo',
  imports: [TarjetaIndicadorComponent, GraficoComponent, RegistrosSinSiacComponent],
  templateUrl: './panel-administrativo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelAdministrativoComponent {
  private readonly servicio = inject(PanelService);
  private readonly router = inject(Router);

  protected readonly resumen = signal<ResumenPanel | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);

  protected readonly indicadores = computed<Indicador[]>(() => {
    const r = this.resumen();
    if (!r) return [];
    return [
      { titulo: 'Carreras activas', valor: r.carrerasActivas, icono: 'C', detalle: 'En uso', color: 'primary', ruta: '/gestion/carreras' },
      { titulo: 'Mallas vigentes', valor: r.mallasVigentes, icono: 'M', detalle: 'Por carrera', color: 'accent', ruta: '/gestion/mallas' },
      { titulo: 'Docentes registrados', valor: r.docentesRegistrados, icono: 'D', detalle: 'En el catálogo', color: 'primary', ruta: '/gestion/docentes' },
      { titulo: 'Períodos abiertos', valor: r.periodosAbiertos, icono: 'P', detalle: 'No cerrados', color: 'accent', ruta: '/gestion/periodos' },
      { titulo: 'Sin código SIAC', valor: r.registrosSinSiac, icono: '!', detalle: 'Por completar', color: 'gold', ruta: '' },
    ];
  });

  protected readonly etiquetasGrafico = computed(() => this.resumen()?.carrerasPorFacultad.map((f) => f.facultad) ?? []);

  protected readonly seriesGrafico = computed<GraficoSerie[]>(() => [
    { nombre: 'Carreras activas', valores: this.resumen()?.carrerasPorFacultad.map((f) => f.carreras) ?? [] },
  ]);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.servicio.resumen().subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }

  /**
   * Respuesta a `(click)` de app-tarjeta-indicador.
   *
   * TEMPORAL: la salida de la tarjeta (C5-19, G5) se llama `click`, igual que el clic del
   * navegador, así que llegan las dos. Solo se atiende el del navegador (`Event`); la salida
   * llega sin valor.
   */
  protected abrir(indicador: Indicador, evento: unknown): void {
    if (!(evento instanceof Event)) return;
    if (indicador.ruta) {
      this.navegar(indicador.ruta);
    } else {
      document.getElementById('registros-sin-siac')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /** Respuesta a `(irARegistro)` de app-registros-sin-siac. */
  protected irARegistro(registro: { entidad: EntidadSiac; id: number }): void {
    this.navegar(RUTA_ENTIDAD[registro.entidad]);
  }

  /** TEMPORAL: navega solo si la página ya existe, para no romper la navegación. */
  private navegar(ruta: string): void {
    if (this.rutaExiste(ruta.replace(/^\//, ''), this.router.config)) {
      void this.router.navigateByUrl(ruta);
    }
  }

  private rutaExiste(ruta: string, rutas: Route[]): boolean {
    return rutas.some((r) => r.path === ruta || (!!r.children && this.rutaExiste(ruta, r.children)));
  }
}
