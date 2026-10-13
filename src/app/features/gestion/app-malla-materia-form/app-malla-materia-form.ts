import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-malla-materia-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app-malla-materia-form.html',
  styleUrl: './app-malla-materia-form.css'
})
export class MallaMateriaFormComponent implements OnInit {
  @Input() mallaId?: number;
  @Input() mallaMateria?: any;
  @Output() guardar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      materiaId: [this.mallaMateria?.materiaId || '', Validators.required],
      nivel: [this.mallaMateria?.nivel || 1, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.guardar.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}