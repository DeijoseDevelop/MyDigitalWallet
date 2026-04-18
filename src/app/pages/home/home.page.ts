import { Component, OnInit, AfterViewInit, ElementRef, QueryList, ViewChildren, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { animate, stagger, utils } from 'animejs';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService, UserProfile } from 'src/app/core/services/user.service';
import { CardService, Card } from 'src/app/core/services/card.service';
import { PaymentService, Transaction } from 'src/app/core/services/payment.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { DialogService } from 'src/app/core/services/dialog.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { PaymentSimulatorComponent } from 'src/app/shared/components/payment-simulator/payment-simulator.component';
import { QuickAction } from 'src/app/shared/components/quick-actions/quick-actions.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, AfterViewInit {

  @ViewChild('balanceSection') balanceRef!: ElementRef;
  @ViewChild('quickSection') quickRef!: ElementRef;
  @ViewChild('cardsSection') cardsRef!: ElementRef;
  @ViewChild('txSection') txRef!: ElementRef;

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
  private velocity = 0;
  private lastX = 0;
  private lastTime = 0;

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

  ngAfterViewInit() {
    this.animateEntrance();
  }

  async ionViewWillEnter() {
    await this.loadData();
    this.animateEntrance();
  }

  animateEntrance() {
    const sections = [
      this.balanceRef?.nativeElement,
      this.quickRef?.nativeElement,
      this.cardsRef?.nativeElement,
      this.txRef?.nativeElement,
    ].filter(Boolean);

    utils.set(sections, { opacity: 0, translateY: 32 });

    animate(sections, {
      opacity: [0, 1],
      translateY: [32, 0],
      duration: 500,
      delay: stagger(80),
      ease: 'easeOutExpo',
    });
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
    return this.CARD_HEIGHT + (this.orderedCards.length - 1) * this.CARD_PEEK;
  }

  getTransform(i: number): string {
    const peekY = i * this.CARD_PEEK;
    const scale = 1 - i * this.CARD_SCALE;

    if (i === 0 && this.isDragging) {
      const lift = Math.min(Math.abs(this.dragX) * 0.06, 16);
      const rot = this.dragX * 0.03;
      return `translateX(${this.dragX}px) translateY(${-lift}px) rotate(${rot}deg) scale(${scale})`;
    }

    if (i === 1 && this.isDragging) {
      const progress = Math.min(Math.abs(this.dragX) / this.SWIPE_THRESHOLD, 1);
      const interpolatedPeek = peekY * (1 - progress * 0.6);
      const interpolatedScale = scale + this.CARD_SCALE * progress * 0.6;
      return `translateY(${interpolatedPeek}px) scale(${interpolatedScale})`;
    }

    if (i === 2 && this.isDragging) {
      const progress = Math.min(Math.abs(this.dragX) / this.SWIPE_THRESHOLD, 1);
      const interpolatedPeek = peekY * (1 - progress * 0.2);
      return `translateY(${interpolatedPeek}px) scale(${scale})`;
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
    this.lastX = this.touchStartX;
    this.lastTime = Date.now();
    this.velocity = 0;
    this.isDragging = true;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    const now = Date.now();
    const currentX = event.touches[0].clientX;
    const dt = now - this.lastTime;

    if (dt > 0) {
      this.velocity = (currentX - this.lastX) / dt;
    }

    this.lastX = currentX;
    this.lastTime = now;
    this.dragX = currentX - this.touchStartX;
  }

  async onTouchEnd(_event: TouchEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;

    const flick = Math.abs(this.velocity) > 0.5;

    if (Math.abs(this.dragX) >= this.SWIPE_THRESHOLD || flick) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      this.commitSwipe();
    } else {
      this.snapBack();
    }
  }

  private snapBack() {
    const obj = { x: this.dragX };

    animate(obj, {
      x: 0,
      duration: 400,
      ease: 'spring(1, 80, 12, 0)',
      onUpdate: () => { this.dragX = obj.x; }
    });
  }

  private commitSwipe() {
    this.isAnimating = true;
    const direction = this.dragX > 0 ? 1 : -1;
    const exitX = direction * (window.innerWidth + 100);
    const speed = Math.max(Math.abs(this.velocity) * 300, 250);
    const obj = { x: this.dragX };

    animate(obj, {
      x: exitX,
      duration: speed,
      ease: 'easeOutCubic',
      onUpdate: () => { this.dragX = obj.x; },
      onComplete: () => {
        const [first, ...rest] = this.orderedCards;
        this.orderedCards = [...rest, first];
        this.dragX = 0;
        setTimeout(() => {
          this.isAnimating = false;
          this.animateNewTopCard();
        }, 30);
      }
    });
  }

  private animateNewTopCard() {
    const topCard = document.querySelector('.stack-item.is-top');
    if (!topCard) return;

    animate(topCard, {
      scale: [0.92, 1],
      opacity: [0.6, 1],
      duration: 350,
      ease: 'easeOutBack',
    });
  }

  async onQuickAction(action: QuickAction) {
    await Haptics.impact({ style: ImpactStyle.Light });

    if (action === 'pay') {
      await this.openPaymentSimulator();
    } else if (action === 'recharge') {
      await this.openRechargeDialog();
    } else {
      await this.dialogService.alert('Próximamente', 'Esta función estará disponible pronto.');
    }
  }

  async openPaymentSimulator() {
    const { data } = await this.modalService.open(PaymentSimulatorComponent, { cards: this.cards });
    if (data?.success) {
      await Haptics.notification({ type: NotificationType.Success });
      await this.loadData();
    }
  }

  async openRechargeDialog() {
    const alert = await this.alertCtrl.create({
      header: 'Recargar saldo',
      inputs: [{ name: 'amount', type: 'number', placeholder: 'Monto a recargar', min: 1 }],
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
      await Haptics.notification({ type: NotificationType.Success });
      await this.toastService.success(`+$${amount.toLocaleString('es-CO')} agregados a tu saldo.`);
      await this.loadData();
      this.animateBalancePulse();
    } catch (error: any) {
      await Haptics.notification({ type: NotificationType.Error });
      await this.toastService.error(error.message || 'Error al recargar.');
    } finally {
      loading.dismiss();
    }
  }

  private animateBalancePulse() {
    const el = this.balanceRef?.nativeElement;
    if (!el) return;

    animate(el, {
      scale: [1, 1.03, 1],
      duration: 400,
      ease: 'easeOutElastic(1, 0.5)',
    });
  }

  async onLogout() {
    const confirmed = await this.dialogService.confirm('Cerrar sesión', '¿Estás seguro de que quieres salir?');
    if (confirmed) {
      await Haptics.impact({ style: ImpactStyle.Medium });
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