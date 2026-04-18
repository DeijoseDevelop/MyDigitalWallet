import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
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
  private safetyTimer: any = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private cardService: CardService,
    private paymentService: PaymentService,
    private modalService: ModalService,
    private dialogService: DialogService,
    private loadingCtrl: LoadingController,
    private toastService: ToastService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  async ngOnInit() { await this.loadData(); }
  ngAfterViewInit() { this.animateEntrance(); }

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
      this.transactions = transactions;

      const defaultId = user?.defaultCardId;
      if (defaultId && cards.length > 1) {
        const defaultIdx = cards.findIndex(c => c.id === defaultId);
        if (defaultIdx > 0) {
          const reordered = [...cards];
          const [def] = reordered.splice(defaultIdx, 1);
          reordered.unshift(def);
          this.orderedCards = reordered;
        } else {
          this.orderedCards = [...cards];
        }
      } else {
        this.orderedCards = [...cards];
      }

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

  private getAllStackItems(): NodeListOf<HTMLElement> {
    return document.querySelectorAll<HTMLElement>('.stack-item');
  }

  private getTopEl(): HTMLElement | null {
    return document.querySelector<HTMLElement>('.stack-item.is-top');
  }

  private clearAllInlineStyles() {
    this.getAllStackItems().forEach(el => {
      el.style.transition = '';
      el.style.transform = '';
      el.style.opacity = '';
    });
  }

  onTouchStart(event: TouchEvent) {
    if (this.isAnimating || this.orderedCards.length <= 1) return;

    this.clearAllInlineStyles();

    this.touchStartX = event.touches[0].clientX;
    this.lastX = this.touchStartX;
    this.lastTime = Date.now();
    this.velocity = 0;
    this.isDragging = true;
    this.dragX = 0;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;

    const now = Date.now();
    const currentX = event.touches[0].clientX;
    const dt = now - this.lastTime;

    if (dt > 0) this.velocity = (currentX - this.lastX) / dt;
    this.lastX = currentX;
    this.lastTime = now;
    this.dragX = currentX - this.touchStartX;

    const topEl = this.getTopEl();
    if (topEl) {
      const lift = Math.min(Math.abs(this.dragX) * 0.06, 16);
      const rot = this.dragX * 0.025;
      topEl.style.transform = `translateX(${this.dragX}px) translateY(${-lift}px) rotate(${rot}deg)`;
      topEl.style.transition = 'none';
    }
  }

  async onTouchEnd(_event: TouchEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;

    const flick = Math.abs(this.velocity) > 0.4;

    if (Math.abs(this.dragX) >= this.SWIPE_THRESHOLD || flick) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      this.commitSwipe();
    } else {
      this.snapBack();
    }
  }

  private snapBack() {
    const topEl = this.getTopEl();
    if (topEl) {
      topEl.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      topEl.style.transform = '';
      setTimeout(() => { topEl.style.transition = ''; }, 360);
    }
    this.dragX = 0;
  }

  private commitSwipe() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const topEl = this.getTopEl();
    const direction = this.dragX > 0 ? 1 : -1;
    const screenW = window.innerWidth;

    if (!topEl) {
      this.doSwap();
      return;
    }

    topEl.style.transition = 'transform 0.22s ease-out, opacity 0.22s ease-out';
    topEl.style.transform = `translateX(${direction * (screenW + 100)}px) rotate(${direction * 18}deg) scale(0.88)`;
    topEl.style.opacity = '0';

    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    this.safetyTimer = setTimeout(() => this.doSwap(), 260);

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'transform') return;
      topEl.removeEventListener('transitionend', onEnd as EventListener);
      clearTimeout(this.safetyTimer);
      this.doSwap();
    };

    topEl.addEventListener('transitionend', onEnd as EventListener);
  }

  private doSwap() {
    if (!this.isAnimating) return;

    this.clearAllInlineStyles();

    this.ngZone.run(() => {
      const [first, ...rest] = this.orderedCards;
      this.orderedCards = [...rest, first];
      this.dragX = 0;
      this.isAnimating = false;
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
    const { data } = await this.modalService.open(
      PaymentSimulatorComponent,
      { cards: this.orderedCards },
      true
    );
    if (data?.success) {
      await Haptics.notification({ type: NotificationType.Success });
      await this.loadData();
    }
  }

  async openRechargeDialog() {
    const rawValue = await this.dialogService.prompt(
      'Recargar saldo',
      'Ingresa el monto a recargar.',
      'Monto a recargar'
    );

    if (rawValue === null) return;
    const amount = Number(rawValue);
    if (!amount || amount <= 0) {
      await this.toastService.error('Ingresa un monto válido.');
      return;
    }
    await this.processRecharge(amount);
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
    const confirmed = await this.dialogService.confirm('Cerrar sesión', '¿Estás seguro?');
    if (confirmed) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await this.authService.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  trackCard(_: number, card: Card): string {
    return card.id ?? card.cardNumber;
  }

  goToAddCard() { this.router.navigateByUrl('/add-card'); }
  goToPayment() { this.router.navigateByUrl('/payment'); }
  goToProfile() { this.router.navigateByUrl('/profile'); }
  goToDefault() { this.router.navigateByUrl('/default-card'); }
}