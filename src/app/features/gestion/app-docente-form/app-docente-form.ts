import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../../shared/services/usuario.service';

@Component({
  selector: 'app-docente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app-docente-form.html',
  styleUrl: './app-docente-form.css'
})
export class DocenteFormComponent implements OnInit {
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form!: FormGroup;
  usuarios: any[] = [];

  constructor(private fb: FormBuilder, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    // Simulación de usuarios para el selector vinculado
    this.usuarios = [
      { id: 101, nombre: 'Carlos Mendoza (cmendoza)' },
      { id: 102, nombre: 'Ana Torres (atorres)' }
    ];

    this.form = this.fb.group({
      usuarioId: ['', Validators.required],
      cedula: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      departamento: ['', Validators.required],
      estado: ['Activo', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.guardar.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}