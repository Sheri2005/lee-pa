import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { RegistroSinSiac } from '../../../../app/core/models/registro-sin-siac';
import { SiacService } from '../../../../app/core/services/siac.service';
import { RegistrosSinSiacComponent } from '../../../../app/shared/components/registros-sin-siac/registros-sin-siac.component';
import { VistaPreviaExportacionComponent } from '../vista-previa-exportacion/vista-previa-exportacion';

type EstadoPlanificacion = 'APROBADA' | 'PENDIENTE';

interface PlanificacionExportable {
  id: number;
  nombre: string;
  carrera: string;
  periodo: string;
  estado: EstadoPlanificacion;
  totalParalelos: number;
  datosJson: unknown;
  contenidoCsv: string;
}

type EstadoValidacion = 'cargando' | 'listo' | 'error';

@Component({
  selector: 'app-exportacion-siac',
  imports: [
    RegistrosSinSiacComponent,
    VistaPreviaExportacionComponent,
  ],
  templateUrl: './exportacion-siac.html',
  styleUrl: './exportacion-siac.css',
})
export class ExportacionSiacComponent {
  private readonly siacService = inject(SiacService);

  readonly planificaciones: readonly PlanificacionExportable[] = [
    {
      id: 1,
      nombre: 'Planificación Ingeniería en Computación',
      carrera: 'Ingeniería en Computación',
      periodo: 'Primer período ordinario 2027',
      estado: 'APROBADA',
      totalParalelos: 5,
      datosJson: {
        version: '1.0',
        generado: '2026-10-07T23:15:00-05:00',
        periodo: {
          codigo_siac: '2027-1',
          nombre: 'Primer período ordinario 2027',
        },
        carrera: {
          codigo_siac: 'ING-COMP',
          facultad_codigo_siac: 'FI',
        },
        paralelos: [
          {
            materia_codigo_siac: 'MAT-101',
            paralelo: 'A',
            cupo: 35,
            docente_codigo_siac: 'DOC-0452',
            sesiones: [
              {
                dia: 'LUNES',
                inicio: '07:00',
                fin: '09:00',
                espacio: 'F-203',
              },
            ],
          },
        ],
      },
      contenidoCsv:
        'periodo_codigo_siac;carrera_codigo_siac;materia_codigo_siac;paralelo;cupo;docente_codigo_siac;dia;hora_inicio;hora_fin;espacio_codigo\n' +
        '2027-1;ING-COMP;MAT-101;A;35;DOC-0452;LUNES;07:00;09:00;F-203',
    },
    {
      id: 2,
      nombre: 'Planificación Ingeniería Industrial',
      carrera: 'Ingeniería Industrial',
      periodo: 'Segundo período ordinario 2027',
      estado: 'PENDIENTE',
      totalParalelos: 4,
      datosJson: {},
      contenidoCsv: '',
    },
    {
      id: 3,
      nombre: 'Planificación Ingeniería en Computación',
      carrera: 'Ingeniería en Computación',
      periodo: 'Segundo período ordinario 2027',
      estado: 'APROBADA',
      totalParalelos: 3,
      datosJson: {
        version: '1.0',
        generado: '2026-10-07T23:15:00-05:00',
        periodo: {
          codigo_siac: '2027-2',
          nombre: 'Segundo período ordinario 2027',
        },
        carrera: {
          codigo_siac: 'ING-COMP',
          facultad_codigo_siac: 'FI',
        },
        paralelos: [
          {
            materia_codigo_siac: 'BDD-301',
            paralelo: 'A',
            cupo: 35,
            docente_codigo_siac: 'DOC-0781',
            sesiones: [
              {
                dia: 'MARTES',
                inicio: '09:00',
                fin: '11:00',
                espacio: 'F-205',
              },
            ],
          },
        ],
      },
      contenidoCsv:
        'periodo_codigo_siac;carrera_codigo_siac;materia_codigo_siac;paralelo;cupo;docente_codigo_siac;dia;hora_inicio;hora_fin;espacio_codigo\n' +
        '2027-2;ING-COMP;BDD-301;A;35;DOC-0781;MARTES;09:00;11:00;F-205',
    },
  ];

  protected readonly planificacionId = signal(1);
  protected readonly estadoValidacion =
    signal<EstadoValidacion>('cargando');

  protected readonly registrosPendientes =
    signal<RegistroSinSiac[]>([]);

  protected readonly mostrarVistaPrevia = signal(false);

  protected readonly registroSeleccionado =
    signal<string | null>(null);

  protected readonly planificacionSeleccionada = computed(
    () =>
      this.planificaciones.find(
        (planificacion) =>
          planificacion.id === this.planificacionId(),
      ) ?? null,
  );

  protected readonly puedeGenerarVistaPrevia = computed(() => {
    const planificacion = this.planificacionSeleccionada();

    return (
      planificacion?.estado === 'APROBADA' &&
      this.estadoValidacion() === 'listo' &&
      this.registrosPendientes().length === 0
    );
  });

  constructor() {
    this.validarPlanificacion();
  }

  protected seleccionarPlanificacion(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);

    this.planificacionId.set(id);
    this.mostrarVistaPrevia.set(false);
    this.registroSeleccionado.set(null);

    this.validarPlanificacion();
  }

  protected generarVistaPrevia(): void {
    if (!this.puedeGenerarVistaPrevia()) {
      return;
    }

    this.mostrarVistaPrevia.set(true);
  }

  protected ocultarVistaPrevia(): void {
    this.mostrarVistaPrevia.set(false);
  }

  protected irARegistro(evento: {
    entidad: string;
    id: number;
  }): void {
    this.registroSeleccionado.set(
      `${evento.entidad} #${evento.id}`,
    );
  }

  private validarPlanificacion(): void {
    const planificacion = this.planificacionSeleccionada();

    this.registrosPendientes.set([]);

    if (!planificacion) {
      this.estadoValidacion.set('error');
      return;
    }

    if (planificacion.estado !== 'APROBADA') {
      this.estadoValidacion.set('listo');
      return;
    }

    this.estadoValidacion.set('cargando');

    this.siacService
      .registrosSinCodigo(planificacion.id)
      .subscribe({
        next: (registros) => {
          this.registrosPendientes.set(registros);
          this.estadoValidacion.set('listo');
        },
        error: () => {
          this.estadoValidacion.set('error');
        },
      });
  }
}