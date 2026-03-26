import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtsWidget } from './otswidget';

describe('OtsWidget', () => {
  let component: OtsWidget;
  let fixture: ComponentFixture<OtsWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtsWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtsWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
