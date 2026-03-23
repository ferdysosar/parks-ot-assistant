import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Companieswidget } from './companieswidget';

describe('Companieswidget', () => {
  let component: Companieswidget;
  let fixture: ComponentFixture<Companieswidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Companieswidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Companieswidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
