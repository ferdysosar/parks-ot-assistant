import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoWidget } from './demowidget';

describe('DemoWidget', () => {
  let component: DemoWidget;
  let fixture: ComponentFixture<DemoWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemoWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
