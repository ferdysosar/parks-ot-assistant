import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Demowidget } from './demowidget';

describe('Demowidget', () => {
  let component: Demowidget;
  let fixture: ComponentFixture<Demowidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Demowidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Demowidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
