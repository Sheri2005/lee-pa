import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MallaMateriaFormComponent } from './app-malla-materia-form';

describe('MallaMateriaFormComponent', () => {
  let component: MallaMateriaFormComponent;
  let fixture: ComponentFixture<MallaMateriaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MallaMateriaFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MallaMateriaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});