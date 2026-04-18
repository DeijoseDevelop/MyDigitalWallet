import { Component, Input } from '@angular/core';
import { Transaction } from 'src/app/core/services/payment.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
  standalone: false,
})
export class TransactionListComponent {

  @Input() transactions: Transaction[] = [];

  constructor(
    private firestoreService: FirestoreService,
    private userService: UserService
  ) {}

  async onEmojiPicked(tx: Transaction, emoji: string) {
    if (!tx.id) return;

    tx.description = `${emoji} ${tx.description.replace(/^\S+\s/, '').trim()}`;
    const cleanDesc = tx.description.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u, '');
    tx.description = `${emoji} ${cleanDesc}`;

    const uid = this.userService.getCurrentUid();
    if (!uid) return;

    await this.firestoreService.updateDocument(
      `users/${uid}/transactions`,
      tx.id,
      { description: tx.description }
    );
  }

  getEmoji(tx: Transaction): string {
    const match = tx.description.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
    return match ? match[0] : '';
  }
}