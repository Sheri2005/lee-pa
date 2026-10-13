import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuUsuarioComponent } from './menu-usuario';

describe('MenuUsuario', () => {
  let component: MenuUsuarioComponent;
  let fixture: ComponentFixture<MenuUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuUsuarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuUsuarioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
