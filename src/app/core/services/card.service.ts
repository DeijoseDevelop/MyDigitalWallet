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
  ) { }

  luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\s|-/g, '');
    if (!/^\d+$/.test(digits)) return false;

    return digits
      .split('')
      .reverse()
      .reduce((sum: number, digit: string, i: number) => {
        let currentDigit = Number(digit);

        if (i % 2 !== 0) {
          currentDigit *= 2;
          if (currentDigit > 9) currentDigit -= 9;
        }

        return sum + currentDigit;

      }, 0) % 10 === 0;
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