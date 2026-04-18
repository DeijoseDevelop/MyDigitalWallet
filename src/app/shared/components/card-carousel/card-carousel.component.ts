import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Card } from 'src/app/core/services/card.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { animate } from 'animejs';

@Component({
  selector: 'app-card-carousel',
  templateUrl: './card-carousel.component.html',
  styleUrls: ['./card-carousel.component.scss'],
  standalone: false,
})
export class CardCarouselComponent implements OnChanges {

  @Input() cards: Card[] = [];
  @Input() defaultCardId = '';
  @Output() defaultChanged = new EventEmitter<Card>();

  activeIndex = 0;
  isSliding = false;
  slideOffset = 0;
  prevOffset = 0;

  private touchStartX = 0;
  private touchDeltaX = 0;

  ngOnChanges() {
    if (this.defaultCardId && this.cards.length > 0) {
      const idx = this.cards.findIndex(c => c.id === this.defaultCardId);
      if (idx >= 0) this.activeIndex = idx;
    }
  }

  get activeCard(): Card | null {
    return this.cards[this.activeIndex] ?? null;
  }

  get prevIndex(): number {
    return (this.activeIndex - 1 + this.cards.length) % this.cards.length;
  }

  get nextIndex(): number {
    return (this.activeIndex + 1) % this.cards.length;
  }

  async prev() {
    if (this.isSliding || this.cards.length <= 1) return;
    await Haptics.impact({ style: ImpactStyle.Light });
    this.slide('right');
  }

  async next() {
    if (this.isSliding || this.cards.length <= 1) return;
    await Haptics.impact({ style: ImpactStyle.Light });
    this.slide('left');
  }

  async goTo(index: number) {
    if (this.isSliding || index === this.activeIndex) return;
    await Haptics.impact({ style: ImpactStyle.Light });
    const direction = index > this.activeIndex ? 'left' : 'right';
    this.activeIndex = index;
    this.animateSlide(direction);
    this.emitDefault();
  }

  private slide(direction: 'left' | 'right') {
    if (direction === 'left') {
      this.activeIndex = this.nextIndex;
    } else {
      this.activeIndex = this.prevIndex;
    }
    this.animateSlide(direction);
    this.emitDefault();
  }

  private animateSlide(direction: 'left' | 'right') {
    this.isSliding = true;
    const track = document.querySelector<HTMLElement>('.carousel-track');
    if (!track) { this.isSliding = false; return; }

    const from = direction === 'left' ? 60 : -60;
    const obj = { x: from, o: 0 };

    animate(obj, {
      x: 0,
      o: 1,
      duration: 320,
      ease: 'easeOutExpo',
      onUpdate: () => {
        track.style.transform = `translateX(${obj.x}px)`;
        track.style.opacity = `${obj.o}`;
      },
      onComplete: () => {
        track.style.transform = '';
        track.style.opacity = '';
        this.isSliding = false;
      }
    });
  }

  private emitDefault() {
    if (this.activeCard) {
      this.defaultChanged.emit(this.activeCard);
    }
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchDeltaX = 0;
  }

  onTouchMove(event: TouchEvent) {
    this.touchDeltaX = event.touches[0].clientX - this.touchStartX;
    const track = document.querySelector<HTMLElement>('.carousel-track');
    if (track) {
      track.style.transform = `translateX(${this.touchDeltaX * 0.3}px)`;
    }
  }

  async onTouchEnd() {
    const track = document.querySelector<HTMLElement>('.carousel-track');
    if (track) track.style.transform = '';

    if (Math.abs(this.touchDeltaX) > 50) {
      if (this.touchDeltaX < 0) {
        await this.next();
      } else {
        await this.prev();
      }
    }
    this.touchDeltaX = 0;
  }
}