import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MateriaService } from '../../../shared/services/materia.service'; 

@Component({
  selector: 'app-materias-lista',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-materias-lista.html',
  styleUrl: './app-materias-lista.css'
})
export class MateriasListaComponent implements OnInit {
  private materiaService = inject(MateriaService);

  materias: any[] = [];
  cargando: boolean = true;

  ngOnInit(): void {
    this.materiaService.listar().subscribe({
      next: (data: any[]) => {
        this.materias = data || [];
        this.cargando = false;
      },
      error: () => {
        this.materias = [];
        this.cargando = false;
      }
    });
  }
}