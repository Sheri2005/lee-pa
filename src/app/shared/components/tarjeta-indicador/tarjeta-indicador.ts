import { Component, EventEmitter, Input, Output } from '@angular/core';

export type TarjetaIndicadorColor =
  | 'primary'
  | 'accent'
  | 'gold'
  | 'neutral';

@Component({
  selector: 'app-tarjeta-indicador',
  imports: [],
  templateUrl: './tarjeta-indicador.html',
  styleUrl: './tarjeta-indicador.css',
})
export class TarjetaIndicadorComponent {
  @Input({ required: true }) titulo!: string;
  @Input({ required: true }) valor!: string | number;

  @Input() icono?: string;
  @Input() detalle?: string;
  @Input() color: TarjetaIndicadorColor = 'primary';

  @Output('click') indicadorClick = new EventEmitter<void>();

  emitirClick(): void {
    this.indicadorClick.emit();
  }
}