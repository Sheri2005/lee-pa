import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MallasListaComponent } from './app-mallas-lista';

describe('MallasListaComponent', () => {
  let component: MallasListaComponent;
  let fixture: ComponentFixture<MallasListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MallasListaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MallasListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});