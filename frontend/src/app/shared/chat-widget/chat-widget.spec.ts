import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatWidget } from './chat-widget';

describe('ChatWidget', () => {
  let component: ChatWidget;
  let fixture: ComponentFixture<ChatWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('inicia con saludo corto sin ejemplos', () => {
    const initialMessage = component.messages[0]?.text ?? '';
    expect(initialMessage).toBe('Hola, soy Parks OT Assistant. ¿En qué te puedo ayudar con las OTs?');
    expect(initialMessage).not.toContain('Ejemplos');
  });
});
