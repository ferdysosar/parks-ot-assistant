import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import { ChatMessage } from './chat.types';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss',
})
export class ChatWidget implements AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer?: ElementRef<HTMLDivElement>;

  private readonly initialAssistantMessage =
    'Hola, soy Parks OT Assistant. Podés consultar por número de OT, empresa o activo. Ejemplos: "OT-001", "Aurora I", "órdenes de Río Norte".';

  isOpen = false;
  userInput = '';
  messages: ChatMessage[] = this.buildInitialMessages();

  private shouldScrollToBottom = false;

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.forceScrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.requestScrollToBottom();
    }
  }

  sendMessage(): void {
    const raw = this.userInput.trim();

    if (!raw) return;

    this.messages.push({
      role: 'user',
      text: raw,
    });

    this.userInput = '';
    this.requestScrollToBottom();

    const response = this.chatService.resolveQuery(raw);

    this.messages.push({
      role: 'assistant',
      text: response,
    });

    this.requestScrollToBottom();
  }

  resetConversation(): void {
    this.chatService.resetConversationContext();
    this.userInput = '';
    this.messages = this.buildInitialMessages();
    this.requestScrollToBottom();
  }

  private buildInitialMessages(): ChatMessage[] {
    return [
      {
        role: 'assistant',
        text: this.initialAssistantMessage,
      },
    ];
  }

  private requestScrollToBottom(): void {
    this.shouldScrollToBottom = true;
  }

  private forceScrollToBottom(): void {
    const container = this.chatContainer?.nativeElement;
    if (!container) return;

    container.scrollTop = container.scrollHeight;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }
}
