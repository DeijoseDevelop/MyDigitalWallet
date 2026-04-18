import { Component, Output, EventEmitter } from '@angular/core';

export type QuickAction = 'transfer' | 'recharge' | 'pay';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss'],
  standalone: false,
})
export class QuickActionsComponent {
  @Output() actionSelected = new EventEmitter<QuickAction>();

  actions = [
    { id: 'transfer' as QuickAction, label: 'Transferir', icon: 'swap-horizontal-outline' },
    { id: 'recharge' as QuickAction, label: 'Recargar',   icon: 'add-circle-outline' },
    { id: 'pay'      as QuickAction, label: 'Pagar',      icon: 'receipt-outline' },
  ];

  onAction(id: QuickAction) {
    this.actionSelected.emit(id);
  }
}