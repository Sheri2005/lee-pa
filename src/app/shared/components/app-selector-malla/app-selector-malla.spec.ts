import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectorMallaComponent } from './app-selector-malla';

describe('SelectorMallaComponent', () => {
  let component: SelectorMallaComponent;
  let fixture: ComponentFixture<SelectorMallaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorMallaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectorMallaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});