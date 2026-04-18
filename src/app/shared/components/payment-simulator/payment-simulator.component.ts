import { Component, Input, OnInit } from '@angular/core';
import { Card } from 'src/app/core/services/card.service';
import { PaymentService, FakeMerchant } from 'src/app/core/services/payment.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { BiometricService } from 'src/app/core/services/biometric.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-payment-simulator',
  templateUrl: './payment-simulator.component.html',
  styleUrls: ['./payment-simulator.component.scss'],
  standalone: false,
})
export class PaymentSimulatorComponent implements OnInit {
  @Input() cards: Card[] = [];

  selectedCard: Card | null = null;
  selectedMerchant: FakeMerchant | null = null;
  merchants: FakeMerchant[] = [];
  processing = false;

  constructor(
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private modalService: ModalService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private biometricService: BiometricService,
    private userService: UserService,
  ) { }

  async ngOnInit() {
    const user = await this.userService.getUserData();
    const defaultId = user?.defaultCardId;

    if (defaultId) {
      this.selectedCard = this.cards.find(c => c.id === defaultId) ?? this.cards[0] ?? null;
    } else {
      this.selectedCard = this.cards[0] ?? null;
    }

    this.refreshMerchants();
  }

  refreshMerchants() {
    this.merchants = this.paymentService.generateFakeMerchants(6);
    this.selectedMerchant = null;
  }

  selectCard(card: Card) { this.selectedCard = card; }
  selectMerchant(merchant: FakeMerchant) {
    this.selectedMerchant = this.selectedMerchant?.name === merchant.name ? null : merchant;
  }

  isValid(): boolean {
    return !!this.selectedCard && !!this.selectedMerchant;
  }

  getCategoryEmoji(category: string): string {
    const map: Record<string, string> = {
      'Comida': '🍔', 'Transporte': '🚗', 'Servicios': '⚡',
      'Compras': '🛍️', 'Salud': '💊', 'Ocio': '🎮',
    };
    return map[category] ?? '💸';
  }

  async onPay() {
    if (!this.isValid() || !this.selectedCard || !this.selectedMerchant) return;

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

    await this.loadingService.show('Procesando pago...');
    try {
      await this.paymentService.processPayment(
        this.selectedCard.id!,
        this.selectedCard.cardNumber,
        this.selectedMerchant.amount,
        this.selectedMerchant.name,
        this.selectedMerchant.name,
        this.selectedMerchant.category
      );
      await this.notificationService.sendPaymentNotification(this.selectedMerchant.amount);
      await this.toastService.success('¡Pago realizado con éxito!');
      await this.modalService.close({ success: true, amount: this.selectedMerchant.amount }, 'confirm');
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