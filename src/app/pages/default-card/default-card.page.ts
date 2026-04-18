import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { animate } from 'animejs';
import { Card, CardService } from 'src/app/core/services/card.service';
import { UserService } from 'src/app/core/services/user.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-default-card',
  templateUrl: './default-card.page.html',
  styleUrls: ['./default-card.page.scss'],
  standalone: false
})
export class DefaultCardPage implements OnInit {

  cards: Card[] = [];
  defaultCardId = '';
  activeIndex = 0;
  isSliding = false;
  loading = true;

  private touchStartX = 0;
  private touchDeltaX = 0;

  constructor(
    private cardService: CardService,
    private userService: UserService,
    private toastService: ToastService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const [cards, user] = await Promise.all([
        this.cardService.getCards(),
        this.userService.getUserData()
      ]);
      this.cards = cards;
      this.defaultCardId = user?.defaultCardId ?? '';

      if (this.defaultCardId) {
        const idx = this.cards.findIndex(c => c.id === this.defaultCardId);
        if (idx >= 0) this.activeIndex = idx;
      }
    } finally {
      this.loading = false;
    }
  }

  get activeCard(): Card | null {
    return this.cards[this.activeIndex] ?? null;
  }

  get isDefault(): boolean {
    return this.activeCard?.id === this.defaultCardId;
  }

  async prev() {
    if (this.isSliding || this.cards.length <= 1) return;
    await Haptics.impact({ style: ImpactStyle.Light });
    this.activeIndex = (this.activeIndex - 1 + this.cards.length) % this.cards.length;
    this.animateSlide('right');
  }

  async next() {
    if (this.isSliding || this.cards.length <= 1) return;
    await Haptics.impact({ style: ImpactStyle.Light });
    this.activeIndex = (this.activeIndex + 1) % this.cards.length;
    this.animateSlide('left');
  }

  async goTo(index: number) {
    if (this.isSliding || index === this.activeIndex) return;
    const dir = index > this.activeIndex ? 'left' : 'right';
    this.activeIndex = index;
    await Haptics.impact({ style: ImpactStyle.Light });
    this.animateSlide(dir);
  }

  private animateSlide(direction: 'left' | 'right') {
    this.isSliding = true;
    const track = document.querySelector<HTMLElement>('.carousel-track');
    if (!track) { this.isSliding = false; return; }

    const from = direction === 'left' ? 80 : -80;
    const obj = { x: from, o: 0 };

    animate(obj, {
      x: 0,
      o: 1,
      duration: 300,
      ease: 'easeOutExpo',
      onUpdate: () => {
        track.style.transform = `translateX(${obj.x}px)`;
        track.style.opacity = String(obj.o);
      },
      onComplete: () => {
        track.style.transform = '';
        track.style.opacity = '';
        this.isSliding = false;
      }
    });
  }

  async setAsDefault() {
    if (!this.activeCard?.id) return;
    await Haptics.notification({ type: NotificationType.Success });
    await this.userService.setDefaultCard(this.activeCard.id);
    this.defaultCardId = this.activeCard.id;
    await this.toastService.success(`Tarjeta •••• ${this.activeCard.cardNumber} establecida como predeterminada.`);
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchDeltaX = 0;
  }

  onTouchMove(event: TouchEvent) {
    this.touchDeltaX = event.touches[0].clientX - this.touchStartX;
    const track = document.querySelector<HTMLElement>('.carousel-track');
    if (track) track.style.transform = `translateX(${this.touchDeltaX * 0.25}px)`;
  }

  async onTouchEnd() {
    const track = document.querySelector<HTMLElement>('.carousel-track');
    if (track) track.style.transform = '';
    if (Math.abs(this.touchDeltaX) > 50) {
      this.touchDeltaX < 0 ? await this.next() : await this.prev();
    }
    this.touchDeltaX = 0;
  }
}