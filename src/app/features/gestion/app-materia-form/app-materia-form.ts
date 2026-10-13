import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CarreraService } from '../../../shared/services/carrera.service';

@Component({
  selector: 'app-materia-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app-materia-form.html',
  styleUrl: './app-materia-form.css'
})
export class MateriaFormComponent implements OnInit {
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  materiaForm!: FormGroup;
  carreras: any[] = [];

  constructor(private fb: FormBuilder, private carreraService: CarreraService) {}

  ngOnInit(): void {
    // Carreras oficiales de prueba (5 ING-COMP, 6 ING-IND, 7 ARQ)
    this.carreras = [
      { id: 5, nombre: 'ING-COMP' },
      { id: 6, nombre: 'ING-IND' },
      { id: 7, nombre: 'ARQ' }
    ];

    this.materiaForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      estado: ['Activa', Validators.required],
      carreraId: ['', Validators.required],
      codigoSiac: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.materiaForm.valid) {
      this.guardar.emit(this.materiaForm.value);
      this.materiaForm.reset({ estado: 'Activa' });
    } else {
      this.materiaForm.markAllAsTouched();
    }
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}