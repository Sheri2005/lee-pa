import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShellLayoutComponent } from './shell-layout';

describe('ShellLayout', () => {
  let component: ShellLayoutComponent;
  let fixture: ComponentFixture<ShellLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellLayoutComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ShellLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
