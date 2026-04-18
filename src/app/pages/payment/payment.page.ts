import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardService, Card } from 'src/app/core/services/card.service';
import { PaymentService, Transaction } from 'src/app/core/services/payment.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { DialogService } from 'src/app/core/services/dialog.service';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { UserService } from 'src/app/core/services/user.service';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

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

  filteredTransactions: Transaction[] = [];
  filterDate: Date | null = null;
  filterCategory = '';
  filterCardId = '';
  activeSegment = 'pay';

  defaultCardId = '';

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private dialogService: DialogService,
    private biometricService: BiometricService,
    private userService: UserService
  ) {
    this.paymentForm = this.fb.group({
      cardId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
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

  onSegmentChange() {
    Haptics.impact({ style: ImpactStyle.Light });
    if (this.activeSegment === 'history') {
      this.loadTransactions();
    }
  }

  async loadCards() {
    this.loading = true;
    this.cards = await this.cardService.getCards();

    if (this.cards.length > 0) {
      const user = await this.userService.getUserData();
      this.defaultCardId = user?.defaultCardId ?? '';
      const defaultCard = this.defaultCardId
        ? this.cards.find(c => c.id === this.defaultCardId)
        : null;

      this.paymentForm.get('cardId')?.setValue(
        defaultCard?.id ?? this.cards[0].id
      );
    }

    this.loading = false;
  }

  async loadTransactions() {
    this.loadingTx = true;
    this.transactions = await this.paymentService.getTransactions();
    this.applyFilters();
    this.loadingTx = false;
  }

  get selectedCard(): Card | undefined {
    const id = this.paymentForm.get('cardId')?.value;
    return this.cards.find(c => c.id === id);
  }

  onDateFilter(date: Date | null) {
    this.filterDate = date;
    this.applyFilters();
  }

  onCategoryFilter(category: string) {
    this.filterCategory = category;
    this.applyFilters();
  }

  onCardFilter(cardId: string) {
    Haptics.impact({ style: ImpactStyle.Light });
    this.filterCardId = this.filterCardId === cardId ? '' : cardId;
    this.applyFilters();
  }

  clearAllFilters() {
    Haptics.impact({ style: ImpactStyle.Medium });
    this.filterDate = null;
    this.filterCategory = '';
    this.filterCardId = '';
    this.applyFilters();
  }

  get activeFilterCount(): number {
    return [this.filterDate, this.filterCategory, this.filterCardId]
      .filter(Boolean).length;
  }

  getCardById(id: string): Card | undefined {
    return this.cards.find(c => c.id === id);
  }

  private applyFilters() {
    let result = [...this.transactions];

    if (this.filterDate) {
      result = result.filter(tx => {
        const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
        return txDate.toDateString() === this.filterDate!.toDateString();
      });
    }

    if (this.filterCategory) {
      result = result.filter(tx =>
        tx.category.toLowerCase() === this.filterCategory.toLowerCase()
      );
    }

    if (this.filterCardId) {
      result = result.filter(tx => tx.cardId === this.filterCardId);
    }

    this.filteredTransactions = result;
  }

  async onPay() {
    if (this.paymentForm.invalid) {
      this.toastService.error('Completa todos los campos.');
      return;
    }

    const { cardId, amount, description, category } = this.paymentForm.value;
    const card = this.cards.find(c => c.id === cardId);
    if (!card) return;

    const userData = await this.userService.getUserData();
    if (userData?.biometryEnabled) {
      const available = await this.biometricService.isAvailable();
      if (available) {
        const verified = await this.biometricService.verify('Autoriza el pago con tu huella');
        if (!verified) {
          await this.toastService.error('Pago cancelado. Biometría no verificada.');
          return;
        }
      }
    }

    const confirmed = await this.dialogService.confirm(
      'Confirmar pago',
      `¿Pagar $${amount.toLocaleString('es-CO')} con tarjeta •••• ${card.cardNumber}?`
    );
    if (!confirmed) return;

    await this.loadingService.show('Procesando pago...');
    try {
      await this.paymentService.processPayment(
        cardId, card.cardNumber, amount, description, description, category
      );
      await this.notificationService.sendPaymentNotification(amount);
      await Haptics.notification({ type: NotificationType.Success });
      await this.toastService.success('¡Pago realizado con éxito!');
      this.paymentForm.reset();
      if (this.cards.length > 0) {
        this.paymentForm.get('cardId')?.setValue(this.cards[0].id);
      }
      await this.loadTransactions();
    } catch (error: any) {
      await Haptics.notification({ type: NotificationType.Error });
      await this.toastService.error(error.message || 'Error al procesar el pago.');
    } finally {
      await this.loadingService.hide();
    }
  }
}