import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrosSinSiacComponent } from './registros-sin-siac.component';

describe('RegistrosSinSiacComponent', () => {
  let component: RegistrosSinSiacComponent;
  let fixture: ComponentFixture<RegistrosSinSiacComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrosSinSiacComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrosSinSiacComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
