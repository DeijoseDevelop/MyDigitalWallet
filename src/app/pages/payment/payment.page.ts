import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardService, Card } from 'src/app/core/services/card.service';
import { PaymentService, Transaction } from 'src/app/core/services/payment.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { DialogService } from 'src/app/core/services/dialog.service';

export const CATEGORIES = [
  'Comida', 'Transporte', 'Servicios', 'Compras', 'Salud', 'Ocio'
];

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
  standalone: false
})
export class PaymentPage implements OnInit {

  paymentForm: FormGroup;
  cards: Card[] = [];
  transactions: Transaction[] = [];
  categories = CATEGORIES;
  loading = true;
  loadingTx = true;

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private dialogService: DialogService
  ) {
    this.paymentForm = this.fb.group({
      cardId:      ['', Validators.required],
      amount:      [null, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      category:    ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.loadCards();
    await this.loadTransactions();
  }

  async ionViewWillEnter() {
    await this.loadCards();
    await this.loadTransactions();
  }

  async loadCards() {
    this.loading = true;
    this.cards = await this.cardService.getCards();
    if (this.cards.length > 0) {
      this.paymentForm.get('cardId')?.setValue(this.cards[0].id);
    }
    this.loading = false;
  }

  async loadTransactions() {
    this.loadingTx = true;
    this.transactions = await this.paymentService.getTransactions();
    this.loadingTx = false;
  }

  get selectedCard(): Card | undefined {
    const id = this.paymentForm.get('cardId')?.value;
    return this.cards.find(c => c.id === id);
  }

  async onPay() {
    if (this.paymentForm.invalid) {
      this.toastService.error('Completa todos los campos.');
      return;
    }

    const { cardId, amount, description, category } = this.paymentForm.value;
    const card = this.cards.find(c => c.id === cardId);
    if (!card) return;

    const confirmed = await this.dialogService.confirm(
      'Confirmar pago',
      `¿Pagar $${amount.toLocaleString('es-CO')} con tarjeta •••• ${card.cardNumber}?`
    );
    if (!confirmed) return;

    await this.loadingService.show('Procesando pago...');
    try {
      await this.paymentService.processPayment(
        cardId,
        card.cardNumber,
        amount,
        description,
        category
      );
      await this.notificationService.sendPaymentNotification(amount);
      await this.toastService.success('¡Pago realizado con éxito!');
      this.paymentForm.reset();
      if (this.cards.length > 0) {
        this.paymentForm.get('cardId')?.setValue(this.cards[0].id);
      }
      await this.loadTransactions();
    } catch (error: any) {
      await this.toastService.error(error.message || 'Error al procesar el pago.');
    } finally {
      await this.loadingService.hide();
    }
  }
}