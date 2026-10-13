import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaIndicadorComponent } from './tarjeta-indicador';

describe('TarjetaIndicadorComponent', () => {
  let component: TarjetaIndicadorComponent;
  let fixture: ComponentFixture<TarjetaIndicadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaIndicadorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaIndicadorComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('titulo', 'Indicador de prueba');
    fixture.componentRef.setInput('valor', 10);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});