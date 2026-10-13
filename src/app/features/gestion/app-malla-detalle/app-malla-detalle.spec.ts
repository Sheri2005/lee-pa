import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MallaDetalleComponent } from './app-malla-detalle';

describe('MallaDetalleComponent', () => {
  let component: MallaDetalleComponent;
  let fixture: ComponentFixture<MallaDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MallaDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MallaDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});