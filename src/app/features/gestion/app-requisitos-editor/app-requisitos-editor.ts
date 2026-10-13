import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-requisitos-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-requisitos-editor.html',
  styleUrl: './app-requisitos-editor.css'
})
export class RequisitosEditorComponent implements OnInit {
  @Input() mallaMateria: any;
  @Output() requisitosChange = new EventEmitter<any[]>();

  requisitos: string[] = ['Prerrequisito 1'];

  ngOnInit(): void {}

  agregarRequisito(req: string): void {
    this.requisitos.push(req);
    this.requisitosChange.emit(this.requisitos);
  }
}