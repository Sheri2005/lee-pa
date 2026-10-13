# Gráfico reutilizable

Componente standalone del Grupo 5 para mostrar datos de reportes como barras, pastel o líneas usando Chart.js.

## Uso

Importa `GraficoComponent` desde `src/app/shared/components/grafico` en el componente consumidor:

```ts
import { GraficoComponent, GraficoSerie, GraficoTipo } from '../../shared/components/grafico';

export class ReporteComponent {
  readonly tipo: GraficoTipo = 'barras';
  readonly etiquetas = ['Ingeniería', 'Medicina', 'Derecho'];
  readonly series: GraficoSerie[] = [
    { nombre: 'Paralelos', valores: [12, 8, 10] },
    { nombre: 'Cursos', valores: [20, 14, 16], color: '#9A1232' },
  ];
}
```

```html
<app-grafico
  [tipo]="tipo"
  [etiquetas]="etiquetas"
  [series]="series"
  titulo="Cursos y paralelos por carrera"
/>
```

`GraficoSerie` contiene `nombre`, `valores` y un `color` opcional. Cada serie debe incluir un valor numérico por etiqueta. El gráfico de pastel acepta exactamente una serie y utiliza los colores de la paleta del sistema. Actualiza las entradas con nuevos arreglos para que el componente refresque los datos.

Si no hay datos o las etiquetas y series no coinciden, muestra un estado explicativo. También incluye una tabla visualmente oculta con los datos para tecnologías de asistencia.
