import { Component, Input, OnInit } from '@angular/core';
import { Card } from 'src/app/core/services/card.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadingService } from 'src/app/core/services/loading.service';

export const CATEGORIES = [
  'Comida', 'Transporte', 'Servicios', 'Compras', 'Salud', 'Ocio'
];

@Component({
  selector: 'app-payment-simulator',
  templateUrl: './payment-simulator.component.html',
  styleUrls: ['./payment-simulator.component.scss'],
  standalone: false,
})
export class PaymentSimulatorComponent implements OnInit {
  @Input() cards: Card[] = [];

  selectedCard: Card | null = null;
  amount: number | null = null;
  description = '';
  category = '';
  categories = CATEGORIES;
  processing = false;

  constructor(
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private modalService: ModalService,
    private toastService: ToastService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    if (this.cards.length > 0) {
      this.selectedCard = this.cards[0];
    }
  }

  selectCard(card: Card) {
    this.selectedCard = card;
  }

  isValid(): boolean {
    return !!this.selectedCard
      && !!this.amount
      && this.amount > 0
      && this.description.trim().length > 0
      && this.category.length > 0;
  }

  async onPay() {
    if (!this.isValid() || !this.selectedCard) return;

    await this.loadingService.show('Procesando pago...');

    try {
      await this.paymentService.processPayment(
        this.selectedCard.id!,
        this.selectedCard.cardNumber,
        this.amount!,
        this.description.trim(),
        this.category
      );

      await this.notificationService.sendPaymentNotification(this.amount!);
      await this.toastService.success('¡Pago realizado con éxito!');
      await this.modalService.close({ success: true, amount: this.amount }, 'confirm');
    } catch (error: any) {
      await this.toastService.error(error.message || 'Error al procesar el pago');
    } finally {
      await this.loadingService.hide();
    }
  }

  async onCancel() {
    await this.modalService.close(null, 'cancel');
  }
}