import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequisitosEditorComponent } from './app-requisitos-editor';

describe('RequisitosEditorComponent', () => {
  let component: RequisitosEditorComponent;
  let fixture: ComponentFixture<RequisitosEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequisitosEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequisitosEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});