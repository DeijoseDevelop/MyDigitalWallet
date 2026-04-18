import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { UserService } from './user.service';

export interface Card {
  id?: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  type: 'visa' | 'mastercard';
  color: string;
  createdAt: any;
}

@Injectable({ providedIn: 'root' })
export class CardService {

  constructor(
    private firestoreService: FirestoreService,
    private userService: UserService
  ) {}

  luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\s|-/g, '');
    if (!/^\d+$/.test(digits)) return false;

    let sum = 0;
    let alternate = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  }

  detectCardType(cardNumber: string): 'visa' | 'mastercard' {
    const digits = cardNumber.replace(/\s|-/g, '');
    if (digits.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
    return 'visa';
  }

  async addCard(cardData: Omit<Card, 'id'>): Promise<string> {
    const uid = this.userService.getCurrentUid();
    if (!uid) throw new Error('Usuario no autenticado');
    return this.firestoreService.addDocument(`users/${uid}/cards`, cardData);
  }

  async getCards(): Promise<Card[]> {
    const uid = this.userService.getCurrentUid();
    if (!uid) return [];
    return this.firestoreService.getCollection(`users/${uid}/cards`) as Promise<Card[]>;
  }
}