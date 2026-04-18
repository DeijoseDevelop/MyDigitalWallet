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

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  user: UserProfile | null = null;
  cards: Card[] = [];
  transactions: Transaction[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private cardService: CardService,
    private paymentService: PaymentService,
    private modalService: ModalService,
    private dialogService: DialogService,
    private router: Router
  ) {}

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
      this.user        = user;
      this.cards       = cards;
      this.transactions = transactions;
    } finally {
      this.loading = false;
    }
  }

  async onQuickAction(action: QuickAction) {
    if (action === 'pay') {
      await this.openPaymentSimulator();
    } else if (action === 'recharge') {
      this.router.navigateByUrl('/add-card');
    } else {
      await this.dialogService.alert('Próximamente', 'Esta función estará disponible pronto.');
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