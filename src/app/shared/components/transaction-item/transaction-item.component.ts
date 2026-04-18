import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Transaction } from 'src/app/core/services/payment.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-transaction-item',
  templateUrl: './transaction-item.component.html',
  styleUrls: ['./transaction-item.component.scss'],
  standalone: false,
})
export class TransactionItemComponent implements OnDestroy {

  @Input() transaction!: Transaction;
  @Input() emoji = '';
  @Output() emojiPicked = new EventEmitter<string>();

  private pressTimer: any = null;
  private progressInterval: any = null;
  readonly LONG_PRESS_MS = 800;

  isHolding = false;
  progress = 0;
  showPicker = false;

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Comida': 'fast-food-outline',
      'Transporte': 'car-outline',
      'Servicios': 'flash-outline',
      'Compras': 'bag-outline',
      'Salud': 'medkit-outline',
      'Ocio': 'game-controller-outline',
    };
    return icons[category] ?? 'receipt-outline';
  }

  getFormattedDate(date: any): string {
    if (!date) return '';
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  onPressStart(event: TouchEvent | MouseEvent) {
    event.preventDefault();
    this.isHolding = true;
    this.progress = 0;

    this.progressInterval = setInterval(() => {
      this.progress = Math.min(this.progress + (100 / (this.LONG_PRESS_MS / 50)), 100);
    }, 50);

    this.pressTimer = setTimeout(async () => {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.showPicker = true;
      this.cancelPress();
    }, this.LONG_PRESS_MS);
  }

  onPressEnd() {
    this.cancelPress();
  }

  async onEmojiSelect(event: any) {
    const emoji = event.emoji?.native ?? '';
    if (emoji) {
      await Haptics.impact({ style: ImpactStyle.Light });
      this.emojiPicked.emit(emoji);
    }
    this.showPicker = false;
  }
  private cancelPress() {
    clearTimeout(this.pressTimer);
    clearInterval(this.progressInterval);
    this.isHolding = false;
    this.progress = 0;
  }

  ngOnDestroy() {
    this.cancelPress();
  }
}