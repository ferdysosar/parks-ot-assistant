import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Otswidget } from './otswidget';

describe('Otswidget', () => {
  let component: Otswidget;
  let fixture: ComponentFixture<Otswidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Otswidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Otswidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
