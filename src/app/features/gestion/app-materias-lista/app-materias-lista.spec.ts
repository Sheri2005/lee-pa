import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MateriasListaComponent } from './app-materias-lista';
import { provideRouter } from '@angular/router';

describe('MateriasListaComponent', () => {
  let component: MateriasListaComponent;
  let fixture: ComponentFixture<MateriasListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MateriasListaComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(MateriasListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});