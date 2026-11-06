import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AdminConversationDto, MessageDto, MessageType } from '@lost-and-found/api';

@Component({
  selector: 'app-conversation-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  templateUrl: './conversation-modal.component.html',
  styleUrl: './conversation-modal.component.scss',
})
export class ConversationModalComponent {
  @Input() data!: AdminConversationDto;
  @Input() highlightedMessageId?: number;

  MessageType = MessageType;

  constructor(public modalRef: BsModalRef) {}

  senderName(message: MessageDto): string {
    return message.senderId === this.data.holderId ? this.data.holderName : this.data.claimantName;
  }

  isHolder(message: MessageDto): boolean {
    return message.senderId === this.data.holderId;
  }

  close(): void {
    this.modalRef.hide();
  }
}
