import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MallaService } from '../../services/malla.service';

@Component({
  selector: 'app-selector-malla',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app-selector-malla.html',
  styleUrl: './app-selector-malla.css'
})
export class SelectorMallaComponent implements OnInit {
  @Input() carreraId?: number;
  @Output() mallaChange = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private mallaService = inject(MallaService);

  form: FormGroup = this.fb.group({
    mallaId: ['', Validators.required]
  });

  mallas: any[] = [];

  ngOnInit(): void {
    this.mallaService.listar().subscribe({
      next: (data: any[]) => {
        this.mallas = data || [];
        const mallasFiltradas = this.carreraId 
          ? this.mallas.filter(m => m.carreraId === this.carreraId) 
          : this.mallas;

        const vigente = mallasFiltradas.find(m => m.vigente) || mallasFiltradas[0];
        if (vigente) {
          this.form.patchValue({ mallaId: vigente.id });
          this.mallaChange.emit(vigente);
        }
      },
      error: () => {
        this.mallas = [{ id: 1, codigo: 'MAL-2026', vigente: true, nombre: 'Malla Vigente' }];
        this.mallaChange.emit(this.mallas[0]);
      }
    });

    this.form.get('mallaId')?.valueChanges.subscribe(id => {
      const seleccionada = this.mallas.find(m => m.id == id);
      this.mallaChange.emit(seleccionada);
    });
  }
}