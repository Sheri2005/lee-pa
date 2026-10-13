import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocentesListaComponent } from './app-docentes-lista';

describe('DocentesListaComponent', () => {
  let component: DocentesListaComponent;
  let fixture: ComponentFixture<DocentesListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocentesListaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocentesListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});