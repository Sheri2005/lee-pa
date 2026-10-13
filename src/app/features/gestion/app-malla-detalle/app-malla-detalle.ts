import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MallaService } from '../../../shared/services/malla.service';

@Component({
  selector: 'app-malla-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-malla-detalle.html',
  styleUrl: './app-malla-detalle.css'
})
export class MallaDetalleComponent implements OnInit {
  private mallaService = inject(MallaService);
  private route = inject(ActivatedRoute);

  malla: any = null;
  cargando: boolean = true;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const mallaId = idParam ? Number(idParam) : 1;

    this.mallaService.listar().subscribe({
      next: (data: any[]) => {
        const encontrada = (data || []).find(m => m.id === mallaId);
        this.malla = encontrada || data[0] || null;
        this.cargando = false;
      },
      error: () => {
        this.malla = null;
        this.cargando = false;
      }
    });
  }
}