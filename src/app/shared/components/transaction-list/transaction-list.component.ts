import { Component, Input } from '@angular/core';
import { Transaction } from 'src/app/core/services/payment.service';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
  standalone: false,
})
export class TransactionListComponent {
  @Input() transactions: Transaction[] = [];
}