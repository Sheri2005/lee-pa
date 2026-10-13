import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-malla-por-niveles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './malla-por-niveles.html',
  styleUrl: './malla-por-niveles.css'
})
export class MallaPorNivelesComponent implements OnInit {
  @Input() mallaId?: number;

  niveles = [
    { nivel: 1, materias: ['Matemática I', 'Programación I'] },
    { nivel: 2, materias: ['Matemática II', 'Estructura de Datos'] }
  ];

  ngOnInit(): void {}
}