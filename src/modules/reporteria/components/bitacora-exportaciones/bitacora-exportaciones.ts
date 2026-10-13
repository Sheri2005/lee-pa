import { Component, computed, signal } from '@angular/core';

type FormatoExportacionSiac = 'JSON' | 'CSV';

interface RegistroExportacion {
  id: number;
  planificacionId: number;
  planificacion: string;
  usuario: string;
  fecha: string;
  formato: FormatoExportacionSiac;
  totalParalelos: number;
  archivo: string;
}

@Component({
  selector: 'app-bitacora-exportaciones',
  imports: [],
  templateUrl: './bitacora-exportaciones.html',
  styleUrl: './bitacora-exportaciones.css',
})
export class BitacoraExportacionesComponent {
  protected readonly registros: readonly RegistroExportacion[] = [
    {
      id: 1,
      planificacionId: 12,
      planificacion: 'Ingeniería en Computación · 2027-1',
      usuario: 'María López',
      fecha: '2026-10-07T16:45:00-05:00',
      formato: 'JSON',
      totalParalelos: 8,
      archivo: 'planificacion-12.json',
    },
    {
      id: 2,
      planificacionId: 12,
      planificacion: 'Ingeniería en Computación · 2027-1',
      usuario: 'María López',
      fecha: '2026-10-07T16:46:00-05:00',
      formato: 'CSV',
      totalParalelos: 8,
      archivo: 'planificacion-12.csv',
    },
    {
      id: 3,
      planificacionId: 18,
      planificacion: 'Ingeniería Industrial · 2027-1',
      usuario: 'Carlos Mendoza',
      fecha: '2026-10-06T11:20:00-05:00',
      formato: 'JSON',
      totalParalelos: 6,
      archivo: 'planificacion-18.json',
    },
    {
      id: 4,
      planificacionId: 21,
      planificacion: 'Ingeniería en Computación · 2026-2',
      usuario: 'Ana Torres',
      fecha: '2026-10-05T09:15:00-05:00',
      formato: 'CSV',
      totalParalelos: 7,
      archivo: 'planificacion-21.csv',
    },
    {
      id: 5,
      planificacionId: 21,
      planificacion: 'Ingeniería en Computación · 2026-2',
      usuario: 'Ana Torres',
      fecha: '2026-10-05T09:14:00-05:00',
      formato: 'JSON',
      totalParalelos: 7,
      archivo: 'planificacion-21.json',
    },
  ];

  protected readonly busqueda = signal('');
  protected readonly formatoSeleccionado =
    signal<'TODOS' | FormatoExportacionSiac>('TODOS');

  protected readonly registrosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const formato = this.formatoSeleccionado();

    return this.registros.filter((registro) => {
      const coincideFormato =
        formato === 'TODOS' || registro.formato === formato;

      const coincideBusqueda =
        texto.length === 0 ||
        registro.planificacion.toLowerCase().includes(texto) ||
        registro.usuario.toLowerCase().includes(texto) ||
        registro.archivo.toLowerCase().includes(texto);

      return coincideFormato && coincideBusqueda;
    });
  });

  protected actualizarBusqueda(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
  }

  protected actualizarFormato(event: Event): void {
    const select = event.target as HTMLSelectElement;

    this.formatoSeleccionado.set(
      select.value as 'TODOS' | FormatoExportacionSiac,
    );
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.formatoSeleccionado.set('TODOS');
  }

  protected formatearFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(fecha));
  }
}