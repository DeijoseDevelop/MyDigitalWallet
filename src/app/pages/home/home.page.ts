import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService, UserProfile } from 'src/app/core/services/user.service';
import { CardService, Card } from 'src/app/core/services/card.service';
import { PaymentService, Transaction } from 'src/app/core/services/payment.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { DialogService } from 'src/app/core/services/dialog.service';
import { PaymentSimulatorComponent } from 'src/app/shared/components/payment-simulator/payment-simulator.component';
import { QuickAction } from 'src/app/shared/components/quick-actions/quick-actions.component';
import { AlertController, LoadingController } from '@ionic/angular';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  user: UserProfile | null = null;
  cards: Card[] = [];
  orderedCards: Card[] = [];
  transactions: Transaction[] = [];
  loading = true;

  readonly CARD_HEIGHT = 190;
  readonly CARD_PEEK = 24;
  readonly CARD_SCALE = 0.04;
  readonly SWIPE_THRESHOLD = 80;

  dragX = 0;
  isDragging = false;
  isAnimating = false;
  private touchStartX = 0;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private cardService: CardService,
    private paymentService: PaymentService,
    private modalService: ModalService,
    private dialogService: DialogService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastService: ToastService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const [user, cards, transactions] = await Promise.all([
        this.userService.getUserData(),
        this.cardService.getCards(),
        this.paymentService.getTransactions()
      ]);
      this.user = user;
      this.cards = cards;
      this.orderedCards = [...cards];
      this.transactions = transactions;
    } finally {
      this.loading = false;
    }
  }

  get stackHeight(): number {
    const count = this.orderedCards.length;
    return this.CARD_HEIGHT + (count - 1) * this.CARD_PEEK;
  }

  getTransform(i: number): string {
    const peekY = i * this.CARD_PEEK;
    const scale = 1 - i * this.CARD_SCALE;

    if (i === 0 && this.isDragging) {
      const lift = Math.min(Math.abs(this.dragX) * 0.05, 10);
      const rot = this.dragX * 0.04;
      return `translateX(${this.dragX}px) translateY(${-lift}px) rotate(${rot}deg) scale(${scale})`;
    }

    if (i === 1 && this.isDragging) {
      const progress = Math.min(Math.abs(this.dragX) / this.SWIPE_THRESHOLD, 1);
      const interpolatedPeek = peekY * (1 - progress * 0.5);
      const interpolatedScale = scale + this.CARD_SCALE * progress * 0.5;
      return `translateY(${interpolatedPeek}px) scale(${interpolatedScale})`;
    }

    return `translateY(${peekY}px) scale(${scale})`;
  }

  getZIndex(i: number): number {
    return this.orderedCards.length - i;
  }

  getOpacity(i: number): number {
    return i >= 3 ? 0 : 1;
  }

  onTouchStart(event: TouchEvent) {
    if (this.isAnimating || this.orderedCards.length <= 1) return;
    this.touchStartX = event.touches[0].clientX;
    this.isDragging = true;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    this.dragX = event.touches[0].clientX - this.touchStartX;
  }

  onTouchEnd(_event: TouchEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (Math.abs(this.dragX) >= this.SWIPE_THRESHOLD) {
      this.commitSwipe();
    } else {
      this.dragX = 0;
    }
  }

  private commitSwipe() {
    this.isAnimating = true;
    const direction = this.dragX > 0 ? 1 : -1;
    this.dragX = direction * 600;

    setTimeout(() => {
      const [first, ...rest] = this.orderedCards;
      this.orderedCards = [...rest, first];
      this.dragX = 0;
      setTimeout(() => { this.isAnimating = false; }, 50);
    }, 280);
  }

  async onQuickAction(action: QuickAction) {
    if (action === 'pay') {
      await this.openPaymentSimulator();
    } else if (action === 'recharge') {
      await this.openRechargeDialog();
    } else {
      await this.dialogService.alert('Próximamente', 'Esta función estará disponible pronto.');
    }
  }

  async openRechargeDialog() {
    const alert = await this.alertCtrl.create({
      header: 'Recargar saldo',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Monto a recargar',
          min: 1,
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Recargar',
          handler: async (data) => {
            const amount = Number(data.amount);
            if (!amount || amount <= 0) {
              await this.toastService.error('Ingresa un monto válido.');
              return false;
            }
            await this.processRecharge(amount);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async processRecharge(amount: number) {
    const loading = await this.loadingCtrl.create({ message: 'Recargando...' });
    await loading.present();
    try {
      const userData = await this.userService.getUserData();
      if (!userData) throw new Error('No se encontró el perfil.');
      const newBalance = (userData.balance ?? 0) + amount;
      await this.userService.updateBalance(newBalance);
      await this.toastService.success(`+$${amount.toLocaleString('es-CO')} agregados a tu saldo.`);
      await this.loadData();
    } catch (error: any) {
      await this.toastService.error(error.message || 'Error al recargar.');
    } finally {
      loading.dismiss();
    }
  }

  async openPaymentSimulator() {
    const { data } = await this.modalService.open(PaymentSimulatorComponent, {
      cards: this.cards
    });
    if (data?.success) {
      await this.loadData();
    }
  }

  async onLogout() {
    const confirmed = await this.dialogService.confirm(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?'
    );
    if (confirmed) {
      await this.authService.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  goToAddCard() {
    this.router.navigateByUrl('/add-card');
  }

  goToPayment() {
    this.router.navigateByUrl('/payment');
  }
}