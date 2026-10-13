import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MallaPorNivelesComponent } from './malla-por-niveles';

describe('MallaPorNivelesComponent', () => {
  let component: MallaPorNivelesComponent;
  let fixture: ComponentFixture<MallaPorNivelesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MallaPorNivelesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MallaPorNivelesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});