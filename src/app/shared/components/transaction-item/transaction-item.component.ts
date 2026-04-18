import { Component, Input } from '@angular/core';
import { Transaction } from 'src/app/core/services/payment.service';

@Component({
  selector: 'app-transaction-item',
  templateUrl: './transaction-item.component.html',
  styleUrls: ['./transaction-item.component.scss'],
  standalone: false,
})
export class TransactionItemComponent {
  @Input() transaction!: Transaction;

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Comida':      'fast-food-outline',
      'Transporte':  'car-outline',
      'Servicios':   'flash-outline',
      'Compras':     'bag-outline',
      'Salud':       'medkit-outline',
      'Ocio':        'game-controller-outline',
    };
    return icons[category] ?? 'receipt-outline';
  }

  getFormattedDate(date: any): string {
    if (!date) return '';
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}