import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  enlace: string;
  leida: boolean;
  fecha: Date;
}

@Component({
  selector: 'app-campana-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campana-notificaciones.html',
  styleUrl: './campana-notificaciones.css'
})
export class CampanaNotificacionesComponent {

  mostrarNotificaciones = false;

  notificaciones: Notificacion[] = [
    {
      id: 1,
      titulo: 'Solicitud aprobada',
      mensaje: 'La planificación fue aprobada.',
      enlace: '/planificacion',
      leida: false,
      fecha: new Date()
    },
    {
      id: 2,
      titulo: 'Nueva solicitud',
      mensaje: 'Tienes una solicitud de aprobación pendiente.',
      enlace: '/aprobaciones',
      leida: false,
      fecha: new Date()
    },
    {
      id: 3,
      titulo: 'Reserva actualizada',
      mensaje: 'La reserva del laboratorio fue actualizada.',
      enlace: '/reservas',
      leida: true,
      fecha: new Date()
    }
  ];

  get noLeidas(): number {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  toggleNotificaciones(): void {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
  }

  marcarComoLeida(notificacion: Notificacion): void {
    notificacion.leida = true;
  }

  marcarTodasComoLeidas(): void {
    this.notificaciones.forEach(n => n.leida = true);
  }

  cerrar(): void {
    this.mostrarNotificaciones = false;
  }
}