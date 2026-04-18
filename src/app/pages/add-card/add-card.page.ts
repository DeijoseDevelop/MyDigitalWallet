import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardService } from 'src/app/core/services/card.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { animate } from 'animejs';
import { Haptics, NotificationType } from '@capacitor/haptics';

@Component({
  selector: 'app-add-card',
  templateUrl: './add-card.page.html',
  styleUrls: ['./add-card.page.scss'],
  standalone: false
})
export class AddCardPage {
  @ViewChild('cardPreview') cardPreviewRef!: ElementRef;

  cardForm: FormGroup;
  cardColors = ['#1a1f71', '#0f172a', '#1a1a1a', '#064e3b', '#4c1d95'];
  selectedColor = this.cardColors[0];

  constructor(
    private fb: FormBuilder,
    private cardService: CardService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private router: Router
  ) {
    this.cardForm = this.fb.group({
      cardholderName: ['', Validators.required],
      cardNumber: ['', [Validators.required, Validators.minLength(16), Validators.maxLength(19)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    });
  }

  onCardNumberChange() {
    this.animateCardFlip();
  }

  private animateCardFlip() {
    const el = this.cardPreviewRef?.nativeElement;
    if (!el) return;

    animate(el, {
      rotateY: ['0deg', '90deg'],
      duration: 150,
      ease: 'easeInQuad',
      onComplete: () => {
        animate(el, {
          rotateY: ['90deg', '0deg'],
          duration: 200,
          ease: 'easeOutQuad',
        });
      }
    });
  }

  get detectedType(): 'visa' | 'mastercard' {
    const num = this.cardForm.get('cardNumber')?.value ?? '';
    return this.cardService.detectCardType(num);
  }

  get last4(): string {
    const raw = this.cardForm.get('cardNumber')?.value?.replace(/\s|-/g, '') ?? '';
    return raw.length >= 4 ? raw.slice(-4) : '????';
  }

  formatCardNumber(event: any) {
    let val = event.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.match(/.{1,4}/g)?.join(' ') ?? val;
    this.cardForm.get('cardNumber')?.setValue(val, { emitEvent: false });
    event.target.value = val;
  }

  formatExpiry(event: any) {
    let val = event.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    this.cardForm.get('expiryDate')?.setValue(val, { emitEvent: false });
    event.target.value = val;
  }

  async onSubmit() {
    if (this.cardForm.invalid) {
      this.toastService.error('Completa todos los campos correctamente.');
      return;
    }

    const raw = this.cardForm.get('cardNumber')!.value.replace(/\s/g, '');
    if (!this.cardService.luhnCheck(raw)) {
      this.toastService.error('El número de tarjeta no es válido.');
      return;
    }

    await this.loadingService.show('Guardando tarjeta...');
    try {
      await this.cardService.addCard({
        cardholderName: this.cardForm.value.cardholderName,
        cardNumber: raw.slice(-4),
        expiryDate: this.cardForm.value.expiryDate,
        type: this.detectedType,
        color: this.selectedColor,
        createdAt: new Date()
      });
      await Haptics.notification({ type: NotificationType.Success });
      await this.toastService.success('Tarjeta agregada exitosamente.');
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: any) {
      await Haptics.notification({ type: NotificationType.Error });
      await this.toastService.error(error.message || 'Error al guardar la tarjeta.');
    } finally {
      await this.loadingService.hide();
    }
  }
}