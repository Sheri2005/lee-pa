import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import type { ChartConfiguration, ChartDataset, ChartOptions } from 'chart.js';

export type GraficoTipo = 'barras' | 'pastel' | 'lineas';
type ChartEngineType = 'bar' | 'pie' | 'line';

export interface GraficoSerie {
  nombre: string;
  valores: number[];
  /** Optional dataset color for bar and line charts. Pie slices use the shared palette. */
  color?: string;
}

const PALETA = ['#75001B', '#9A1232', '#B7731E', '#621324', '#4A0011', '#6F666A'];

Chart.register(...registerables);

@Component({
  selector: 'app-grafico',
  standalone: true,
  host: { class: 'block min-w-0' },
  templateUrl: './grafico.html',
})
export class GraficoComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() tipo: GraficoTipo = 'barras';
  @Input() etiquetas: string[] = [];
  @Input() series: GraficoSerie[] = [];
  @Input() titulo = '';

  @ViewChild('canvas') private canvas?: ElementRef<HTMLCanvasElement>;

  mensajeEstado = '';

  private chart?: Chart<ChartEngineType, number[], string>;
  private tipoRenderizado?: ChartEngineType;
  private vistaLista = false;

  ngAfterViewInit(): void {
    this.vistaLista = true;
    this.renderizar();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.vistaLista) {
      this.renderizar();
    }
  }

  ngOnDestroy(): void {
    this.destruirGrafico();
  }

  get tipoAccesible(): string {
    switch (this.tipo) {
      case 'pastel':
        return 'gráfico de pastel';
      case 'lineas':
        return 'gráfico de líneas';
      default:
        return 'gráfico de barras';
    }
  }

  valorEn(etiquetaIndex: number, serie: GraficoSerie): number {
    return serie.valores[etiquetaIndex];
  }

  private renderizar(): void {
    const canvas = this.canvas?.nativeElement;
    if (!canvas) {
      return;
    }

    const error = this.validarDatos();
    if (error) {
      this.mensajeEstado = error;
      this.destruirGrafico();
      return;
    }

    this.mensajeEstado = '';
    const tipoChart = this.tipoChart;

    if (this.chart && this.tipoRenderizado === tipoChart) {
      this.chart.data.labels = [...this.etiquetas];
      this.chart.data.datasets = this.construirSeries();
      this.chart.options = this.construirOpciones();
      this.chart.update();
      return;
    }

    this.destruirGrafico();
    const config: ChartConfiguration<ChartEngineType, number[], string> = {
      type: tipoChart,
      data: {
        labels: [...this.etiquetas],
        datasets: this.construirSeries(),
      },
      options: this.construirOpciones(),
    };

    this.chart = new Chart(canvas, config);
    this.tipoRenderizado = tipoChart;
  }

  private validarDatos(): string | null {
    if (!['barras', 'pastel', 'lineas'].includes(this.tipo)) {
      return 'El tipo de gráfico no es válido.';
    }

    if (this.etiquetas.length === 0 || this.series.length === 0) {
      return 'No hay datos para mostrar.';
    }

    if (this.tipo === 'pastel' && this.series.length !== 1) {
      return 'El gráfico de pastel requiere una sola serie de datos.';
    }

    if (this.tipo === 'pastel' && this.series[0].valores.some((valor) => valor < 0)) {
      return 'El gráfico de pastel no admite valores negativos.';
    }

    const seriesInvalida = this.series.some(
      (serie) =>
        serie.valores.length !== this.etiquetas.length ||
        serie.valores.some((valor) => !Number.isFinite(valor)),
    );

    if (seriesInvalida) {
      return 'Cada serie debe tener un valor numérico por etiqueta.';
    }

    return null;
  }

  private get tipoChart(): ChartEngineType {
    switch (this.tipo) {
      case 'pastel':
        return 'pie';
      case 'lineas':
        return 'line';
      default:
        return 'bar';
    }
  }

  private construirSeries(): ChartDataset<ChartEngineType, number[]>[] {
    if (this.tipo === 'pastel') {
      const serie = this.series[0];
      return [
        {
          label: serie.nombre,
          data: [...serie.valores],
          backgroundColor: this.etiquetas.map((_, index) => PALETA[index % PALETA.length]),
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ];
    }

    return this.series.map((serie, index) => {
      const color = serie.color ?? PALETA[index % PALETA.length];
      const dataset: ChartDataset<ChartEngineType, number[]> = {
        label: serie.nombre,
        data: [...serie.valores],
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
      };

      if (this.tipo === 'barras') {
        return Object.assign(dataset, { borderRadius: 5 });
      }

      return Object.assign(dataset, {
        fill: false,
        tension: 0.25,
        pointRadius: 3,
      });
    });
  }

  private construirOpciones(): ChartOptions<ChartEngineType> {
    const opciones: ChartOptions<ChartEngineType> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 250,
      },
      plugins: {
        legend: {
          display: this.tipo === 'pastel' || this.series.length > 1,
          position: 'bottom',
          labels: {
            color: '#5A0015',
            usePointStyle: true,
            padding: 18,
          },
        },
        tooltip: {
          enabled: true,
        },
      },
    };

    if (this.tipo !== 'pastel') {
      opciones.scales = {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#6F666A',
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#EFE6EA',
          },
          ticks: {
            color: '#6F666A',
          },
        },
      };
    }

    return opciones;
  }

  private destruirGrafico(): void {
    this.chart?.destroy();
    this.chart = undefined;
    this.tipoRenderizado = undefined;
  }
}
