import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SketchPageComponent } from './sketch-page.component';

describe('SketchPageComponent', () => {
  let component: SketchPageComponent;
  let fixture: ComponentFixture<SketchPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SketchPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SketchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
