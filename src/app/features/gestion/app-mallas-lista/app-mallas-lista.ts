import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MallaService } from '../../../shared/services/malla.service';

@Component({
  selector: 'app-mallas-lista',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-mallas-lista.html',
  styleUrl: './app-mallas-lista.css'
})
export class MallasListaComponent implements OnInit {
  private mallaService = inject(MallaService);
  
  mallas: any[] = [];
  cargando: boolean = true;

  ngOnInit(): void {
    this.mallaService.listar().subscribe({
      next: (data: any[]) => {
        this.mallas = data || [];
        this.cargando = false;
      },
      error: () => {
        this.mallas = [];
        this.cargando = false;
      }
    });
  }
}