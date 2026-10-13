import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-docentes-lista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-docentes-lista.html',
  styleUrl: './app-docentes-lista.css'
})
export class DocentesListaComponent implements OnInit {
  docentes = [
    { id: 1, cedula: '0928374651', nombre: 'Ing. Carlos Mendoza, M.Sc.', departamento: 'Sistemas y Computación', estado: 'Activo' }
  ];

  ngOnInit(): void {}
}